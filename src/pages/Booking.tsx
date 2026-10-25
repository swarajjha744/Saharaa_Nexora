import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowRight, BadgeCheck, Camera, CheckCircle2, ChevronLeft, Clock, ImagePlus,
  Lock, MapPin, MessageCircle, Mic, Navigation, Phone, ShieldCheck, Star,
  AlertTriangle, Wallet, RotateCcw, Send, Sparkles, Timer, FileText, ChevronRight, X,
  Loader2, AlertCircle, RefreshCw, CheckCheck, Undo2
} from "lucide-react";
import { workers, serviceJobConfigs } from "../data";
import type { OfferMsg } from "../data";
import { CustomerBottomNav, Stars, TrustRing, EmptyState } from "../components/shared";
import type { Page } from "../components/shared";
import { useAuth } from "../contexts/AuthContext";
import {
  createBooking, fetchBookingById, fetchBookingOffers, fetchBookingEvents,
  submitCounterOffer, acceptOffer, updateBookingStatus, fetchCustomerBookings,
  type DbBooking, type DbNegotiationOffer, type DbBookingEvent
} from "../lib/bookings";
import { fetchWorkerById, normalizeWorker } from "../lib/marketplace";

/* ================= BOOKING + FAIRFARE ================= */
export function BookingFlow({
  go, lang, workerId, onLocked,
  scheduleMode = "asap", setScheduleMode, scheduleDate = "Tomorrow, 10:00 AM", setScheduleDate,
  address = "B-42, Laxmi Nagar, Delhi 110092", setAddress,
}: {
  go: (p: Page, widOrOpts?: any) => void; lang: "en" | "hi"; workerId: string; onLocked: (price: number) => void;
  scheduleMode?: "asap" | "later"; setScheduleMode?: (m: "asap" | "later") => void;
  scheduleDate?: string; setScheduleDate?: (d: string) => void;
  address?: string; setAddress?: (a: string) => void;
}) {
  const w = workers.find((x) => x.id === workerId) ?? workers[0];
  const cfg = serviceJobConfigs[w.serviceId] || serviceJobConfigs["plumbing"];

  const [step, setStep] = useState(1);
  const [schedule, setSchedule] = useState<"asap" | "later">(scheduleMode);
  const [date, setDate] = useState(scheduleDate);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("10:00 AM - 12:00 PM");
  const [dateError, setDateError] = useState("");
  const [localAddress, setLocalAddress] = useState(address);
  const [desc, setDesc] = useState(cfg.defaultDesc);
  const [photos, setPhotos] = useState(cfg.photos.length);
  const [offers, setOffers] = useState<OfferMsg[]>([
    {
      id: 1,
      from: "system",
      text: `FairFare started · ${w.name.split(" ")[0]}'s quote for ${cfg.title.toLowerCase()}`,
      price: w.price + 150,
      time: "10:02",
    },
    {
      id: 2,
      from: "worker",
      text: schedule === "asap"
        ? `${cfg.workerGreeting} I can come in ${w.eta}.`
        : `Namaste! Seen your request for ${cfg.title.toLowerCase()} on ${date}. I have confirmed that slot.`,
      price: w.price + 150,
      time: "10:03",
    },
  ]);
  const [input, setInput] = useState("");
  const [locked, setLocked] = useState<number | null>(null);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [offers, typing, step]);

  const todayStr = new Date().toISOString().split("T")[0];

  const handleCustomDateChange = (dVal: string) => {
    setCustomDate(dVal);
    if (!dVal) return;
    if (dVal < todayStr) {
      setDateError("Please select today or a future date.");
      return;
    }
    setDateError("");
    const formatted = `${dVal}, ${customTime}`;
    setDate(formatted);
    if (setScheduleDate) setScheduleDate(formatted);
  };

  const handleCustomTimeChange = (tVal: string) => {
    setCustomTime(tVal);
    const datePart = customDate || "Tomorrow";
    const formatted = `${datePart}, ${tVal}`;
    setDate(formatted);
    if (setScheduleDate) setScheduleDate(formatted);
  };

  const selectPresetDate = (d: string) => {
    setDate(d);
    setDateError("");
    if (setScheduleDate) setScheduleDate(d);
  };

  const sendOffer = (price?: number, text?: string) => {
    const val = price ?? parseInt(input.replace(/[^0-9]/g, "")) ?? 0;
    if (!val && !text) return;
    const msg: OfferMsg = {
      id: Date.now(),
      from: "customer",
      text: text ?? `I can do ₹${val}. Can you confirm for ${schedule === "asap" ? "ASAP" : date}?`,
      price: val || undefined,
      time: "now",
    };
    setOffers((o) => [...o, msg]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      if (val && val >= w.price) {
        const lockPrice = val;
        setOffers((o) => [
          ...o,
          {
            id: Date.now() + 1,
            from: "worker",
            text: `Done! ₹${lockPrice} works for me. Locking price for ${cfg.title.toLowerCase()}…`,
            price: lockPrice,
            time: "now",
          },
          {
            id: Date.now() + 2,
            from: "system",
            text: `Price locked at ₹${lockPrice} · Guaranteed price for ${cfg.title.toLowerCase()} · No hidden charges`,
            price: lockPrice,
            time: "now",
          },
        ]);
        setLocked(lockPrice);
      } else if (val) {
        const counter = Math.max(w.price, Math.round((val + w.price + 150) / 2 / 10) * 10);
        const reason = cfg.workerCounterReason.replace("{counter}", String(counter));
        setOffers((o) => [
          ...o,
          { id: Date.now() + 1, from: "worker", text: reason, price: counter, time: "now" },
        ]);
      } else {
        setOffers((o) => [
          ...o,
          { id: Date.now() + 1, from: "worker", text: "Sure — tell me your budget and I'll do my best to make it fair!", time: "now" },
        ]);
      }
    }, 1500);
  };

  const quickOffers = [w.price - 40, w.price, w.price + 60];

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 pb-32 pt-5 sm:px-6 md:pb-16">
      <button onClick={() => go("worker-profile", w.id)} className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-bold ring-1 ring-[#1B4332]/12">
        <ChevronLeft className="h-4 w-4" /> {w.name}
      </button>

      {/* steps */}
      <div className="mt-4 flex items-center gap-1.5 sm:gap-2">
        {["Details", "FairFare", "Confirm"].map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-1.5">
            <div className={`flex flex-1 items-center gap-2 rounded-full px-3 py-2 text-[12px] font-extrabold sm:px-4 ${step > i + 1 ? "bg-[#2D6A4F] text-white" : step === i + 1 ? "bg-[#1B4332] text-white" : "bg-white text-[#8a8a8a] ring-1 ring-[#1B4332]/10"}`}>
              <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${step >= i + 1 ? "bg-white/20" : "bg-[#1B4332]/10"}`}>{step > i + 1 ? "✓" : i + 1}</span> {s}
            </div>
            {i < 2 && <ChevronRight className="h-4 w-4 shrink-0 text-[#8a8a8a]" />}
          </div>
        ))}
      </div>

      <div className="mt-4 grid items-start gap-5 lg:grid-cols-[1fr_400px]">
        <div>
          {step === 1 && (
            <div className="animate-slide-up rounded-[22px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow sm:p-6">
              <h2 className="text-[18px] font-extrabold">Tell {w.name.split(" ")[0]} about the {w.service.toLowerCase()} work</h2>
              <p className="mt-1 text-[13px] font-semibold text-[#4A4A4A]">Accurate details help {w.name.split(" ")[0]} give the most honest FairFare quote.</p>

              {/* Timing */}
              <p className="mt-5 text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">When do you need this done?</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setSchedule("asap");
                    if (setScheduleMode) setScheduleMode("asap");
                  }}
                  className={`flex items-center gap-2.5 rounded-2xl p-3.5 text-left ring-2 transition ${schedule === "asap" ? "bg-[#EFFAF1] ring-[#2D6A4F]" : "bg-[#FAF9F6] ring-[#1B4332]/10"}`}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#E76F51] text-white"><Timer className="h-5 w-5" /></span>
                  <span>
                    <span className="block text-[13.5px] font-extrabold">ASAP</span>
                    <span className="block text-[11.5px] font-bold text-[#4A4A4A]">{w.availableNow ? `Arrives ${w.eta}` : "Busy (~2h wait)"}</span>
                  </span>
                </button>
                <button
                  onClick={() => {
                    setSchedule("later");
                    if (setScheduleMode) setScheduleMode("later");
                  }}
                  className={`flex items-center gap-2.5 rounded-2xl p-3.5 text-left ring-2 transition ${schedule === "later" ? "bg-[#EFFAF1] ring-[#2D6A4F]" : "bg-[#FAF9F6] ring-[#1B4332]/10"}`}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#1B4332] text-white"><Clock className="h-5 w-5" /></span>
                  <span>
                    <span className="block text-[13.5px] font-extrabold">Schedule</span>
                    <span className="block text-[11.5px] font-bold text-[#4A4A4A]">Choose slot</span>
                  </span>
                </button>
              </div>

              {/* ASAP worker unavailable warning */}
              {schedule === "asap" && !w.availableNow && (
                <div className="animate-fade-in mt-3 rounded-2xl bg-[#FFF1E8] p-3.5 text-[12.5px] font-bold text-[#9c3d1e] ring-1 ring-[#E76F51]/30">
                  ⚠️ {w.name} is currently completing another job and is not immediately free. We strongly recommend scheduling a future appointment time slot below.
                  <button onClick={() => setSchedule("later")} className="mt-1 block text-xs underline font-extrabold">
                    Switch to Schedule appointment →
                  </button>
                </div>
              )}

              {/* Schedule slot picker */}
              {schedule === "later" && (
                <div className="animate-fade-in mt-3 rounded-2xl bg-[#FAF9F6] p-4 ring-1 ring-[#1B4332]/10">
                  <p className="text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">Select appointment slot</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {["Today, 4:00 PM", "Tomorrow, 10:00 AM", "Tomorrow, 2:00 PM", "Day after, 11:00 AM"].map((d) => (
                      <button key={d} onClick={() => selectPresetDate(d)} className={`rounded-2xl px-3 py-2.5 text-[12px] font-extrabold ring-1 transition ${date === d ? "bg-[#1B4332] text-white ring-[#1B4332]" : "bg-white ring-[#1B4332]/12 hover:bg-[#FAF9F6]"}`}>{d}</button>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <label className="text-[11.5px] font-bold text-[#4A4A4A]">
                      Or choose calendar date:
                      <input
                        type="date"
                        min={todayStr}
                        value={customDate}
                        onChange={(e) => handleCustomDateChange(e.target.value)}
                        className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-xs font-bold outline-none ring-1 ring-[#1B4332]/15"
                      />
                    </label>
                    <label className="text-[11.5px] font-bold text-[#4A4A4A]">
                      Preferred time window:
                      <select
                        value={customTime}
                        onChange={(e) => handleCustomTimeChange(e.target.value)}
                        className="mt-1 w-full rounded-xl bg-white px-3 py-2 text-xs font-bold outline-none ring-1 ring-[#1B4332]/15"
                      >
                        <option>09:00 AM - 11:00 AM (Morning)</option>
                        <option>11:00 AM - 01:00 PM (Midday)</option>
                        <option>02:00 PM - 04:00 PM (Afternoon)</option>
                        <option>04:00 PM - 06:00 PM (Evening)</option>
                        <option>06:00 PM - 08:00 PM (Late evening)</option>
                      </select>
                    </label>
                  </div>
                  {dateError && <p className="mt-2 text-xs font-bold text-[#c65a3a]">{dateError}</p>}
                  <p className="mt-2 text-[11.5px] font-semibold text-[#1B4332]">
                    Confirmed appointment: <span className="font-extrabold">{date}</span>
                  </p>
                </div>
              )}

              {/* Address */}
              <p className="mt-5 text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">Address</p>
              <label className="mt-2 flex items-start gap-2.5 rounded-2xl bg-[#FAF9F6] p-3.5 ring-1 ring-[#1B4332]/10 focus-within:ring-[#2D6A4F]">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#E76F51]" />
                <textarea
                  value={localAddress}
                  onChange={(e) => {
                    setLocalAddress(e.target.value);
                    if (setAddress) setAddress(e.target.value);
                  }}
                  rows={2}
                  className="w-full bg-transparent text-[13.5px] font-semibold outline-none"
                />
              </label>

              {/* Service specific description */}
              <p className="mt-4 text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">Describe the work ({w.service})</p>
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
                className="mt-2 w-full rounded-2xl bg-[#FAF9F6] p-3.5 text-[13.5px] font-semibold outline-none ring-1 ring-[#1B4332]/10 focus:ring-[#2D6A4F]"
              />

              {/* Photos */}
              <p className="mt-4 text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">Job photos (helps {w.name.split(" ")[0]} prepare tools)</p>
              <div className="mt-2 flex gap-2">
                {cfg.photos.slice(0, photos).map((url, i) => (
                  <div key={i} className="relative h-20 w-20 overflow-hidden rounded-2xl ring-1 ring-[#1B4332]/15">
                    <img src={url} alt={`${w.service} work preview`} className="h-full w-full object-cover" />
                    <button onClick={() => setPhotos(Math.max(0, photos - 1))} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-[10px] text-white">✕</button>
                  </div>
                ))}
                {photos < cfg.photos.length && (
                  <button onClick={() => setPhotos(cfg.photos.length)} className="grid h-20 w-20 place-items-center rounded-2xl border-2 border-dashed border-[#1B4332]/25 bg-[#FAF9F6] text-[#1B4332] transition hover:border-[#2D6A4F]">
                    <span className="text-center"><ImagePlus className="mx-auto h-5 w-5" /><span className="text-[10px] font-extrabold">Add</span></span>
                  </button>
                )}
              </div>

              <button onClick={() => setStep(2)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1B4332] py-4 text-[15px] font-extrabold text-white transition hover:bg-[#2D6A4F] active:scale-[0.98]">
                Continue to FairFare <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-slide-up overflow-hidden rounded-[22px] bg-white ring-1 ring-[#1B4332]/10 card-shadow">
              <div className="bg-[#122b21] px-5 py-4 text-white">
                <p className="flex items-center gap-2 text-[13px] font-extrabold">
                  <Sparkles className="h-4 w-4 text-[#F4A261]" /> FAIRFARE™ NEGOTIATION FOR {w.service.toUpperCase()}
                  <span className="ml-auto flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10.5px]">
                    <Lock className="h-3 w-3" /> {locked ? "LOCKED" : "OPEN"}
                  </span>
                </p>
                <p className="mt-1 text-[12px] font-medium text-white/60">
                  Job: {cfg.title} • {schedule === "asap" ? `Immediate arrival (${w.eta})` : `Slot: ${date}`} • No hidden charges.
                </p>
              </div>
              <div className="max-h-[380px] space-y-3 overflow-y-auto bg-[#FAF9F6] p-4 sm:p-5">
                {offers.map((m) => (
                  <div key={m.id} className={`animate-chat-in flex ${m.from === "customer" ? "justify-end" : m.from === "system" ? "justify-center" : "justify-start"}`}>
                    {m.from === "system" ? (
                      <div className="max-w-[90%] rounded-2xl bg-[#1B4332]/8 px-4 py-2.5 text-center text-[12px] font-bold text-[#1B4332] ring-1 ring-[#1B4332]/15">
                        🔒 {m.text} {m.price && <span className="font-extrabold">₹{m.price}</span>}
                      </div>
                    ) : (
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 card-shadow ${m.from === "customer" ? "rounded-tr-md bg-[#1B4332] text-white" : "rounded-tl-md bg-white ring-1 ring-[#1B4332]/10"}`}>
                        {m.from === "worker" && <p className="mb-1 flex items-center gap-1 text-[10.5px] font-extrabold text-[#2D6A4F]"><BadgeCheck className="h-3 w-3" /> {w.name.split(" ")[0]} • verified</p>}
                        <p className={`text-[13.5px] font-semibold leading-relaxed ${m.from === "customer" ? "text-white" : "text-[#1A1A1A]"}`}>{m.text}</p>
                        {m.price && <p className={`mt-1.5 inline-block rounded-full px-3 py-1 text-[14px] font-extrabold ${m.from === "customer" ? "bg-white/15 text-white" : "bg-[#FEF6EC] text-[#E76F51] ring-1 ring-[#E76F51]/25"}`}>₹{m.price}</p>}
                        <p className={`mt-1 text-right text-[10px] font-bold ${m.from === "customer" ? "text-white/60" : "text-[#8a8a8a]"}`}>{m.time} ✓✓</p>
                      </div>
                    )}
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start"><div className="flex gap-1 rounded-2xl rounded-tl-md bg-white px-4 py-3 ring-1 ring-[#1B4332]/10">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-[#1B4332]/40" style={{ animationDelay: `${i * 200}ms` }} />)}</div></div>
                )}
                <div ref={bottomRef} />
              </div>
              {locked ? (
                <div className="animate-slide-up border-t-2 border-[#2D6A4F] bg-[#EFFAF1] p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-[#2D6A4F] text-white"><Lock className="h-5 w-5" /></span>
                    <div className="flex-1">
                      <p className="text-[15px] font-extrabold text-[#1B4332]">Final Agreed Price: ₹{locked}</p>
                      <p className="text-[12px] font-bold text-[#4A4A4A]">{schedule === "asap" ? `ASAP • arrives ${w.eta}` : date} • No hidden platform fees</p>
                    </div>
                    <CheckCircle2 className="h-7 w-7 text-[#2D6A4F]" />
                  </div>
                  <button onClick={() => { onLocked(locked); setStep(3); }} className="mt-3 w-full rounded-2xl bg-[#1B4332] py-4 text-[15px] font-extrabold text-white transition hover:bg-[#2D6A4F]">
                    Review booking at ₹{locked} →
                  </button>
                </div>
              ) : (
                <div className="border-t border-[#1B4332]/10 bg-white p-3.5 sm:p-4">
                  <div className="mb-2.5 flex gap-2">
                    {quickOffers.map((p) => (
                      <button key={p} onClick={() => sendOffer(p)} className="flex-1 rounded-full bg-[#FAF9F6] py-2 text-[12.5px] font-extrabold text-[#1B4332] ring-1 ring-[#1B4332]/15 transition hover:bg-[#1B4332] hover:text-white">Offer ₹{p}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex flex-1 items-center gap-2 rounded-full bg-[#FAF9F6] px-4 ring-1 ring-[#1B4332]/15 focus-within:ring-[#2D6A4F]">
                      <span className="text-[14px] font-extrabold text-[#1B4332]">₹</span>
                      <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendOffer()} inputMode="numeric" placeholder={`Your offer for ${w.service.toLowerCase()}… e.g. ${w.price}`} className="h-12 w-full bg-transparent text-[14px] font-bold outline-none" />
                    </div>
                    <button onClick={() => sendOffer()} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#E76F51] text-white transition hover:bg-[#c65a3a] active:scale-90"><Send className="h-5 w-5" /></button>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <ConfirmBooking
              go={go}
              wId={w.id}
              price={locked ?? w.price}
              schedule={schedule}
              date={date}
              address={localAddress}
              lang={lang}
              serviceName={w.service}
              jobTitle={cfg.title}
              jobDesc={desc}
              serviceId={w.serviceId}
            />
          )}
        </div>

        {/* worker mini summary */}
        <aside className="rounded-[22px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            <img src={w.photo} alt={w.name} className="h-16 w-16 rounded-2xl object-cover" />
            <div className="flex-1">
              <p className="flex items-center gap-1 text-[15px] font-extrabold">{w.name} <BadgeCheck className="h-4 w-4 fill-[#52B788] text-white" /></p>
              <p className="text-[12px] font-semibold text-[#4A4A4A]">{w.service} • {w.distance} • {w.eta}</p>
            </div>
            <TrustRing score={w.trustDNA} size={56} stroke={6} />
          </div>
          <div className="mt-4 space-y-2 rounded-2xl bg-[#FAF9F6] p-4 text-[12.5px] font-semibold text-[#4A4A4A] ring-1 ring-[#1B4332]/8">
            <p className="flex justify-between">Selected service <span className="font-extrabold text-[#1A1A1A]">{w.service}</span></p>
            <p className="flex justify-between">Starting quote <span className="font-extrabold text-[#1A1A1A]">₹{w.price + 150}</span></p>
            <p className="flex justify-between">FairFare target <span className="font-extrabold text-[#2D6A4F]">₹{w.price} – ₹{w.price + 150}</span></p>
            <p className="flex justify-between">Platform fee <span className="font-extrabold text-[#2D6A4F]">FREE (₹0)</span></p>
          </div>
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-[#EFFAF1] p-3.5 text-[12px] font-semibold text-[#1B4332] ring-1 ring-[#2D6A4F]/20">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Pay only after work is done & you confirm. Tips go 100% to the worker.
          </div>
        </aside>
      </div>
      <CustomerBottomNav page="booking" go={go} onBook={() => {}} />
    </div>
  );
}

function ConfirmBooking({
  go, wId, price, schedule, date, address, lang, serviceName, jobTitle, jobDesc, serviceId,
}: {
  go: (p: Page, widOrOpts?: any) => void; wId: string; price: number; schedule: string; date: string; address: string; lang: string;
  serviceName: string; jobTitle: string; jobDesc: string; serviceId?: string;
}) {
  const { user, profile, isAuthenticated } = useAuth();
  const w = workers.find((x) => x.id === wId) || {
    id: wId,
    name: "Verified Worker",
    eta: "~15 min",
    service: serviceName,
  };
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const platformFee = 0;
  const total = price + platformFee;

  const handleConfirm = async () => {
    if (submitting) return;

    if (!isAuthenticated || !user) {
      setErrorMsg(lang === "hi" ? "बुकिंग की पुष्टि करने के लिए कृपया पहले लॉगिन करें।" : "Please sign in to your Saharaa account to confirm and persist this booking.");
      return;
    }

    if (profile?.role === "worker") {
      setErrorMsg(lang === "hi" ? "कारीगर खाता बुकिंग नहीं कर सकता। कृपया ग्राहक खाते से लॉगिन करें।" : "Workers cannot book services. Please sign in with a customer account.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const res = await createBooking({
      workerId: wId,
      serviceId: serviceId || "plumbing",
      jobTitle: jobTitle || `${serviceName} Service`,
      jobDescription: jobDesc,
      serviceAddress: address,
      serviceLocation: "Laxmi Nagar, Delhi",
      bookingType: schedule === "asap" ? "asap" : "schedule",
      scheduledAt: schedule === "asap" ? null : date,
      initialPrice: price,
      customerNote: `Customer initial FairFare offer for ${serviceName}`
    });

    setSubmitting(false);

    if (res.error || !res.data) {
      setErrorMsg(res.error || "Failed to confirm booking in Supabase. Please retry.");
    } else {
      go("tracking", {
        bookingId: res.data.id,
        workerId: wId,
        price: res.data.locked_price,
        schedule,
        date,
        address,
      });
    }
  };

  return (
    <div className="animate-slide-up rounded-[22px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow sm:p-6">
      <p className="flex items-center gap-2 text-[18px] font-extrabold"><CheckCircle2 className="h-6 w-6 text-[#2D6A4F]" /> Review & confirm booking</p>
      
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#EFFAF1] p-4 ring-1 ring-[#2D6A4F]/25">
        <Lock className="h-6 w-6 text-[#2D6A4F]" />
        <div>
          <p className="text-[13px] font-bold text-[#1B4332]">FAIRFARE PROPOSED PRICE</p>
          <p className="text-[22px] font-extrabold text-[#1B4332]">₹{price} <span className="text-[12px] font-bold text-[#4A4A4A]">initial offer • saved to database</span></p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5 text-[13.5px] font-semibold">
        <div className="flex gap-2.5 rounded-xl bg-[#FAF9F6] p-3 text-xs">
          <span className="font-extrabold text-[#1B4332]">{serviceName}</span>
          <span className="text-[#4A4A4A]">({jobTitle}) — {jobDesc}</span>
        </div>
        <div className="flex gap-2.5"><MapPin className="h-5 w-5 shrink-0 text-[#E76F51]" /><span>{address}</span></div>
        <div className="flex gap-2.5"><Clock className="h-5 w-5 shrink-0 text-[#1B4332]" /><span>{schedule === "asap" ? `ASAP — arrives ${w.eta}` : `Scheduled: ${date}`}</span></div>
        <div className="flex gap-2.5"><Wallet className="h-5 w-5 shrink-0 text-[#1B4332]" /><span>Pay after work • UPI / Cash / Card</span></div>
      </div>

      <div className="mt-4 rounded-2xl bg-[#FAF9F6] p-4 text-[13px] font-semibold ring-1 ring-[#1B4332]/8">
        <p className="flex justify-between py-0.5">Proposed service price <span className="font-extrabold text-[#1A1A1A]">₹{price}</span></p>
        <p className="flex justify-between py-0.5">Platform booking fee <span className="font-extrabold text-[#2D6A4F]">FREE (₹0)</span></p>
        <p className="flex justify-between border-t border-dashed border-[#1B4332]/15 pt-2 text-[15px] font-extrabold">You'll pay <span className="text-[#1B4332]">₹{total}</span></p>
      </div>

      {errorMsg && (
        <div className="animate-fade-in mt-3 flex items-start gap-2.5 rounded-2xl bg-[#FFEBEE] p-3.5 text-[12.5px] font-bold text-[#C62828] ring-1 ring-[#EF5350]/30">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex-1">
            <span>{errorMsg}</span>
            {!isAuthenticated && (
              <button
                onClick={() => go("auth")}
                className="mt-2 block rounded-full bg-[#1B4332] px-3.5 py-1.5 text-xs text-white"
              >
                Sign In / Sign Up →
              </button>
            )}
          </div>
        </div>
      )}

      <button
        onClick={handleConfirm}
        disabled={submitting}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1B4332] py-4 text-[15px] font-extrabold text-white transition hover:bg-[#2D6A4F] active:scale-[0.98] ${submitting ? "opacity-75 cursor-not-allowed" : ""}`}
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Persisting booking to database…</span>
          </>
        ) : (
          lang === "hi" ? "बुकिंग पक्की करें ✓" : "Confirm booking ✓"
        )}
      </button>
      <p className="mt-2.5 text-center text-[11.5px] font-bold text-[#8a8a8a]">Free cancellation • SOS & support always on • Database protected</p>
    </div>
  );
}

/* ================= TRACKING (DATABASE-BACKED) ================= */
const stages = ["Requested", "Accepted", "On the Way", "In Progress", "Completed"];

export function Tracking({
  go, lang, workerId, price = 450, schedule = "asap", date = "Tomorrow, 10:00 AM", address = "B-42, Laxmi Nagar, Delhi 110092",
  bookingId, partsApproved = false, setPartsApproved,
}: {
  go: (p: Page, widOrOpts?: any) => void; lang: "en" | "hi"; workerId: string; price: number;
  schedule?: "asap" | "later"; date?: string; address?: string;
  bookingId?: string; partsApproved?: boolean; setPartsApproved?: (b: boolean) => void;
}) {
  const { user } = useAuth();
  const staticWorker = workers.find((x) => x.id === workerId) ?? workers[0];
  const cfg = serviceJobConfigs[staticWorker.serviceId] || serviceJobConfigs["plumbing"];

  const [dbBooking, setDbBooking] = useState<DbBooking | null>(null);
  const [dbOffers, setDbOffers] = useState<DbNegotiationOffer[]>([]);
  const [dbEvents, setDbEvents] = useState<DbBookingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(bookingId || null);

  const [counterInput, setCounterInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Change of plans");

  const [proof, setProof] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [toast, setToast] = useState("");

  // Load real booking from Supabase
  const loadBookingData = useCallback(async () => {
    let targetId = activeBookingId;
    if (!targetId) {
      const custRes = await fetchCustomerBookings();
      if (custRes.data && custRes.data.length > 0) {
        targetId = custRes.data[0].id;
        setActiveBookingId(targetId);
      }
    }

    if (!targetId) return;

    setLoading(true);
    const [bRes, oRes, eRes] = await Promise.all([
      fetchBookingById(targetId),
      fetchBookingOffers(targetId),
      fetchBookingEvents(targetId),
    ]);
    setLoading(false);

    if (bRes.data) setDbBooking(bRes.data);
    if (oRes.data) setDbOffers(oRes.data);
    if (eRes.data) setDbEvents(eRes.data);
  }, [activeBookingId]);

  useEffect(() => {
    loadBookingData();
  }, [loadBookingData]);

  // Derive stage from genuine database status
  const currentStatus = dbBooking?.booking_status || "pending";
  let stage = 0;
  if (currentStatus === "pending" || currentStatus === "negotiating") stage = 0;
  else if (currentStatus === "accepted") stage = 1;
  else if (currentStatus === "on_the_way") stage = 2;
  else if (currentStatus === "in_progress") stage = 3;
  else if (currentStatus === "completed") stage = 4;
  else if (currentStatus === "cancelled") stage = -1;

  const currentPrice = dbBooking ? Number(dbBooking.locked_price) : price;
  const partsPrice = partsApproved ? 120 : (dbBooking?.spare_parts_amount ? Number(dbBooking.spare_parts_amount) : 0);
  const currentTotal = currentPrice + partsPrice;
  const bookingNumber = dbBooking?.booking_number || "BK-DEMO-2481";

  const workerDisplayName = dbBooking?.worker?.full_name || staticWorker.name;
  const workerAvatar = dbBooking?.worker?.avatar_url || staticWorker.photo;

  // FairFare Actions
  const latestOffer = dbOffers[dbOffers.length - 1];
  const pendingWorkerOffer = dbOffers.find(
    (o) => o.offer_status === "pending" && o.proposer_role === "worker"
  );

  const handleAcceptOffer = async (offer: DbNegotiationOffer) => {
    if (!activeBookingId || actionLoading) return;
    setActionLoading(true);
    setStatusMessage(null);
    const res = await acceptOffer(activeBookingId, offer.id, offer.offered_price);
    setActionLoading(false);
    if (!res.success) {
      setStatusMessage(res.error || "Failed to accept offer");
    } else {
      setToast(`Offer accepted at ₹${offer.offered_price}! Booking confirmed 🎉`);
      setTimeout(() => setToast(""), 3000);
      loadBookingData();
    }
  };

  const handleSendCounter = async () => {
    if (!activeBookingId || actionLoading) return;
    const priceVal = parseInt(counterInput.replace(/[^0-9]/g, ""), 10);
    if (!priceVal || priceVal <= 0) {
      setStatusMessage("Please enter a valid counteroffer amount");
      return;
    }
    setActionLoading(true);
    setStatusMessage(null);
    const res = await submitCounterOffer(activeBookingId, priceVal, `Customer countered with ₹${priceVal}`);
    setActionLoading(false);
    setCounterInput("");
    if (!res.success) {
      setStatusMessage(res.error || "Failed to submit counteroffer");
    } else {
      setToast(`Counteroffer ₹${priceVal} submitted to worker!`);
      setTimeout(() => setToast(""), 3000);
      loadBookingData();
    }
  };

  const handleCancelBooking = async () => {
    if (!activeBookingId || actionLoading) return;
    setActionLoading(true);
    const res = await updateBookingStatus(activeBookingId, "cancelled", cancelReason);
    setActionLoading(false);
    setShowCancelModal(false);
    if (!res.success) {
      setStatusMessage(res.error || "Failed to cancel booking");
    } else {
      setToast("Booking has been cancelled");
      setTimeout(() => setToast(""), 3000);
      loadBookingData();
    }
  };

  const triggerSOS = () => {
    setSosActive(true);
    setToast("🚨 SOS Alert sent to Police (112) & Saharaa 24x7 Safety Response Team");
    setTimeout(() => setToast(""), 4000);
  };

  const handleReportSubmit = () => {
    setReportSubmitted(true);
    setToast(`Issue report filed for ${bookingNumber}. Our safety team is reviewing it.`);
    setTimeout(() => {
      setToast("");
      setShowReportModal(false);
      setReportSubmitted(false);
    }, 2500);
  };

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 pb-32 pt-5 sm:px-6 md:pb-16">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button onClick={() => go("customer-home")} className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-bold ring-1 ring-[#1B4332]/12">
          <ChevronLeft className="h-4 w-4" /> Home
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={loadBookingData}
            title="Refresh database state"
            className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#1B4332] ring-1 ring-[#1B4332]/15 hover:bg-[#FAF9F6]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Sync status
          </button>
          <span className="rounded-full bg-[#1B4332] px-3.5 py-1.5 text-[12px] font-extrabold text-white">
            {bookingNumber} • {dbBooking?.job_title || staticWorker.service} • ₹{currentTotal}
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="animate-fade-in mt-3 flex items-center gap-2 rounded-2xl bg-[#FFEBEE] px-4 py-2.5 text-[12.5px] font-bold text-[#C62828] ring-1 ring-[#EF5350]/30">
          <AlertCircle className="h-4 w-4 shrink-0 text-[#C62828]" />
          <span>{statusMessage}</span>
        </div>
      )}

      {currentStatus === "cancelled" && (
        <div className="animate-fade-in mt-3 rounded-2xl bg-[#FFEBEE] p-4 text-center text-[13.5px] font-extrabold text-[#C62828] ring-1 ring-[#EF5350]/30">
          ⚠️ This booking was cancelled. No charges applied.
        </div>
      )}

      <div className="mt-4 grid items-start gap-5 lg:grid-cols-[1fr_380px]">
        <div>
          {/* Status hero */}
          <div className="relative overflow-hidden rounded-[22px] bg-[#122b21] p-5 text-white card-shadow-lg sm:p-6">
            <div className="jaali-pattern absolute inset-0 opacity-40" />
            <div className="relative flex flex-wrap items-center gap-4">
              <div className="relative">
                <img src={workerAvatar} alt={workerDisplayName} className="h-20 w-20 rounded-2xl object-cover ring-2 ring-[#52B788]" />
                <span className="absolute -bottom-1.5 -right-1.5 grid h-7 w-7 place-items-center rounded-full bg-[#2D6A4F] ring-2 ring-[#122b21]"><CheckCircle2 className="h-4 w-4" /></span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[17px] font-extrabold">
                  {workerDisplayName} <BadgeCheck className="h-4.5 w-4.5 fill-[#52B788] text-white" />
                </p>
                <p className="text-[12.5px] font-semibold text-white/70">
                  {dbBooking?.job_title || staticWorker.service} • ◆ {staticWorker.trustDNA} TrustDNA • {staticWorker.rating} ★
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-[13px] font-extrabold text-[#F4A261]">
                  <Clock className="h-4 w-4" />
                  {currentStatus === "pending"
                    ? "Requested — Waiting for worker confirmation"
                    : currentStatus === "negotiating"
                    ? "FairFare Negotiation in progress"
                    : currentStatus === "accepted"
                    ? `Booking confirmed at ₹${currentPrice} — preparing arrival`
                    : currentStatus === "on_the_way"
                    ? `Worker on the way to ${dbBooking?.service_address || address}`
                    : currentStatus === "in_progress"
                    ? "Work currently in progress at your address"
                    : currentStatus === "completed"
                    ? "Service completed successfully ✓"
                    : "Booking cancelled"}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowCallModal(true)} aria-label="Call worker" className="grid h-12 w-12 place-items-center rounded-full bg-[#E76F51] transition hover:bg-[#c65a3a]">
                  <Phone className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Lifecycle Progress Bar */}
            {currentStatus !== "cancelled" && (
              <div className="relative mt-5">
                <div className="absolute left-0 right-0 top-[15px] h-1 rounded-full bg-white/15" />
                <div className="absolute left-0 top-[15px] h-1 rounded-full bg-[#52B788] transition-all duration-700" style={{ width: `${(Math.max(0, stage) / (stages.length - 1)) * 100}%` }} />
                <div className="relative flex justify-between">
                  {stages.map((s, i) => (
                    <div key={s} className="flex w-14 flex-col items-center gap-1.5 text-center">
                      <span className={`grid h-8 w-8 place-items-center rounded-full text-[12px] font-extrabold ring-2 transition ${i < stage ? "bg-[#52B788] text-white ring-[#52B788]" : i === stage ? "bg-white text-[#1B4332] ring-white animate-pulse-ring" : "bg-white/10 text-white/50 ring-white/20"}`}>
                        {i < stage ? "✓" : i + 1}
                      </span>
                      <span className={`text-[9.5px] font-extrabold leading-tight sm:text-[10.5px] ${i <= stage ? "text-white" : "text-white/40"}`}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* FAIRFARE NEGOTIATION PANEL (Database-backed) */}
          {(currentStatus === "pending" || currentStatus === "negotiating" || dbOffers.length > 0) && (
            <div className="mt-4 overflow-hidden rounded-[22px] bg-white ring-1 ring-[#1B4332]/10 card-shadow">
              <div className="flex items-center justify-between bg-[#FAF9F6] px-5 py-3.5 border-b border-[#1B4332]/8">
                <p className="flex items-center gap-2 text-[14px] font-extrabold text-[#1B4332]">
                  <Sparkles className="h-4 w-4 text-[#E76F51]" /> FairFare™ Negotiation History
                </p>
                <span className="rounded-full bg-[#1B4332]/10 px-3 py-1 text-xs font-extrabold text-[#1B4332]">
                  {currentStatus === "accepted" ? "Locked at ₹" + currentPrice : "Negotiation Active"}
                </span>
              </div>
              <div className="p-4 sm:p-5 space-y-3">
                {dbOffers.length === 0 ? (
                  <p className="text-xs text-[#4A4A4A] font-semibold">Initial booking offer: ₹{currentPrice} submitted.</p>
                ) : (
                  dbOffers.map((o) => (
                    <div
                      key={o.id}
                      className={`flex ${o.proposer_role === "customer" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[85%] rounded-2xl p-3.5 card-shadow ${o.proposer_role === "customer" ? "bg-[#1B4332] text-white rounded-tr-sm" : "bg-[#FAF9F6] ring-1 ring-[#1B4332]/12 rounded-tl-sm text-[#1A1A1A]"}`}>
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <span className={`text-[10px] font-extrabold uppercase ${o.proposer_role === "customer" ? "text-white/70" : "text-[#2D6A4F]"}`}>
                            {o.proposer_role === "customer" ? "You" : workerDisplayName} • Round {o.round_number}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${o.offer_status === "accepted" ? "bg-[#2D6A4F] text-white" : o.offer_status === "pending" ? "bg-[#E76F51] text-white" : "bg-black/10 text-gray-700"}`}>
                            {o.offer_status}
                          </span>
                        </div>
                        <p className="text-[13px] font-semibold">{o.message || `Offered ₹${o.offered_price}`}</p>
                        <p className={`mt-1 text-[16px] font-black ${o.proposer_role === "customer" ? "text-[#52B788]" : "text-[#E76F51]"}`}>
                          ₹{o.offered_price}
                        </p>
                        <p className={`mt-0.5 text-right text-[10px] font-semibold ${o.proposer_role === "customer" ? "text-white/60" : "text-[#8a8a8a]"}`}>
                          {new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                {/* Counter / Accept actions if worker counteroffered */}
                {pendingWorkerOffer && currentStatus !== "accepted" && currentStatus !== "completed" && (
                  <div className="animate-slide-up rounded-2xl bg-[#EFFAF1] p-4 ring-1 ring-[#2D6A4F]/25 mt-3">
                    <p className="text-xs font-bold text-[#1B4332]">
                      {workerDisplayName} countered at <span className="font-extrabold text-[15px] text-[#2D6A4F]">₹{pendingWorkerOffer.offered_price}</span>. Accept this price or submit a new counteroffer below:
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleAcceptOffer(pendingWorkerOffer)}
                        disabled={actionLoading}
                        className="rounded-full bg-[#1B4332] px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#2D6A4F]"
                      >
                        Accept ₹{pendingWorkerOffer.offered_price} ✓
                      </button>
                    </div>
                  </div>
                )}

                {/* Customer counteroffer input */}
                {(currentStatus === "pending" || currentStatus === "negotiating") && (
                  <div className="pt-2 border-t border-[#1B4332]/10 mt-3 flex gap-2">
                    <div className="flex flex-1 items-center gap-2 rounded-full bg-[#FAF9F6] px-4 ring-1 ring-[#1B4332]/15 focus-within:ring-[#2D6A4F]">
                      <span className="text-[14px] font-extrabold text-[#1B4332]">₹</span>
                      <input
                        value={counterInput}
                        onChange={(e) => setCounterInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendCounter()}
                        inputMode="numeric"
                        placeholder="Offer a new price…"
                        className="h-11 w-full bg-transparent text-[14px] font-bold outline-none"
                      />
                    </div>
                    <button
                      onClick={handleSendCounter}
                      disabled={actionLoading}
                      className="rounded-full bg-[#E76F51] px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#c65a3a]"
                    >
                      Counter →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VERIFIED BOOKING MILESTONES & AUDIT TIMELINE (Replaces simulated fake GPS) */}
          <div className="mt-4 rounded-[22px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow sm:p-6">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-[15px] font-extrabold text-[#1A1A1A]">
                <ShieldCheck className="h-5 w-5 text-[#2D6A4F]" /> Verified Booking Milestones & Audit
              </p>
              <span className="rounded-full bg-[#EFFAF1] px-2.5 py-1 text-[11px] font-extrabold text-[#1B4332]">
                Database Logged
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-[#4A4A4A]">
              Real-time audit trail stored in Supabase with timestamps and actor verification.
            </p>

            <div className="mt-4 space-y-3">
              {dbEvents.length === 0 ? (
                <div className="rounded-xl bg-[#FAF9F6] p-3 text-xs font-medium text-[#4A4A4A]">
                  Initial booking request submitted to {workerDisplayName}. Awaiting worker response.
                </div>
              ) : (
                dbEvents.map((e, idx) => (
                  <div key={e.id || idx} className="flex items-start gap-3 text-xs">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#EFFAF1] text-[#2D6A4F] ring-1 ring-[#2D6A4F]/20">
                      <CheckCheck className="h-3.5 w-3.5" />
                    </span>
                    <div className="flex-1">
                      <p className="font-extrabold text-[#1A1A1A]">{e.notes || e.event_type}</p>
                      <p className="text-[11px] font-semibold text-[#8a8a8a]">
                        {new Date(e.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cancel booking option */}
            {["pending", "negotiating", "accepted", "on_the_way"].includes(currentStatus) && (
              <div className="mt-5 border-t border-[#1B4332]/10 pt-3 flex justify-end">
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="text-xs font-bold text-[#C62828] hover:underline"
                >
                  Cancel this booking
                </button>
              </div>
            )}
          </div>

          {/* Proof of Work & Payment confirmation */}
          <div className="mt-4 rounded-[22px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow sm:p-6">
            <p className="flex items-center gap-2 text-[15px] font-extrabold">
              <Camera className="h-5 w-5 text-[#E76F51]" /> Proof of Work ({dbBooking?.job_title || staticWorker.service})
            </p>
            {stage >= 3 || currentStatus === "completed" ? (
              <div className="animate-fade-in mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <figure className="overflow-hidden rounded-2xl ring-1 ring-[#1B4332]/12">
                    <img src={cfg.photos[0]} alt="Before work" className="h-36 w-full object-cover" />
                    <figcaption className="bg-[#FAF9F6] py-1.5 text-center text-[11px] font-extrabold text-[#8a8a8a]">BEFORE</figcaption>
                  </figure>
                  <figure className="overflow-hidden rounded-2xl ring-2 ring-[#2D6A4F]">
                    <img src={cfg.photos[1]} alt="After work" className="h-36 w-full object-cover" />
                    <figcaption className="bg-[#EFFAF1] py-1.5 text-center text-[11px] font-extrabold text-[#1B4332]">AFTER ✓ COMPLETED</figcaption>
                  </figure>
                </div>
                <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-2xl bg-[#FAF9F6] p-3.5 ring-1 ring-[#1B4332]/10">
                  <input type="checkbox" checked={proof} onChange={() => setProof(!proof)} className="mt-0.5 h-5 w-5 accent-[#1B4332]" />
                  <span className="text-[13px] font-bold">I confirm the work is completed to satisfaction and matches photos. <span className="text-[#8a8a8a]">(Required before releasing payment)</span></span>
                </label>
                <button
                  disabled={!proof}
                  onClick={() => go("payment", { workerId: staticWorker.id, price: currentPrice, partsApproved, schedule, date, address })}
                  className={`mt-3 w-full rounded-2xl py-4 text-[15px] font-extrabold text-white transition ${proof ? "bg-[#1B4332] hover:bg-[#2D6A4F]" : "cursor-not-allowed bg-[#d8cfbe]"}`}
                >
                  Confirm & Pay ₹{currentTotal} →
                </button>
              </div>
            ) : (
              <p className="mt-2 text-[13px] font-semibold text-[#4A4A4A]">
                {workerDisplayName} will upload verified before/after photos once work commences at your home.
              </p>
            )}
          </div>
        </div>

        {/* side: invoice + safety */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-[22px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow">
            <p className="flex items-center gap-2 text-[14px] font-extrabold"><FileText className="h-4 w-4" /> Live invoice breakdown</p>
            <div className="mt-3 space-y-2 text-[13px] font-semibold text-[#4A4A4A]">
              <p className="flex justify-between">
                FairFare agreed service price <span className="font-extrabold text-[#1A1A1A]">₹{currentPrice}</span>
              </p>
              
              <label className="flex items-center justify-between rounded-xl bg-[#FAF9F6] p-2 text-xs font-bold ring-1 ring-[#1B4332]/8 cursor-pointer">
                <span className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={partsApproved}
                    onChange={(e) => setPartsApproved && setPartsApproved(e.target.checked)}
                    className="accent-[#1B4332]"
                  />
                  Extra parts/supplies (receipt verified)
                </span>
                <span className="font-extrabold text-[#1A1A1A]">₹{partsPrice}</span>
              </label>

              <p className="flex justify-between">
                Platform fee <span className="font-extrabold text-[#2D6A4F]">FREE (₹0)</span>
              </p>
              
              <p className="flex justify-between border-t border-dashed border-[#1B4332]/15 pt-2 text-[15px] font-extrabold text-[#1A1A1A]">
                Total line items <span className="text-[#1B4332]">₹{currentTotal}</span>
              </p>
            </div>
          </div>

          <div className="rounded-[22px] bg-[#FFF1E8] p-5 ring-1 ring-[#E76F51]/25">
            <p className="flex items-center gap-2 text-[14px] font-extrabold text-[#9c3d1e]"><AlertTriangle className="h-4 w-4" /> Safety centre</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => setShowSOSModal(true)} className="rounded-2xl bg-[#E76F51] py-3 text-[13px] font-extrabold text-white hover:bg-[#c65a3a]">
                SOS Alert
              </button>
              <button onClick={() => setShowReportModal(true)} className="rounded-2xl bg-white py-3 text-[13px] font-extrabold text-[#9c3d1e] ring-1 ring-[#E76F51]/30 hover:bg-[#FAF9F6]">
                Report issue
              </button>
            </div>
            <p className="mt-2.5 text-[11.5px] font-semibold text-[#9c3d1e]/80">Booking record & worker identity logged with emergency safety desk.</p>
          </div>
        </aside>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl ring-1 ring-[#1B4332]/10 animate-slide-up">
            <h3 className="text-[17px] font-extrabold text-[#1A1A1A]">Cancel booking?</h3>
            <p className="mt-1 text-xs font-semibold text-[#4A4A4A]">Free cancellation. The worker will be notified immediately.</p>
            <div className="mt-3 space-y-2 text-xs font-bold">
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-xl bg-[#FAF9F6] p-2.5 ring-1 ring-[#1B4332]/12 outline-none"
              >
                <option>Change of plans / rescheduled</option>
                <option>Price negotiation not agreeable</option>
                <option>Booked another worker</option>
                <option>Booked by mistake</option>
              </select>
              <button
                disabled={actionLoading}
                onClick={handleCancelBooking}
                className="w-full rounded-2xl bg-[#C62828] py-3 text-xs font-extrabold text-white transition hover:bg-[#b71c1c]"
              >
                {actionLoading ? "Cancelling…" : "Yes, cancel booking"}
              </button>
              <button onClick={() => setShowCancelModal(false)} className="w-full py-1 text-center text-xs font-bold text-[#8a8a8a]">Keep booking</button>
            </div>
          </div>
        </div>
      )}

      {/* SOS Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl ring-1 ring-[#E76F51]/30 text-center animate-slide-up">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#FFF1E8] text-[#E76F51]">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="mt-3 text-[19px] font-extrabold text-[#9c3d1e]">Saharaa 24x7 Safety Centre</h3>
            <p className="mt-1 text-xs font-semibold text-[#4A4A4A]">If you feel unsafe, assistance is immediate and verified.</p>
            <div className="mt-4 space-y-2 text-left text-xs font-bold">
              <a href="tel:112" className="flex items-center justify-between rounded-2xl bg-[#E76F51] p-3 text-white">
                <span>🚨 Police Emergency (112)</span>
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px]">Dial</span>
              </a>
              <a href="tel:18007242722" className="flex items-center justify-between rounded-2xl bg-[#1B4332] p-3 text-white">
                <span>🛡️ Saharaa Safety Hotline</span>
                <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px]">Call</span>
              </a>
              <button onClick={triggerSOS} className="w-full rounded-2xl bg-[#FFF1E8] p-3 text-center text-[#9c3d1e] ring-1 ring-[#E76F51]/30">
                {sosActive ? "✓ SOS Broadcast Active" : "Trigger Emergency Silent Alert"}
              </button>
            </div>
            <button onClick={() => setShowSOSModal(false)} className="mt-4 text-xs font-bold text-[#8a8a8a]">Close</button>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl ring-1 ring-[#1B4332]/10 animate-slide-up">
            <h3 className="text-[17px] font-extrabold text-[#1A1A1A]">Report an issue</h3>
            <p className="mt-1 text-xs font-semibold text-[#4A4A4A]">Booking {bookingNumber} with {workerDisplayName}</p>
            <div className="mt-3 space-y-2 text-xs font-bold">
              <select className="w-full rounded-xl bg-[#FAF9F6] p-2.5 ring-1 ring-[#1B4332]/12 outline-none">
                <option>Price dispute / asking cash beyond locked price</option>
                <option>Worker arrived excessively late</option>
                <option>Poor workmanship / unfinished work</option>
                <option>Unprofessional behavior</option>
              </select>
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Describe what went wrong in detail…"
                rows={3}
                className="w-full rounded-xl bg-[#FAF9F6] p-2.5 ring-1 ring-[#1B4332]/12 outline-none"
              />
              <button
                disabled={reportSubmitted}
                onClick={handleReportSubmit}
                className="w-full rounded-2xl bg-[#E76F51] py-3 text-xs font-extrabold text-white"
              >
                {reportSubmitted ? "Submitting report…" : "Submit report for investigation"}
              </button>
              <button onClick={() => setShowReportModal(false)} className="w-full py-1 text-center text-xs font-bold text-[#8a8a8a]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Call Worker Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl ring-1 ring-[#1B4332]/10 text-center animate-slide-up">
            <img src={workerAvatar} alt={workerDisplayName} className="mx-auto h-20 w-20 rounded-full object-cover ring-4 ring-[#52B788]" />
            <h3 className="mt-3 text-[18px] font-extrabold">{workerDisplayName}</h3>
            <p className="text-xs font-semibold text-[#4A4A4A]">{dbBooking?.job_title || staticWorker.service}</p>
            <div className="mt-4 rounded-2xl bg-[#EFFAF1] p-3 text-left text-xs font-bold text-[#1B4332] ring-1 ring-[#2D6A4F]/20">
              <ShieldCheck className="inline h-4 w-4 text-[#2D6A4F] mr-1.5" />
              Connected via Saharaa Privacy Masking Line. Your real number stays private.
            </div>
            <p className="mt-3 text-xs font-bold text-[#4A4A4A]">Masked call number: <span className="font-extrabold text-[#1A1A1A]">+91 98118-XX482</span></p>
            <div className="mt-4 grid gap-2">
              <a href="tel:18007242722" className="block w-full rounded-2xl bg-[#1B4332] py-3.5 text-xs font-extrabold text-white">
                📞 Call {workerDisplayName.split(" ")[0]} Now
              </a>
              <button onClick={() => setShowCallModal(false)} className="text-xs font-bold text-[#8a8a8a]">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-2xl bg-[#122b21] px-5 py-3.5 text-center text-xs font-bold text-white shadow-2xl animate-slide-up">
          {toast}
        </div>
      )}

      <CustomerBottomNav page="tracking" go={go} onBook={() => go("booking", staticWorker.id)} />
    </div>
  );
}

/* ================= PAYMENT & REVIEW ================= */
export function PaymentReview({
  go, lang, workerId, price = 450, partsApproved = false, schedule = "asap", date = "Tomorrow, 10:00 AM", address = "B-42, Laxmi Nagar, Delhi 110092",
}: {
  go: (p: Page, widOrOpts?: any) => void; lang: "en" | "hi"; workerId: string; price: number;
  partsApproved?: boolean; schedule?: "asap" | "later"; date?: string; address?: string;
}) {
  const w = workers.find((x) => x.id === workerId) ?? workers[0];
  const cfg = serviceJobConfigs[w.serviceId] || serviceJobConfigs["plumbing"];

  const [stars, setStars] = useState(5);
  const [tip, setTip] = useState(50);
  const [review, setReview] = useState("");
  const [method, setMethod] = useState("UPI");
  const [paid, setPaid] = useState(false);

  const partsCost = partsApproved ? 120 : 0;
  const subtotal = price + partsCost;
  const total = subtotal + tip;

  if (paid) {
    return (
      <div className="page-enter mx-auto max-w-lg px-4 pb-28 pt-10 text-center sm:px-6">
        <div className="animate-slide-up rounded-[24px] bg-white p-8 ring-1 ring-[#1B4332]/10 card-shadow-lg">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#EFFAF1]">
            <CheckCircle2 className="h-10 w-10 text-[#2D6A4F]" />
          </div>
          <h1 className="font-display mt-4 text-[26px] font-black">Shukriya! 🙏</h1>
          <p className="mt-2 text-[14px] font-medium text-[#4A4A4A]">
            ₹{total} paid to {w.name} for {w.service.toLowerCase()} ({cfg.title}).{" "}
            {tip > 0 && <span className="font-bold text-[#2D6A4F]">₹{tip} tip reaches {w.name.split(" ")[0]} with zero platform deduction.</span>}
          </p>
          <div className="mt-5 rounded-2xl bg-[#EFFAF1] p-4 text-left ring-1 ring-[#2D6A4F]/20">
            <p className="text-[12px] font-extrabold uppercase tracking-wide text-[#1B4332]">Your livelihood impact</p>
            <p className="mt-1 text-[13.5px] font-bold">This was {w.name.split(" ")[0]}'s <span className="text-[#2D6A4F]">{w.jobs + 1}th job</span> on Saharaa. 68% of your payment stays in your neighbourhood.</p>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button onClick={() => go("booking", w.id)} className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#1B4332] py-3.5 text-[13.5px] font-extrabold text-white"><RotateCcw className="h-4 w-4" /> Rebook</button>
            <button onClick={() => go("customer-home")} className="rounded-2xl py-3.5 text-[13.5px] font-extrabold text-[#1B4332] ring-1 ring-[#1B4332]/25">Home</button>
          </div>
          <button onClick={() => go("impact")} className="mt-3 w-full rounded-2xl bg-[#FEF6EC] py-3 text-[13px] font-extrabold text-[#c65a3a] ring-1 ring-[#E76F51]/25">See community impact →</button>
        </div>
        <CustomerBottomNav page="payment" go={go} onBook={() => go("booking", w.id)} />
      </div>
    );
  }

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 pb-32 pt-5 sm:px-6 md:pb-16">
      <h1 className="font-display text-[24px] font-black tracking-tight sm:text-[30px]">Payment & review</h1>
      <div className="mt-4 grid items-start gap-5 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          {/* invoice */}
          <div className="rounded-[22px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow sm:p-6">
            <p className="flex items-center justify-between text-[15px] font-extrabold">Digital invoice <span className="rounded-full bg-[#EFFAF1] px-2.5 py-1 text-[11px] text-[#1B4332]">#SH-2481 • GST incl.</span></p>
            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#FAF9F6] p-3.5 ring-1 ring-[#1B4332]/8">
              <img src={w.photo} alt={w.name} className="h-12 w-12 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="flex items-center gap-1 text-[13.5px] font-extrabold">{w.name} <BadgeCheck className="h-3.5 w-3.5 fill-[#52B788] text-white" /></p>
                <p className="text-[11.5px] font-semibold text-[#4A4A4A]">{w.service} • {cfg.title} • Proof confirmed ✓</p>
              </div>
              <TrustRing score={w.trustDNA} size={48} stroke={5} />
            </div>
            <div className="mt-3 space-y-1.5 text-[13.5px] font-semibold text-[#4A4A4A]">
              <p className="flex justify-between">FairFare agreed price <span className="font-extrabold text-[#1A1A1A]">₹{price}</span></p>
              <p className="flex justify-between">Approved parts / supplies <span className="font-extrabold text-[#1A1A1A]">₹{partsCost}</span></p>
              <p className="flex justify-between">Platform fee <span className="font-extrabold text-[#2D6A4F]">FREE (₹0)</span></p>
              <p className="flex justify-between border-t border-dashed border-[#1B4332]/15 pt-2 text-[14px] font-extrabold text-[#1A1A1A]">Subtotal <span className="text-[#1A1A1A]">₹{subtotal}</span></p>
            </div>
            <p className="mt-4 text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">Add a tip? <span className="text-[#2D6A4F]">100% goes to {w.name.split(" ")[0]}</span></p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {[0, 30, 50, 100].map((t) => (
                <button key={t} onClick={() => setTip(t)} className={`rounded-2xl py-2.5 text-[13px] font-extrabold ring-1 transition ${tip === t ? "bg-[#1B4332] text-white ring-[#1B4332]" : "bg-[#FAF9F6] ring-[#1B4332]/12"}`}>{t === 0 ? "No tip" : `₹${t}`}</button>
              ))}
            </div>
            <p className="mt-4 text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">Pay via</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {["UPI", "Card", "Cash"].map((m) => (
                <button key={m} onClick={() => setMethod(m)} className={`rounded-2xl py-3 text-[13px] font-extrabold ring-1 transition ${method === m ? "bg-[#EFFAF1] text-[#1B4332] ring-[#2D6A4F]" : "bg-[#FAF9F6] ring-[#1B4332]/12"}`}>{m}</button>
              ))}
            </div>
          </div>

          {/* review */}
          <div className="rounded-[22px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow sm:p-6">
            <p className="text-[15px] font-extrabold">Rate {w.name.split(" ")[0]}'s work</p>
            <div className="mt-3 flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setStars(s)} aria-label={`${s} stars`} className="transition active:scale-90">
                  <Star className={`h-10 w-10 transition ${s <= stars ? "fill-[#F4A261] text-[#F4A261]" : "fill-[#EFE9DD] text-[#EFE9DD] hover:fill-[#F4A261]/50"}`} />
                </button>
              ))}
            </div>
            <p className="mt-1 text-[12.5px] font-bold text-[#4A4A4A]">{["", "Needs improvement", "Okay", "Good", "Great!", "Outstanding! 🌟"][stars]} — your review updates {w.name.split(" ")[0]}'s TrustDNA.</p>
            <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={3} placeholder={lang === "hi" ? "अपना अनुभव लिखें… (वैकल्पिक)" : "Write a few words… (optional, means a lot to workers)"} className="mt-3 w-full rounded-2xl bg-[#FAF9F6] p-3.5 text-[13.5px] font-semibold outline-none ring-1 ring-[#1B4332]/10 focus:ring-[#2D6A4F]" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["On time", "Clean work", "Fair price", "Polite", "Expert"].map((t) => (
                <button key={t} onClick={() => setReview((r) => r ? `${r} • ${t}` : t)} className="rounded-full bg-[#FAF9F6] px-3 py-1.5 text-[11.5px] font-bold ring-1 ring-[#1B4332]/12 hover:bg-[#EFFAF1]">+ {t}</button>
              ))}
            </div>
          </div>
        </div>

        <aside className="rounded-[22px] bg-[#122b21] p-5 text-white card-shadow-lg sm:p-6 lg:sticky lg:top-24">
          <Stars rating={stars} />
          <p className="mt-3 flex justify-between text-[13px] font-semibold text-white/70">Subtotal <span className="text-white font-extrabold">₹{subtotal}</span></p>
          <p className="mt-1 flex justify-between text-[13px] font-semibold text-white/70">Tip (100% to worker) <span className="text-[#F4A261] font-extrabold">₹{tip}</span></p>
          <p className="font-display mt-2 flex justify-between border-t border-white/10 pt-3 text-[24px] font-black">Total to pay <span>₹{total}</span></p>
          <button onClick={() => setPaid(true)} className="mt-4 w-full rounded-2xl bg-[#E76F51] py-4 text-[15px] font-extrabold text-white transition hover:bg-[#F4A261] hover:text-[#122b21] active:scale-[0.98]">
            Pay ₹{total} via {method} →
          </button>
          <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11px] font-bold text-white/50"><ShieldCheck className="h-3.5 w-3.5" /> Secure • Receipt on SMS + WhatsApp</p>
          <button onClick={() => go("booking", w.id)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-white/10 py-3 text-[13px] font-extrabold ring-1 ring-white/15"><RotateCcw className="h-4 w-4" /> Rebook this worker</button>
        </aside>
      </div>
      <CustomerBottomNav page="payment" go={go} onBook={() => go("booking", w.id)} />
    </div>
  );
}
