import {
  BadgeCheck, Bell, Brush, ChefHat, ChevronRight, Hammer, Leaf, MapPin, Mic,
  Refrigerator, Search, ShieldCheck, Sparkles, Star, Wrench, Zap, Globe, Menu, X,
  Clock, Navigation, MessageCircle, Phone, Home, CalendarCheck, User, LayoutGrid,
  Wallet, Briefcase, BarChart3, HeartHandshake, Languages, Database, CheckCircle2, AlertCircle, RefreshCw, LogOut
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { workers } from "../data";
import { checkSupabaseConnection, type BackendHealthReport } from "../lib/supabaseHealth";
import { useAuth } from "../contexts/AuthContext";

/* ---------- Brand ---------- */
export function Logo({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#1B4332] text-white card-shadow">
        <HeartHandshake className="h-5 w-5" strokeWidth={2.2} />
        <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#E76F51] text-[10px] font-extrabold text-white ring-2 ring-[#FAF9F6]">S</span>
      </div>
      {!compact && (
        <div className="leading-none">
          <p className={`text-[19px] font-extrabold tracking-tight ${dark ? "text-white" : "text-[#1A1A1A]"}`}>Saharaa</p>
          <p className={`mt-1 text-[10.5px] font-semibold tracking-wide ${dark ? "text-white/60" : "text-[#4A4A4A]/80"}`}>सहारा • SAHAARA</p>
        </div>
      )}
    </div>
  );
}

export function LangToggle({ lang, setLang }: { lang: "en" | "hi"; setLang: (l: "en" | "hi") => void }) {
  return (
    <button
      onClick={() => setLang(lang === "en" ? "hi" : "en")}
      className="flex items-center gap-1.5 rounded-full border border-[#1B4332]/15 bg-white px-3 py-1.5 text-xs font-bold text-[#1B4332] transition hover:border-[#1B4332]/40 active:scale-95"
      aria-label="Toggle language"
    >
      <Languages className="h-3.5 w-3.5" />
      {lang === "en" ? "हिंदी" : "English"}
    </button>
  );
}

/* ---------- Top nav ---------- */
export type Page =
  | "landing" | "auth" | "customer-home" | "workers" | "worker-profile"
  | "booking" | "tracking" | "payment" | "worker-dashboard" | "worker-onboarding"
  | "worker-jobs" | "worker-earnings" | "admin" | "impact";

export function TopNav({
  page, go, lang, setLang, role: propRole, location, setLocation,
}: {
  page: Page; go: (p: Page, wid?: string) => void; lang: "en" | "hi"; setLang: (l: "en" | "hi") => void;
  role: string | null; location: string; setLocation?: (loc: string) => void;
}) {
  const { user, profile, role: authRole, isAuthenticated, signOut } = useAuth();
  const effectiveRole = authRole || propRole;

  const [open, setOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isApp = !["landing", "auth", "impact"].includes(page);
  const locations = [
    "Laxmi Nagar, Delhi",
    "Preet Vihar, Delhi",
    "Mayur Vihar, Delhi",
    "Nirman Vihar, Delhi",
    "Akshardham, Delhi",
  ];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setOpen(false);
    await signOut();
    go("landing");
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || (effectiveRole ? effectiveRole.toUpperCase() : "User");
  const avatarLetter = (displayName || "U")[0].toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-[#1B4332]/10 bg-[#FAF9F6]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <button onClick={() => go("landing")} className="shrink-0" aria-label="Saharaa home">
          <Logo />
        </button>

        <div className="relative hidden md:block">
          <button
            onClick={() => setLocOpen(!locOpen)}
            className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-semibold text-[#1A1A1A] ring-1 ring-[#1B4332]/10 transition hover:ring-[#1B4332]/30 active:scale-95"
            aria-label="Change location"
          >
            <MapPin className="h-4 w-4 text-[#E76F51]" />
            {location}
            <ChevronRight className={`h-3.5 w-3.5 text-[#4A4A4A] transition ${locOpen ? "-rotate-90" : "rotate-90"}`} />
          </button>
          {locOpen && (
            <div className="animate-fade-in absolute left-0 top-12 z-50 w-56 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-[#1B4332]/10">
              <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#8a8a8a]">Select area</p>
              {locations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => {
                    if (setLocation) setLocation(loc);
                    setLocOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] font-bold transition ${location === loc ? "bg-[#1B4332] text-white" : "text-[#1A1A1A] hover:bg-[#FAF9F6]"}`}
                >
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-[#E76F51]" />
                  {loc}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Role-Based Navigation */}
        <nav className="hidden items-center gap-1 text-[14px] font-semibold text-[#4A4A4A] lg:flex">
          {effectiveRole === "worker" ? (
            <>
              <NavLink label={lang === "hi" ? "कारीगर डैशबोर्ड" : "Dashboard"} onClick={() => go("worker-dashboard")} />
              <NavLink label={lang === "hi" ? "मेरे काम" : "My Jobs"} onClick={() => go("worker-jobs")} />
              <NavLink label={lang === "hi" ? "कमाई" : "Earnings"} onClick={() => go("worker-earnings")} />
              <NavLink label={lang === "hi" ? "प्रभाव" : "Impact"} onClick={() => go("impact")} />
            </>
          ) : effectiveRole === "admin" ? (
            <>
              <NavLink label={lang === "hi" ? "सेवाएँ खोजें" : "Customer View"} onClick={() => go("customer-home")} />
              <NavLink label="Admin Console" onClick={() => go("admin")} />
              <NavLink label={lang === "hi" ? "प्रभाव" : "Impact"} onClick={() => go("impact")} />
            </>
          ) : (
            <>
              <NavLink label={lang === "hi" ? "सेवाएँ खोजें" : "Find Work"} onClick={() => go("customer-home")} />
              <NavLink label={lang === "hi" ? "कारीगर बनें" : "Become a Worker"} onClick={() => go("worker-onboarding")} />
              <NavLink label={lang === "hi" ? "प्रभाव" : "Impact"} onClick={() => go("impact")} />
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block"><LangToggle lang={lang} setLang={setLang} /></div>

          {/* User Account / Role / Sign-in */}
          {isAuthenticated || effectiveRole ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="hidden items-center gap-2 rounded-full bg-[#1B4332] py-1.5 pl-2 pr-3.5 text-[13px] font-bold text-white transition hover:bg-[#2D6A4F] active:scale-95 sm:flex"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-white/20 text-xs font-black">
                  {avatarLetter}
                </span>
                <span className="max-w-[120px] truncate text-left">{displayName}</span>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#F4A261]">
                  {effectiveRole || "user"}
                </span>
              </button>

              {userMenuOpen && (
                <div className="animate-fade-in absolute right-0 top-12 z-50 w-60 rounded-2xl bg-white p-2.5 shadow-2xl ring-1 ring-[#1B4332]/10">
                  <div className="border-b border-[#1B4332]/8 px-3 py-2">
                    <p className="text-[13.5px] font-extrabold text-[#1A1A1A] truncate">{displayName}</p>
                    <p className="text-[11.5px] font-medium text-[#4A4A4A] truncate">{user?.email || "Authenticated"}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#1B4332]/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#1B4332]">
                      <ShieldCheck className="h-3 w-3" />
                      Role: {effectiveRole || "customer"}
                    </div>
                  </div>

                  <div className="mt-1 space-y-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (effectiveRole === "worker") go("worker-dashboard");
                        else if (effectiveRole === "admin") go("admin");
                        else go("customer-home");
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] font-bold text-[#1A1A1A] transition hover:bg-[#FAF9F6]"
                    >
                      <User className="h-4 w-4 text-[#2D6A4F]" />
                      {effectiveRole === "worker"
                        ? (lang === "hi" ? "कारीगर डैशबोर्ड" : "Worker Dashboard")
                        : effectiveRole === "admin"
                        ? "Admin Console"
                        : (lang === "hi" ? "मेरे बुकिंग" : "My Bookings")}
                    </button>

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] font-bold text-[#C62828] transition hover:bg-[#FFEBEE]"
                    >
                      <LogOut className="h-4 w-4 text-[#C62828]" />
                      {lang === "hi" ? "लॉग आउट करें" : "Log out"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => go("auth")}
                className="hidden rounded-full px-4 py-2 text-[13px] font-bold text-[#1B4332] hover:bg-[#1B4332]/5 sm:block"
              >
                {lang === "hi" ? "लॉगिन" : "Log in"}
              </button>
              <button
                onClick={() => go("auth")}
                className="rounded-full bg-[#1B4332] px-4 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#2D6A4F] active:scale-95"
              >
                {lang === "hi" ? "शुरू करें" : "Get started"}
              </button>
            </>
          )}

          <button
            onClick={() => setOpen(!open)}
            className="grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-[#1B4332]/10 lg:hidden"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {open && (
        <div className="animate-fade-in border-t border-[#1B4332]/10 bg-[#FAF9F6] px-4 pb-5 pt-3 lg:hidden">
          {isAuthenticated && (
            <div className="mb-3 flex items-center justify-between rounded-2xl bg-white p-3 ring-1 ring-[#1B4332]/10">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#1B4332] text-xs font-black text-white">
                  {avatarLetter}
                </span>
                <div>
                  <p className="text-[13px] font-extrabold text-[#1A1A1A]">{displayName}</p>
                  <p className="text-[11px] font-semibold text-[#2D6A4F] uppercase">{effectiveRole || "customer"}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-xl bg-[#FFEBEE] px-2.5 py-1.5 text-[11px] font-extrabold text-[#C62828]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          )}

          <div className="grid gap-1 text-[15px] font-semibold">
            {effectiveRole === "worker" ? (
              <>
                <MobileLink label={lang === "hi" ? "कारीगर डैशबोर्ड" : "Worker dashboard"} onClick={() => { go("worker-dashboard"); setOpen(false); }} />
                <MobileLink label={lang === "hi" ? "मेरे काम" : "My jobs"} onClick={() => { go("worker-jobs"); setOpen(false); }} />
                <MobileLink label={lang === "hi" ? "कमाई" : "Worker earnings"} onClick={() => { go("worker-earnings"); setOpen(false); }} />
              </>
            ) : effectiveRole === "admin" ? (
              <>
                <MobileLink label="Admin Console" onClick={() => { go("admin"); setOpen(false); }} />
                <MobileLink label={lang === "hi" ? "सेवाएँ खोजें" : "Customer view"} onClick={() => { go("customer-home"); setOpen(false); }} />
              </>
            ) : (
              <>
                <MobileLink label={lang === "hi" ? "सेवाएँ खोजें" : "Find a worker"} onClick={() => { go("customer-home"); setOpen(false); }} />
                <MobileLink label={lang === "hi" ? "कारीगर बनें" : "Become a worker"} onClick={() => { go("worker-onboarding"); setOpen(false); }} />
              </>
            )}

            <MobileLink label={lang === "hi" ? "सामुदायिक प्रभाव" : "Community impact"} onClick={() => { go("impact"); setOpen(false); }} />

            {!isAuthenticated && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => { go("auth"); setOpen(false); }}
                  className="rounded-2xl border border-[#1B4332]/20 py-3 text-center text-[13px] font-extrabold text-[#1B4332]"
                >
                  {lang === "hi" ? "लॉगिन" : "Log in"}
                </button>
                <button
                  onClick={() => { go("auth"); setOpen(false); }}
                  className="rounded-2xl bg-[#1B4332] py-3 text-center text-[13px] font-extrabold text-white"
                >
                  {lang === "hi" ? "शुरू करें" : "Sign up"}
                </button>
              </div>
            )}

            <div className="mt-2 flex gap-2 sm:hidden"><LangToggle lang={lang} setLang={setLang} /></div>
          </div>

          {isApp && (
            <div className="mt-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-[#4A4A4A]"><MapPin className="h-3.5 w-3.5 text-[#E76F51]" />{location}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => { if (setLocation) setLocation(loc); }}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${location === loc ? "bg-[#1B4332] text-white ring-[#1B4332]" : "bg-white text-[#4A4A4A] ring-[#1B4332]/10"}`}
                  >
                    {loc.split(",")[0]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

function NavLink({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="rounded-full px-3.5 py-2 transition hover:bg-[#1B4332]/5 hover:text-[#1B4332]">{label}</button>;
}

function MobileLink({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3.5 ring-1 ring-[#1B4332]/10">{label}<ChevronRight className="h-4 w-4 text-[#4A4A4A]" /></button>;
}


/* ---------- Service icon ---------- */
export function ServiceIcon({ icon, className = "h-6 w-6" }: { icon: string; className?: string }) {
  const c = `${className}`;
  switch (icon) {
    case "wrench": return <Wrench className={c} />;
    case "zap": return <Zap className={c} />;
    case "sparkles": return <Sparkles className={c} />;
    case "paint": return <Brush className={c} />;
    case "chef": return <ChefHat className={c} />;
    case "fridge": return <Refrigerator className={c} />;
    case "hammer": return <Hammer className={c} />;
    case "leaf": return <Leaf className={c} />;
    default: return <Wrench className={c} />;
  }
}

/* ---------- TrustDNA ---------- */
export function TrustRing({ score, size = 64, stroke = 7, dark = false }: { score?: number | null; size?: number; stroke?: number; dark?: boolean }) {
  if (score === null || score === undefined) {
    return (
      <div className="relative shrink-0 flex items-center justify-center rounded-full border border-dashed border-[#1B4332]/25 p-1 text-center" style={{ width: size, height: size }} title="TrustDNA: Not enough data">
        <div className="leading-none">
          <p className={`font-extrabold ${dark ? "text-white/80" : "text-[#1B4332]"}`} style={{ fontSize: Math.max(10, size * 0.22) }}>--</p>
          <p className={`mt-0.5 font-bold tracking-tight ${dark ? "text-white/60" : "text-[#4A4A4A]"}`} style={{ fontSize: Math.max(7, size * 0.14) }}>Not enough data</p>
        </div>
      </div>
    );
  }
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (score / 100) * circ;
  const color = score >= 90 ? "#52B788" : score >= 80 ? "#F4A261" : "#E9C46A";
  const track = dark ? "rgba(255,255,255,0.18)" : "#EFE9DD";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={`TrustDNA ${score}/100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={off} style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center leading-none">
        <div>
          <p className={`font-extrabold ${dark ? "text-white" : "text-[#1B4332]"}`} style={{ fontSize: size * 0.28 }}>{score}</p>
          <p className={`text-[8px] font-extrabold tracking-widest ${dark ? "text-white/60" : "text-[#4A4A4A]"}`}>TRUSTDNA</p>
        </div>
      </div>
    </div>
  );
}

export function TrustBadge({ score, compact = false }: { score?: number | null; compact?: boolean }) {
  if (score === null || score === undefined) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-[#1B4332]/70 backdrop-blur py-1 px-2.5 font-bold text-white ${compact ? "text-[10px]" : "text-[11px]"}`}>
        <ShieldCheck className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        Not enough data
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 font-extrabold ${compact ? "pr-2.5 text-[11px]" : "pr-3 text-xs"} ${score >= 90 ? "bg-[#1B4332] text-white" : "bg-[#E76F51] text-white"}`}>
      <ShieldCheck className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      {score} TrustDNA
    </span>
  );
}

/* ---------- Worker card ---------- */
export function Stars({ rating, className = "h-3.5 w-3.5" }: { rating?: number | null; className?: string }) {
  if (rating === null || rating === undefined) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8a8a8a]" aria-label="No rating yet">
        <Star className={`${className} text-[#8a8a8a]/40`} />
        <span>No reviews yet</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${className} ${i <= Math.round(rating) ? "fill-[#F4A261] text-[#F4A261]" : "fill-[#EFE9DD] text-[#EFE9DD]"}`} />
      ))}
    </span>
  );
}

export function WorkerCard({
  id, go, lang, showAvailable = true,
}: { id: string; go: (p: Page, wid?: string) => void; lang: "en" | "hi"; showAvailable?: boolean }) {
  const w = workers.find((x) => x.id === id)!;
  return (
    <button
      onClick={() => go("worker-profile", w.id)}
      className="group w-full overflow-hidden rounded-[18px] bg-white text-left ring-1 ring-[#1B4332]/10 card-shadow transition hover:-translate-y-1 hover:card-shadow-lg active:scale-[0.99]"
    >
      <div className="relative">
        <img src={w.photo} alt={w.name} className="h-44 w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {showAvailable && w.availableNow && (
            <span className="flex items-center gap-1.5 rounded-full bg-white/95 py-1 pl-2 pr-2.5 text-[11px] font-extrabold text-[#1B4332] backdrop-blur">
              <span className="relative flex h-2 w-2"><span className="absolute h-full w-full animate-ping rounded-full bg-[#52B788]" /><span className="h-2 w-2 rounded-full bg-[#2D6A4F]" /></span>
              {lang === "hi" ? "अभी उपलब्ध" : "Available now"}
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3"><TrustBadge score={w.trustDNA} compact /></div>
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div className="text-white">
            <p className="flex items-center gap-1.5 text-[16px] font-extrabold leading-tight">{w.name}
              {w.verified && <BadgeCheck className="h-4.5 w-4.5 shrink-0 fill-[#52B788] text-white" />}
            </p>
            <p className="text-[12px] font-semibold text-white/85">{w.service} • {w.distance} • {w.eta}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#1A1A1A]"><Stars rating={w.rating} /> {w.rating} <span className="font-semibold text-[#4A4A4A]">({w.jobs})</span></p>
          <p className="mt-0.5 text-[12px] font-semibold text-[#4A4A4A]">{w.skills.slice(0, 2).join(" • ")}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#4A4A4A]">{lang === "hi" ? "शुरुआत" : "starts"}</p>
          <p className="text-[18px] font-extrabold text-[#1B4332]">₹{w.price}</p>
        </div>
      </div>
    </button>
  );
}

/* ---------- Bottom nav (mobile) ---------- */
export function CustomerBottomNav({ page, go, onBook }: { page: Page; go: (p: Page) => void; onBook: () => void }) {
  const items = [
    { id: "customer-home", icon: Home, label: "Home" },
    { id: "workers", icon: Search, label: "Search" },
    { id: "booking", icon: CalendarCheck, label: "Book" },
    { id: "tracking", icon: Navigation, label: "Track" },
    { id: "payment", icon: User, label: "Account" },
  ] as const;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1B4332]/10 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {items.map((it) => {
          const active = page === it.id || (it.id === "booking" && page === "worker-profile");
          return (
            <button key={it.id} onClick={() => (it.id === "booking" ? onBook() : it.id === "payment" ? go("auth") : go(it.id as Page))}
              className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-[10.5px] font-bold transition ${active ? "text-[#1B4332]" : "text-[#8a8a8a]"}`}>
              <span className={`grid h-9 w-12 place-items-center rounded-full transition ${active ? "bg-[#1B4332] text-white" : ""}`}>
                <it.icon className="h-5 w-5" />
              </span>
              {it.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function WorkerBottomNav({ page, go }: { page: Page; go: (p: Page) => void }) {
  const items = [
    { id: "worker-dashboard", icon: LayoutGrid, label: "Home" },
    { id: "worker-jobs", icon: Briefcase, label: "Jobs" },
    { id: "worker-earnings", icon: Wallet, label: "Earnings" },
    { id: "worker-onboarding", icon: User, label: "Profile" },
  ] as const;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#1B4332]/10 bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4">
        {items.map((it) => {
          const active = page === it.id;
          return (
            <button key={it.id} onClick={() => go(it.id as Page)}
              className={`flex flex-col items-center gap-1 rounded-2xl py-2 text-[10.5px] font-bold transition ${active ? "text-[#1B4332]" : "text-[#8a8a8a]"}`}>
              <span className={`grid h-9 w-14 place-items-center rounded-full transition ${active ? "bg-[#1B4332] text-white" : ""}`}>
                <it.icon className="h-5 w-5" />
              </span>
              {it.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------- Misc UI ---------- */
export function SectionHead({ eyebrow, title, sub, dark = false }: { eyebrow: string; title: string; sub?: string; dark?: boolean }) {
  return (
    <div className="max-w-2xl">
      <p className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] ${dark ? "bg-white/10 text-[#F4A261]" : "bg-[#1B4332]/8 text-[#1B4332]"}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />{eyebrow}
      </p>
      <h2 className={`font-display mt-3 text-[28px] font-bold leading-[1.1] tracking-tight sm:text-[38px] ${dark ? "text-white" : "text-[#1A1A1A]"}`}>{title}</h2>
      {sub && <p className={`mt-2.5 text-[15px] font-medium leading-relaxed ${dark ? "text-white/70" : "text-[#4A4A4A]"}`}>{sub}</p>}
    </div>
  );
}

export function Stat({ value, label, icon }: { value: string; label: string; icon: ReactNode }) {
  return (
    <div className="rounded-[18px] bg-white p-4 ring-1 ring-[#1B4332]/10 card-shadow sm:p-5">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#1B4332]/8 text-[#1B4332]">{icon}</div>
      <p className="mt-3 text-[22px] font-extrabold tracking-tight text-[#1A1A1A] sm:text-[26px]">{value}</p>
      <p className="text-[12.5px] font-semibold text-[#4A4A4A]">{label}</p>
    </div>
  );
}

export function EmptyState({ title, sub, action }: { title: string; sub: string; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-[20px] border-2 border-dashed border-[#1B4332]/15 bg-white/60 px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-[#1B4332]/8 text-[#1B4332]"><Search className="h-6 w-6" /></div>
      <p className="mt-4 text-[16px] font-extrabold">{title}</p>
      <p className="mt-1 max-w-xs text-[13.5px] font-medium text-[#4A4A4A]">{sub}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[18px] bg-white ring-1 ring-[#1B4332]/10">
      <div className="skeleton h-44 w-full" />
      <div className="space-y-2 p-4"><div className="skeleton h-4 w-2/3 rounded-full" /><div className="skeleton h-3 w-1/2 rounded-full" /></div>
    </div>
  );
}

export function VoiceButton({ onClick, listening }: { onClick: () => void; listening: boolean }) {
  return (
    <button onClick={onClick} aria-label="Book by voice"
      className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-white transition active:scale-90 ${listening ? "bg-[#E76F51] animate-pulse-ring" : "bg-[#E76F51] hover:bg-[#c65a3a]"}`}>
      <Mic className="h-5 w-5" />
    </button>
  );
}

export function Footer({ go }: { go: (p: Page) => void }) {
  return (
    <footer className="bg-[#122b21] text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo dark />
            <p className="mt-4 max-w-xs text-[14px] font-medium leading-relaxed text-white/65">Local Skills. Fair Work. Trusted Connections. Dignified livelihoods for India's local heroes.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold">
              <span className="rounded-full bg-white/10 px-3 py-1.5">✓ Verified profiles</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5">✓ Transparent pricing</span>
              <span className="rounded-full bg-white/10 px-3 py-1.5">✓ Real reviews</span>
            </div>
          </div>
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-widest text-white/50">Customers</p>
            <ul className="mt-3 space-y-2.5 text-[14px] font-semibold text-white/80">
              <li><button onClick={() => go("customer-home")} className="hover:text-white">Find a worker</button></li>
              <li><button onClick={() => go("workers")} className="hover:text-white">All services</button></li>
              <li><button onClick={() => go("tracking")} className="hover:text-white">Track booking</button></li>
              <li><button onClick={() => go("impact")} className="hover:text-white">Community impact</button></li>
            </ul>
          </div>
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-widest text-white/50">Workers</p>
            <ul className="mt-3 space-y-2.5 text-[14px] font-semibold text-white/80">
              <li><button onClick={() => go("worker-onboarding")} className="hover:text-white">Join Saharaa</button></li>
              <li><button onClick={() => go("worker-dashboard")} className="hover:text-white">Worker dashboard</button></li>
              <li><button onClick={() => go("worker-earnings")} className="hover:text-white">Earnings & impact</button></li>
            </ul>
          </div>
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-widest text-white/50">Trust & safety</p>
            <ul className="mt-3 space-y-2.5 text-[14px] font-semibold text-white/80">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#52B788]" /> TrustDNA verified</li>
              <li className="flex items-center gap-2"><Bell className="h-4 w-4 text-[#52B788]" /> SOS & report</li>
              <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[#52B788]" /> Hindi + English</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-[#52B788]" /> 1800-SAHARAA</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-[12.5px] font-semibold text-white/50 sm:flex-row">
          <p>© 2026 Saharaa • Vecnaverse Hackathon • Social Impact</p>
          <p className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Made with care in India • <Clock className="ml-2 h-3.5 w-3.5" /> Support 8am–10pm</p>
        </div>
      </div>
    </footer>
  );
}

export function DemoBar({ go, role, setRole }: { go: (p: Page) => void; role: string | null; setRole: (r: any) => void }) {
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [healthReport, setHealthReport] = useState<BackendHealthReport | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  const runHealthCheck = async () => {
    setLoadingHealth(true);
    try {
      const res = await checkSupabaseConnection();
      setHealthReport(res);
    } catch {
      // report will be null or error handled inside checkSupabaseConnection
    } finally {
      setLoadingHealth(false);
    }
  };

  const openDiagnostics = () => {
    setShowHealthModal(true);
    if (!healthReport) {
      runHealthCheck();
    }
  };

  return (
    <>
      <div className="fixed bottom-[76px] left-1/2 z-40 w-[calc(100%-24px)] max-w-2xl -translate-x-1/2 md:bottom-6">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar rounded-full border border-[#1B4332]/15 bg-[#122b21]/95 p-1.5 text-white shadow-2xl backdrop-blur-xl">
          <span className="hidden shrink-0 pl-3 text-[10px] font-extrabold uppercase tracking-widest text-white/50 sm:block">Demo •</span>
          {[
            { id: "landing", label: "Landing" },
            { id: "customer-home", label: "Customer" },
            { id: "booking", label: "FairFare" },
            { id: "tracking", label: "Tracking" },
            { id: "worker-dashboard", label: "Worker" },
            { id: "admin", label: "Admin" },
            { id: "impact", label: "Impact" },
          ].map((d) => (
            <button key={d.id} onClick={() => { if (d.id === "worker-dashboard") setRole("worker"); go(d.id as Page); }}
              className="shrink-0 rounded-full px-3.5 py-2 text-[12px] font-bold transition hover:bg-white/10 active:scale-95">
              {d.label}
            </button>
          ))}
          <button
            onClick={openDiagnostics}
            title="Inspect Supabase backend health"
            className="shrink-0 flex items-center gap-1.5 rounded-full bg-[#2D6A4F]/60 px-3 py-1.5 text-[11px] font-extrabold text-[#52B788] ring-1 ring-[#52B788]/30 hover:bg-[#2D6A4F] transition active:scale-95"
          >
            <Database className="h-3 w-3" />
            <span className="hidden sm:inline">Backend</span>
          </button>
          <span className="ml-auto hidden shrink-0 items-center gap-1 pr-2 text-[10px] font-bold text-white/40 md:flex">
            <BarChart3 className="h-3 w-3" /> {role ?? "guest"}
          </span>
        </div>
      </div>

      {showHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white card-shadow-lg animate-fade-in">
            <div className="flex items-center justify-between bg-[#1B4332] p-5 text-white">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-white/10 text-[#52B788]">
                  <Database className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-[15px] font-extrabold">Supabase Backend Foundation</h3>
                  <p className="text-[11px] text-white/70">Phase 2A Diagnostic Check</p>
                </div>
              </div>
              <button
                onClick={() => setShowHealthModal(false)}
                className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-bold text-white hover:bg-white/20"
              >
                Close ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5 space-y-3.5">
              {loadingHealth && !healthReport ? (
                <div className="py-8 text-center text-[#4A4A4A]">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-[#1B4332]" />
                  <p className="mt-2 text-[13px] font-semibold">Running safe connection diagnostic...</p>
                </div>
              ) : healthReport ? (
                <>
                  <div className="rounded-2xl bg-[#FAF9F6] p-3.5 ring-1 ring-[#1B4332]/10 space-y-3">
                    {/* 1. Environment Config */}
                    <div className="flex items-start gap-2.5">
                      {healthReport.envConfigured ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2D6A4F] mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0 text-[#E76F51] mt-0.5" />
                      )}
                      <div>
                        <p className="text-[12.5px] font-extrabold text-[#1B4332]">1. Environment Configuration</p>
                        <p className="text-[11.5px] font-medium text-[#4A4A4A]">{healthReport.details.envMessage}</p>
                      </div>
                    </div>

                    {/* 2. Supabase Endpoint */}
                    <div className="flex items-start gap-2.5">
                      {healthReport.endpointReachable ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2D6A4F] mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0 text-[#E76F51] mt-0.5" />
                      )}
                      <div>
                        <p className="text-[12.5px] font-extrabold text-[#1B4332]">2. Endpoint Reachability</p>
                        <p className="text-[11.5px] font-medium text-[#4A4A4A]">{healthReport.details.networkMessage}</p>
                      </div>
                    </div>

                    {/* 3. Database Schema */}
                    <div className="flex items-start gap-2.5">
                      {healthReport.schemaMigrated ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2D6A4F] mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0 text-[#F4A261] mt-0.5" />
                      )}
                      <div>
                        <p className="text-[12.5px] font-extrabold text-[#1B4332]">3. Database Schema Status</p>
                        <p className="text-[11.5px] font-medium text-[#4A4A4A]">{healthReport.details.databaseMessage}</p>
                      </div>
                    </div>

                    {/* 4. Auth Service */}
                    <div className="flex items-start gap-2.5">
                      {healthReport.authOperational ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#2D6A4F] mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0 text-[#E76F51] mt-0.5" />
                      )}
                      <div>
                        <p className="text-[12.5px] font-extrabold text-[#1B4332]">4. Auth Service Status</p>
                        <p className="text-[11.5px] font-medium text-[#4A4A4A]">{healthReport.details.authMessage}</p>
                      </div>
                    </div>

                    {/* 5. Integration Status */}
                    <div className="flex items-start gap-2.5">
                      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#1B4332] text-[9px] font-extrabold text-white mt-0.5">
                        i
                      </span>
                      <div>
                        <p className="text-[12.5px] font-extrabold text-[#1B4332]">5. Application Data Layer</p>
                        <p className="text-[11.5px] font-medium text-[#4A4A4A]">{healthReport.details.integrationMessage}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#EFFAF1] p-3 text-[11.5px] font-medium text-[#1B4332] ring-1 ring-[#2D6A4F]/20">
                    <p className="font-bold">Next Migration Step:</p>
                    Execute <code className="font-mono bg-white/60 px-1 py-0.5 rounded text-[11px]">supabase/migrations/20261024000000_initial_schema.sql</code> in the Supabase Dashboard SQL Editor to initialize all 10 tables, triggers, and RLS policies.
                  </div>
                </>
              ) : null}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={runHealthCheck}
                  disabled={loadingHealth}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-[#1B4332] py-2.5 text-[12.5px] font-extrabold text-white transition hover:bg-[#2D6A4F]"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingHealth ? "animate-spin" : ""}`} />
                  {loadingHealth ? "Testing..." : "Re-test Connection"}
                </button>
                <button
                  onClick={() => setShowHealthModal(false)}
                  className="rounded-2xl px-5 py-2.5 text-[12.5px] font-extrabold text-[#4A4A4A] ring-1 ring-[#1B4332]/15 hover:bg-[#FAF9F6]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
