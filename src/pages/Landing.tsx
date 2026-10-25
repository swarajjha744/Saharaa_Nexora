import { useState } from "react";
import {
  ArrowRight, BadgeCheck, Bell, ChevronRight, Clock, HandCoins, MapPin, MessageCircle,
  Mic, Play, Search, ShieldCheck, Star, Quote, CheckCircle2, HeartHandshake, Navigation, Sparkles,
} from "lucide-react";
import { services, workers, impactStats, reviews } from "../data";
import { SectionHead, ServiceIcon, Stars, TrustRing, Footer } from "../components/shared";
import type { Page } from "../components/shared";

export default function Landing({
  go, lang, location, setLocation, selectedService, setSelectedService, searchQuery, setSearchQuery,
}: {
  go: (p: Page, opts?: any) => void;
  lang: "en" | "hi";
  location: string;
  setLocation: (s: string) => void;
  selectedService: string;
  setSelectedService: (s: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}) {
  const [q, setQ] = useState(searchQuery || "");
  const [listening, setListening] = useState(false);

  const handleSearch = (customQuery?: string) => {
    const text = (customQuery !== undefined ? customQuery : q).trim();
    setSearchQuery(text);

    const lower = text.toLowerCase();
    const matched = services.find((s) =>
      lower.includes(s.id) ||
      lower.includes(s.en.toLowerCase()) ||
      lower.includes(s.hi) ||
      (s.id === "plumbing" && (lower.includes("tap") || lower.includes("leak") || lower.includes("pipe") || lower.includes("नल") || lower.includes("plumb"))) ||
      (s.id === "electrical" && (lower.includes("fan") || lower.includes("light") || lower.includes("switch") || lower.includes("wire") || lower.includes("बिजली") || lower.includes("electr"))) ||
      (s.id === "cleaning" && (lower.includes("clean") || lower.includes("deep") || lower.includes("safai") || lower.includes("सफाई"))) ||
      (s.id === "cooking" && (lower.includes("cook") || lower.includes("food") || lower.includes("meal") || lower.includes("tiffin") || lower.includes("खाना"))) ||
      (s.id === "painting" && (lower.includes("paint") || lower.includes("wall") || lower.includes("color") || lower.includes("रंग"))) ||
      (s.id === "appliance" && (lower.includes("ac") || lower.includes("fridge") || lower.includes("washer") || lower.includes("repair"))) ||
      (s.id === "carpentry" && (lower.includes("wood") || lower.includes("door") || lower.includes("lock") || lower.includes("furniture") || lower.includes("बढ़ई") || lower.includes("carpent"))) ||
      (s.id === "gardening" && (lower.includes("garden") || lower.includes("plant") || lower.includes("pot") || lower.includes("पौधे")))
    );

    const serviceId = matched ? matched.id : selectedService !== "All" ? selectedService : "All";
    if (matched) setSelectedService(serviceId);
    go("workers", { service: serviceId, searchQuery: text, location });
  };

  const handleVoiceSearch = () => {
    if (listening) return;
    setListening(true);
    const spokenText = lang === "hi" ? "मुझे प्लंबर चाहिए (नल ठीक)" : "Need a plumber to fix leaking tap";
    setTimeout(() => {
      setQ(spokenText);
    }, 700);
    setTimeout(() => {
      setListening(false);
      handleSearch(spokenText);
    }, 1800);
  };

  return (
    <div className="page-enter">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#1B4332]">
        <div className="jaali-pattern absolute inset-0 opacity-60" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#2D6A4F]/60 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-[#E76F51]/20 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-10 sm:px-6 sm:pt-16 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pb-20">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-[12px] font-bold text-white ring-1 ring-white/15">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#52B788]" />
                {lang === "hi" ? "2,150+ सत्यापित कारीगर ऑनलाइन" : "2,150+ verified workers online"}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-[#E76F51] px-3.5 py-2 text-[12px] font-bold text-white">
                <ShieldCheck className="h-3.5 w-3.5" /> TrustDNA Protected
              </span>
            </div>
            <h1 className="font-display mt-5 text-[38px] font-black leading-[1.02] tracking-tight text-white sm:text-[54px] lg:text-[60px]">
              {lang === "hi" ? (
                <>भरोसेमंद <span className="text-[#F4A261]">स्थानीय कारीगर,</span> मिनटों में।</>
              ) : (
                <>Trusted local help, <span className="text-[#F4A261]">in minutes.</span></>
              )}
            </h1>
            <p className="mt-4 max-w-lg text-[15.5px] font-medium leading-relaxed text-white/75 sm:text-[17px]">
              {lang === "hi"
                ? "प्लंबर से लेकर कुक तक — सत्यापित प्रोफाइल, सही दाम पर सौदा, और असली रिव्यू। Local Skills. Fair Work. Trusted Connections."
                : "From plumbers to cooks — verified profiles, fair-price negotiation and real reviews. Local Skills. Fair Work. Trusted Connections."}
            </p>

            {/* location + search */}
            <div className="mt-6 rounded-[20px] bg-white p-2.5 card-shadow-lg">
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="flex flex-1 items-center gap-2 rounded-2xl bg-[#FAF9F6] px-4 py-3 ring-1 ring-[#1B4332]/10 focus-within:ring-[#2D6A4F]">
                  <MapPin className="h-5 w-5 shrink-0 text-[#E76F51]" />
                  <select value={location} onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-transparent text-[14px] font-bold text-[#1A1A1A] outline-none">
                    <option>Laxmi Nagar, Delhi</option>
                    <option>Preet Vihar, Delhi</option>
                    <option>Mayur Vihar, Delhi</option>
                    <option>Nirman Vihar, Delhi</option>
                    <option>Akshardham, Delhi</option>
                  </select>
                </label>
                <label className="flex flex-[1.4] items-center gap-2 rounded-2xl bg-[#FAF9F6] px-4 py-3 ring-1 ring-[#1B4332]/10 focus-within:ring-[#2D6A4F]">
                  <Search className="h-5 w-5 shrink-0 text-[#1B4332]" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder={lang === "hi" ? "क्या काम करवाना है? (जैसे: नल ठीक, कुक)" : "What do you need? (e.g. leaking tap, cook)"}
                    className="w-full bg-transparent text-[14px] font-semibold text-[#1A1A1A] outline-none placeholder:text-[#8a8a8a]"
                  />
                  {q && (
                    <button onClick={() => { setQ(""); setSearchQuery(""); }} className="text-[#8a8a8a] hover:text-[#1A1A1A] text-xs font-bold px-1">✕</button>
                  )}
                </label>
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleSearch()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#1B4332] px-6 py-4 text-[15px] font-extrabold text-white transition hover:bg-[#2D6A4F] active:scale-[0.98]">
                  {lang === "hi" ? "कारीगर खोजें" : "Find a Worker"} <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={handleVoiceSearch}
                  aria-label="Voice search"
                  className={`grid w-[60px] place-items-center rounded-2xl text-white transition active:scale-90 ${listening ? "bg-[#E76F51] animate-pulse-ring" : "bg-[#E76F51]/90 hover:bg-[#E76F51]"}`}>
                  <Mic className="h-5 w-5" />
                </button>
              </div>
              {listening && (
                <p className="animate-fade-in px-2 pb-1 pt-2 text-center text-[12.5px] font-bold text-[#E76F51]">
                  🎙️ {lang === "hi" ? "सुन रहे हैं… “मुझे प्लंबर चाहिए”" : "Listening… “Need a plumber to fix leaking tap”"}
                </p>
              )}
            </div>

            {/* trust strip */}
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] font-bold text-white/80">
              <span className="flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-[#52B788]" /> {lang === "hi" ? "सत्यापित प्रोफाइल" : "Verified profiles"}</span>
              <span className="flex items-center gap-1.5"><HandCoins className="h-4 w-4 text-[#F4A261]" /> {lang === "hi" ? "पारदर्शी दाम" : "Transparent pricing"}</span>
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-[#F4A261] text-[#F4A261]" /> {lang === "hi" ? "असली रिव्यू" : "Real reviews"}</span>
            </div>
          </div>

          {/* hero visual */}
          <div className="relative mt-10 lg:mt-0">
            <div className="animate-float-slow relative overflow-hidden rounded-[24px] ring-1 ring-white/20 card-shadow-lg">
              <img src="https://images.pexels.com/photos/7647233/pexels-photo-7647233.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200"
                alt="Verified electrician at work" className="h-[320px] w-full object-cover sm:h-[420px]" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#122b21]/70 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl bg-white/95 p-3 backdrop-blur">
                <img src={workers[0].photo} alt="Ramesh" className="h-12 w-12 rounded-full object-cover ring-2 ring-[#52B788]" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-[13.5px] font-extrabold">Ramesh Kumar <BadgeCheck className="h-4 w-4 fill-[#52B788] text-white" /></p>
                  <p className="flex items-center gap-1 text-[12px] font-semibold text-[#4A4A4A]"><Stars rating={4.8} /> 4.8 • 148 jobs • 0.8 km</p>
                </div>
                <span className="rounded-full bg-[#1B4332] px-3 py-1.5 text-[11px] font-extrabold text-white">92 TrustDNA</span>
              </div>
            </div>
            {/* floating cards */}
            <div className="absolute -left-3 top-6 hidden animate-float-slow rounded-2xl bg-white p-3 pr-4 card-shadow-lg sm:flex" style={{ animationDelay: "1s" }}>
              <TrustRing score={94} size={52} stroke={6} />
              <div className="ml-2.5 self-center"><p className="text-[12px] font-extrabold">Avg. TrustDNA</p><p className="text-[11px] font-semibold text-[#4A4A4A]">ID + skill verified</p></div>
            </div>
            <div className="absolute -right-2 bottom-24 hidden rounded-2xl bg-white p-3 pr-4 card-shadow-lg sm:block">
              <p className="flex items-center gap-1.5 text-[12px] font-extrabold text-[#1B4332]"><CheckCircle2 className="h-4 w-4 text-[#2D6A4F]" /> Job completed</p>
              <p className="mt-0.5 text-[11px] font-semibold text-[#4A4A4A]">AC repair • ₹449 • Paid fairly ✓</p>
            </div>
          </div>
        </div>
        {/* wave */}
        <svg viewBox="0 0 1440 48" className="relative block w-full text-[#FAF9F6]" fill="currentColor" preserveAspectRatio="none"><path d="M0,24 C240,48 480,0 720,24 C960,48 1200,0 1440,24 L1440,48 L0,48 Z" /></svg>
      </section>

      {/* SERVICES */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHead eyebrow={lang === "hi" ? "सेवाएँ" : "Services"} title={lang === "hi" ? "आपको क्या काम करवाना है?" : "What do you need help with?"} sub={lang === "hi" ? "8+ श्रेणियाँ • शुरुआती दाम के साथ • हिंदी + English" : "8+ categories with honest starting prices"} />
          <button
            onClick={() => {
              setSelectedService("All");
              setSearchQuery("");
              go("workers", { service: "All", location, searchQuery: "" });
            }}
            className="flex items-center gap-1 rounded-full bg-white px-4 py-2.5 text-[13px] font-bold text-[#1B4332] ring-1 ring-[#1B4332]/15 hover:ring-[#1B4332]/40"
          >
            {lang === "hi" ? "सभी देखें" : "View all"} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {services.map((s, i) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedService(s.id);
                setSearchQuery("");
                go("workers", { service: s.id, location, searchQuery: "" });
              }}
              className="group rounded-[18px] bg-white p-4 text-left ring-1 ring-[#1B4332]/10 card-shadow transition hover:-translate-y-1 hover:ring-[#2D6A4F]/40 sm:p-5"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className={`grid h-12 w-12 place-items-center rounded-2xl transition group-hover:scale-110 ${i % 3 === 1 ? "bg-[#E76F51]/12 text-[#E76F51]" : "bg-[#1B4332]/8 text-[#1B4332]"}`}>
                <ServiceIcon icon={s.icon} />
              </div>
              <p className="mt-3 text-[15px] font-extrabold">{lang === "hi" ? s.hi : s.en}</p>
              <p className="mt-0.5 line-clamp-1 text-[12px] font-semibold text-[#4A4A4A]">{s.desc}</p>
              <p className="mt-2 flex items-center justify-between text-[12px] font-extrabold text-[#1B4332]">₹{s.basePrice} onwards <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></p>
            </button>
          ))}
        </div>
      </section>

      {/* UNIQUE FEATURES */}
      <section className="border-y border-[#1B4332]/10 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <SectionHead eyebrow="Why Saharaa" title={lang === "hi" ? "भरोसा, पहले। हमेशा।" : "Trust, designed in. Not bolted on."} sub="Three signature systems that make work fair for workers and worry-free for you." />
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            <div className="rounded-[20px] bg-[#1B4332] p-6 text-white card-shadow-lg">
              <div className="flex items-center justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10"><ShieldCheck className="h-6 w-6 text-[#52B788]" /></div>
                <TrustRing score={92} size={64} stroke={7} dark />
              </div>
              <p className="mt-4 text-[18px] font-extrabold">TrustDNA™ Score</p>
              <p className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-white/70">Every worker carries a live trust score — identity verified · jobs done · rating · response speed.</p>
              <button onClick={() => go("worker-profile", "ramesh")} className="mt-4 flex items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[13px] font-extrabold text-[#1B4332] transition hover:bg-[#F4A261] hover:text-white">
                See live example <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-[20px] bg-[#FEF6EC] p-6 ring-1 ring-[#E76F51]/25 card-shadow">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#E76F51]/15 text-[#E76F51]"><MessageCircle className="h-6 w-6" /></div>
              <p className="mt-4 text-[18px] font-extrabold text-[#1A1A1A]">FairFare™ Negotiation</p>
              <p className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-[#4A4A4A]">Chat-style offers. No haggling stress, no hidden charges — you counter, worker counters, price locks.</p>
              <div className="mt-4 space-y-2">
                <div className="animate-chat-in w-fit max-w-[85%] rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-[12.5px] font-bold ring-1 ring-[#1B4332]/10">Worker quote: <span className="text-[#E76F51]">₹550</span></div>
                <div className="animate-chat-in ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-md bg-[#1B4332] px-3.5 py-2.5 text-[12.5px] font-bold text-white" style={{ animationDelay: "150ms" }}>Your offer: ₹450 ✓ locked</div>
              </div>
              <button onClick={() => go("booking", "ramesh")} className="mt-4 flex items-center gap-1.5 rounded-full bg-[#E76F51] px-4 py-2.5 text-[13px] font-extrabold text-white transition hover:bg-[#c65a3a]">
                Try FairFare <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-[20px] bg-[#EFFAF1] p-6 ring-1 ring-[#2D6A4F]/20 card-shadow">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#2D6A4F]/12 text-[#2D6A4F]"><HeartHandshake className="h-6 w-6" /></div>
              <p className="mt-4 text-[18px] font-extrabold text-[#1A1A1A]">Worker First</p>
              <p className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-[#4A4A4A]">“Available Now” cards, zero hidden commission on tips, proof-of-work photos & livelihood dashboards.</p>
              <button onClick={() => go("worker-dashboard")} className="mt-4 flex items-center gap-1.5 rounded-full bg-[#1B4332] px-4 py-2.5 text-[13px] font-extrabold text-white transition hover:bg-[#2D6A4F]">
                Worker view <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <SectionHead eyebrow={lang === "hi" ? "कैसे काम करता है" : "How it works"} title={lang === "hi" ? "3 आसान स्टेप, बस।" : "Book in 3 simple steps."} />
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {[
            { icon: Search, t: lang === "hi" ? "खोजें या बोलें" : "Search or speak", d: lang === "hi" ? "सेवा चुनें या माइक दबाकर बोलें — “मुझे इलेक्ट्रीशियन चाहिए”।" : "Pick a service or tap the mic and say “I need an electrician”.", c: "bg-[#1B4332] text-white" },
            { icon: MessageCircle, t: lang === "hi" ? "दाम पक्का करें" : "Negotiate & lock", d: lang === "hi" ? "FairFare चैट में ऑफर दें, काउंटर देखें, सही दाम लॉक करें।" : "Offer in FairFare chat, see counters, lock a fair price.", c: "bg-[#E76F51] text-white" },
            { icon: Navigation, t: lang === "hi" ? "ट्रैक और पेमेंट" : "Track & pay fairly", d: lang === "hi" ? "लाइव ट्रैकिंग, फोटो प्रूफ, डिजिटल बिल और टिप का विकल्प।" : "Live tracking, photo proof, digital invoice and optional tip.", c: "bg-[#2D6A4F] text-white" },
          ].map((s, i) => (
            <div key={i} className="relative rounded-[20px] bg-white p-6 ring-1 ring-[#1B4332]/10 card-shadow">
              <span className="absolute right-5 top-5 font-display text-[42px] font-black leading-none text-[#1B4332]/8">0{i + 1}</span>
              <div className={`grid h-12 w-12 place-items-center rounded-2xl ${s.c}`}><s.icon className="h-6 w-6" /></div>
              <p className="mt-4 text-[17px] font-extrabold">{s.t}</p>
              <p className="mt-1.5 text-[13.5px] font-medium leading-relaxed text-[#4A4A4A]">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* IMPACT */}
      <section className="bg-[#1B4332]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <SectionHead dark eyebrow="Social impact" title={lang === "hi" ? "हर बुकिंग, किसी की कमाई।" : "Every booking is someone's livelihood."} sub="Saharaa routes work to verified local workers first — with fair pricing and zero tip commission." />
          <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {impactStats.map((s) => (
              <div key={s.label} className="rounded-[18px] bg-white/[0.07] p-5 ring-1 ring-white/10 backdrop-blur">
                <p className="font-display text-[28px] font-black text-[#F4A261] sm:text-[34px]">{s.value}</p>
                <p className="mt-1 text-[13px] font-bold text-white">{s.label}</p>
                <p className="text-[11.5px] font-semibold text-white/50">{s.hi}</p>
              </div>
            ))}
          </div>
          <button onClick={() => go("impact")} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[14px] font-extrabold text-[#1B4332] transition hover:bg-[#F4A261] hover:text-white">
            {lang === "hi" ? "प्रभाव कहानियाँ देखें" : "See impact stories"} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* AVAILABLE NOW */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHead eyebrow="Worker first • Available now" title={lang === "hi" ? "अभी उपलब्ध कारीगर" : "Available right now near you"} sub="Workers publish live availability — no waiting, no middlemen." />
          <button onClick={() => go("workers")} className="flex items-center gap-1 rounded-full bg-[#1B4332] px-4 py-2.5 text-[13px] font-bold text-white hover:bg-[#2D6A4F]">
            {lang === "hi" ? "सभी देखें" : "View all"} <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="no-scrollbar -mx-4 mt-6 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-4">
          {workers.filter((w) => w.availableNow).slice(0, 4).map((w) => (
            <div key={w.id} className="w-[260px] shrink-0 snap-start sm:w-auto">
              <WorkerMini id={w.id} go={go} />
            </div>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section className="border-y border-[#1B4332]/10 bg-[#F8F5F0]">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <SectionHead eyebrow="Real reviews" title={lang === "hi" ? "पड़ोसी क्या कहते हैं" : "Loved by neighbourhoods"} />
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {reviews.map((r, i) => (
              <figure key={i} className="rounded-[20px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow">
                <Quote className="h-6 w-6 text-[#E76F51]" />
                <blockquote className="mt-3 text-[14px] font-medium leading-relaxed text-[#1A1A1A]">“{r.text}”</blockquote>
                <figcaption className="mt-4 flex items-center justify-between border-t border-[#1B4332]/10 pt-3">
                  <div><p className="text-[13.5px] font-extrabold">{r.name}</p><p className="text-[11.5px] font-semibold text-[#4A4A4A]">{r.area} • {r.service}</p></div>
                  <Stars rating={r.rating} />
                </figcaption>
              </figure>
            ))}
          </div>
          {/* safety */}
          <div className="mt-6 flex flex-col items-start gap-4 rounded-[20px] bg-[#122b21] p-6 text-white sm:flex-row sm:items-center sm:p-7">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#E76F51]"><Bell className="h-6 w-6" /></div>
            <div className="flex-1">
              <p className="text-[16px] font-extrabold">Safety, always on. सुरक्षा, हमेशा।</p>
              <p className="mt-1 text-[13px] font-medium text-white/65">In-app SOS, live job tracking shared with family, and one-tap report. Every job is logged and insured.</p>
            </div>
            <button onClick={() => go("tracking")} className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-[13px] font-extrabold text-[#1B4332]"><Play className="h-4 w-4" /> See live tracking</button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#E76F51] to-[#c65a3a] p-8 text-white card-shadow-lg sm:p-12">
          <div className="jaali-pattern absolute inset-0 opacity-40" />
          <div className="relative grid items-center gap-8 lg:grid-cols-2">
            <div>
              <p className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-white/80"><Sparkles className="h-4 w-4" /> Join 8,900+ happy households</p>
              <h3 className="font-display mt-3 text-[30px] font-black leading-tight sm:text-[40px]">{lang === "hi" ? "आज ही भरोसेमंद मदद पाएँ।" : "Get trusted help today."}</h3>
              <p className="mt-2 text-[14.5px] font-medium text-white/80">Fair prices • Verified workers • Pay after work is done.</p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <button onClick={() => go("customer-home")} className="flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-[14px] font-extrabold text-[#c65a3a] transition hover:bg-[#1B4332] hover:text-white">Find a worker <ArrowRight className="h-4 w-4" /></button>
                <button onClick={() => go("worker-onboarding")} className="rounded-full px-6 py-3.5 text-[14px] font-extrabold text-white ring-2 ring-white/60 transition hover:bg-white/10">Join as worker</button>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-[12px] font-bold text-white/70"><Clock className="h-3.5 w-3.5" /> Average booking time: 3 min • Arrival: ~18 min</p>
            </div>
            <div className="hidden lg:block">
              <img src="https://images.pexels.com/photos/8819146/pexels-photo-8819146.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200" alt="Happy family" className="h-72 w-full rounded-[20px] object-cover ring-4 ring-white/25" />
            </div>
          </div>
        </div>
      </section>

      <Footer go={go} />
    </div>
  );
}

function WorkerMini({ id, go }: { id: string; go: (p: Page, wid?: string) => void }) {
  const w = workers.find((x) => x.id === id)!;
  return (
    <button onClick={() => go("worker-profile", id)} className="w-full overflow-hidden rounded-[18px] bg-white text-left ring-1 ring-[#1B4332]/10 card-shadow transition hover:-translate-y-1">
      <div className="relative">
        <img src={w.photo} alt={w.name} className="h-36 w-full object-cover" loading="lazy" />
        <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-extrabold text-[#1B4332]"><span className="h-1.5 w-1.5 rounded-full bg-[#2D6A4F]" /> NOW</span>
        <span className="absolute bottom-2.5 right-2.5 rounded-full bg-[#1B4332] px-2.5 py-1 text-[10.5px] font-extrabold text-white">{w.trustDNA != null ? `${w.trustDNA} ◆` : "Not enough data"}</span>
      </div>
      <div className="p-3.5">
        <p className="flex items-center gap-1 text-[14px] font-extrabold">{w.name} <BadgeCheck className="h-4 w-4 fill-[#52B788] text-white" /></p>
        <p className="text-[12px] font-semibold text-[#4A4A4A]">{w.service} • {w.distance}</p>
        <p className="mt-1.5 flex items-center justify-between"><span className="text-[15px] font-extrabold text-[#1B4332]">₹{w.price}</span><span className="flex items-center gap-1 text-[12px] font-bold"><Star className="h-3.5 w-3.5 fill-[#F4A261] text-[#F4A261]" />{w.rating ?? "New"} ({w.jobs})</span></p>
      </div>
    </button>
  );
}
