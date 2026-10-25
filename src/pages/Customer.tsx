import { useMemo, useState, useEffect, useCallback } from "react";
import {
  BadgeCheck, Camera, CheckCircle2, ChevronLeft, ChevronRight, Clock,
  List, Map as MapIcon, MapPin, MessageCircle, Navigation, Phone, Search,
  ShieldCheck, SlidersHorizontal, Star, X, Zap, Heart, RefreshCw, AlertCircle, Loader2
} from "lucide-react";
import { services, workers } from "../data";
import type { Worker } from "../data";
import { CustomerBottomNav, ServiceIcon, Stars, TrustRing, VoiceButton, EmptyState, SkeletonCard } from "../components/shared";
import type { Page } from "../components/shared";
import {
  fetchServices, fetchMarketplaceWorkers, fetchWorkerById, normalizeWorker,
  type MarketplaceService, type MarketplaceWorker
} from "../lib/marketplace";

/* ================= CUSTOMER HOME ================= */
export function CustomerHome({
  go, lang, location, selectedService, setSelectedService, selectedWorker, setSelectedWorker,
  searchQuery, setSearchQuery, scheduleMode, setScheduleMode, scheduleDate, setScheduleDate,
}: {
  go: (p: Page, opts?: any) => void; lang: "en" | "hi"; location: string;
  selectedService: string; setSelectedService: (s: string) => void;
  selectedWorker: string; setSelectedWorker: (s: string) => void;
  searchQuery?: string; setSearchQuery?: (q: string) => void;
  scheduleMode?: "asap" | "later"; setScheduleMode?: (m: "asap" | "later") => void;
  scheduleDate?: string; setScheduleDate?: (d: string) => void;
}) {
  const [q, setQ] = useState(searchQuery || "");
  const [listening, setListening] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const [filter, setFilter] = useState("All");
  const [liked, setLiked] = useState<string[]>([]);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  // 1. Live Services Catalog from Supabase
  const [catalog, setCatalog] = useState<MarketplaceService[]>([]);
  useEffect(() => {
    let active = true;
    fetchServices().then((res) => {
      if (!active) return;
      if (res.data && res.data.length > 0) {
        setCatalog(res.data);
      }
    });
    return () => { active = false; };
  }, []);

  const displayServices = catalog.length > 0
    ? catalog.map((s) => ({
        id: s.id,
        en: s.name_en,
        hi: s.name_hi,
        icon: s.icon,
        desc: s.description,
        basePrice: Number(s.base_price),
      }))
    : services;

  // 2. Live Workers from marketplace_workers security view
  const [workersList, setWorkersList] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [workersError, setWorkersError] = useState<string | null>(null);

  const loadWorkers = useCallback(async () => {
    setLoading(true);
    setWorkersError(null);

    const isAvailableOnly = filter === "ASAP" || filter === "Available now";
    const sortBy =
      filter === "Top rated"
        ? "Highest rated"
        : filter === "Budget"
        ? "Price: low to high"
        : filter === "Schedule"
        ? "TrustDNA"
        : "Recommended";

    const res = await fetchMarketplaceWorkers({
      serviceId: selectedService,
      searchQuery: q,
      location,
      onlyAvailableNow: isAvailableOnly,
      sortBy,
    });

    if (res.error) {
      setWorkersError(res.error);
      setWorkersList([]);
    } else {
      const normalized = res.data.map((w) => normalizeWorker(w, catalog));
      setWorkersList(normalized);
    }
    setLoading(false);
  }, [selectedService, q, location, filter, catalog]);

  useEffect(() => {
    loadWorkers();
  }, [loadWorkers]);

  const nearby = workersList;


  const handleFilterClick = (fEn: string) => {
    if (fEn === "Schedule") {
      setShowSchedulePicker(true);
      setFilter("Schedule");
      if (setScheduleMode) setScheduleMode("later");
    } else if (fEn === "ASAP") {
      setShowSchedulePicker(false);
      setFilter(filter === "ASAP" ? "All" : "ASAP");
      if (setScheduleMode) setScheduleMode("asap");
    } else {
      setShowSchedulePicker(false);
      setFilter(filter === fEn ? "All" : fEn);
    }
  };

  const startVoice = () => {
    setListening(true); setVoiceText("");
    const spoken = lang === "hi" ? "“मुझे नल ठीक करने वाला चाहिए…”" : "“I need someone to fix a leaking tap…”";
    setTimeout(() => setVoiceText(spoken), 700);
    setTimeout(() => {
      setListening(false);
      setQ("plumbing");
      if (setSearchQuery) setSearchQuery("plumbing");
      setSelectedService("plumbing");
    }, 2200);
  };

  const handleSearchSubmit = () => {
    if (setSearchQuery) setSearchQuery(q);
    const lower = q.toLowerCase().trim();
    const matched = services.find((s) =>
      lower.includes(s.id) ||
      lower.includes(s.en.toLowerCase()) ||
      lower.includes(s.hi) ||
      (s.id === "plumbing" && (lower.includes("tap") || lower.includes("leak") || lower.includes("pipe") || lower.includes("नल"))) ||
      (s.id === "electrical" && (lower.includes("fan") || lower.includes("switch") || lower.includes("wire") || lower.includes("बिजली"))) ||
      (s.id === "cleaning" && (lower.includes("clean") || lower.includes("safai") || lower.includes("सफाई"))) ||
      (s.id === "cooking" && (lower.includes("cook") || lower.includes("food") || lower.includes("खाना"))) ||
      (s.id === "painting" && (lower.includes("paint") || lower.includes("wall") || lower.includes("रंग"))) ||
      (s.id === "appliance" && (lower.includes("ac") || lower.includes("fridge") || lower.includes("washer"))) ||
      (s.id === "carpentry" && (lower.includes("wood") || lower.includes("door") || lower.includes("lock") || lower.includes("बढ़ई"))) ||
      (s.id === "gardening" && (lower.includes("garden") || lower.includes("plant") || lower.includes("पौधे")))
    );
    if (matched) {
      setSelectedService(matched.id);
    }
  };

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 md:pb-16">
      {/* greeting + search */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#4A4A4A]"><MapPin className="h-3.5 w-3.5 text-[#E76F51]" /> {location}</p>
          <h1 className="font-display mt-1 text-[24px] font-black tracking-tight sm:text-[30px]">
            {lang === "hi" ? "नमस्ते, प्रिया 🙏" : "Namaste, Priya 🙏"}
          </h1>
        </div>
        <button onClick={() => go("tracking")} className="relative grid h-11 w-11 place-items-center rounded-full bg-white ring-1 ring-[#1B4332]/10" aria-label="Tracking">
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#E76F51]" />
          <Clock className="h-5 w-5 text-[#1B4332]" />
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <label className="flex flex-1 items-center gap-2.5 rounded-[18px] bg-white px-4 py-1 ring-1 ring-[#1B4332]/12 card-shadow focus-within:ring-[#2D6A4F]">
          <Search className="h-5 w-5 shrink-0 text-[#1B4332]" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              if (setSearchQuery) setSearchQuery(e.target.value);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            placeholder={lang === "hi" ? "खोजें: प्लंबर, सफ़ाई, कुक…" : "Search: plumber, cleaning, cook…"}
            className="h-12 w-full bg-transparent text-[14.5px] font-semibold outline-none placeholder:text-[#8a8a8a]"
          />
          {q && (
            <button
              onClick={() => {
                setQ("");
                if (setSearchQuery) setSearchQuery("");
              }}
              aria-label="Clear"
            >
              <X className="h-4 w-4 text-[#8a8a8a]" />
            </button>
          )}
        </label>
        <VoiceButton onClick={startVoice} listening={listening} />
      </div>
      {(listening || voiceText) && (
        <div className="animate-fade-in mt-2.5 rounded-[16px] bg-[#122b21] px-4 py-3 text-[13px] font-bold text-white">
          {listening ? <span className="flex items-center gap-2"><span className="flex gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className="h-4 w-1 animate-pulse rounded-full bg-[#52B788]" style={{ animationDelay: `${i * 150}ms` }} />)}</span> {voiceText || (lang === "hi" ? "सुन रहे हैं… बोलिए" : "Listening… speak now")}</span>
            : <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#52B788]" /> {lang === "hi" ? "समझ गए! प्लंबिंग कारीगर दिखा रहे हैं ✓" : "Got it! Showing plumbing workers ✓"}</span>}
        </div>
      )}

      {/* quick filters */}
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {[
          { en: "ASAP", hi: "तुरंत (ASAP)", icon: Zap },
          { en: "Schedule", hi: "शेड्यूल", icon: Clock },
          { en: "Available now", hi: "अभी उपलब्ध", icon: null },
          { en: "Top rated", hi: "टॉप रेटेड", icon: null },
          { en: "Nearest", hi: "नज़दीकी", icon: null },
          { en: "Budget", hi: "बजट (< ₹350)", icon: null },
        ].map((f) => (
          <button key={f.en} onClick={() => handleFilterClick(f.en)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[12.5px] font-extrabold ring-1 transition active:scale-95 ${filter === f.en ? "bg-[#1B4332] text-white ring-[#1B4332]" : "bg-white text-[#1A1A1A] ring-[#1B4332]/12"}`}>
            {f.icon && <f.icon className="h-3.5 w-3.5" />}{lang === "hi" ? f.hi : f.en}
          </button>
        ))}
      </div>

      {/* ASAP alert strip when active */}
      {filter === "ASAP" && (
        <div className="animate-fade-in mt-3 flex items-center justify-between rounded-2xl bg-[#EFFAF1] px-4 py-3 text-[12.5px] font-bold text-[#1B4332] ring-1 ring-[#2D6A4F]/20">
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#E76F51]" />
            Showing {nearby.length} workers available for immediate dispatch (ETA under 25 mins)
          </span>
          <button onClick={() => setFilter("All")} className="text-xs underline font-semibold">Show all</button>
        </div>
      )}

      {/* Schedule selector drawer when active */}
      {showSchedulePicker && (
        <div className="animate-slide-up mt-3 rounded-[20px] bg-white p-4 ring-1 ring-[#1B4332]/15 card-shadow">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-[13.5px] font-extrabold text-[#1B4332]">
              <Clock className="h-4 w-4 text-[#E76F51]" /> Pick your preferred appointment slot
            </p>
            <button onClick={() => setShowSchedulePicker(false)} className="text-xs font-bold text-[#8a8a8a] hover:text-[#1A1A1A]">✕ Close</button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Today, 4:00 PM", "Tomorrow, 10:00 AM", "Tomorrow, 2:00 PM", "Tomorrow, 6:00 PM", "Day after tomorrow, 11:00 AM"].map((slot) => (
              <button
                key={slot}
                onClick={() => {
                  if (setScheduleDate) setScheduleDate(slot);
                  if (setScheduleMode) setScheduleMode("later");
                }}
                className={`rounded-xl px-3.5 py-2 text-[12px] font-extrabold ring-1 transition ${(scheduleDate || "Tomorrow, 10:00 AM") === slot ? "bg-[#1B4332] text-white ring-[#1B4332]" : "bg-[#FAF9F6] text-[#4A4A4A] ring-[#1B4332]/10 hover:ring-[#1B4332]/30"}`}
              >
                {slot}
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[11.5px] font-semibold text-[#4A4A4A]">
            Selected: <span className="font-extrabold text-[#1B4332]">{scheduleDate || "Tomorrow, 10:00 AM"}</span> • This appointment time is locked and honored by your chosen worker.
          </p>
        </div>
      )}

      {/* categories */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-[16px] font-extrabold">{lang === "hi" ? "सेवा चुनें" : "Choose a service"}</h2>
        <button
          onClick={() => {
            setSelectedService("All");
            go("workers", { service: "All", location, searchQuery: q });
          }}
          className="text-[12.5px] font-bold text-[#2D6A4F] hover:underline"
        >
          See all →
        </button>
      </div>
      <div className="no-scrollbar -mx-4 mt-3 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-8">
        <button onClick={() => setSelectedService("All")}
          className={`flex w-[86px] shrink-0 flex-col items-center gap-2 rounded-[18px] p-3.5 ring-1 transition active:scale-95 sm:w-auto ${selectedService === "All" ? "bg-[#1B4332] text-white ring-[#1B4332]" : "bg-white ring-[#1B4332]/10"}`}>
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#E76F51]/15 text-[#E76F51] text-lg font-black">✦</span>
          <span className="text-[11.5px] font-extrabold">{lang === "hi" ? "सभी" : "All"}</span>
        </button>
        {displayServices.map((s) => (
          <button key={s.id} onClick={() => { setSelectedService(s.id); }}
            className={`flex w-[86px] shrink-0 flex-col items-center gap-2 rounded-[18px] p-3.5 ring-1 transition active:scale-95 sm:w-auto ${selectedService === s.id ? "bg-[#1B4332] text-white ring-[#1B4332]" : "bg-white ring-[#1B4332]/10 hover:ring-[#2D6A4F]/40"}`}>
            <span className={`grid h-11 w-11 place-items-center rounded-2xl ${selectedService === s.id ? "bg-white/15 text-white" : "bg-[#1B4332]/8 text-[#1B4332]"}`}>
              <ServiceIcon icon={s.icon} className="h-5 w-5" />
            </span>
            <span className="text-center text-[11.5px] font-extrabold leading-tight">{lang === "hi" ? s.hi : s.en}</span>
          </button>
        ))}
      </div>

      {/* available now strip */}
      <div className="mt-6 overflow-hidden rounded-[20px] bg-gradient-to-r from-[#1B4332] to-[#2D6A4F] p-5 text-white sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-[13px] font-extrabold text-[#52B788]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute h-full w-full animate-ping rounded-full bg-[#52B788]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#52B788]" />
              </span>
              WORKER FIRST • {workersList.filter((w) => w.availableNow).length} ONLINE IN YOUR AREA
            </p>
            <h3 className="font-display mt-1.5 text-[22px] font-black sm:text-[26px]">
              {lang === "hi" ? "अभी उपलब्ध — तुरंत बुक करें" : "Available now — book instantly"}
            </h3>
          </div>
          {workersList.filter((w) => w.availableNow).length > 0 && (
            <button onClick={() => { setFilter("Available now"); }} className="rounded-full bg-white px-5 py-2.5 text-[13px] font-extrabold text-[#1B4332] transition hover:bg-[#F4A261] hover:text-white">
              Show now →
            </button>
          )}
        </div>

        {workersList.filter((w) => w.availableNow).length > 0 ? (
          <div className="no-scrollbar -mx-5 mt-4 flex gap-3 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0">
            {workersList.filter((w) => w.availableNow).slice(0, 5).map((w) => (
              <button key={w.id} onClick={() => { setSelectedWorker(w.id); go("worker-profile", w.id); }}
                className="flex shrink-0 items-center gap-2.5 rounded-2xl bg-white/10 p-2 pr-4 ring-1 ring-white/15 backdrop-blur transition hover:bg-white/20">
                <img src={w.photo} alt={w.name} className="h-11 w-11 rounded-xl object-cover" />
                <span className="text-left">
                  <span className="block text-[12.5px] font-extrabold">{w.name.split(" ")[0]} • {w.service}</span>
                  <span className="block text-[11px] font-semibold text-white/70">₹{w.price} • {w.eta} • ◆{w.trustDNA != null ? w.trustDNA : "Not enough data"}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-black/20 p-3 text-[12.5px] font-semibold text-white/80">
            {lang === "hi"
              ? "फ़िलहाल कोई कारीगर तुरंत उपलब्ध (Online) नहीं है। आप बाद के लिए शेड्यूल कर सकते हैं या सेवा सूची ब्राउज़ कर सकते हैं।"
              : "No verified workers are currently online for instant dispatch. Schedule an appointment or browse all service categories."}
          </p>
        )}
      </div>

      {/* nearby */}
      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-[16px] font-extrabold">
          {lang === "hi" ? "नज़दीकी कारीगर" : "Nearby workers"}{" "}
          <span className="ml-1 rounded-full bg-[#1B4332]/8 px-2.5 py-1 text-[11px]">{nearby.length}</span>
        </h2>
        <button
          onClick={() => go("workers", { service: selectedService, location, searchQuery: q })}
          className="flex items-center gap-1 text-[12.5px] font-bold text-[#2D6A4F] hover:underline"
        >
          <MapIcon className="h-3.5 w-3.5" /> Map & all ({nearby.length})
        </button>
      </div>

      {loading ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : workersError ? (
        <div className="mt-4 rounded-2xl bg-[#FFEBEE] p-5 ring-1 ring-[#EF5350]/30 text-center">
          <AlertCircle className="h-6 w-6 text-[#C62828] mx-auto mb-2" />
          <p className="text-[14.5px] font-extrabold text-[#C62828]">{workersError}</p>
          <p className="mt-1 text-xs font-semibold text-[#4A4A4A]">Unable to retrieve verified workers from the database.</p>
          <button onClick={loadWorkers} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#1B4332] px-4 py-2 text-xs font-extrabold text-white">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : nearby.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title={lang === "hi" ? "कोई सत्यापित कारीगर नहीं मिला" : "No verified workers available yet"}
            sub={
              q
                ? `No verified workers match "${q}". Try clearing your search term.`
                : selectedService !== "All"
                ? `Currently no verified workers are registered under ${displayServices.find(s => s.id === selectedService)?.en || selectedService}. New verified providers join daily.`
                : "No verified workers are currently discoverable in this area. Verified providers will appear here as their identity and trade checks are completed."
            }
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                {selectedService !== "All" && (
                  <button onClick={() => setSelectedService("All")} className="rounded-full bg-[#1B4332] px-4 py-2 text-[12.5px] font-bold text-white transition hover:bg-[#2D6A4F]">
                    {lang === "hi" ? "सभी सेवाएँ देखें" : "Show all services"}
                  </button>
                )}
                {q && (
                  <button onClick={() => { setQ(""); if (setSearchQuery) setSearchQuery(""); }} className="rounded-full bg-[#E76F51] px-4 py-2 text-[12.5px] font-bold text-white transition hover:bg-[#c65a3a]">
                    {lang === "hi" ? "खोज साफ़ करें" : "Clear search"}
                  </button>
                )}
                <button
                  onClick={() => { setQ(""); setSelectedService("All"); setFilter("All"); if (setSearchQuery) setSearchQuery(""); }}
                  className="rounded-full bg-[#FAF9F6] px-4 py-2 text-[12.5px] font-bold text-[#1B4332] ring-1 ring-[#1B4332]/20 hover:bg-[#1B4332]/5"
                >
                  {lang === "hi" ? "फ़िल्टर रीसेट करें" : "Reset all filters"}
                </button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nearby.slice(0, 6).map((w) => (
            <WorkerRowCard key={w.id} w={w} go={go} liked={liked.includes(w.id)} onLike={() => setLiked((l) => l.includes(w.id) ? l.filter((x) => x !== w.id) : [...l, w.id])} onSelect={() => { setSelectedWorker(w.id); go("worker-profile", w.id); }} />
          ))}
        </div>
      )}


      <CustomerBottomNav page="customer-home" go={go} onBook={() => go("booking", selectedWorker || "ramesh")} />
    </div>
  );
}

export function WorkerRowCard({ w, go, liked, onLike, onSelect }: { w: Worker; go: (p: Page, w?: string) => void; liked: boolean; onLike: () => void; onSelect: () => void }) {
  return (
    <div className="flex gap-3.5 rounded-[18px] bg-white p-3.5 ring-1 ring-[#1B4332]/10 card-shadow transition hover:ring-[#2D6A4F]/40">
      <button onClick={onSelect} className="relative shrink-0">
        <img src={w.photo} alt={w.name} className="h-[86px] w-[86px] rounded-2xl object-cover" loading="lazy" />
        {w.availableNow && <span className="absolute -bottom-1.5 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-[#1B4332] px-2 py-0.5 text-[9.5px] font-extrabold text-white"><span className="h-1.5 w-1.5 rounded-full bg-[#52B788]" />NOW</span>}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <button onClick={onSelect} className="min-w-0 text-left">
            <p className="flex items-center gap-1 truncate text-[14.5px] font-extrabold">{w.name} {w.verified && <BadgeCheck className="h-4 w-4 shrink-0 fill-[#52B788] text-white" />}</p>
            <p className="truncate text-[12px] font-semibold text-[#4A4A4A]">{w.service} • {w.distance} • {w.eta}</p>
          </button>
          <button onClick={onLike} aria-label="Save" className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition active:scale-90 ${liked ? "bg-[#E76F51]/12 text-[#E76F51]" : "bg-[#FAF9F6] text-[#8a8a8a]"}`}>
            <Heart className={`h-4 w-4 ${liked ? "fill-[#E76F51]" : ""}`} />
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1 text-[12px] font-bold"><Star className="h-3.5 w-3.5 fill-[#F4A261] text-[#F4A261]" />{w.rating ?? "New"} <span className="font-semibold text-[#8a8a8a]">({w.jobs})</span> <span className="ml-1 rounded-full bg-[#EFFAF1] px-2 py-0.5 text-[10.5px] font-extrabold text-[#1B4332]">◆ {w.trustDNA != null ? w.trustDNA : "Not enough data"}</span></span>
          <span className="text-[15px] font-extrabold text-[#1B4332]">₹{w.price}<span className="text-[10.5px] font-bold text-[#8a8a8a]">+</span></span>
        </div>
        <button onClick={() => go("booking", w.id)} className="mt-2 w-full rounded-xl bg-[#1B4332] py-2 text-[12.5px] font-extrabold text-white transition hover:bg-[#2D6A4F] active:scale-[0.98]">Negotiate & Book →</button>
      </div>
    </div>
  );
}

/* ================= WORKER LISTING ================= */
export function WorkerListing({
  go, lang, selectedService, setSelectedService, setSelectedWorker,
  searchQuery, setSearchQuery, location,
}: {
  go: (p: Page, opts?: any) => void; lang: "en" | "hi"; selectedService: string; setSelectedService: (s: string) => void; setSelectedWorker: (s: string) => void;
  searchQuery?: string; setSearchQuery?: (q: string) => void; location?: string;
}) {
  const [view, setView] = useState<"list" | "map">("list");
  const [sort, setSort] = useState("Recommended");
  const [maxPrice, setMaxPrice] = useState(900);
  const [onlyNow, setOnlyNow] = useState(false);
  const [minTrust, setMinTrust] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // 1. Service Catalog from Supabase
  const [catalog, setCatalog] = useState<MarketplaceService[]>([]);
  useEffect(() => {
    let active = true;
    fetchServices().then((res) => {
      if (!active) return;
      if (res.data && res.data.length > 0) setCatalog(res.data);
    });
    return () => { active = false; };
  }, []);

  const displayServices = catalog.length > 0
    ? catalog.map((s) => ({
        id: s.id,
        en: s.name_en,
        hi: s.name_hi,
        icon: s.icon,
        desc: s.description,
        basePrice: Number(s.base_price),
      }))
    : services;

  // 2. Real workers from marketplace_workers
  const [workersList, setWorkersList] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkers = useCallback(async () => {
    setLoading(true);
    setError(null);

    const res = await fetchMarketplaceWorkers({
      serviceId: selectedService,
      searchQuery,
      location,
      onlyAvailableNow: onlyNow,
      maxPrice,
      minTrust,
      sortBy: sort as any,
    });

    if (res.error) {
      setError(res.error);
      setWorkersList([]);
    } else {
      const normalized = res.data.map((w) => normalizeWorker(w, catalog));
      setWorkersList(normalized);
    }
    setLoading(false);
  }, [selectedService, searchQuery, location, onlyNow, maxPrice, minTrust, sort, catalog]);

  useEffect(() => {
    loadWorkers();
  }, [loadWorkers]);

  const list = workersList;
  const activeServiceObj = displayServices.find((s) => s.id === selectedService);

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 md:pb-16">
      <button onClick={() => go("customer-home")} className="flex items-center gap-1.5 text-[13px] font-bold text-[#4A4A4A] hover:text-[#1B4332]"><ChevronLeft className="h-4 w-4" /> Back</button>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-black tracking-tight sm:text-[30px]">
            {selectedService === "All" ? (lang === "hi" ? "सभी सत्यापित कारीगर" : "All verified workers") : (activeServiceObj ? (lang === "hi" ? activeServiceObj.hi : activeServiceObj.en) : selectedService)}{" "}
            <span className="text-[#8a8a8a] text-[16px] font-bold">({list.length})</span>
          </h1>
          {location && <p className="text-xs font-bold text-[#4A4A4A] mt-0.5"><MapPin className="inline h-3 w-3 text-[#E76F51] mr-1" />{location}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-white p-1 ring-1 ring-[#1B4332]/12">
            <button onClick={() => setView("list")} className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-extrabold transition ${view === "list" ? "bg-[#1B4332] text-white" : "text-[#4A4A4A]"}`}><List className="h-4 w-4" /> List</button>
            <button onClick={() => setView("map")} className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-extrabold transition ${view === "map" ? "bg-[#1B4332] text-white" : "text-[#4A4A4A]"}`}><MapIcon className="h-4 w-4" /> Map</button>
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 rounded-full bg-[#E76F51] px-4 py-2.5 text-[12.5px] font-extrabold text-white transition hover:bg-[#c65a3a]">
            <SlidersHorizontal className="h-4 w-4" /> Filters {(onlyNow || minTrust > 0 || maxPrice < 900) && <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] text-[#E76F51]">!</span>}
          </button>
        </div>
      </div>

      {/* live search input bar */}
      <div className="mt-3 flex items-center gap-2.5 rounded-[18px] bg-white px-4 py-1.5 ring-1 ring-[#1B4332]/12 card-shadow focus-within:ring-[#2D6A4F]">
        <Search className="h-4 w-4 shrink-0 text-[#1B4332]" />
        <input
          value={searchQuery || ""}
          onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
          placeholder={lang === "hi" ? "कारीगर का नाम, कौशल (जैसे leak, fan, paint) या इलाका खोजें…" : "Search worker by name, skill (e.g. leak, wiring, AC), or area..."}
          className="h-10 w-full bg-transparent text-[13.5px] font-semibold outline-none placeholder:text-[#8a8a8a]"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery && setSearchQuery("")} aria-label="Clear search" className="rounded-full p-1 text-[#8a8a8a] hover:text-[#1A1A1A]">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* service pills */}
      <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {[{ id: "All", en: "All services", hi: "सभी" }, ...displayServices].map((s) => (
          <button key={s.id} onClick={() => setSelectedService(s.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-[12.5px] font-extrabold ring-1 transition active:scale-95 ${selectedService === s.id ? "bg-[#1B4332] text-white ring-[#1B4332]" : "bg-white ring-[#1B4332]/12"}`}>
            {lang === "hi" ? (s as any).hi : (s as any).en}
          </button>
        ))}
      </div>

      {/* filters */}
      {showFilters && (
        <div className="animate-slide-up mt-3 grid gap-4 rounded-[20px] bg-white p-5 ring-1 ring-[#1B4332]/12 card-shadow sm:grid-cols-4">
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">Sort by</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["Recommended", "Nearest", "Highest rated", "Price: low to high", "TrustDNA"].map((o) => (
                <button key={o} onClick={() => setSort(o)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold ring-1 ${sort === o ? "bg-[#1B4332] text-white ring-[#1B4332]" : "bg-[#FAF9F6] ring-[#1B4332]/12"}`}>{o}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">Max starting price: <span className="text-[#E76F51]">₹{maxPrice}</span></p>
            <input type="range" min={150} max={900} step={50} value={maxPrice} onChange={(e) => setMaxPrice(+e.target.value)} className="mt-3 w-full accent-[#1B4332]" />
          </div>
          <div>
            <p className="text-[12px] font-extrabold uppercase tracking-wide text-[#4A4A4A]">Min TrustDNA: <span className="text-[#1B4332]">{minTrust || "Any"}</span></p>
            <div className="mt-2 flex gap-1.5">{[0, 85, 90, 93].map((v) => <button key={v} onClick={() => setMinTrust(v)} className={`rounded-full px-3 py-1.5 text-[12px] font-bold ring-1 ${minTrust === v ? "bg-[#1B4332] text-white" : "bg-[#FAF9F6] ring-[#1B4332]/12"}`}>{v === 0 ? "Any" : `${v}+`}</button>)}</div>
          </div>
          <div className="flex items-end">
            <button onClick={() => setOnlyNow(!onlyNow)} className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-[13px] font-extrabold ring-1 transition ${onlyNow ? "bg-[#EFFAF1] text-[#1B4332] ring-[#2D6A4F]" : "bg-[#FAF9F6] ring-[#1B4332]/12"}`}>
              Available now only <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${onlyNow ? "bg-[#2D6A4F]" : "bg-[#d8cfbe]"}`}><span className={`h-5 w-5 rounded-full bg-white shadow transition ${onlyNow ? "translate-x-5" : "translate-x-0.5"}`} /></span>
            </button>
          </div>
        </div>
      )}

      {error ? (
        <div className="mt-4 rounded-2xl bg-[#FFEBEE] p-5 ring-1 ring-[#EF5350]/30 text-center">
          <AlertCircle className="h-6 w-6 text-[#C62828] mx-auto mb-2" />
          <p className="text-[14.5px] font-extrabold text-[#C62828]">{error}</p>
          <p className="mt-1 text-xs font-semibold text-[#4A4A4A]">Could not query marketplace_workers view.</p>
          <button onClick={loadWorkers} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#1B4332] px-4 py-2 text-xs font-extrabold text-white">
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : view === "map" ? (
        <div className="animate-fade-in mt-4 overflow-hidden rounded-[20px] ring-1 ring-[#1B4332]/12 card-shadow">
          {/* stylized map */}
          <div className="dot-grid relative h-[380px] bg-[#EDE8DA] sm:h-[440px]">
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 800 400">
              <path d="M-20,120 C150,100 220,200 400,170 C580,140 640,220 820,190" stroke="#fff" strokeWidth="26" fill="none" strokeLinecap="round" />
              <path d="M-20,260 C180,250 300,300 500,270 C650,250 720,290 820,270" stroke="#fff" strokeWidth="18" fill="none" strokeLinecap="round" />
              <path d="M200,-20 C220,120 180,260 230,420" stroke="#fff" strokeWidth="20" fill="none" />
              <path d="M560,-20 C540,140 600,260 570,420" stroke="#fff" strokeWidth="14" fill="none" />
              <circle cx="400" cy="200" r="90" fill="#2D6A4F" opacity="0.12" />
              <circle cx="400" cy="200" r="55" fill="#2D6A4F" opacity="0.12" />
            </svg>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#1B4332] text-white ring-4 ring-white card-shadow-lg"><Navigation className="h-5 w-5" /></div>
              <p className="mt-1 whitespace-nowrap rounded-full bg-[#122b21] px-3 py-1 text-center text-[10.5px] font-extrabold text-white">You • {location || "Laxmi Nagar"}</p>
            </div>
            {list.slice(0, 5).map((w, i) => {
              const pos = [{ l: "18%", t: "22%" }, { l: "68%", t: "18%" }, { l: "74%", t: "62%" }, { l: "24%", t: "66%" }, { l: "48%", t: "30%" }][i];
              return (
                <button key={w.id} onClick={() => { setSelectedWorker(w.id); go("worker-profile", w.id); }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition hover:z-10 hover:scale-110" style={{ left: pos.l, top: pos.t }}>
                  <div className="flex items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-3 ring-2 ring-[#2D6A4F] card-shadow-lg">
                    <img src={w.photo} alt={w.name} className="h-8 w-8 rounded-full object-cover" />
                    <span className="text-left leading-none"><span className="block text-[11px] font-extrabold">₹{w.price}</span><span className="block text-[9px] font-bold text-[#4A4A4A]">{w.eta}</span></span>
                  </div>
                </button>
              );
            })}
            {list.length === 0 ? (
              <div className="absolute inset-0 grid place-items-center bg-[#EDE8DA]/80 backdrop-blur-sm p-4 text-center">
                <div className="rounded-2xl bg-white p-5 shadow-lg max-w-sm">
                  <p className="text-[15px] font-extrabold text-[#1A1A1A]">No verified workers found on map</p>
                  <p className="mt-1 text-xs font-medium text-[#4A4A4A]">No verified workers match your selected filters in this area.</p>
                  <button onClick={() => { setMaxPrice(900); setMinTrust(0); setOnlyNow(false); setSelectedService("All"); if (setSearchQuery) setSearchQuery(""); }} className="mt-3 rounded-full bg-[#1B4332] px-4 py-2 text-xs font-bold text-white">Reset filters</button>
                </div>
              </div>
            ) : (
              <div className="absolute bottom-3 left-3 rounded-2xl bg-white/95 px-3.5 py-2.5 text-[11.5px] font-bold text-[#1A1A1A] backdrop-blur card-shadow">
                🗺️ {list.length} verified workers within 3 km • Tap a pin to view profile
              </div>
            )}
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto bg-white p-3">
            {list.map((w) => (
              <button key={w.id} onClick={() => { setSelectedWorker(w.id); go("worker-profile", w.id); }} className="flex w-[240px] shrink-0 items-center gap-2.5 rounded-2xl bg-[#FAF9F6] p-2.5 text-left ring-1 ring-[#1B4332]/10 hover:ring-[#2D6A4F]">
                <img src={w.photo} alt={w.name} className="h-12 w-12 rounded-xl object-cover" />
                <span><span className="block text-[13px] font-extrabold">{w.name}</span><span className="block text-[11.5px] font-semibold text-[#4A4A4A]">◆{w.trustDNA != null ? w.trustDNA : "Not enough data"} • {w.distance} • ₹{w.price}</span></span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="grid content-start gap-4 sm:grid-cols-2">
            {loading ? (
              <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : list.length === 0 ? (
              <div className="sm:col-span-2">
                <EmptyState
                  title={lang === "hi" ? "कोई सत्यापित कारीगर नहीं मिला" : "No verified workers found for this search"}
                  sub={
                    searchQuery
                      ? `No verified workers match "${searchQuery}". Try a different keyword or view all services.`
                      : selectedService !== "All"
                      ? `Currently no verified workers match the selected filters under ${activeServiceObj?.en || selectedService}.`
                      : "No verified workers match the selected filters in this area. Loosen filters to see more results."
                  }
                  action={
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {selectedService !== "All" && (
                        <button
                          onClick={() => setSelectedService("All")}
                          className="rounded-full bg-[#1B4332] px-4 py-2 text-[12.5px] font-bold text-white transition hover:bg-[#2D6A4F]"
                        >
                          Show all services
                        </button>
                      )}
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery && setSearchQuery("")}
                          className="rounded-full bg-[#E76F51] px-4 py-2 text-[12.5px] font-bold text-white transition hover:bg-[#c65a3a]"
                        >
                          Clear search
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setMaxPrice(900);
                          setMinTrust(0);
                          setOnlyNow(false);
                          setSelectedService("All");
                          if (setSearchQuery) setSearchQuery("");
                        }}
                        className="rounded-full bg-[#FAF9F6] px-4 py-2 text-[12.5px] font-bold text-[#1B4332] ring-1 ring-[#1B4332]/20 hover:bg-[#1B4332]/5"
                      >
                        Reset all filters
                      </button>
                    </div>
                  }
                />
              </div>
            ) : list.map((w) => (
              <WorkerDetailCard key={w.id} w={w} onProfile={() => { setSelectedWorker(w.id); go("worker-profile", w.id); }} onBook={() => go("booking", w.id)} />
            ))}
          </div>
          {/* explainer sidebar */}
          <aside className="hidden h-fit rounded-[20px] bg-[#1B4332] p-6 text-white lg:block">
            <p className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-[#52B788]"><ShieldCheck className="h-4 w-4" /> What is TrustDNA?</p>
            <div className="mt-4 flex justify-center"><TrustRing score={92} size={120} stroke={11} dark /></div>
            <ul className="mt-4 space-y-2.5 text-[13px] font-semibold text-white/80">
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#52B788]" /> Identity & address verified with Aadhaar</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#52B788]" /> Real completed jobs counted live</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#52B788]" /> Ratings only from paying customers</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#52B788]" /> Response speed tracked honestly</li>
            </ul>
            <button onClick={() => go("impact")} className="mt-5 w-full rounded-full bg-white py-3 text-[13px] font-extrabold text-[#1B4332]">How we keep you safe →</button>
          </aside>
        </div>
      )}
      <CustomerBottomNav page="workers" go={go} onBook={() => go("booking", list[0]?.id || "ramesh")} />
    </div>
  );
}

function WorkerDetailCard({ w, onProfile, onBook }: { w: Worker; onProfile: () => void; onBook: () => void }) {
  return (
    <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-[#1B4332]/10 card-shadow transition hover:card-shadow-lg">
      <button onClick={onProfile} className="flex w-full gap-3.5 p-4 text-left">
        <div className="relative shrink-0">
          <img src={w.photo} alt={w.name} className="h-20 w-20 rounded-2xl object-cover" loading="lazy" />
          {w.availableNow && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#2D6A4F] px-2 py-0.5 text-[9px] font-extrabold text-white">● NOW</span>}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[15px] font-extrabold">{w.name} {w.verified && <BadgeCheck className="h-4 w-4 fill-[#52B788] text-white" />}</p>
          <p className="mt-0.5 flex flex-wrap gap-1">{w.skills.slice(0, 3).map((s) => <span key={s} className="rounded-full bg-[#FAF9F6] px-2 py-0.5 text-[10.5px] font-bold text-[#4A4A4A] ring-1 ring-[#1B4332]/10">{s}</span>)}</p>
          <p className="mt-1.5 flex items-center gap-2 text-[12px] font-bold text-[#4A4A4A]"><span className="flex items-center gap-1 text-[#1A1A1A]"><Star className="h-3.5 w-3.5 fill-[#F4A261] text-[#F4A261]" />{w.rating} ({w.jobs})</span> • {w.distance} • {w.eta}</p>
        </div>
        <TrustRing score={w.trustDNA} size={56} stroke={6} />
      </button>
      <div className="flex items-center justify-between gap-2 border-t border-[#1B4332]/8 bg-[#FAF9F6]/60 px-4 py-3">
        <p className="text-[13px] font-bold text-[#4A4A4A]">Starts <span className="text-[17px] font-extrabold text-[#1B4332]">₹{w.price}</span></p>
        <div className="flex gap-2">
          <button onClick={onProfile} className="rounded-full px-4 py-2 text-[12.5px] font-extrabold text-[#1B4332] ring-1 ring-[#1B4332]/25 transition hover:bg-[#1B4332]/5">Profile</button>
          <button onClick={onBook} className="rounded-full bg-[#E76F51] px-4 py-2 text-[12.5px] font-extrabold text-white transition hover:bg-[#c65a3a]">Book →</button>
        </div>
      </div>
      <div className="flex items-center gap-1.5 bg-[#EFFAF1] px-4 py-2 text-[11px] font-bold text-[#1B4332]">
        <ShieldCheck className="h-3.5 w-3.5" /> Identity verified · {w.jobs} jobs · {w.rating} rating · ~{w.responseMins} min response
        <button onClick={onProfile} className="ml-auto underline">why?</button>
      </div>
    </div>
  );
}

/* ================= WORKER PROFILE ================= */
export function WorkerProfile({
  go, lang, workerId, setSelectedWorker,
}: {
  go: (p: Page, wid?: string) => void; lang: "en" | "hi"; workerId: string; setSelectedWorker: (s: string) => void;
}) {
  const fallback = workers.find((x) => x.id === workerId) ?? workers[0];
  const [worker, setWorker] = useState<Worker>(fallback);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadWorker() {
      // If it is a real database worker or not in local dummy list
      const staticFound = workers.find((x) => x.id === workerId);
      if (staticFound) {
        setWorker(staticFound);
      } else if (workerId) {
        setProfileLoading(true);
        const { data: dbWorker } = await fetchWorkerById(workerId);
        if (dbWorker && isMounted) {
          const { data: servicesList } = await fetchServices();
          setWorker(normalizeWorker(dbWorker, servicesList));
        }
        if (isMounted) setProfileLoading(false);
      }
    }
    loadWorker();
    return () => { isMounted = false; };
  }, [workerId]);

  const w = worker;
  const [tab, setTab] = useState<"about" | "reviews" | "rates">("about");
  const [showDNA, setShowDNA] = useState(true);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callToast, setCallToast] = useState("");
  const others = workers.filter((x) => x.id !== w.id && x.serviceId === w.serviceId).concat(workers.filter((x) => x.id !== w.id && x.serviceId !== w.serviceId)).slice(0, 3);

  const simulateCall = () => {
    setCallToast(`Connecting secure call to ${w.name} via Saharaa privacy line...`);
    setTimeout(() => {
      setCallToast(`Call in progress with ${w.name.split(" ")[0]} 📞`);
      setTimeout(() => {
        setCallToast("");
        setShowCallModal(false);
      }, 3000);
    }, 1500);
  };

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 pb-32 pt-5 sm:px-6 md:pb-16">
      <div className="flex items-center justify-between">
        <button onClick={() => go("workers")} className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-[13px] font-bold ring-1 ring-[#1B4332]/12"><ChevronLeft className="h-4 w-4" /> {lang === "hi" ? "वापस" : "Back"}</button>
        <span className="flex items-center gap-1.5 text-[12px] font-bold text-[#4A4A4A]"><MapPin className="h-3.5 w-3.5 text-[#E76F51]" /> {w.distance} away • {w.area}</span>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_380px]">
        <div>
          {/* hero card */}
          <div className="overflow-hidden rounded-[22px] bg-white ring-1 ring-[#1B4332]/10 card-shadow">
            <div className="relative">
              <img src={w.photo} alt={w.name} className="h-64 w-full object-cover sm:h-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute left-4 top-4 flex gap-2">
                {w.availableNow ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-[#2D6A4F] px-3.5 py-1.5 text-[12px] font-extrabold text-white"><span className="h-2 w-2 animate-pulse rounded-full bg-white" /> {lang === "hi" ? "अभी उपलब्ध" : "Available now"}</span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-1.5 text-[12px] font-extrabold text-[#4A4A4A]"><Clock className="h-3.5 w-3.5" /> Busy • back ~2h</span>
                )}
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                <div className="text-white">
                  <h1 className="flex items-center gap-2 text-[24px] font-extrabold sm:text-[28px]">{w.name} {w.verified && <BadgeCheck className="h-6 w-6 fill-[#52B788] text-white" />}</h1>
                  <p className="text-[13.5px] font-semibold text-white/85">{w.service} • {lang === "hi" ? w.hindiName : w.languages.join(" • ")} • {w.eta} arrival</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
              <TrustRing score={w.trustDNA} size={76} stroke={8} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-[15px] font-extrabold"><Stars rating={w.rating} /> {w.rating ?? "New"} <span className="font-semibold text-[#4A4A4A]">• {w.jobs} jobs done</span></p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">{w.skills.map((s) => <span key={s} className="rounded-full bg-[#FAF9F6] px-2.5 py-1 text-[11px] font-bold ring-1 ring-[#1B4332]/10">{s}</span>)}</div>
              </div>
              <div className="text-right"><p className="text-[11px] font-bold uppercase tracking-wide text-[#8a8a8a]">Starts at</p><p className="text-[26px] font-extrabold text-[#1B4332]">₹{w.price}</p></div>
            </div>
            {/* TrustDNA breakdown */}
            <div className="border-t border-[#1B4332]/10 bg-[#EFFAF1]/60 px-4 py-4 sm:px-5">
              <button onClick={() => setShowDNA(!showDNA)} className="flex w-full items-center justify-between text-left">
                <span className="flex items-center gap-2 text-[14px] font-extrabold text-[#1B4332]"><ShieldCheck className="h-5 w-5" /> TrustDNA {w.trustDNA != null ? `${w.trustDNA}/100` : "Not enough data"} — {lang === "hi" ? "क्यों भरोसा करें?" : "why trust this score?"}</span>
                <ChevronRight className={`h-5 w-5 text-[#1B4332] transition ${showDNA ? "rotate-90" : ""}`} />
              </button>
              {showDNA && (
                <div className="animate-slide-up mt-3 grid gap-2 sm:grid-cols-2">
                  {w.breakdown.map((b) => (
                    <div key={b.label} className="flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-3 ring-1 ring-[#2D6A4F]/15">
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${b.done ? "bg-[#2D6A4F] text-white" : "bg-[#F4A261]/20 text-[#E76F51]"}`}>
                        {b.done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </span>
                      <span><span className="block text-[12.5px] font-extrabold">{b.label}</span><span className="block text-[11px] font-bold text-[#2D6A4F]">{b.value}</span></span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* tabs */}
          <div className="mt-4 flex rounded-full bg-white p-1 ring-1 ring-[#1B4332]/12">
            {(["about", "reviews", "rates"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-full py-2.5 text-[13px] font-extrabold capitalize transition ${tab === t ? "bg-[#1B4332] text-white" : "text-[#4A4A4A]"}`}>{t}</button>
            ))}
          </div>
          <div className="animate-fade-in mt-4 rounded-[20px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow sm:p-6" key={tab}>
            {tab === "about" && (
              <div>
                <p className="text-[14.5px] font-medium leading-relaxed text-[#1A1A1A]">“{w.about}”</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-[13px] font-bold sm:grid-cols-4">
                  <InfoTile label="Service area" value={w.area} />
                  <InfoTile label="Languages" value={w.languages.join(", ")} />
                  <InfoTile label="Responds in" value={`~${w.responseMins} min`} />
                  <InfoTile label="Repeat clients" value="68%" />
                </div>
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#FEF6EC] p-4 ring-1 ring-[#E76F51]/20">
                  <Camera className="h-8 w-8 shrink-0 text-[#E76F51]" />
                  <p className="text-[12.5px] font-semibold text-[#4A4A4A]"><span className="font-extrabold text-[#1A1A1A]">Proof of Work promise:</span> before/after photos shared for every job, confirmed by you before payment.</p>
                </div>
              </div>
            )}
            {tab === "reviews" && (
              <div className="space-y-3">
                {[
                  { n: "Priya S.", t: `Fixed our issue in 40 minutes. Clean work, explained every charge. Highly recommended!`, r: 5, d: "2 days ago" },
                  { n: "Amit V.", t: "Polite, on time, brought own tools. Fair price locked in chat — no haggling at the door.", r: 5, d: "1 week ago" },
                  { n: "Kavita R.", t: "Good work, arrived promptly and quality was top-notch.", r: 5, d: "3 weeks ago" },
                ].map((r, i) => (
                  <div key={i} className="rounded-2xl bg-[#FAF9F6] p-4 ring-1 ring-[#1B4332]/8">
                    <div className="flex items-center justify-between"><p className="text-[13.5px] font-extrabold">{r.n}</p><Stars rating={r.r} /></div>
                    <p className="mt-1.5 text-[13.5px] font-medium text-[#1A1A1A]">“{r.t}”</p>
                    <p className="mt-1 text-[11px] font-bold text-[#8a8a8a]">{r.d} • Verified booking ✓</p>
                  </div>
                ))}
              </div>
            )}
            {tab === "rates" && (
              <div className="space-y-2.5">
                {[
                  { s: "Inspection & diagnosis visit", p: `₹${w.price}` },
                  { s: "Standard job service (1 hr)", p: `₹${w.price + 150}` },
                  { s: "Deep service / multi-task (2–3 hrs)", p: `₹${w.price + 450}` },
                  { s: "Emergency / priority visit", p: `₹${w.price + 200}` },
                ].map((r) => (
                  <div key={r.s} className="flex items-center justify-between rounded-2xl bg-[#FAF9F6] px-4 py-3.5 ring-1 ring-[#1B4332]/8">
                    <span className="text-[13.5px] font-bold">{r.s}</span><span className="text-[15px] font-extrabold text-[#1B4332]">{r.p}</span>
                  </div>
                ))}
                <p className="pt-1 text-[12px] font-semibold text-[#4A4A4A]">Final price is negotiated fairly in FairFare chat — these are starting guides, not fixed bills.</p>
              </div>
            )}
          </div>

          {/* similar */}
          <h3 className="mt-6 text-[15px] font-extrabold">Similar trusted workers</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {others.map((o) => (
              <button key={o.id} onClick={() => { setSelectedWorker(o.id); window.scrollTo({ top: 0 }); }} className="flex items-center gap-2.5 rounded-2xl bg-white p-3 text-left ring-1 ring-[#1B4332]/10 hover:ring-[#2D6A4F]/50">
                <img src={o.photo} alt={o.name} className="h-12 w-12 rounded-xl object-cover" />
                <span><span className="block text-[13px] font-extrabold">{o.name}</span><span className="block text-[11px] font-semibold text-[#4A4A4A]">◆{o.trustDNA != null ? o.trustDNA : "Not enough data"} • ₹{o.price} • {o.distance}</span></span>
              </button>
            ))}
          </div>
        </div>

        {/* sticky book panel */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-[22px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow-lg sm:p-6">
            <p className="flex items-center justify-between text-[14px] font-extrabold">Booking summary <span className="rounded-full bg-[#EFFAF1] px-2.5 py-1 text-[11px] text-[#1B4332]">No advance needed</span></p>
            <div className="mt-3 space-y-2 text-[13px] font-semibold text-[#4A4A4A]">
              <Row k="Arrival ETA" v={w.eta} />
              <Row k="Starting price" v={`₹${w.price}`} />
              <Row k="Platform fee" v="₹0 (FREE)" />
              <Row k="Payment terms" v="After work • UPI/Cash" />
            </div>
            <button onClick={() => go("booking", w.id)} className="mt-4 w-full rounded-2xl bg-[#E76F51] py-4 text-[15px] font-extrabold text-white transition hover:bg-[#c65a3a] active:scale-[0.98]">
              Negotiate & Book →
            </button>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              <button onClick={() => go("booking", w.id)} className="flex items-center justify-center gap-1.5 rounded-2xl py-3 text-[13px] font-extrabold text-[#1B4332] ring-1 ring-[#1B4332]/25 transition hover:bg-[#1B4332]/5">
                <MessageCircle className="h-4 w-4" /> Chat
              </button>
              <button onClick={() => setShowCallModal(true)} className="flex items-center justify-center gap-1.5 rounded-2xl py-3 text-[13px] font-extrabold text-[#1B4332] ring-1 ring-[#1B4332]/25 transition hover:bg-[#1B4332]/5">
                <Phone className="h-4 w-4" /> Call
              </button>
            </div>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11.5px] font-bold text-[#4A4A4A]"><ShieldCheck className="h-3.5 w-3.5 text-[#2D6A4F]" /> Covered by Saharaa Safety Promise</p>
          </div>
        </aside>
      </div>

      {/* Call modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl ring-1 ring-[#1B4332]/10 text-center animate-slide-up">
            <img src={w.photo} alt={w.name} className="mx-auto h-20 w-20 rounded-full object-cover ring-4 ring-[#52B788]" />
            <h3 className="mt-3 text-[18px] font-extrabold">{w.name}</h3>
            <p className="text-xs font-semibold text-[#4A4A4A]">{w.service} • ◆ {w.trustDNA != null ? `${w.trustDNA} TrustDNA` : "Not enough data"}</p>
            <div className="mt-4 rounded-2xl bg-[#EFFAF1] p-3 text-left text-xs font-bold text-[#1B4332] ring-1 ring-[#2D6A4F]/20">
              <ShieldCheck className="inline h-4 w-4 text-[#2D6A4F] mr-1.5" />
              Saharaa Privacy Shield active: your personal phone number is masked and protected.
            </div>
            <p className="mt-3 text-xs font-bold text-[#4A4A4A]">Masked line: <span className="text-[#1A1A1A] font-extrabold">+91 98118-XX482</span></p>
            {callToast ? (
              <p className="mt-3 rounded-xl bg-[#1B4332] py-2.5 text-xs font-bold text-white animate-pulse">{callToast}</p>
            ) : (
              <div className="mt-4 grid gap-2">
                <button onClick={simulateCall} className="w-full rounded-2xl bg-[#1B4332] py-3.5 text-sm font-extrabold text-white transition hover:bg-[#2D6A4F]">
                  📞 Call via Saharaa Line
                </button>
                <a href="tel:18007242722" className="block w-full rounded-2xl bg-[#FAF9F6] py-3 text-xs font-bold text-[#4A4A4A] ring-1 ring-[#1B4332]/10 hover:bg-[#FAF9F6]/80">
                  Dial Toll-Free (1800-SAHARAA)
                </a>
              </div>
            )}
            <button onClick={() => setShowCallModal(false)} className="mt-3 text-xs font-bold text-[#8a8a8a] hover:text-[#1A1A1A]">Cancel</button>
          </div>
        </div>
      )}

      {/* mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-[72px] z-30 px-4 md:hidden">
        <button onClick={() => go("booking", w.id)} className="mx-auto flex w-full max-w-md items-center justify-between rounded-2xl bg-[#E76F51] px-5 py-3.5 text-white card-shadow-lg active:scale-[0.98]">
          <span className="text-left"><span className="block text-[11px] font-bold text-white/80">Starts at ₹{w.price} • {w.eta}</span><span className="block text-[15px] font-extrabold">Negotiate & Book →</span></span>
          <span className="rounded-full bg-white/15 p-1"><TrustRing score={w.trustDNA} size={48} stroke={5} dark /></span>
        </button>
      </div>
      <CustomerBottomNav page="worker-profile" go={go} onBook={() => go("booking", w.id)} />
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <p className="flex items-center justify-between border-b border-dashed border-[#1B4332]/10 pb-2">{k}<span className="font-extrabold text-[#1A1A1A]">{v}</span></p>;
}
function InfoTile({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[#FAF9F6] p-3 ring-1 ring-[#1B4332]/8"><p className="text-[10.5px] font-extrabold uppercase tracking-wide text-[#8a8a8a]">{label}</p><p className="mt-0.5 text-[12.5px] font-extrabold leading-snug">{value}</p></div>;
}
