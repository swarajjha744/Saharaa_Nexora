import { useState } from "react";
import {
  ShieldCheck, CheckCircle2, Phone, Briefcase, Mail, Lock, User as UserIcon,
  AlertCircle, ArrowRight, Loader2, Sparkles, LogIn, UserPlus
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { services } from "../data";
import type { Page } from "../components/shared";

interface AuthPageProps {
  go: (p: Page, w?: string) => void;
  lang: "en" | "hi";
  initialMode?: "signin" | "signup";
}

export function AuthPage({ go, lang, initialMode = "signin" }: AuthPageProps) {
  const { signIn, signUp, role: currentRole, isAuthenticated, signOut } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [roleSelection, setRoleSelection] = useState<"customer" | "worker">("customer");

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [primaryServiceId, setPrimaryServiceId] = useState("plumbing");

  // State & Validation
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setConfirmationNotice(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage(lang === "hi" ? "कृपया अपना ईमेल दर्ज करें" : "Please enter your email address.");
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      setErrorMessage(lang === "hi" ? "कृपया एक मान्य ईमेल दर्ज करें" : "Please enter a valid email address.");
      return;
    }
    if (!password) {
      setErrorMessage(lang === "hi" ? "कृपया अपना पासवर्ड दर्ज करें" : "Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn(trimmedEmail, password);
      if (!res.success) {
        setErrorMessage(res.error || "Login failed. Please check your credentials.");
      } else {
        // Redirect according to user role
        const targetRole = res.role || "customer";
        if (targetRole === "worker") {
          go("worker-dashboard");
        } else if (targetRole === "admin") {
          go("admin");
        } else {
          go("customer-home");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setConfirmationNotice(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setErrorMessage(lang === "hi" ? "कृपया अपना पूरा नाम दर्ज करें" : "Please enter your full name.");
      return;
    }
    if (!trimmedEmail) {
      setErrorMessage(lang === "hi" ? "कृपया अपना ईमेल दर्ज करें" : "Please enter your email address.");
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      setErrorMessage(lang === "hi" ? "कृपया एक मान्य ईमेल पता दर्ज करें" : "Please enter a valid email address.");
      return;
    }
    if (trimmedPhone && !/^\d{10}$/.test(trimmedPhone.replace(/[\s-]/g, ""))) {
      setErrorMessage(lang === "hi" ? "कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें" : "Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!password) {
      setErrorMessage(lang === "hi" ? "कृपया एक पासवर्ड चुनें" : "Please create a password.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage(lang === "hi" ? "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए" : "Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(lang === "hi" ? "पासवर्ड मेल नहीं खाते" : "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await signUp({
        fullName: trimmedName,
        email: trimmedEmail,
        password,
        phone: trimmedPhone ? `+91 ${trimmedPhone.replace(/[\s-]/g, "")}` : undefined,
        role: roleSelection,
        preferredLanguage: lang,
        primaryServiceId: roleSelection === "worker" ? primaryServiceId : undefined,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Signup failed. Please try again.");
      } else if (res.needsConfirmation) {
        setConfirmationNotice(
          lang === "hi"
            ? "खाता बनाया गया! कृपया अपने इनबॉक्स में जाकर ईमेल सत्यापन लिंक पर क्लिक करें।"
            : "Account created successfully! Please check your email inbox to confirm your account before logging in."
        );
        setMode("signin");
      } else {
        // Direct session created
        if (roleSelection === "worker") {
          go("worker-dashboard");
        } else {
          go("customer-home");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // If already authenticated, show friendly session card
  if (isAuthenticated) {
    return (
      <div className="page-enter mx-auto max-w-md px-4 py-16 text-center">
        <div className="rounded-[24px] bg-white p-8 ring-1 ring-[#1B4332]/10 card-shadow">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#52B788]/20 text-[#1B4332]">
            <CheckCircle2 className="h-8 w-8 text-[#2D6A4F]" />
          </div>
          <h2 className="font-display mt-4 text-[22px] font-black text-[#1A1A1A]">
            {lang === "hi" ? "आप पहले से लॉग इन हैं" : "You are already logged in"}
          </h2>
          <p className="mt-1.5 text-[13.5px] font-medium text-[#4A4A4A]">
            {lang === "hi"
              ? `आप ${currentRole || "ग्राहक"} के रूप में जुड़े हुए हैं`
              : `Logged in with role: ${currentRole ? currentRole.toUpperCase() : "CUSTOMER"}`}
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={() => {
                if (currentRole === "worker") go("worker-dashboard");
                else if (currentRole === "admin") go("admin");
                else go("customer-home");
              }}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#1B4332] py-3.5 text-[14.5px] font-extrabold text-white transition hover:bg-[#2D6A4F]"
            >
              <span>{lang === "hi" ? "डैशबोर्ड पर जाएँ" : "Go to Dashboard"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={async () => {
                await signOut();
                go("landing");
              }}
              className="rounded-2xl border border-[#1B4332]/15 py-3 text-[13.5px] font-bold text-[#4A4A4A] transition hover:bg-[#FAF9F6]"
            >
              {lang === "hi" ? "लॉग आउट करें" : "Log out"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:py-14">
      {/* Left side branding card */}
      <div className="hidden overflow-hidden rounded-[24px] bg-[#1B4332] p-8 text-white card-shadow lg:flex lg:flex-col lg:justify-between">
        <div className="jaali-pattern absolute inset-0 opacity-25 pointer-events-none" />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-[#F4A261] ring-1 ring-white/15">
            <Sparkles className="h-3.5 w-3.5" />
            Vecnaverse • Social Impact
          </p>
          <h2 className="font-display mt-4 text-[34px] font-black leading-tight">
            Local Skills.<br />
            Fair Work.<br />
            <span className="text-[#F4A261]">Trusted Connections.</span>
          </h2>
          <div className="mt-6 space-y-3">
            {[
              [
                lang === "hi" ? "विश्वसनीय कारीगर मिनटों में" : "Find trusted help in minutes",
                lang === "hi" ? "सत्यापित पहचान, पारदर्शी मूल्य, लाइव ट्रैकिंग" : "Verified workers, transparent pricing, live tracking"
              ],
              [
                lang === "hi" ? "सम्मान के साथ कमाई" : "Earn with dignity & respect",
                lang === "hi" ? "शून्य कमीशन शोषण, 100% टिप आपकी, तुरंत भुगतान" : "Zero joining fees, tips 100% yours, transparent FairFare"
              ],
              [
                lang === "hi" ? "TrustDNA सुरक्षा तंत्र" : "TrustDNA multi-layer trust",
                lang === "hi" ? "सत्यापित अनुभव और प्रामाणिक समीक्षाएँ" : "Genuine customer reviews and verified credentials"
              ]
            ].map(([t, d]) => (
              <div key={t} className="flex gap-3 rounded-2xl bg-white/8 p-3.5 ring-1 ring-white/12">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#52B788]" />
                <div>
                  <span className="block text-[13.5px] font-extrabold text-white">{t}</span>
                  <span className="block text-[12px] font-medium text-white/65">{d}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mt-8 rounded-2xl bg-black/20 p-4 ring-1 ring-white/10 text-xs text-white/70">
          <p className="font-bold text-white mb-0.5">Community-First Hyperlocal Platform</p>
          Empowering local neighborhoods across Delhi NCR with dignified labor and fair pricing.
        </div>
      </div>

      {/* Right side Auth Form */}
      <div className="rounded-[24px] bg-white p-6 ring-1 ring-[#1B4332]/10 card-shadow sm:p-8">
        {/* Tab switch between Sign In and Sign Up */}
        <div className="flex rounded-2xl bg-[#FAF9F6] p-1.5 ring-1 ring-[#1B4332]/10">
          <button
            type="button"
            onClick={() => { setMode("signin"); setErrorMessage(null); }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13.5px] font-extrabold transition ${
              mode === "signin"
                ? "bg-[#1B4332] text-white shadow"
                : "text-[#4A4A4A] hover:text-[#1A1A1A]"
            }`}
          >
            <LogIn className="h-4 w-4" />
            {lang === "hi" ? "लॉग इन" : "Sign In"}
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setErrorMessage(null); }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13.5px] font-extrabold transition ${
              mode === "signup"
                ? "bg-[#1B4332] text-white shadow"
                : "text-[#4A4A4A] hover:text-[#1A1A1A]"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            {lang === "hi" ? "नया खाता बनाएँ" : "Create Account"}
          </button>
        </div>

        <div className="mt-5">
          <h1 className="font-display text-[22px] font-black text-[#1A1A1A]">
            {mode === "signin"
              ? (lang === "hi" ? "सहारा में स्वागत है" : "Welcome back to Saharaa")
              : (lang === "hi" ? "सहारा से जुड़ें" : "Join the Saharaa Community")}
          </h1>
          <p className="mt-1 text-[13px] font-medium text-[#4A4A4A]">
            {mode === "signin"
              ? (lang === "hi" ? "अपने क्रेडेंशियल्स के साथ साइन इन करें" : "Sign in with your email and password to continue.")
              : (lang === "hi" ? "ग्राहक या कारीगर के रूप में पंजीकृत हों" : "Create an account as a customer or local service provider.")}
          </p>
        </div>

        {/* Success / Confirmation notification */}
        {confirmationNotice && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-[#E8F5E9] p-4 text-[13px] font-bold text-[#1B4332] ring-1 ring-[#52B788]/40 animate-fade-in">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[#2D6A4F]" />
            <div>{confirmationNotice}</div>
          </div>
        )}

        {/* Error alert */}
        {errorMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-[#FFEBEE] p-3.5 text-[13px] font-bold text-[#C62828] ring-1 ring-[#EF5350]/30 animate-fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 text-[#C62828]" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* SIGN IN FORM */}
        {mode === "signin" ? (
          <form onSubmit={handleSignIn} className="mt-5 space-y-4">
            <div>
              <label className="text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">
                {lang === "hi" ? "ईमेल पता" : "Email Address"}
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8a8a]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="h-12 w-full rounded-2xl bg-[#FAF9F6] pl-11 pr-4 text-[14.5px] font-bold outline-none ring-1 ring-[#1B4332]/12 focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">
                  {lang === "hi" ? "पासवर्ड" : "Password"}
                </label>
              </div>
              <div className="relative mt-1.5">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8a8a]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-12 w-full rounded-2xl bg-[#FAF9F6] pl-11 pr-4 text-[14.5px] font-bold outline-none ring-1 ring-[#1B4332]/12 focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#1B4332] text-[14.5px] font-extrabold text-white transition hover:bg-[#2D6A4F] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{lang === "hi" ? "प्रमाणीकरण हो रहा है..." : "Signing in..."}</span>
                </>
              ) : (
                <>
                  <span>{lang === "hi" ? "साइन इन करें →" : "Sign In →"}</span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => { setMode("signup"); setErrorMessage(null); }}
                className="text-[12.5px] font-bold text-[#1B4332] hover:underline"
              >
                {lang === "hi" ? "खाता नहीं है? नया खाता बनाएँ" : "Don't have an account? Sign up here"}
              </button>
            </div>
          </form>
        ) : (
          /* SIGN UP FORM */
          <form onSubmit={handleSignUp} className="mt-5 space-y-4">
            {/* Account Type Selection */}
            <div>
              <label className="text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">
                {lang === "hi" ? "खाते का प्रकार चुनें" : "Select Account Type"}
              </label>
              <div className="mt-2 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setRoleSelection("customer")}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl p-3.5 ring-2 transition ${
                    roleSelection === "customer"
                      ? "bg-[#1B4332] text-white ring-[#1B4332]"
                      : "bg-[#FAF9F6] text-[#1A1A1A] ring-[#1B4332]/10 hover:bg-[#FAF9F6]/80"
                  }`}
                >
                  <Phone className="h-5 w-5" />
                  <span className="text-[13px] font-extrabold">
                    {lang === "hi" ? "ग्राहक (Customer)" : "Customer"}
                  </span>
                  <span className={`text-[10.5px] font-medium ${roleSelection === "customer" ? "text-white/75" : "text-[#4A4A4A]"}`}>
                    {lang === "hi" ? "सेवा बुक करें" : "Book home services"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRoleSelection("worker")}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl p-3.5 ring-2 transition ${
                    roleSelection === "worker"
                      ? "bg-[#1B4332] text-white ring-[#1B4332]"
                      : "bg-[#FAF9F6] text-[#1A1A1A] ring-[#1B4332]/10 hover:bg-[#FAF9F6]/80"
                  }`}
                >
                  <Briefcase className="h-5 w-5" />
                  <span className="text-[13px] font-extrabold">
                    {lang === "hi" ? "कारीगर (Worker)" : "Worker"}
                  </span>
                  <span className={`text-[10.5px] font-medium ${roleSelection === "worker" ? "text-white/75" : "text-[#4A4A4A]"}`}>
                    {lang === "hi" ? "सेवा प्रदान करें" : "Earn fair wages"}
                  </span>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">
                {lang === "hi" ? "पूरा नाम" : "Full Name"}
              </label>
              <div className="relative mt-1.5">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8a8a]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  autoComplete="name"
                  className="h-12 w-full rounded-2xl bg-[#FAF9F6] pl-11 pr-4 text-[14.5px] font-bold outline-none ring-1 ring-[#1B4332]/12 focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">
                {lang === "hi" ? "ईमेल पता" : "Email Address"}
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8a8a]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="h-12 w-full rounded-2xl bg-[#FAF9F6] pl-11 pr-4 text-[14.5px] font-bold outline-none ring-1 ring-[#1B4332]/12 focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">
                {lang === "hi" ? "मोबाइल नंबर (वैकल्पिक)" : "Mobile Number (Optional)"}
              </label>
              <div className="mt-1.5 flex gap-2">
                <span className="grid place-items-center rounded-2xl bg-[#FAF9F6] px-3.5 text-[13.5px] font-extrabold ring-1 ring-[#1B4332]/12">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="numeric"
                  placeholder="98765 43210"
                  className="h-12 w-full rounded-2xl bg-[#FAF9F6] px-4 text-[14.5px] font-bold outline-none ring-1 ring-[#1B4332]/12 focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>
            </div>

            {/* Primary Skill Selection if Worker */}
            {roleSelection === "worker" && (
              <div className="animate-fade-in">
                <label className="text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">
                  {lang === "hi" ? "प्राथमिक सेवा" : "Primary Trade / Service"}
                </label>
                <select
                  value={primaryServiceId}
                  onChange={(e) => setPrimaryServiceId(e.target.value)}
                  className="mt-1.5 h-12 w-full rounded-2xl bg-[#FAF9F6] px-4 text-[14.5px] font-bold outline-none ring-1 ring-[#1B4332]/12 focus:ring-2 focus:ring-[#2D6A4F]"
                >
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {lang === "hi" ? `${s.hi} (${s.en})` : s.en} — Base ₹{s.basePrice}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">
                  {lang === "hi" ? "पासवर्ड" : "Password"}
                </label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8a8a]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                    className="h-12 w-full rounded-2xl bg-[#FAF9F6] pl-11 pr-3 text-[14px] font-bold outline-none ring-1 ring-[#1B4332]/12 focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">
                  {lang === "hi" ? "पासवर्ड की पुष्टि" : "Confirm Password"}
                </label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8a8a]" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    className="h-12 w-full rounded-2xl bg-[#FAF9F6] pl-11 pr-3 text-[14px] font-bold outline-none ring-1 ring-[#1B4332]/12 focus:ring-2 focus:ring-[#2D6A4F]"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-3 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#E76F51] text-[14.5px] font-extrabold text-white transition hover:bg-[#c65a3a] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>{lang === "hi" ? "खाता बन रहा है..." : "Creating Account..."}</span>
                </>
              ) : (
                <>
                  <span>
                    {roleSelection === "worker"
                      ? (lang === "hi" ? "कारीगर के रूप में पंजीकरण करें →" : "Register as Worker →")
                      : (lang === "hi" ? "ग्राहक के रूप में पंजीकरण करें →" : "Register as Customer →")}
                  </span>
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => { setMode("signin"); setErrorMessage(null); }}
                className="text-[12.5px] font-bold text-[#1B4332] hover:underline"
              >
                {lang === "hi" ? "पहले से खाता है? यहाँ लॉग इन करें" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 flex items-start gap-2 rounded-2xl bg-[#FAF9F6] p-3 text-[11px] font-semibold text-[#4A4A4A] ring-1 ring-[#1B4332]/8">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[#2D6A4F] mt-0.5" />
          <span>
            {lang === "hi"
              ? "सहारा उचित-कार्य और सुरक्षा दिशानिर्देशों का पालन करता है। कोई छिपी फीस नहीं।"
              : "Saharaa complies with fair-work terms: honest pricing, respectful communication, verified identity."}
          </span>
        </div>
      </div>
    </div>
  );
}
