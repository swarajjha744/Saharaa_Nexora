import { useState } from "react";
import {
  AlertTriangle, BarChart3, CheckCircle2, ChevronLeft,
  Flag, HeartHandshake, Search, ShieldCheck, TrendingUp,
  Users, Wallet, Quote, ArrowRight, Sparkles, HandCoins, FileText,
} from "lucide-react";
import { workers, impactStats } from "../data";
import type { Page } from "../components/shared";

/* ================= ADMIN ================= */
export function Admin({ go }: { go: (p: Page, w?: string) => void }) {
  const [tab, setTab] = useState<"verify" | "bookings" | "reports" | "analytics">("verify");
  const [queue, setQueue] = useState([
    { id: 1, name: "Dinesh Pal", skill: "Plumbing", docs: "Aadhaar ✓ • Address ✓", score: 78, img: workers[4].photo },
    { id: 2, name: "Rekha Singh", skill: "Cleaning", docs: "Aadhaar ✓ • Police check pending", score: 71, img: workers[6].photo },
    { id: 3, name: "Imran Sheikh", skill: "Electrical", docs: "Aadhaar ✓ • ITI cert ✓", score: 84, img: workers[2].photo },
  ]);
  const [bookingQuery, setBookingQuery] = useState("");
  const [reportsList, setReportsList] = useState([
    { id: 1, t: "Late arrival — 40 mins", d: "Customer reports worker arrived late without update. Booking #SH-2461.", u: true, resolved: false, details: "Investigated: Metro delay on Blue line. Worker called customer at 9:15 AM to inform. 15% discount applied." },
    { id: 2, t: "Price dispute — extra ₹100 asked", d: "Worker allegedly asked cash beyond locked price. Under review.", u: true, resolved: false, details: "FairFare policy checked. Worker asked for brass valve replacement without parts approval. Warning issued, customer refunded ₹100." },
    { id: 3, t: "Excellent service flagged", d: "Customer praised Sunita — auto-nominated for Worker of Week. 🌟", u: false, resolved: false, details: "Customer gave 5/5 stars and praised cleanliness and punctuality. Badge unlocked." },
  ]);
  const [activeReport, setActiveReport] = useState<typeof reportsList[0] | null>(null);

  const allBookings = [
    ["#SH-2481", "Ramesh → Priya", "Plumbing • ₹450 locked", "On the Way", "bg-[#FEF6EC] text-[#c65a3a]"],
    ["#SH-2480", "Sunita → Amit", "Cleaning • ₹549", "In Progress", "bg-[#EFFAF1] text-[#1B4332]"],
    ["#SH-2479", "Arif → Kavita", "Electrical • ₹399", "Completed ✓", "bg-[#1B4332] text-white"],
    ["#SH-2478", "Javed → Rohit", "AC repair • ₹449", "Completed ✓", "bg-[#1B4332] text-white"],
    ["#SH-2477", "Harish → Sunita", "Gardening • ₹299", "Completed ✓", "bg-[#1B4332] text-white"],
    ["#SH-2476", "Anita → Vikram", "Cooking • ₹350", "Completed ✓", "bg-[#1B4332] text-white"],
  ];

  const [toast, setToast] = useState("");
  const decide = (id: number, ok: boolean) => {
    setQueue((q) => q.filter((x) => x.id !== id));
    setToast(ok ? "Worker verified ✓ TrustDNA issued" : "Sent back for document correction");
    setTimeout(() => setToast(""), 2600);
  };

  const resolveReport = (id: number, u: boolean) => {
    setReportsList((list) => list.map((r) => r.id === id ? { ...r, resolved: true } : r));
    setToast(u ? "Dispute marked resolved ✓ Customer & worker updated" : "Appreciation sent to worker's TrustDNA profile 🌟");
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="page-enter mx-auto max-w-6xl px-4 pb-16 pt-5 sm:px-6">
      <button onClick={() => go("landing")} className="flex items-center gap-1.5 text-[13px] font-bold text-[#4A4A4A]"><ChevronLeft className="h-4 w-4" /> Home</button>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-black sm:text-[30px]">Admin control centre</h1>
          <p className="text-[13px] font-semibold text-[#4A4A4A]">East Delhi cluster • 2,150 workers • 312 active bookings</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-[#EFFAF1] px-3.5 py-2 text-[12px] font-extrabold text-[#1B4332] ring-1 ring-[#2D6A4F]/25"><span className="h-2 w-2 animate-pulse rounded-full bg-[#2D6A4F]" /> All systems healthy</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Users, v: "2,150", l: "Verified workers", d: "+48 this week" },
          { icon: FileText, v: "312", l: "Active bookings", d: "96% on-time" },
          { icon: Wallet, v: "₹4.2L", l: "Paid to workers (wk)", d: "+12% growth" },
          { icon: Flag, v: "7", l: "Open reports", d: "2 urgent" },
        ].map((c, i) => (
          <div key={i} className="rounded-[18px] bg-white p-4 ring-1 ring-[#1B4332]/10 card-shadow">
            <c.icon className="h-5 w-5 text-[#1B4332]" />
            <p className="mt-2 text-[22px] font-extrabold">{c.v}</p>
            <p className="text-[12px] font-bold">{c.l}</p>
            <p className="text-[11px] font-bold text-[#2D6A4F]">{c.d}</p>
          </div>
        ))}
      </div>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {([["verify", "Verification queue"], ["bookings", "Bookings"], ["reports", "Reports"], ["analytics", "Analytics"]] as const).map(([id, l]) => (
          <button key={id} onClick={() => setTab(id)} className={`shrink-0 rounded-full px-5 py-2.5 text-[13px] font-extrabold ring-1 transition ${tab === id ? "bg-[#1B4332] text-white ring-[#1B4332]" : "bg-white ring-[#1B4332]/12"}`}>
            {l} {id === "verify" && queue.length > 0 && <span className="ml-1 rounded-full bg-[#E76F51] px-2 py-0.5 text-[10px] text-white">{queue.length}</span>}
          </button>
        ))}
      </div>

      <div className="animate-fade-in mt-4" key={tab}>
        {tab === "verify" && (
          <div className="grid gap-3 lg:grid-cols-2">
            {queue.length === 0 ? (
              <div className="rounded-[20px] bg-[#EFFAF1] p-8 text-center ring-1 ring-[#2D6A4F]/20 lg:col-span-2">
                <CheckCircle2 className="mx-auto h-10 w-10 text-[#2D6A4F]" />
                <p className="mt-2 text-[16px] font-extrabold text-[#1B4332]">Queue clear! 🎉</p>
                <p className="text-[13px] font-medium text-[#4A4A4A]">All worker applications reviewed. New ones arrive daily ~9 AM.</p>
              </div>
            ) : queue.map((a) => (
              <div key={a.id} className="rounded-[20px] bg-white p-4 ring-1 ring-[#1B4332]/10 card-shadow">
                <div className="flex gap-3">
                  <img src={a.img} alt={a.name} className="h-16 w-16 rounded-2xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-extrabold">{a.name}</p>
                    <p className="text-[12px] font-semibold text-[#4A4A4A]">{a.skill} • {a.docs}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[12px] font-extrabold text-[#1B4332]"><ShieldCheck className="h-3.5 w-3.5" /> Provisional TrustDNA: {a.score}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button onClick={() => decide(a.id, true)} className="rounded-2xl bg-[#1B4332] py-2.5 text-[13px] font-extrabold text-white">Approve ✓</button>
                  <button onClick={() => decide(a.id, false)} className="rounded-2xl py-2.5 text-[13px] font-extrabold text-[#8a8a8a] ring-1 ring-[#1B4332]/15">Request fix</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "bookings" && (
          <div className="overflow-hidden rounded-[20px] bg-white ring-1 ring-[#1B4332]/10 card-shadow">
            <div className="flex items-center gap-2 border-b border-[#1B4332]/10 p-4">
              <Search className="h-4 w-4 text-[#8a8a8a]" />
              <input
                value={bookingQuery}
                onChange={(e) => setBookingQuery(e.target.value)}
                placeholder="Search bookings, workers, services, status…"
                className="w-full bg-transparent text-[13.5px] font-semibold outline-none"
              />
              {bookingQuery && (
                <button onClick={() => setBookingQuery("")} className="text-[12px] font-extrabold text-[#8a8a8a] hover:text-[#1A1A1A]">
                  Clear
                </button>
              )}
            </div>
            {filteredBookings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-[14px] font-extrabold text-[#1B4332]">No matching bookings found</p>
                <p className="mt-1 text-[12.5px] text-[#4A4A4A]">Try searching for "Plumbing", "Sunita", "Ramesh", or "#SH-2481".</p>
              </div>
            ) : (
              filteredBookings.map(([id, who, what, st, c]) => (
                <div key={id} className="flex flex-wrap items-center gap-2 border-b border-[#1B4332]/8 p-4 text-[13px] last:border-0 hover:bg-[#FAF9F6] transition">
                  <span className="font-extrabold">{id}</span>
                  <span className="font-bold">{who}</span>
                  <span className="font-semibold text-[#4A4A4A]">{what}</span>
                  <span className={`ml-auto rounded-full px-3 py-1 text-[11.5px] font-extrabold ${c}`}>{st}</span>
                </div>
              ))
            )}
          </div>
        )}
        {tab === "reports" && (
          <div className="grid gap-3 lg:grid-cols-2">
            {reportsList.map((r) => (
              <div key={r.id} className={`rounded-[20px] bg-white p-5 ring-1 card-shadow transition ${r.resolved ? "opacity-70 ring-[#1B4332]/10" : r.u ? "ring-[#E76F51]/30" : "ring-[#2D6A4F]/25"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-center gap-2 text-[14px] font-extrabold">
                    {r.u ? <AlertTriangle className="h-4 w-4 text-[#E76F51]" /> : <CheckCircle2 className="h-4 w-4 text-[#2D6A4F]" />}
                    {r.t}
                  </p>
                  {r.resolved && (
                    <span className="rounded-full bg-[#EFFAF1] px-2.5 py-0.5 text-[11px] font-extrabold text-[#1B4332]">Resolved ✓</span>
                  )}
                </div>
                <p className="mt-1.5 text-[13px] font-medium text-[#4A4A4A]">{r.d}</p>
                <div className="mt-3 flex gap-2">
                  {!r.resolved ? (
                    <button
                      onClick={() => resolveReport(r.id, r.u)}
                      className="rounded-full bg-[#1B4332] px-4 py-2 text-[12px] font-extrabold text-white transition hover:bg-[#2D6A4F]"
                    >
                      {r.u ? "Resolve" : "Appreciate"}
                    </button>
                  ) : (
                    <span className="rounded-full bg-[#FAF9F6] px-4 py-2 text-[12px] font-bold text-[#8a8a8a] ring-1 ring-[#1B4332]/10">Action completed</span>
                  )}
                  <button
                    onClick={() => setActiveReport(r)}
                    className="rounded-full px-4 py-2 text-[12px] font-extrabold text-[#4A4A4A] ring-1 ring-[#1B4332]/15 transition hover:bg-[#FAF9F6]"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Report Details Modal */}
        {activeReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-[24px] bg-white card-shadow-lg">
              <div className="flex items-center justify-between bg-[#1B4332] p-5 text-white">
                <div>
                  <p className="text-[15px] font-extrabold">Incident Case #{activeReport.id} Investigation</p>
                  <p className="text-[12px] text-white/80">{activeReport.t}</p>
                </div>
                <button onClick={() => setActiveReport(null)} className="rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-bold text-white hover:bg-white/20">Close ✕</button>
              </div>
              <div className="p-5">
                <div className="rounded-2xl bg-[#FAF9F6] p-4 ring-1 ring-[#1B4332]/10">
                  <p className="text-[11px] font-extrabold uppercase text-[#8a8a8a]">Incident Summary</p>
                  <p className="mt-1 text-[13px] font-bold text-[#1A1A1A]">{activeReport.d}</p>
                </div>
                <div className="mt-3 rounded-2xl bg-[#EFFAF1] p-4 ring-1 ring-[#2D6A4F]/20">
                  <p className="text-[11px] font-extrabold uppercase text-[#2D6A4F]">Investigation Log & Policy Findings</p>
                  <p className="mt-1 text-[13px] font-semibold text-[#1B4332]">{activeReport.details}</p>
                </div>
                <div className="mt-5 flex gap-2">
                  {!activeReport.resolved && (
                    <button
                      onClick={() => {
                        resolveReport(activeReport.id, activeReport.u);
                        setActiveReport(null);
                      }}
                      className="flex-1 rounded-2xl bg-[#1B4332] py-3 text-[13.5px] font-extrabold text-white"
                    >
                      {activeReport.u ? "Approve Resolution & Notify" : "Send Official Badge & Note"}
                    </button>
                  )}
                  <button
                    onClick={() => setActiveReport(null)}
                    className="rounded-2xl px-5 py-3 text-[13px] font-extrabold text-[#4A4A4A] ring-1 ring-[#1B4332]/15"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {tab === "analytics" && (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[20px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow">
              <p className="flex items-center gap-2 text-[14px] font-extrabold"><BarChart3 className="h-4 w-4" /> Jobs per day</p>
              <div className="mt-4 flex h-36 items-end gap-2">
                {[42, 58, 51, 72, 88, 124, 96].map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-extrabold">{v}</span>
                    <div className="flex w-full flex-1 items-end rounded-lg bg-[#FAF9F6]"><div className="w-full rounded-lg bg-gradient-to-t from-[#1B4332] to-[#52B788]" style={{ height: `${(v / 124) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[20px] bg-[#122b21] p-5 text-white">
              <p className="text-[14px] font-extrabold">Fairness health</p>
              <div className="mt-3 space-y-2.5 text-[12.5px] font-bold">
                <FairRow k="Avg. negotiation rounds" v="1.4 (healthy)" />
                <FairRow k="Locked-price honoured" v="98.2%" />
                <FairRow k="Tips reaching workers" v="100% • ₹86k" />
                <FairRow k="Worker retention (90d)" v="91%" />
              </div>
            </div>
          </div>
        )}
      </div>
      {toast && <div className="animate-slide-up fixed bottom-8 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-2xl bg-[#122b21] px-5 py-3.5 text-center text-[13.5px] font-bold text-white">{toast}</div>}
    </div>
  );
}
function FairRow({ k, v }: { k: string; v: string }) {
  return <p className="flex justify-between border-b border-white/10 pb-2 text-white/70">{k}<span className="font-extrabold text-[#52B788]">{v}</span></p>;
}

/* ================= IMPACT ================= */
export function Impact({ go, lang }: { go: (p: Page, w?: string) => void; lang: "en" | "hi" }) {
  const [pledged, setPledged] = useState(false);
  return (
    <div className="page-enter">
      <section className="relative overflow-hidden bg-[#1B4332]">
        <div className="jaali-pattern absolute inset-0 opacity-50" />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#2D6A4F]/60 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#F4A261] ring-1 ring-white/15"><HeartHandshake className="h-4 w-4" /> Community impact • सामाजिक प्रभाव</p>
          <h1 className="font-display mt-4 max-w-2xl text-[34px] font-black leading-[1.05] text-white sm:text-[50px]">
            {lang === "hi" ? "हर बुकिंग, किसी के घर की रौशनी।" : "Every booking lights up a local home."}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] font-medium text-white/70">Saharaa keeps 68 paise of every rupee inside your neighbourhood — fair prices, zero tip commission, skills training free for workers.</p>
          <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {impactStats.map((s) => (
              <div key={s.label} className="rounded-[18px] bg-white/[0.07] p-5 ring-1 ring-white/10">
                <p className="font-display text-[28px] font-black text-[#F4A261] sm:text-[32px]">{s.value}</p>
                <p className="text-[13px] font-bold text-white">{s.label}</p>
                <p className="text-[11px] font-semibold text-white/50">{s.hi}</p>
              </div>
            ))}
          </div>
        </div>
        <svg viewBox="0 0 1440 48" className="relative block w-full text-[#FAF9F6]" fill="currentColor" preserveAspectRatio="none"><path d="M0,24 C240,48 480,0 720,24 C960,48 1200,0 1440,24 L1440,48 L0,48 Z" /></svg>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid items-start gap-5 lg:grid-cols-[1fr_380px]">
          <div>
            <h2 className="text-[20px] font-extrabold">Where your money goes</h2>
            <div className="mt-4 rounded-[22px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow sm:p-6">
              <div className="flex h-9 overflow-hidden rounded-full ring-1 ring-[#1B4332]/10">
                <div className="bg-[#1B4332]" style={{ width: "68%" }} />
                <div className="bg-[#52B788]" style={{ width: "17%" }} />
                <div className="bg-[#F4A261]" style={{ width: "10%" }} />
                <div className="bg-[#EFE9DD]" style={{ width: "5%" }} />
              </div>
              <div className="mt-4 grid gap-2.5 text-[13px] font-bold sm:grid-cols-2">
                <Legend c="bg-[#1B4332]" t="68% — Worker payout" d="Direct to worker + family" />
                <Legend c="bg-[#52B788]" t="17% — Parts & warranty" d="Genuine spares, 30-day cover" />
                <Legend c="bg-[#F4A261]" t="10% — Training & insurance" d="Free skilling, safety cover" />
                <Legend c="bg-[#EFE9DD]" t="5% — Platform upkeep" d="Support, tech, verification" />
              </div>
              <p className="mt-4 flex items-center gap-2 rounded-2xl bg-[#EFFAF1] p-3.5 text-[12.5px] font-bold text-[#1B4332]"><HandCoins className="h-5 w-5 shrink-0" /> Tips: 0% commission. Every rupee you tip reaches the worker's UPI instantly.</p>
            </div>

            <h2 className="mt-8 text-[20px] font-extrabold">Stories of change ✨</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <StoryCard img="https://images.pexels.com/photos/31199562/pexels-photo-31199562.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200" name="Sunita Devi, 34" role="Cleaning • 214 jobs • ₹18,400/month" quote="Pehle contractor 40% kaat leta tha. Ab Saharaa par poori kamai meri — beti ki fees time par jaati hai." />
              <StoryCard img="https://images.pexels.com/photos/9271168/pexels-photo-9271168.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" name="Ramesh Kumar, 41" role="Plumbing • 148 jobs • TrustDNA 92" quote="TrustDNA score dekh kar customers pehle se bharosa karte hain. Repeat bookings se ghar ka kharcha stable hai." />
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {[
                { icon: ShieldCheck, t: "Verified & insured", d: "Aadhaar + skill checks, job insurance up to ₹10k" },
                { icon: TrendingUp, t: "Free upskilling", d: "120+ workers trained in AC, safety & behaviour" },
                { icon: Users, t: "Women first", d: "38% earners are women • creche + safe slots" },
              ].map((f, i) => (
                <div key={i} className="rounded-[20px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow">
                  <f.icon className="h-6 w-6 text-[#1B4332]" />
                  <p className="mt-2.5 text-[14.5px] font-extrabold">{f.t}</p>
                  <p className="mt-1 text-[12.5px] font-medium text-[#4A4A4A]">{f.d}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="rounded-[22px] bg-gradient-to-br from-[#E76F51] to-[#c65a3a] p-6 text-white card-shadow-lg">
              <p className="flex items-center gap-2 text-[12px] font-extrabold uppercase tracking-widest text-white/80"><Sparkles className="h-4 w-4" /> Support local workers</p>
              <p className="font-display mt-2 text-[24px] font-black leading-tight">Pledge to hire local first.</p>
              <p className="mt-1.5 text-[13px] font-medium text-white/80">Join 8,900+ households who choose verified neighbourhood workers over random contractors.</p>
              {pledged ? (
                <p className="animate-slide-up mt-4 rounded-2xl bg-white/15 p-3.5 text-center text-[13.5px] font-extrabold ring-1 ring-white/25">🎉 You're #8,901! Certificate sent on SMS. Shukriya!</p>
              ) : (
                <button onClick={() => setPledged(true)} className="mt-4 w-full rounded-2xl bg-white py-3.5 text-[14px] font-extrabold text-[#c65a3a] transition hover:bg-[#122b21] hover:text-white">I pledge 🤝</button>
              )}
              <button onClick={() => go("customer-home")} className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-2xl py-3 text-[13.5px] font-extrabold text-white ring-2 ring-white/40">Book a worker <ArrowRight className="h-4 w-4" /></button>
            </div>
            <div className="rounded-[22px] bg-white p-5 ring-1 ring-[#1B4332]/10 card-shadow">
              <p className="text-[14px] font-extrabold">Top neighbourhoods this month</p>
              {[["Laxmi Nagar", 1240], ["Preet Vihar", 980], ["Mayur Vihar", 860], ["Nirman Vihar", 640]].map(([n, v]) => (
                <div key={n as string} className="mt-2.5">
                  <p className="flex justify-between text-[12px] font-bold">{n}<span>{v} jobs</span></p>
                  <div className="mt-1 h-2 rounded-full bg-[#FAF9F6] ring-1 ring-[#1B4332]/8"><div className="h-full rounded-full bg-[#E76F51]" style={{ width: `${(Number(v) / 1240) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

function Legend({ c, t, d }: { c: string; t: string; d: string }) {
  return <div className="flex gap-2.5 rounded-2xl bg-[#FAF9F6] p-3 ring-1 ring-[#1B4332]/8"><span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${c}`} /><span><span className="block text-[12.5px] font-extrabold">{t}</span><span className="block text-[11px] font-semibold text-[#4A4A4A]">{d}</span></span></div>;
}
function StoryCard({ img, name, role, quote }: { img: string; name: string; role: string; quote: string }) {
  return (
    <figure className="overflow-hidden rounded-[20px] bg-white ring-1 ring-[#1B4332]/10 card-shadow">
      <img src={img} alt={name} className="h-44 w-full object-cover" loading="lazy" />
      <div className="p-5">
        <Quote className="h-5 w-5 text-[#E76F51]" />
        <blockquote className="mt-2 text-[13.5px] font-medium italic leading-relaxed">“{quote}”</blockquote>
        <figcaption className="mt-3 border-t border-[#1B4332]/10 pt-3"><p className="text-[13.5px] font-extrabold">{name}</p><p className="text-[11.5px] font-bold text-[#2D6A4F]">{role}</p></figcaption>
      </div>
    </figure>
  );
}
