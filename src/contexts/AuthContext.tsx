import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserProfile, WorkerProfile, UserRole, SignUpData } from '../lib/authTypes';
import { updateWorkerAvailability } from '../lib/marketplace';


interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  workerProfile: WorkerProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<void>;
  updateAvailability: (isOnline: boolean, isAvailableNow?: boolean) => Promise<{ success: boolean; error?: string }>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const configured = isSupabaseConfigured();

  const fetchProfileData = useCallback(async (userId: string) => {
    if (!configured) {
      return { profile: null, workerProfile: null };
    }
    try {
      const { data: prof, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profError) {
        console.warn('Profile fetch warning:', profError.message);
        return { profile: null, workerProfile: null };
      }

      let wProf: WorkerProfile | null = null;
      if (prof && prof.role === 'worker') {
        const { data: wData } = await supabase
          .from('worker_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        wProf = wData as WorkerProfile | null;
      }

      return { profile: prof as UserProfile | null, workerProfile: wProf };
    } catch (err) {
      console.error('Failed to load user profile:', err);
      return { profile: null, workerProfile: null };
    }
  }, [configured]);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setWorkerProfile(null);
      return;
    }
    const { profile: p, workerProfile: wp } = await fetchProfileData(user.id);
    setProfile(p);
    setWorkerProfile(wp);
  }, [user, fetchProfileData]);

  // Initialize and listen to Supabase Auth changes
  useEffect(() => {
    let isMounted = true;

    if (!configured) {
      setIsLoading(false);
      return;
    }

    // 1. Initial session load
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching auth session:', error.message);
        }

        if (!isMounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          const { profile: p, workerProfile: wp } = await fetchProfileData(initialSession.user.id);
          if (isMounted) {
            setProfile(p);
            setWorkerProfile(wp);
          }
        } else {
          setSession(null);
          setUser(null);
          setProfile(null);
          setWorkerProfile(null);
        }
      } catch (err) {
        console.error('Unexpected auth initialization error:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // 2. Auth state subscription with proper cleanup
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // If signed in or token refreshed, fetch profile
          const { profile: p, workerProfile: wp } = await fetchProfileData(currentSession.user.id);
          if (isMounted) {
            setProfile(p);
            setWorkerProfile(wp);
            setIsLoading(false);
          }
        } else {
          // If signed out, clear profile
          if (isMounted) {
            setProfile(null);
            setWorkerProfile(null);
            setIsLoading(false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [configured, fetchProfileData]);

  const signUp = useCallback(async (data: SignUpData) => {
    if (!configured) {
      return { success: false, error: 'Database is not configured. Please verify environment settings.' };
    }

    try {
      const email = data.email.trim();
      const fullName = data.fullName.trim();
      const phone = data.phone ? data.phone.trim() : null;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: {
          data: {
            full_name: fullName,
            role: data.role,
            phone: phone,
            preferred_language: data.preferredLanguage || 'en',
            primary_service_id: data.primaryServiceId || null,
            starting_rate: data.startingRate || 199.00,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('User already registered') || authError.message.includes('already in use')) {
          return { success: false, error: 'This email is already registered. Please log in instead.' };
        }
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Failed to create user account. Please try again.' };
      }

      // Check if email confirmation is required (session is null when unconfirmed)
      const needsConfirmation = !authData.session;

      // If session exists immediately, update phone in profile if trigger left it null
      if (authData.session?.user && phone) {
        try {
          await supabase
            .from('profiles')
            .update({ phone })
            .eq('id', authData.session.user.id);
        } catch {
          // Non-critical, trigger handled initial profile
        }
      }

      return { success: true, needsConfirmation };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred during signup.' };
    }
  }, [configured]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!configured) {
      return { success: false, error: 'Database is not configured. Please verify environment settings.' };
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Invalid email or password. Please verify your details.' };
        }
        if (authError.message.includes('Email not confirmed')) {
          return { success: false, error: 'Please confirm your email address before logging in. Check your inbox.' };
        }
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Authentication failed. Please try again.' };
      }

      // Load profile to retrieve authoritative role
      const { profile: p, workerProfile: wp } = await fetchProfileData(authData.user.id);
      setProfile(p);
      setWorkerProfile(wp);

      return { success: true, role: p?.role || 'customer' };
    } catch (err: any) {
      return { success: false, error: err.message || 'An unexpected error occurred during login.' };
    }
  }, [configured, fetchProfileData]);

  const signOut = useCallback(async () => {
    try {
      if (configured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setWorkerProfile(null);
    }
    return { success: true };
  }, [configured]);

  const updateAvailability = useCallback(async (isOnline: boolean, isAvailableNow?: boolean) => {
    if (!user) {
      return { success: false, error: 'User is not authenticated' };
    }
    if (profile?.role !== 'worker') {
      return { success: false, error: 'Only registered workers can update operational availability' };
    }

    try {
      const res = await updateWorkerAvailability(user.id, isOnline, isAvailableNow);
      if (!res.success) {
        return { success: false, error: res.error || 'Failed to update availability' };
      }

      setWorkerProfile((prev) => prev ? {
        ...prev,
        is_online: isOnline,
        is_available_now: isAvailableNow !== undefined ? isAvailableNow : isOnline,
      } : null);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Unexpected error updating availability' };
    }
  }, [user, profile]);

  const role = profile?.role ?? null;
  const isAuthenticated = Boolean(user && session);

  const contextValue = useMemo<AuthContextType>(() => ({
    user,
    session,
    profile,
    workerProfile,
    role,
    isLoading,
    isAuthenticated,
    isConfigured: configured,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    updateAvailability,
  }), [
    user,
    session,
    profile,
    workerProfile,
    role,
    isLoading,
    isAuthenticated,
    configured,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    updateAvailability,
  ]);


  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
