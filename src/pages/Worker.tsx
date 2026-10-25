import { useMemo, useState, useEffect, useCallback } from "react";
import {
  BadgeCheck, Camera, CheckCircle2, ChevronLeft, ChevronRight,
  ImagePlus, MapPin, MessageCircle, Navigation, Phone, ShieldCheck, Star,
  TrendingUp, Users, Wallet, Zap, HeartHandshake, Briefcase, LogOut, FileCheck, Loader2, AlertCircle, RefreshCw
} from "lucide-react";
import { workers } from "../data";
import { Stars, TrustRing, WorkerBottomNav } from "../components/shared";
import type { Page } from "../components/shared";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchWorkerBookings, updateBookingStatus, submitCounterOffer,
  type DbBooking
} from "../lib/bookings";

/* ================= WORKER DASHBOARD ================= */
export function WorkerDashboard({ go, lang }: { go: (p: Page, w?: string) => void; lang: "en" | "hi" }) {
  const { user, profile, workerProfile, updateAvailability, isAuthenticated } = useAuth();
  const isWorker = profile?.role === "worker";

  const isOnline = workerProfile?.is_online ?? false;
  const [updatingOnline, setUpdatingOnline] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Real DB bookings replacing the static mock
  const [dbBookings, setDbBookings] = useState<DbBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const loadWorkerBookings = useCallback(async () => {
    if (!user?.id) return;
    setBookingsLoading(true);
    setBookingsError(null);
    const res = await fetchWorkerBookings(user.id);
    setBookingsLoading(false);
    if (res.error) {
      setBookingsError(res.error);
    } else {
      // Show only actionable bookings in the dashboard
      setDbBookings(res.data.filter(b =>
        b.booking_status === 'pending' ||
        b.booking_status === 'negotiating' ||
        b.booking_status === 'accepted' ||
        b.booking_status === 'on_the_way' ||
        b.booking_status === 'in_progress'
      ));
    }
  }, [user?.id]);

  useEffect(() => {
    loadWorkerBookings();
  }, [loadWorkerBookings]);

  const handleAcceptBooking = async (bookingId: string) => {
    const res = await updateBookingStatus(bookingId, 'accepted', 'Worker accepted the booking');
    if (!res.success) {
      setToast(res.error || 'Failed to accept job');
    } else {
      setToast('Job accepted! Customer notified 🎉');
      loadWorkerBookings();
    }
    setTimeout(() => setToast(''), 3000);
  };

  const handleDeclineBooking = async (bookingId: string) => {
    const res = await updateBookingStatus(bookingId, 'cancelled', 'Worker declined the booking request');
    if (!res.success) {
      setToast(res.error || 'Failed to decline job');
    } else {
      setToast('Request declined politely');
      loadWorkerBookings();
    }
    setTimeout(() => setToast(''), 2600);
  };

  const handleCounterBooking = async (bookingId: string, currentPrice: number) => {
    const counter = Math.max(currentPrice, Math.round(currentPrice * 1.1 / 10) * 10);
    const res = await submitCounterOffer(bookingId, counter, `Worker countered with ₹${counter}`);
    if (!res.success) {
      setToast(res.error || 'Failed to send counter-offer');
    } else {
      setToast(`Counter-offer ₹${counter} sent via FairFare`);
      loadWorkerBookings();
    }
    setTimeout(() => setToast(''), 2600);
  };

  const handleToggleOnline = async () => {
    if (updatingOnline) return;

    if (!isAuthenticated || !isWorker) {
      setToast(lang === "hi" ? "लाइव उपलब्धता टॉगल करने के लिए कृपया कारीगर खाते से लॉग इन करें" : "Please log in as a registered worker to toggle live availability.");
      setTimeout(() => setToast(""), 3200);
      return;
    }

    setUpdatingOnline(true);
    setErrorNotice(null);
    const targetStatus = !isOnline;

    const res = await updateAvailability(targetStatus);
    setUpdatingOnline(false);

    if (!res.success) {
      setErrorNotice(res.error || "Failed to persist availability status");
      setToast(lang === "hi" ? "उपलब्धता अपडेट करने में विफल" : "Failed to update availability in database");
    } else {
      setToast(targetStatus
        ? (lang === "hi" ? "आप अब ऑनलाइन हैं! काम प्राप्त कर सकते हैं 🎉" : "You are now ONLINE! Ready to receive jobs 🎉")
        : (lang === "hi" ? "आप अब ऑफ़लाइन हैं" : "You are now OFFLINE"));
    }
    setTimeout(() => setToast(""), 3000);
  };

  // Legacy mock action removed — handled by handleAcceptBooking/handleDeclineBooking/handleCounterBooking

  const workerDisplayName = profile?.full_name || (isWorker ? "Worker" : "Ramesh Kumar");
  const isVerified = workerProfile?.verification_status === "verified";
  const ratingText = workerProfile?.rating != null ? workerProfile.rating.toFixed(1) : "New";
  const trustDNAText = workerProfile?.trust_dna != null ? `${workerProfile.trust_dna} TrustDNA` : "Not enough data";
  const jobsCount = workerProfile?.total_jobs ?? 0;
  const avatarUrl = profile?.avatar_url || "https://images.pexels.com/photos/9271168/pexels-photo-9271168.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 md:pb-16">
      {/* Toast Feedback */}
      {toast && (
        <div className="animate-fade-in fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-2xl bg-[#122b21] px-5 py-3 text-[13px] font-extrabold text-white shadow-2xl border border-[#52B788]/30">
          {toast}
        </div>
      )}

      {/* header + online toggle */}
      <div className="flex flex-wrap items-center gap-3 rounded-[22px] bg-[#122b21] p-4 text-white card-shadow-lg sm:p-5">
        <img src={avatarUrl} alt={workerDisplayName} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-[#52B788]" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[16px] font-extrabold">
            {lang === "hi" ? `नमस्ते, ${workerProfile?.hindi_name || workerDisplayName} 🙏` : `Namaste, ${workerDisplayName} 🙏`}
            {isVerified && <BadgeCheck className="h-4 w-4 fill-[#52B788] text-white" title="Verified Worker" />}
          </p>
          <p className="flex items-center gap-2 text-[12px] font-semibold text-white/65">
            {workerProfile?.rating != null && <Stars rating={workerProfile.rating} />}
            {ratingText} • ◆ {trustDNAText} • {jobsCount} jobs
          </p>
        </div>

        {/* Database-Backed Online Toggle */}
        <button
          onClick={handleToggleOnline}
          disabled={updatingOnline}
          aria-label="Toggle online availability"
          className={`flex items-center gap-3 rounded-full p-1.5 pr-2 transition ${isOnline ? "bg-[#2D6A4F]" : "bg-white/10"} ${updatingOnline ? "opacity-60 cursor-not-allowed" : "hover:ring-1 hover:ring-white/30"}`}
        >
          <span className={`flex items-center gap-1.5 px-2.5 text-[12px] font-extrabold ${isOnline ? "text-white" : "text-white/50"}`}>
            {updatingOnline && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isOnline ? "● ONLINE" : "○ OFFLINE"}
          </span>
          <span className={`relative h-9 w-[68px] rounded-full transition ${isOnline ? "bg-white/25" : "bg-white/10"}`}>
            <span className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all ${isOnline ? "left-[36px]" : "left-1"}`} />
          </span>
        </button>
      </div>

      {errorNotice && (
        <div className="animate-fade-in mt-3 flex items-center gap-2 rounded-2xl bg-[#FFEBEE] px-4 py-2.5 text-[12.5px] font-bold text-[#C62828] ring-1 ring-[#EF5350]/30">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#C62828]" />
          <span>{errorNotice}</span>
        </div>
      )}

      {!isOnline && (
        <div className="animate-fade-in mt-3 rounded-2xl bg-[#FFF1E8] px-4 py-3 text-center text-[13px] font-bold text-[#9c3d1e] ring-1 ring-[#E76F51]/25">
          {lang === "hi"
            ? "आप ऑफ़लाइन हैं — ग्राहक आपको खोज नहीं सकते। नए काम प्राप्त करने के लिए ऑनलाइन जाएं।"
            : "You're offline — customers can't discover you. Go online to receive jobs."}
        </div>
      )}


      {/* earnings strip */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-[18px] bg-white p-4 ring-1 ring-[#1B4332]/10 card-shadow">
          <p className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-[#8a8a8a]"><Wallet className="h-3.5 w-3.5" /> Today</p>
          <p className="mt-1 text-[22px] font-extrabold text-[#1B4332] sm:text-[26px]">₹1,240</p>
          <p className="flex items-center gap-1 text-[11px] font-bold text-[#2D6A4F]"><TrendingUp className="h-3 w-3" /> +18% vs yesterday</p>
        </div>
        <div className="rounded-[18px] bg-white p-4 ring-1 ring-[#1B4332]/10 card-shadow">
          <p className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-[#8a8a8a]"><CheckCircle2 className="h-3.5 w-3.5" /> Jobs</p>
          <p className="mt-1 text-[22px] font-extrabold sm:text-[26px]">148</p>
          <p className="text-[11px] font-bold text-[#4A4A4A]">3 today • 98% on-time</p>
        </div>
        <div className="rounded-[18px] bg-[#1B4332] p-4 text-white card-shadow">
          <p className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide text-white/60"><HeartHandshake className="h-3.5 w-3.5" /> Impact</p>
          <p className="mt-1 text-[22px] font-extrabold sm:text-[26px]">96 🏠</p>
          <p className="text-[11px] font-bold text-white/70">households this month</p>
        </div>
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[16px] font-extrabold">
              Incoming requests
              {isOnline && dbBookings.length > 0 && (
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#E76F51] text-[11px] text-white">
                  {dbBookings.filter(b => b.booking_status === 'pending' || b.booking_status === 'negotiating').length}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={loadWorkerBookings}
                disabled={bookingsLoading}
                className="rounded-full p-1.5 text-[#2D6A4F] hover:bg-[#EFFAF1] transition"
                aria-label="Refresh bookings"
              >
                <RefreshCw className={`h-4 w-4 ${bookingsLoading ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={() => go("worker-jobs")} className="text-[12.5px] font-bold text-[#2D6A4F]">All jobs →</button>
            </div>
          </div>

          {bookingsError && (
            <div className="mt-2 flex items-center gap-2 rounded-2xl bg-[#FFEBEE] px-4 py-2.5 text-[12px] font-bold text-[#C62828] ring-1 ring-[#EF5350]/30">
              <AlertCircle className="h-4 w-4 shrink-0" /> {bookingsError}
            </div>
          )}

          {bookingsLoading ? (
            <div className="mt-4 flex items-center justify-center gap-2 py-8 text-[13px] font-semibold text-[#4A4A4A]">
              <Loader2 className="h-5 w-5 animate-spin text-[#2D6A4F]" /> Loading your bookings…
            </div>
          ) : !isOnline ? (
            <div className="mt-3 rounded-[20px] border-2 border-dashed border-[#1B4332]/15 bg-white/60 p-8 text-center">
              <p className="text-[15px] font-extrabold">You're offline 😴</p>
              <p className="mx-auto mt-1 max-w-xs text-[13px] font-medium text-[#4A4A4A]">Go online to start receiving nearby job requests instantly.</p>
            </div>
          ) : dbBookings.length === 0 ? (
            <div className="mt-3 rounded-[20px] border-2 border-dashed border-[#2D6A4F]/25 bg-[#EFFAF1]/60 p-8 text-center">
              <p className="text-[15px] font-extrabold text-[#1B4332]">All caught up! 🎉</p>
              <p className="mx-auto mt-1 max-w-xs text-[13px] font-medium text-[#4A4A4A]">New requests will appear here. Great response rate keeps you on top!</p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {dbBookings.map((b) => {
                const isPending = b.booking_status === 'pending';
                const isNegotiating = b.booking_status === 'negotiating';
                const isActive = b.booking_status === 'accepted' || b.booking_status === 'on_the_way' || b.booking_status === 'in_progress';
                const customerName = b.customer?.full_name || 'Customer';
                const lockedPrice = Number(b.locked_price);
                const bookingTime = b.booking_type === 'asap' ? 'ASAP' : (b.scheduled_at ? new Date(b.scheduled_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Scheduled');
                return (
                  <div key={b.id} className="animate-chat-in overflow-hidden rounded-[20px] bg-white ring-1 ring-[#1B4332]/10 card-shadow">
                    <div className={`flex items-center gap-1.5 px-4 py-2 text-[11px] font-extrabold ${
                      isActive ? 'bg-[#EFFAF1] text-[#1B4332]' :
                      isNegotiating ? 'bg-[#FFF8E7] text-[#9c3d1e]' :
                      'bg-[#FEF6EC] text-[#9c3d1e]'
                    }`}>
                      <Zap className="h-3.5 w-3.5" />
                      {bookingTime}
                      {isNegotiating && ' • Negotiating'}
                      {isActive && ` • ${b.booking_status.replace('_', ' ').toUpperCase()}`}
                      <span className="ml-auto font-bold text-[#8a8a8a]">{b.booking_number}</span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[15px] font-extrabold">{customerName}</p>
                        <p className="text-[18px] font-extrabold text-[#1B4332]">₹{lockedPrice}</p>
                      </div>
                      <p className="mt-0.5 text-[13px] font-semibold text-[#4A4A4A]">{b.job_title}</p>
                      {b.service_address && (
                        <p className="mt-1 flex items-center gap-1 text-[12px] font-semibold text-[#8a8a8a]">
                          <MapPin className="h-3.5 w-3.5" /> {b.service_address}
                        </p>
                      )}
                      {(isPending || isNegotiating) && (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <button
                            onClick={() => handleAcceptBooking(b.id)}
                            className="rounded-2xl bg-[#1B4332] py-3 text-[13px] font-extrabold text-white transition hover:bg-[#2D6A4F]"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleCounterBooking(b.id, lockedPrice)}
                            className="rounded-2xl bg-[#FEF6EC] py-3 text-[13px] font-extrabold text-[#c65a3a] ring-1 ring-[#E76F51]/30"
                          >
                            Counter
                          </button>
                          <button
                            onClick={() => handleDeclineBooking(b.id)}
                            className="rounded-2xl py-3 text-[13px] font-extrabold text-[#8a8a8a] ring-1 ring-[#1B4332]/12"
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {isActive && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="rounded-full bg-[#EFFAF1] px-3 py-1.5 text-[11.5px] font-extrabold text-[#1B4332]">
                            ✓ {b.booking_status.replace(/_/g, ' ')}
                          </span>
                          <button
                            onClick={() => go('worker-jobs')}
                            className="rounded-full bg-[#FAF9F6] px-3 py-1.5 text-[11.5px] font-extrabold text-[#4A4A4A] ring-1 ring-[#1B4332]/12"
                          >
                            Manage →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* today's schedule */}
          <h2 className="mt-6 text-[16px] font-extrabold">Today's schedule</h2>
          <div className="mt-3 space-y-2.5">
            {[
              { t: "10:00 AM", n: "Priya S. — Tap repair", s: "In Progress", c: "bg-[#E76F51] text-white", done: false },
              { t: "1:00 PM", n: "Amit V. — Flush repair", s: "Upcoming", c: "bg-[#1B4332]/8 text-[#1B4332]", done: false },
              { t: "9:00 AM", n: "Sunil K. — Tank check", s: "Done ✓ ₹550", c: "bg-[#EFFAF1] text-[#1B4332]", done: true },
            ].map((j, i) => (
              <div key={i} className={`flex items-center gap-3 rounded-2xl bg-white p-3.5 ring-1 ring-[#1B4332]/10 ${j.done ? "opacity-70" : ""}`}>
                <span className="w-20 shrink-0 text-[12px] font-extrabold text-[#4A4A4A]">{j.t}</span>
                <span className="h-10 w-1 rounded-full bg-[#1B4332]/15" />
                <span className="min-w-0 flex-1 text-[13.5px] font-extrabold">{j.n}</span>
                <span className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-extrabold ${j.c}`}>{j.s}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-[20px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow">
            <p className="text-[14px] font-extrabold">Quick stats</p>
            <div className="mt-3 space-y-2.5">
              <StatBar label="Response rate" value="96%" pct={96} />
              <StatBar label="On-time arrival" value="98%" pct={98} />
              <StatBar label="Repeat customers" value="68%" pct={68} />
            </div>
            <button onClick={() => go("worker-earnings")} className="mt-4 w-full rounded-2xl bg-[#1B4332] py-3 text-[13px] font-extrabold text-white">Earnings & impact →</button>
          </div>
          <div className="overflow-hidden rounded-[20px] bg-gradient-to-br from-[#E76F51] to-[#c65a3a] p-5 text-white">
            <p className="flex items-center gap-1.5 text-[13px] font-extrabold"><Zap className="h-4 w-4" /> Publish “Available Now”</p>
            <p className="mt-1 text-[12.5px] font-medium text-white/80">Get 3× more instant bookings when customers see you online nearby.</p>
            <button onClick={() => setToast("You're now featured as Available Now ⭐")} className="mt-3 w-full rounded-2xl bg-white py-2.5 text-[13px] font-extrabold text-[#c65a3a]">Boost my visibility</button>
          </div>
        </aside>
      </div>

      {toast && (
        <div className="animate-slide-up fixed bottom-24 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-2xl bg-[#122b21] px-5 py-3.5 text-center text-[13.5px] font-bold text-white card-shadow-lg md:bottom-8">
          {toast}
        </div>
      )}
      <WorkerBottomNav page="worker-dashboard" go={go} />
    </div>
  );
}

function StatBar({ label, value, pct }: { label: string; value: string; pct: number }) {
  return (
    <div>
      <p className="flex justify-between text-[12.5px] font-bold text-[#4A4A4A]">{label}<span className="font-extrabold text-[#1B4332]">{value}</span></p>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#FAF9F6] ring-1 ring-[#1B4332]/10">
        <div className="h-full rounded-full bg-gradient-to-r from-[#2D6A4F] to-[#52B788] transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ================= WORKER ONBOARDING ================= */
export function WorkerOnboarding({ go }: { go: (p: Page) => void }) {
  const [step, setStep] = useState(0);
  const [certUploaded, setCertUploaded] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", skill: "Plumbing", rate: "250", area: "Laxmi Nagar + 3km" });
  const steps = ["Personal", "Skills & rates", "Service area", "Documents"];
  return (
    <div className="page-enter mx-auto max-w-2xl px-4 pb-28 pt-6 sm:px-6">
      <button onClick={() => go("landing")} className="flex items-center gap-1.5 text-[13px] font-bold text-[#4A4A4A]"><ChevronLeft className="h-4 w-4" /> Back</button>
      <h1 className="font-display mt-2 text-[26px] font-black tracking-tight sm:text-[32px]">Join Saharaa as a worker 🛠️</h1>
      <p className="mt-1 text-[14px] font-medium text-[#4A4A4A]">Free to join • Earn from day one • Tips are 100% yours</p>
      <div className="mt-5 flex items-center">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <span className={`grid h-9 w-9 place-items-center rounded-full text-[13px] font-extrabold transition ${i < step ? "bg-[#2D6A4F] text-white" : i === step ? "bg-[#1B4332] text-white animate-pulse-ring" : "bg-white text-[#8a8a8a] ring-1 ring-[#1B4332]/15"}`}>{i < step ? "✓" : i + 1}</span>
              <span className={`hidden text-[10.5px] font-extrabold sm:block ${i === step ? "text-[#1B4332]" : "text-[#8a8a8a]"}`}>{s}</span>
            </div>
            {i < steps.length - 1 && <div className={`mx-1 mb-5 h-1 flex-1 rounded-full ${i < step ? "bg-[#2D6A4F]" : "bg-[#1B4332]/10"}`} />}
          </div>
        ))}
      </div>

      <div className="animate-fade-in mt-4 rounded-[22px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow sm:p-7" key={step}>
        {step === 0 && (
          <div>
            <h2 className="text-[17px] font-extrabold">Your details</h2>
            <label className="mt-4 block text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">Full name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ramesh Kumar" className="mt-1.5 h-13 w-full rounded-2xl bg-[#FAF9F6] px-4 py-3.5 text-[14px] font-semibold outline-none ring-1 ring-[#1B4332]/12 focus:ring-[#2D6A4F]" />
            <label className="mt-4 block text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">Mobile number</label>
            <div className="mt-1.5 flex gap-2">
              <span className="grid place-items-center rounded-2xl bg-[#FAF9F6] px-4 text-[14px] font-extrabold ring-1 ring-[#1B4332]/12">+91</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="numeric" placeholder="98765 43210" className="w-full rounded-2xl bg-[#FAF9F6] px-4 py-3.5 text-[14px] font-semibold outline-none ring-1 ring-[#1B4332]/12 focus:ring-[#2D6A4F]" />
            </div>
            <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-[#EFFAF1] p-3.5 text-[12.5px] font-bold text-[#1B4332] ring-1 ring-[#2D6A4F]/20"><ShieldCheck className="h-5 w-5 shrink-0" /> OTP verification + Hindi voice guidance available on every step.</div>
          </div>
        )}
        {step === 1 && (
          <div>
            <h2 className="text-[17px] font-extrabold">Skills & rates</h2>
            <p className="mt-4 text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">Primary skill</p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {["Plumbing", "Electrical", "Cleaning", "Painting", "Cooking", "Carpentry"].map((s) => (
                <button key={s} onClick={() => setForm({ ...form, skill: s })} className={`rounded-2xl py-3 text-[13px] font-extrabold ring-1 transition ${form.skill === s ? "bg-[#1B4332] text-white ring-[#1B4332]" : "bg-[#FAF9F6] ring-[#1B4332]/12"}`}>{s}</button>
              ))}
            </div>
            <p className="mt-4 text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">Starting rate: <span className="text-[16px] text-[#E76F51]">₹{form.rate}</span></p>
            <input type="range" min={99} max={999} step={10} value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} className="mt-2 w-full accent-[#E76F51]" />
            <p className="text-[12px] font-semibold text-[#4A4A4A]">Tip: workers priced ₹199–₹349 fairly get 2× more bookings. You can negotiate every job in FairFare.</p>
          </div>
        )}
        {step === 2 && (
          <div>
            <h2 className="text-[17px] font-extrabold">Where do you work?</h2>
            <div className="dot-grid mt-3 grid h-44 place-items-center rounded-2xl bg-[#EDE8DA] ring-1 ring-[#1B4332]/12">
              <div className="text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#1B4332] text-white"><MapPin className="h-5 w-5" /></span><p className="mt-2 rounded-full bg-white px-4 py-1.5 text-[12px] font-extrabold card-shadow">{form.area}</p></div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Laxmi Nagar + 3km", "Preet Vihar + 4km", "Mayur Vihar + 5km", "Full East Delhi"].map((a) => (
                <button key={a} onClick={() => setForm({ ...form, area: a })} className={`rounded-full px-4 py-2 text-[12.5px] font-extrabold ring-1 ${form.area === a ? "bg-[#1B4332] text-white" : "bg-[#FAF9F6] ring-[#1B4332]/12"}`}>{a}</button>
              ))}
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <h2 className="text-[17px] font-extrabold">Verify your identity 🛡️</h2>
            <p className="mt-1 text-[13px] font-medium text-[#4A4A4A]">Builds your TrustDNA score — verified workers earn 3× more.</p>
            <div className="mt-4 space-y-2.5">
              {[
                ["Aadhaar card", "Uploaded ✓", true],
                ["Address proof", "Uploaded ✓", true],
                ["Skill certificate (optional)", certUploaded ? "Skill_Cert_2026.pdf uploaded ✓ (+8 TrustDNA)" : "Upload to boost TrustDNA +8", certUploaded]
              ].map(([t, s, done]) => (
                <div key={t as string} className="flex items-center gap-3 rounded-2xl bg-[#FAF9F6] p-4 ring-1 ring-[#1B4332]/10">
                  <span className={`grid h-11 w-11 place-items-center rounded-2xl ${done ? "bg-[#2D6A4F] text-white" : "bg-white text-[#1B4332] ring-1 ring-[#1B4332]/15"}`}>{done ? <FileCheck className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}</span>
                  <span className="flex-1"><span className="block text-[13.5px] font-extrabold">{t}</span><span className={`block text-[11.5px] font-bold ${done ? "text-[#2D6A4F]" : "text-[#E76F51]"}`}>{s}</span></span>
                  {!done && (
                    <button
                      onClick={() => setCertUploaded(true)}
                      className="rounded-full bg-[#1B4332] px-4 py-2 text-[12px] font-extrabold text-white transition hover:bg-[#2D6A4F]"
                    >
                      Upload
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-6 flex gap-2">
          {step > 0 && <button onClick={() => setStep(step - 1)} className="rounded-2xl px-5 py-3.5 text-[14px] font-extrabold text-[#4A4A4A] ring-1 ring-[#1B4332]/15">Back</button>}
          <button onClick={() => (step < 3 ? setStep(step + 1) : go("worker-dashboard"))} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1B4332] py-3.5 text-[14px] font-extrabold text-white transition hover:bg-[#2D6A4F]">
            {step < 3 ? <>Continue <ChevronRight className="h-4 w-4" /></> : "Submit & go online 🎉"}
          </button>
        </div>
      </div>
      <WorkerBottomNav page="worker-onboarding" go={go} />
    </div>
  );
}

/* ================= JOBS ================= */
export function WorkerJobs({ go }: { go: (p: Page, w?: string) => void }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<"active" | "past">("active");
  const [jobStage, setJobStage] = useState(1);
  const [showProof, setShowProof] = useState(false);
  const [modalType, setModalType] = useState<"navigate" | "chat" | "call" | null>(null);
  const [chatMsgs, setChatMsgs] = useState([
    { from: "customer", text: "Namaste Ramesh ji, what time will you reach?" },
    { from: "me", text: "I have left Vikas Marg, arriving in 6-8 minutes!" }
  ]);
  const [quickInput, setQuickInput] = useState("");
  const [callActive, setCallActive] = useState(false);
  const [toast, setToast] = useState("");

  // Completed jobs from DB
  const [completedJobs, setCompletedJobs] = useState<DbBooking[]>([]);
  const [completedLoading, setCompletedLoading] = useState(false);

  useEffect(() => {
    if (tab !== 'past' || !user?.id) return;
    setCompletedLoading(true);
    fetchWorkerBookings(user.id).then(res => {
      setCompletedLoading(false);
      if (!res.error) {
        setCompletedJobs(res.data.filter(b => b.booking_status === 'completed'));
      }
    });
  }, [tab, user?.id]);

  const sendMsg = (textToSend?: string) => {
    const t = textToSend || quickInput;
    if (!t.trim()) return;
    setChatMsgs((prev) => [...prev, { from: "me", text: t.trim() }]);
    setQuickInput("");
  };

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 md:pb-16">
      <h1 className="font-display text-[24px] font-black sm:text-[30px]">My jobs</h1>
      <div className="mt-3 flex rounded-full bg-white p-1 ring-1 ring-[#1B4332]/12 sm:max-w-sm">
        <button onClick={() => setTab("active")} className={`flex-1 rounded-full py-2.5 text-[13px] font-extrabold ${tab === "active" ? "bg-[#1B4332] text-white" : "text-[#4A4A4A]"}`}>Active (2)</button>
        <button onClick={() => setTab("past")} className={`flex-1 rounded-full py-2.5 text-[13px] font-extrabold ${tab === "past" ? "bg-[#1B4332] text-white" : "text-[#4A4A4A]"}`}>Completed</button>
      </div>

      {tab === "active" ? (
        <div className="mt-4 grid items-start gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[22px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><p className="text-[17px] font-extrabold">Priya S. — Tap repair • ₹450 locked</p><p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#4A4A4A]"><MapPin className="h-3.5 w-3.5 text-[#E76F51]" /> B-42, Laxmi Nagar • 0.6 km</p></div>
              <span className="rounded-full bg-[#FEF6EC] px-3 py-1.5 text-[11.5px] font-extrabold text-[#c65a3a]">FairFare locked ₹450</span>
            </div>
            <div className="mt-4 flex items-center gap-1">
              {["Accepted", "On the Way", "Start Work", "Complete"].map((s, i) => (
                <div key={s} className="flex flex-1 items-center gap-1">
                  <button onClick={() => setJobStage(i)} className={`flex-1 rounded-2xl py-3 text-[11.5px] font-extrabold transition sm:text-[12.5px] ${i < jobStage ? "bg-[#2D6A4F] text-white" : i === jobStage ? "bg-[#1B4332] text-white animate-pulse-ring" : "bg-[#FAF9F6] text-[#8a8a8a] ring-1 ring-[#1B4332]/10"}`}>
                    {i < jobStage ? `✓ ${s}` : s}
                  </button>
                  {i < 3 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#8a8a8a]" />}
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                onClick={() => setModalType("navigate")}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#FAF9F6] py-3 text-[12.5px] font-extrabold ring-1 ring-[#1B4332]/12 transition hover:bg-[#1B4332] hover:text-white"
              >
                <Navigation className="h-4 w-4" /> Navigate
              </button>
              <button
                onClick={() => setModalType("chat")}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#FAF9F6] py-3 text-[12.5px] font-extrabold ring-1 ring-[#1B4332]/12 transition hover:bg-[#1B4332] hover:text-white"
              >
                <MessageCircle className="h-4 w-4" /> Chat
              </button>
              <button
                onClick={() => { setModalType("call"); setCallActive(false); }}
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#FAF9F6] py-3 text-[12.5px] font-extrabold ring-1 ring-[#1B4332]/12 transition hover:bg-[#1B4332] hover:text-white"
              >
                <Phone className="h-4 w-4" /> Call
              </button>
            </div>
            <button onClick={() => setShowProof(!showProof)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#1B4332]/25 bg-[#FAF9F6] py-3.5 text-[13.5px] font-extrabold text-[#1B4332]">
              <Camera className="h-5 w-5" /> {showProof ? "Photos added ✓ (2)" : "Upload Proof of Work (before/after)"}
            </button>
            {showProof && (
              <div className="animate-fade-in mt-3 grid grid-cols-2 gap-3">
                <div className="overflow-hidden rounded-2xl ring-1 ring-[#1B4332]/12"><img src="https://images.pexels.com/photos/19140578/pexels-photo-19140578.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200" alt="Before" className="h-32 w-full object-cover" /><p className="bg-[#FAF9F6] py-1.5 text-center text-[11px] font-extrabold">BEFORE ✓</p></div>
                <div className="overflow-hidden rounded-2xl ring-2 ring-[#2D6A4F]"><img src="https://images.pexels.com/photos/29226620/pexels-photo-29226620.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200" alt="After" className="h-32 w-full object-cover" /><p className="bg-[#EFFAF1] py-1.5 text-center text-[11px] font-extrabold text-[#1B4332]">AFTER ✓</p></div>
              </div>
            )}
          </div>
          <aside className="space-y-3">
            <div className="rounded-[20px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow">
              <p className="text-[13px] font-extrabold">Next: Amit V. — 1:00 PM</p><p className="text-[12px] font-semibold text-[#4A4A4A]">Flush repair • ₹380 • 1.2 km</p>
              <button onClick={() => go("worker-dashboard")} className="mt-3 w-full rounded-2xl bg-[#FAF9F6] py-2.5 text-[12.5px] font-extrabold ring-1 ring-[#1B4332]/12">View in dashboard</button>
            </div>
            <div className="rounded-[20px] bg-[#1B4332] p-5 text-white"><p className="text-[13px] font-extrabold">💡 Pro tip</p><p className="mt-1 text-[12.5px] font-medium text-white/70">Uploading proof photos before asking for payment increases 5-star reviews by 40%.</p></div>
          </aside>
        </div>
      ) : (
        <div className="mt-4">
          {completedLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-[13px] font-semibold text-[#4A4A4A]">
              <Loader2 className="h-5 w-5 animate-spin text-[#2D6A4F]" /> Loading completed jobs…
            </div>
          ) : completedJobs.length === 0 ? (
            <div className="rounded-[20px] border-2 border-dashed border-[#1B4332]/15 bg-white/60 p-10 text-center">
              <p className="text-[15px] font-extrabold">No completed jobs yet</p>
              <p className="mt-1 text-[13px] font-medium text-[#4A4A4A]">Completed bookings will appear here after you finish jobs.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {completedJobs.map((b) => (
                <div key={b.id} className="rounded-[20px] bg-white p-4 ring-1 ring-[#1B4332]/10 card-shadow">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-extrabold">{b.customer?.full_name || 'Customer'}</p>
                    <span className="rounded-full bg-[#EFFAF1] px-2.5 py-1 text-[12px] font-extrabold text-[#1B4332]">
                      ₹{Number(b.total_amount)} ✓ done
                    </span>
                  </div>
                  <p className="text-[12.5px] font-semibold text-[#4A4A4A]">
                    {b.job_title} • {new Date(b.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="mt-1 text-[11.5px] font-bold text-[#8a8a8a]">{b.booking_number}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation Modal */}
      {modalType === "navigate" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[24px] bg-white card-shadow-lg">
            <div className="bg-[#1B4332] p-5 text-white">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[14px] font-extrabold"><Navigation className="h-4 w-4" /> Live Turn-by-Turn GPS</span>
                <button onClick={() => setModalType(null)} className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-bold text-white hover:bg-white/20">Close ✕</button>
              </div>
              <p className="mt-2 text-[20px] font-black">6 mins • 0.6 km away</p>
              <p className="text-[12.5px] text-white/80">Destination: Priya Sharma — B-42, Laxmi Nagar</p>
            </div>
            <div className="p-5">
              <div className="rounded-2xl bg-[#EFFAF1] p-4 ring-1 ring-[#2D6A4F]/20">
                <p className="text-[13px] font-extrabold text-[#1B4332]">Turn right at Vikas Marg Main Crossing</p>
                <p className="mt-1 text-[12px] font-semibold text-[#4A4A4A]">Then proceed 250m towards Gali No. 4, Green Gate.</p>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    window.open("https://maps.google.com/?q=Laxmi+Nagar+Delhi", "_blank");
                    setModalType(null);
                  }}
                  className="flex-1 rounded-2xl bg-[#1B4332] py-3 text-[13px] font-extrabold text-white"
                >
                  Open in Google Maps ↗
                </button>
                <button
                  onClick={() => {
                    setJobStage(1);
                    setModalType(null);
                    setToast("Marked status: On the way! Customer notified.");
                    setTimeout(() => setToast(""), 3000);
                  }}
                  className="rounded-2xl bg-[#FAF9F6] px-4 py-3 text-[13px] font-extrabold text-[#1B4332] ring-1 ring-[#1B4332]/15"
                >
                  Confirm on way
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {modalType === "chat" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex h-[480px] w-full max-w-md flex-col overflow-hidden rounded-[24px] bg-white card-shadow-lg">
            <div className="flex items-center justify-between bg-[#1B4332] p-4 text-white">
              <div>
                <p className="text-[14px] font-extrabold">Priya Sharma (Customer)</p>
                <p className="text-[11.5px] text-[#52B788]">● Active now • Job #SH-2481</p>
              </div>
              <button onClick={() => setModalType(null)} className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-bold text-white hover:bg-white/20">Close ✕</button>
            </div>
            <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
              {chatMsgs.map((m, idx) => (
                <div key={idx} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] font-semibold ${m.from === "me" ? "bg-[#1B4332] text-white" : "bg-[#FAF9F6] text-[#1A1A1A] ring-1 ring-[#1B4332]/10"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#1B4332]/10 bg-[#FAF9F6] p-3">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {["I'm at the gate", "Reached location", "Please check door"].map((quick) => (
                  <button
                    key={quick}
                    onClick={() => sendMsg(quick)}
                    className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#1B4332] ring-1 ring-[#1B4332]/15"
                  >
                    {quick}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMsg()}
                  placeholder="Type message to Priya..."
                  className="flex-1 rounded-2xl bg-white px-4 py-2.5 text-[13px] font-semibold outline-none ring-1 ring-[#1B4332]/15"
                />
                <button
                  onClick={() => sendMsg()}
                  className="rounded-2xl bg-[#1B4332] px-4 py-2.5 text-[13px] font-extrabold text-white"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {modalType === "call" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-[24px] bg-white p-6 text-center card-shadow-lg">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#EFFAF1] text-[#1B4332] ring-4 ring-[#2D6A4F]/20">
              <Phone className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-[18px] font-black">Customer Call Masking</h3>
            <p className="mt-1 text-[13px] font-medium text-[#4A4A4A]">Priya Sharma • Booking #SH-2481</p>
            <div className="mt-4 rounded-2xl bg-[#FAF9F6] p-3.5 ring-1 ring-[#1B4332]/10">
              <p className="text-[11px] font-bold uppercase text-[#8a8a8a]">Virtual Bridge Number</p>
              <p className="font-mono text-[16px] font-extrabold text-[#1B4332]">+91 011-4920-XXXX</p>
              <p className="text-[11px] font-semibold text-[#52B788]">✓ Personal numbers remain confidential</p>
            </div>
            {callActive ? (
              <div className="animate-fade-in mt-4 rounded-2xl bg-[#EFFAF1] p-3 text-[13px] font-extrabold text-[#1B4332]">
                ● Call connected (00:14) • Speaking with customer
              </div>
            ) : null}
            <div className="mt-5 flex gap-2">
              {!callActive ? (
                <button
                  onClick={() => setCallActive(true)}
                  className="flex-1 rounded-2xl bg-[#2D6A4F] py-3 text-[13.5px] font-extrabold text-white transition hover:bg-[#1B4332]"
                >
                  Connect Call 📞
                </button>
              ) : (
                <button
                  onClick={() => { setCallActive(false); setModalType(null); }}
                  className="flex-1 rounded-2xl bg-[#E76F51] py-3 text-[13.5px] font-extrabold text-white"
                >
                  End Call
                </button>
              )}
              <button
                onClick={() => setModalType(null)}
                className="rounded-2xl px-4 py-3 text-[13px] font-extrabold text-[#4A4A4A] ring-1 ring-[#1B4332]/15"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="animate-slide-up fixed bottom-24 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-2xl bg-[#122b21] px-5 py-3.5 text-center text-[13.5px] font-bold text-white card-shadow-lg md:bottom-8">
          {toast}
        </div>
      )}
      <WorkerBottomNav page="worker-jobs" go={go} />
    </div>
  );
}

/* ================= EARNINGS & IMPACT ================= */
export function WorkerEarnings({ go, lang }: { go: (p: Page) => void; lang: "en" | "hi" }) {
  const [range, setRange] = useState<"week" | "month">("week");
  const [toast, setToast] = useState("");
  const week = [420, 650, 380, 720, 910, 1240, 860];
  const month = [4200, 5100, 4800, 6200];
  const data = range === "week" ? week : month;
  const max = Math.max(...data);
  const labels = range === "week" ? ["M", "T", "W", "T", "F", "S", "S"] : ["W1", "W2", "W3", "W4"];

  const stats = useMemo(() => ([
    { icon: Wallet, v: range === "week" ? "₹5,180" : "₹20,300", l: lang === "hi" ? "कुल कमाई" : "Total earnings" },
    { icon: CheckCircle2, v: "21", l: "Jobs done" },
    { icon: Star, v: "₹340", l: "Tips (100% yours)" },
    { icon: Users, v: "14", l: "Repeat customers" },
  ]), [range, lang]);

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 md:pb-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-[24px] font-black sm:text-[30px]">{lang === "hi" ? "कमाई और प्रभाव" : "Earnings & impact"}</h1>
        <div className="flex rounded-full bg-white p-1 ring-1 ring-[#1B4332]/12">
          <button onClick={() => setRange("week")} className={`rounded-full px-4 py-2 text-[12.5px] font-extrabold ${range === "week" ? "bg-[#1B4332] text-white" : "text-[#4A4A4A]"}`}>Week</button>
          <button onClick={() => setRange("month")} className={`rounded-full px-4 py-2 text-[12.5px] font-extrabold ${range === "month" ? "bg-[#1B4332] text-white" : "text-[#4A4A4A]"}`}>Month</button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i} className="rounded-[18px] bg-white p-4 ring-1 ring-[#1B4332]/10 card-shadow">
            <s.icon className="h-5 w-5 text-[#1B4332]" />
            <p className="mt-2 text-[20px] font-extrabold sm:text-[24px]">{s.v}</p>
            <p className="text-[12px] font-semibold text-[#4A4A4A]">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid items-start gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[22px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow sm:p-6">
          <p className="flex items-center justify-between text-[14px] font-extrabold">Earnings chart <span className="flex items-center gap-1 text-[12px] text-[#2D6A4F]"><TrendingUp className="h-4 w-4" /> +22% growth</span></p>
          <div className="mt-5 flex h-48 items-end gap-2 sm:gap-3">
            {data.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10.5px] font-extrabold text-[#1B4332]">₹{v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}</span>
                <div className="flex w-full flex-1 items-end rounded-xl bg-[#FAF9F6] ring-1 ring-[#1B4332]/8">
                  <div className={`w-full rounded-xl transition-all duration-700 ${i === data.length - 2 ? "bg-gradient-to-t from-[#c65a3a] to-[#F4A261]" : "bg-gradient-to-t from-[#1B4332] to-[#52B788]"}`} style={{ height: `${(v / max) * 100}%`, minHeight: 12 }} />
                </div>
                <span className="text-[11px] font-bold text-[#8a8a8a]">{labels[i]}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 rounded-2xl bg-[#FAF9F6] p-3.5 text-[12px] font-bold text-[#4A4A4A] ring-1 ring-[#1B4332]/8">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#2D6A4F]" /> Job payouts</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#F4A261]" /> Best day</span>
            <span className="ml-auto hidden sm:block">Avg/day: ₹740</span>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="overflow-hidden rounded-[22px] bg-[#1B4332] p-5 text-white card-shadow-lg sm:p-6">
            <p className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-[#52B788]"><HeartHandshake className="h-4 w-4" /> Livelihood impact</p>
            <p className="font-display mt-2 text-[30px] font-black leading-tight">You helped <span className="text-[#F4A261]">96 households</span> this month 🏠</p>
            <div className="mt-4 space-y-2.5 text-[12.5px] font-bold">
              <ImpactRow k="Families served" v="96" />
              <ImpactRow k="Repeat families" v="34" />
              <ImpactRow k="Neighbourhood earnings kept local" v="68%" />
              <ImpactRow k="TrustDNA growth" v="+6 pts" />
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/10 p-3.5 ring-1 ring-white/15">
              <TrustRing score={92} size={52} stroke={6} dark />
              <p className="text-[12px] font-semibold text-white/75">Top 5% of plumbers in East Delhi. Keep your response under 5 mins to hit 95!</p>
            </div>
          </div>
          <div className="rounded-[20px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow">
            <p className="text-[13.5px] font-extrabold">Payout • UPI ****4821</p>
            <p className="text-[12px] font-semibold text-[#4A4A4A]">Next payout tomorrow • ₹1,240 • No commission on tips</p>
            <button
              onClick={() => {
                const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(
                  "Date,Job ID,Customer,Service,Locked Price,Tip,Platform Fee,Net Payout\n" +
                  "2026-10-24,#SH-2481,Priya Sharma,Tap repair,₹450,₹40,₹0,₹490\n" +
                  "2026-10-24,#SH-2475,Sunil Kumar,Tank check,₹550,₹50,₹0,₹600\n" +
                  "2026-10-23,#SH-2460,Rekha Devi,Pipe fitting,₹720,₹60,₹0,₹780\n"
                );
                const link = document.createElement("a");
                link.setAttribute("href", csvContent);
                link.setAttribute("download", `Saharaa_Statement_${range}_2026.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setToast(`Statement downloaded for ${range === "week" ? "this week" : "this month"} 📄`);
                setTimeout(() => setToast(""), 3000);
              }}
              className="mt-3 w-full rounded-2xl bg-[#EFFAF1] py-2.5 text-[12.5px] font-extrabold text-[#1B4332] ring-1 ring-[#2D6A4F]/25 transition hover:bg-[#1B4332] hover:text-white"
            >
              Download statement (CSV)
            </button>
          </div>
        </aside>
      </div>

      {toast && (
        <div className="animate-slide-up fixed bottom-24 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-2xl bg-[#122b21] px-5 py-3.5 text-center text-[13.5px] font-bold text-white card-shadow-lg md:bottom-8">
          {toast}
        </div>
      )}
      <WorkerBottomNav page="worker-earnings" go={go} />
    </div>
  );
}

function ImpactRow({ k, v }: { k: string; v: string }) {
  return <p className="flex justify-between border-b border-white/10 pb-2 text-white/75">{k}<span className="font-extrabold text-white">{v}</span></p>;
}

/* ================= AUTH ================= */
import { AuthPage } from "./AuthPage";

export function Auth({ go, lang }: { go: (p: Page, w?: string) => void; setRole?: (r: "customer" | "worker" | "admin") => void; lang: "en" | "hi" }) {
  return <AuthPage go={go} lang={lang} />;
}

