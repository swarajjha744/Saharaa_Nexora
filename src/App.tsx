import { useState, useEffect, useRef } from "react";
import { HeartHandshake } from "lucide-react";
import { TopNav, DemoBar, type Page } from "./components/shared";
import Landing from "./pages/Landing";
import { CustomerHome, WorkerListing, WorkerProfile } from "./pages/Customer";
import { BookingFlow, Tracking, PaymentReview } from "./pages/Booking";
import { WorkerDashboard, WorkerOnboarding, WorkerJobs, WorkerEarnings, Auth } from "./pages/Worker";
import { Admin, Impact } from "./pages/AdminImpact";
import { useAuth } from "./contexts/AuthContext";

function getStoredState() {
  try {
    const raw = sessionStorage.getItem("saharaa_state");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getValidWorkerId(val: unknown): string | null {
  if (typeof val === "string") {
    const trimmed = decodeURIComponent(val).trim();
    if (!trimmed || trimmed === "[object Object]" || trimmed.includes("[object")) {
      return null;
    }
    return trimmed;
  }
  if (typeof val === "object" && val !== null) {
    const candidate = (val as any).workerId || (val as any).id || (val as any).worker;
    if (typeof candidate === "string") {
      const trimmed = decodeURIComponent(candidate).trim();
      if (trimmed && trimmed !== "[object Object]" && !trimmed.includes("[object")) {
        return trimmed;
      }
    }
  }
  return null;
}

export default function App() {
  const { user, profile, role: authRole, isLoading: authLoading, isAuthenticated } = useAuth();
  const stored = getStoredState();
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  const [page, setPage] = useState<Page>(
    (hashParams.get("page") as Page) || stored?.page || "landing"
  );
  const [role, setRole] = useState<"customer" | "worker" | "admin" | null>(
    authRole || (hashParams.get("role") as any) || stored?.role || null
  );
  const [lang, setLang] = useState<"en" | "hi">(
    (hashParams.get("lang") as any) || stored?.lang || "en"
  );
  const [location, setLocation] = useState(
    hashParams.get("loc") || stored?.location || "Laxmi Nagar, Delhi"
  );
  const [selectedService, setSelectedService] = useState(
    hashParams.get("service") || stored?.selectedService || "All"
  );


  const initialPage = (hashParams.get("page") as Page) || stored?.page || "landing";
  const isInitialWorkerPage = ["worker-profile", "booking", "tracking", "payment"].includes(initialPage);
  const initialWorkerId = getValidWorkerId(hashParams.get("worker")) || (isInitialWorkerPage ? getValidWorkerId(stored?.selectedWorker) || "ramesh" : null);

  const [selectedWorker, setSelectedWorker] = useState<string | null>(initialWorkerId);
  const [lockedPrice, setLockedPrice] = useState<number>(
    hashParams.get("price") ? Number(hashParams.get("price")) : stored?.lockedPrice || 450
  );
  const [searchQuery, setSearchQuery] = useState(
    hashParams.get("q") || stored?.searchQuery || ""
  );
  const [scheduleMode, setScheduleMode] = useState<"asap" | "schedule">(
    (hashParams.get("schedule") as any) || stored?.scheduleMode || "asap"
  );
  const [scheduleDate, setScheduleDate] = useState(
    hashParams.get("date") || stored?.scheduleDate || ""
  );
  const [address, setAddress] = useState(
    hashParams.get("address") || stored?.address || "Flat 402, Shanti Kunj, Laxmi Nagar"
  );
  const [partsApproved, setPartsApproved] = useState<boolean>(
    stored?.partsApproved ?? false
  );

  const isUpdatingHash = useRef(false);

  const setWorkerId = (w: unknown) => {
    const valid = getValidWorkerId(w);
    setSelectedWorker(valid);
  };

  // Synchronize state to URL Hash and sessionStorage
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", page);
    if (role) params.set("role", role);
    if (lang !== "en") params.set("lang", lang);
    if (location) params.set("loc", location);
    if (selectedService && selectedService !== "All") params.set("service", selectedService);

    // Store only a worker's stable ID in the URL, never the full JavaScript object.
    // Remove the worker parameter when no worker is selected.
    const isWorkerPage = ["worker-profile", "booking", "tracking", "payment"].includes(page);
    const validWorker = getValidWorkerId(selectedWorker);
    if (validWorker && isWorkerPage) {
      params.set("worker", validWorker);
    }

    if (lockedPrice) params.set("price", lockedPrice.toString());
    if (searchQuery) params.set("q", searchQuery);
    if (scheduleMode !== "asap") params.set("schedule", scheduleMode);
    if (scheduleDate) params.set("date", scheduleDate);

    const hashString = `#${params.toString()}`;
    if (window.location.hash !== hashString) {
      isUpdatingHash.current = true;
      window.location.hash = hashString;
    }

    try {
      sessionStorage.setItem("saharaa_state", JSON.stringify({
        page, role, lang, location, selectedService,
        selectedWorker: validWorker,
        lockedPrice, searchQuery, scheduleMode, scheduleDate, address, partsApproved
      }));
    } catch { }

    // Dynamic title updates for SEO and UX
    const serviceName = selectedService !== "All" ? `${selectedService} in ` : "";
    document.title = `Saharaa — ${serviceName}${location.split(",")[0]}`;
  }, [page, role, lang, location, selectedService, selectedWorker, lockedPrice, searchQuery, scheduleMode, scheduleDate, address, partsApproved]);

  // Synchronize authenticated role from Supabase Auth
  useEffect(() => {
    if (authRole) {
      setRole(authRole);
    } else if (!isAuthenticated) {
      setRole(null);
    }
  }, [authRole, isAuthenticated]);

  // Role-based route guard
  useEffect(() => {
    if (authLoading) return;

    const workerPages: Page[] = ["worker-dashboard", "worker-jobs", "worker-earnings"];
    const adminPages: Page[] = ["admin"];

    // 1. Admin route protection
    if (adminPages.includes(page)) {
      if (!isAuthenticated) {
        setPage("auth");
      } else if (authRole !== "admin") {
        setPage(authRole === "worker" ? "worker-dashboard" : "customer-home");
      }
    }

    // 2. Worker route protection
    if (workerPages.includes(page)) {
      if (!isAuthenticated) {
        setPage("auth");
      } else if (authRole !== "worker" && authRole !== "admin") {
        setPage("customer-home");
      }
    }
  }, [page, authRole, isAuthenticated, authLoading]);

  // Handle browser Back / Forward buttons (popstate & hashchange)
  useEffect(() => {
    const handleHashChange = () => {
      if (isUpdatingHash.current) {
        isUpdatingHash.current = false;
        return;
      }
      const p = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const newPage = (p.get("page") as Page) || "landing";
      setPage(newPage);
      if (p.get("service")) setSelectedService(p.get("service")!);

      const isWorkerPage = ["worker-profile", "booking", "tracking", "payment"].includes(newPage);
      const workerParam = getValidWorkerId(p.get("worker"));
      setSelectedWorker(workerParam || (isWorkerPage ? "ramesh" : null));

      if (p.get("loc")) setLocation(p.get("loc")!);
      if (p.get("q") !== null) setSearchQuery(p.get("q")!);
      if (p.get("schedule")) setScheduleMode(p.get("schedule") as any);
      if (p.get("date")) setScheduleDate(p.get("date")!);
      if (p.get("price")) setLockedPrice(Number(p.get("price")));
    };

    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, []);

  const go = (p: Page, wid?: unknown) => {
    const workerPages: Page[] = ["worker-dashboard", "worker-jobs", "worker-earnings"];
    const adminPages: Page[] = ["admin"];

    let targetPage = p;

    // Route guards
    if (adminPages.includes(p)) {
      if (!isAuthenticated) {
        targetPage = "auth";
      } else if (authRole !== "admin") {
        targetPage = authRole === "worker" ? "worker-dashboard" : "customer-home";
      }
    } else if (workerPages.includes(p)) {
      if (!isAuthenticated) {
        targetPage = "auth";
      } else if (authRole !== "worker" && authRole !== "admin") {
        targetPage = "customer-home";
      }
    }

    const isWorkerFlow = ["worker-profile", "booking", "tracking", "payment"].includes(targetPage);
    const valid = getValidWorkerId(wid);

    if (valid) {
      setSelectedWorker(valid);
    } else if (!isWorkerFlow) {
      setSelectedWorker(null);
    } else if (isWorkerFlow && !selectedWorker) {
      setSelectedWorker("ramesh");
    }

    if (typeof wid === "object" && wid !== null) {
      const payload = wid as Record<string, any>;
      if (typeof payload.service === "string") setSelectedService(payload.service);
      if (typeof payload.searchQuery === "string") setSearchQuery(payload.searchQuery);
      if (typeof payload.location === "string") setLocation(payload.location);
      if (typeof payload.price === "number") setLockedPrice(payload.price);
      if (typeof payload.schedule === "string") setScheduleMode(payload.schedule);
      if (typeof payload.date === "string") setScheduleDate(payload.date);
      if (typeof payload.address === "string") setAddress(payload.address);
      if (typeof payload.partsApproved === "boolean") setPartsApproved(payload.partsApproved);
    }

    setPage(targetPage);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF9F6]">
        <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-[#1B4332] text-white card-shadow animate-pulse">
          <HeartHandshake className="h-7 w-7" strokeWidth={2.2} />
          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#E76F51] text-[10px] font-extrabold text-white ring-2 ring-[#FAF9F6]">S</span>
        </div>
        <p className="mt-4 font-display font-black text-[20px] text-[#1A1A1A] tracking-tight">Saharaa</p>
        <p className="mt-1 text-xs font-semibold text-[#4A4A4A]">Local Skills • Fair Work • Trusted Connections</p>
      </div>
    );
  }

  const isWorkerPage = ["worker-dashboard", "worker-onboarding", "worker-jobs", "worker-earnings"].includes(page);
  const hideDemo = page === "auth";

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1A1A1A]">
      <TopNav
        page={page}
        go={go}
        lang={lang}
        setLang={setLang}
        role={role}
        location={location}
        setLocation={setLocation}
      />

      <main key={page + selectedWorker} className={isWorkerPage ? "bg-[#FAF9F6]" : ""}>
        {page === "landing" && (
          <Landing
            go={go}
            lang={lang}
            location={location}
            setLocation={setLocation}
            selectedService={selectedService}
            setSelectedService={setSelectedService}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        {page === "auth" && <Auth go={go} setRole={setRole} lang={lang} />}
        {page === "customer-home" && (
          <CustomerHome
            go={go}
            lang={lang}
            location={location}
            setLocation={setLocation}
            selectedService={selectedService}
            setSelectedService={setSelectedService}
            selectedWorker={selectedWorker || "ramesh"}
            setSelectedWorker={setWorkerId}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            scheduleMode={scheduleMode}
            setScheduleMode={setScheduleMode}
            scheduleDate={scheduleDate}
            setScheduleDate={setScheduleDate}
          />
        )}
        {page === "workers" && (
          <WorkerListing
            go={go}
            lang={lang}
            selectedService={selectedService}
            setSelectedService={setSelectedService}
            setSelectedWorker={setWorkerId}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            scheduleMode={scheduleMode}
            location={location}
          />
        )}
        {page === "worker-profile" && (
          <WorkerProfile
            go={go}
            lang={lang}
            workerId={selectedWorker || "ramesh"}
            setSelectedWorker={setWorkerId}
          />
        )}
        {page === "booking" && (
          <BookingFlow
            go={go}
            lang={lang}
            workerId={selectedWorker || "ramesh"}
            onLocked={(p) => setLockedPrice(p)}
            scheduleMode={scheduleMode}
            setScheduleMode={setScheduleMode}
            scheduleDate={scheduleDate}
            setScheduleDate={setScheduleDate}
            address={address}
            setAddress={setAddress}
          />
        )}
        {page === "tracking" && (
          <Tracking
            go={go}
            lang={lang}
            workerId={selectedWorker || "ramesh"}
            price={lockedPrice}
            partsApproved={partsApproved}
            setPartsApproved={setPartsApproved}
            scheduleMode={scheduleMode}
            scheduleDate={scheduleDate}
            address={address}
          />
        )}
        {page === "payment" && (
          <PaymentReview
            go={go}
            lang={lang}
            workerId={selectedWorker || "ramesh"}
            price={lockedPrice}
            partsApproved={partsApproved}
            scheduleMode={scheduleMode}
            scheduleDate={scheduleDate}
          />
        )}
        {page === "worker-dashboard" && <WorkerDashboard go={go} lang={lang} />}
        {page === "worker-onboarding" && <WorkerOnboarding go={go} />}
        {page === "worker-jobs" && <WorkerJobs go={go} />}
        {page === "worker-earnings" && <WorkerEarnings go={go} lang={lang} />}
        {page === "admin" && <Admin go={go} />}
        {page === "impact" && <Impact go={go} lang={lang} />}
      </main>

      {!hideDemo && <DemoBar go={go} role={role} setRole={setRole} />}
    </div>
  );
}
