export type Service = {
  id: string;
  en: string;
  hi: string;
  icon: string;
  desc: string;
  basePrice: number;
  jobs: string;
};

export const services: Service[] = [
  { id: "plumbing", en: "Plumbing", hi: "प्लंबिंग", icon: "wrench", desc: "Leaks, taps, tanks & fittings", basePrice: 199, jobs: "2.4k jobs" },
  { id: "electrical", en: "Electrical", hi: "बिजली", icon: "zap", desc: "Switches, wiring & fans", basePrice: 179, jobs: "3.1k jobs" },
  { id: "cleaning", en: "Home Cleaning", hi: "सफ़ाई", icon: "sparkles", desc: "Deep & regular cleaning", basePrice: 499, jobs: "4.8k jobs" },
  { id: "painting", en: "Painting", hi: "पेंटिंग", icon: "paint", desc: "Rooms, walls & touch-ups", basePrice: 899, jobs: "1.2k jobs" },
  { id: "cooking", en: "Cooking", hi: "खाना", icon: "chef", desc: "Daily meals & events", basePrice: 349, jobs: "1.9k jobs" },
  { id: "appliance", en: "Appliance Repair", hi: "उपकरण मरम्मत", icon: "fridge", desc: "AC, fridge, washer & more", basePrice: 249, jobs: "2.7k jobs" },
  { id: "carpentry", en: "Carpentry", hi: "बढ़ई", icon: "hammer", desc: "Furniture & fittings", basePrice: 299, jobs: "1.5k jobs" },
  { id: "gardening", en: "Gardening", hi: "बागवानी", icon: "leaf", desc: "Plants, lawns & balconies", basePrice: 249, jobs: "860 jobs" },
];

export type Worker = {
  id: string;
  name: string;
  hindiName: string;
  photo: string;
  service: string;
  serviceId: string;
  skills: string[];
  price: number;
  rating?: number | null;
  jobs: number;
  distance: string;
  distanceKm: number;
  eta: string;
  trustDNA?: number | null;
  verified: boolean;
  availableNow: boolean;
  responseMins: number;
  languages: string[];
  area: string;
  about: string;
  breakdown: { label: string; value: string; done: boolean }[];
};

export const workers: Worker[] = [
  {
    id: "ramesh",
    name: "Ramesh Kumar",
    hindiName: "रमेश कुमार",
    photo: "https://images.pexels.com/photos/9271168/pexels-photo-9271168.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    service: "Plumbing",
    serviceId: "plumbing",
    skills: ["Leak repair", "Tap fitting", "Tank cleaning"],
    price: 199,
    rating: 4.8,
    jobs: 148,
    distance: "0.8 km",
    distanceKm: 0.8,
    eta: "~12 min",
    trustDNA: 92,
    verified: true,
    availableNow: true,
    responseMins: 4,
    languages: ["Hindi", "English"],
    area: "Laxmi Nagar & 3 km",
    about: "12 years fixing homes across East Delhi. I bring my own tools, clean up after work, and explain every charge before I start.",
    breakdown: [
      { label: "Aadhaar + address verified", value: "ID checked", done: true },
      { label: "148 jobs completed", value: "Experienced", done: true },
      { label: "4.8 average rating", value: "Loved by locals", done: true },
      { label: "~4 min response", value: "Fast responder", done: true },
    ],
  },
  {
    id: "sunita",
    name: "Sunita Devi",
    hindiName: "सुनीता देवी",
    photo: "https://images.pexels.com/photos/31199562/pexels-photo-31199562.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    service: "Home Cleaning",
    serviceId: "cleaning",
    skills: ["Deep cleaning", "Kitchen", "Bathroom"],
    price: 499,
    rating: 4.9,
    jobs: 214,
    distance: "1.1 km",
    distanceKm: 1.1,
    eta: "~15 min",
    trustDNA: 96,
    verified: true,
    availableNow: true,
    responseMins: 3,
    languages: ["Hindi"],
    area: "Preet Vihar & 4 km",
    about: "I treat every home like my own. Eco-friendly products, background-verified, and 200+ happy repeat families.",
    breakdown: [
      { label: "Aadhaar + police verified", value: "ID checked", done: true },
      { label: "214 jobs completed", value: "Top earner", done: true },
      { label: "4.9 average rating", value: "Exceptional", done: true },
      { label: "~3 min response", value: "Superfast", done: true },
    ],
  },
  {
    id: "arif",
    name: "Arif Khan",
    hindiName: "आरिफ़ ख़ान",
    photo: "https://images.pexels.com/photos/25851303/pexels-photo-25851303.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    service: "Electrical",
    serviceId: "electrical",
    skills: ["Wiring", "Fans & lights", "Inverters"],
    price: 179,
    rating: 4.7,
    jobs: 132,
    distance: "1.4 km",
    distanceKm: 1.4,
    eta: "~18 min",
    trustDNA: 89,
    verified: true,
    availableNow: true,
    responseMins: 6,
    languages: ["Hindi", "Urdu"],
    area: "Mayur Vihar & 5 km",
    about: "ITI-certified electrician. Safety-first work with proper insulation, testing, and 30-day service warranty.",
    breakdown: [
      { label: "Aadhaar + ITI certificate", value: "ID + skill checked", done: true },
      { label: "132 jobs completed", value: "Experienced", done: true },
      { label: "4.7 average rating", value: "Trusted", done: true },
      { label: "~6 min response", value: "Quick", done: true },
    ],
  },
  {
    id: "meena",
    name: "Meena Kumari",
    hindiName: "मीना कुमारी",
    photo: "https://images.pexels.com/photos/31031050/pexels-photo-31031050.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    service: "Cooking",
    serviceId: "cooking",
    skills: ["North Indian", "Tiffin service", "Festive meals"],
    price: 349,
    rating: 4.9,
    jobs: 187,
    distance: "0.6 km",
    distanceKm: 0.6,
    eta: "~10 min",
    trustDNA: 94,
    verified: true,
    availableNow: false,
    responseMins: 5,
    languages: ["Hindi"],
    area: "Laxmi Nagar & 2 km",
    about: "Homely, hygienic food cooked fresh. FSSAI food-safety trained. Trial meal available — pay only if you love it.",
    breakdown: [
      { label: "Aadhaar + food-safety trained", value: "ID checked", done: true },
      { label: "187 jobs completed", value: "In demand", done: true },
      { label: "4.9 average rating", value: "Exceptional", done: true },
      { label: "~5 min response", value: "Fast", done: true },
    ],
  },
  {
    id: "suresh",
    name: "Suresh Yadav",
    hindiName: "सुरेश यादव",
    photo: "https://images.pexels.com/photos/4986291/pexels-photo-4986291.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    service: "Painting",
    serviceId: "painting",
    skills: ["1BHK / 2BHK", "Waterproofing", "Touch-ups"],
    price: 899,
    rating: 4.6,
    jobs: 96,
    distance: "2.2 km",
    distanceKm: 2.2,
    eta: "~25 min",
    trustDNA: 86,
    verified: true,
    availableNow: true,
    responseMins: 9,
    languages: ["Hindi", "Bhojpuri"],
    area: "Akshardham & 6 km",
    about: "Neat lines, no drips, furniture fully covered. Free colour consultation and transparent per-sq-ft pricing.",
    breakdown: [
      { label: "Aadhaar verified", value: "ID checked", done: true },
      { label: "96 jobs completed", value: "Growing strong", done: true },
      { label: "4.6 average rating", value: "Trusted", done: true },
      { label: "~9 min response", value: "Responsive", done: false },
    ],
  },
  {
    id: "javed",
    name: "Javed Ansari",
    hindiName: "जावेद अंसारी",
    photo: "https://images.pexels.com/photos/7397453/pexels-photo-7397453.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    service: "Appliance Repair",
    serviceId: "appliance",
    skills: ["AC service", "Washing machine", "Fridge"],
    price: 249,
    rating: 4.8,
    jobs: 168,
    distance: "1.8 km",
    distanceKm: 1.8,
    eta: "~20 min",
    trustDNA: 91,
    verified: true,
    availableNow: true,
    responseMins: 4,
    languages: ["Hindi", "English"],
    area: "Nirman Vihar & 5 km",
    about: "Multi-brand expert with genuine spares and upfront estimates. 90-day warranty on every repair.",
    breakdown: [
      { label: "Aadhaar + brand training", value: "ID + skill checked", done: true },
      { label: "168 jobs completed", value: "Experienced", done: true },
      { label: "4.8 average rating", value: "Loved by locals", done: true },
      { label: "~4 min response", value: "Fast", done: true },
    ],
  },
  {
    id: "geeta",
    name: "Geeta Sharma",
    hindiName: "गीता शर्मा",
    photo: "https://images.pexels.com/photos/31251589/pexels-photo-31251589.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    service: "Home Cleaning",
    serviceId: "cleaning",
    skills: ["Sofa & carpet", "Move-in/out", "Office"],
    price: 549,
    rating: 4.7,
    jobs: 121,
    distance: "2.5 km",
    distanceKm: 2.5,
    eta: "~28 min",
    trustDNA: 88,
    verified: true,
    availableNow: false,
    responseMins: 7,
    languages: ["Hindi"],
    area: "Pandav Nagar & 4 km",
    about: "Detail-obsessed cleaner with professional machines. Before/after photos shared for every job.",
    breakdown: [
      { label: "Aadhaar verified", value: "ID checked", done: true },
      { label: "121 jobs completed", value: "Experienced", done: true },
      { label: "4.7 average rating", value: "Trusted", done: true },
      { label: "~7 min response", value: "Responsive", done: false },
    ],
  },
  {
    id: "mohan",
    name: "Mohan Singh",
    hindiName: "मोहन सिंह",
    photo: "https://images.pexels.com/photos/37589666/pexels-photo-37589666.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    service: "Carpentry",
    serviceId: "carpentry",
    skills: ["Furniture repair", "Locks & handles", "Modular kitchen"],
    price: 299,
    rating: 4.8,
    jobs: 143,
    distance: "3.0 km",
    distanceKm: 3.0,
    eta: "~32 min",
    trustDNA: 90,
    verified: true,
    availableNow: true,
    responseMins: 5,
    languages: ["Hindi", "Punjabi"],
    area: "Gandhi Nagar & 7 km",
    about: "Master carpenter, 15 years. Own workshop, precise finishing, and honest wood & material advice.",
    breakdown: [
      { label: "Aadhaar verified", value: "ID checked", done: true },
      { label: "143 jobs completed", value: "Experienced", done: true },
      { label: "4.8 average rating", value: "Loved by locals", done: true },
      { label: "~5 min response", value: "Fast", done: true },
    ],
  },
  {
    id: "harish",
    name: "Harish Rawat",
    hindiName: "हरीश रावत",
    photo: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    service: "Gardening",
    serviceId: "gardening",
    skills: ["Balcony gardens", "Pruning & repotting", "Organic manure"],
    price: 249,
    rating: 4.8,
    jobs: 112,
    distance: "1.6 km",
    distanceKm: 1.6,
    eta: "~22 min",
    trustDNA: 91,
    verified: true,
    availableNow: true,
    responseMins: 6,
    languages: ["Hindi", "Pahari"],
    area: "Mayur Vihar & 4 km",
    about: "Dedicated urban gardener with 8+ years experience. Specializes in balcony setups, natural compost and keeping household plants thriving.",
    breakdown: [
      { label: "Aadhaar + horti certified", value: "ID checked", done: true },
      { label: "112 jobs completed", value: "Experienced", done: true },
      { label: "4.8 average rating", value: "Loved by locals", done: true },
      { label: "~6 min response", value: "Fast", done: true },
    ],
  },
];

export type ServiceJobConfig = {
  title: string;
  defaultDesc: string;
  workerGreeting: string;
  workerCounterReason: string;
  photos: string[];
};

export const serviceJobConfigs: Record<string, ServiceJobConfig> = {
  plumbing: {
    title: "Kitchen tap leak repair",
    defaultDesc: "Kitchen tap leaking continuously, needs washer replacement and pipe fitting check.",
    workerGreeting: "Namaste! Seen your photos — tap washer + visit inspection. I can come in 20 mins.",
    workerCounterReason: "Slightly low for parts + visit. I can do ₹{counter} with 30-day warranty?",
    photos: [
      "https://images.pexels.com/photos/19140578/pexels-photo-19140578.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/29226620/pexels-photo-29226620.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
  },
  electrical: {
    title: "Fan & switchboard repair",
    defaultDesc: "Ceiling fan making squeaking noise and living room main switch sparking when turned on.",
    workerGreeting: "Namaste! I checked your issue. I'll bring the multimeter, capacitor and safety tools.",
    workerCounterReason: "For thorough wiring inspection and capacitor replacement, I can do ₹{counter} with 30-day warranty?",
    photos: [
      "https://images.pexels.com/photos/7647233/pexels-photo-7647233.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/25851303/pexels-photo-25851303.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    ],
  },
  cleaning: {
    title: "Deep home cleaning",
    defaultDesc: "Deep cleaning for 2BHK including kitchen oil grease removal and bathroom sanitization.",
    workerGreeting: "Namaste! I bring professional eco-friendly cleaning solutions and scrubbers. Ready to start.",
    workerCounterReason: "Deep sanitization takes 3 hours with specialized supplies. I can do ₹{counter}?",
    photos: [
      "https://images.pexels.com/photos/31199562/pexels-photo-31199562.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/31251589/pexels-photo-31251589.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
  },
  painting: {
    title: "Wall touch-up & painting",
    defaultDesc: "Waterproofing touch-up and double-coat paint for master bedroom and balcony wall.",
    workerGreeting: "Namaste! I will cover your furniture carefully before starting and apply primer + double coat.",
    workerCounterReason: "With surface scraping, primer and premium emulsion, ₹{counter} is the fairest rate.",
    photos: [
      "https://images.pexels.com/photos/4986291/pexels-photo-4986291.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      "https://images.pexels.com/photos/8819155/pexels-photo-8819155.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
  },
  cooking: {
    title: "Daily meal preparation",
    defaultDesc: "Fresh North Indian lunch and dinner preparation for 4 persons (dal, seasonal sabzi, rotis, rice).",
    workerGreeting: "Namaste! I'll cook hygienic, homely food according to your family's spice preference.",
    workerCounterReason: "For preparing both lunch and dinner with kitchen cleanup, ₹{counter} is fair.",
    photos: [
      "https://images.pexels.com/photos/31031050/pexels-photo-31031050.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/8819146/pexels-photo-8819146.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
  },
  appliance: {
    title: "AC servicing & cooling fix",
    defaultDesc: "Split AC cooling slowly and water dripping slightly from indoor drain pipe.",
    workerGreeting: "Namaste! I'll clean the indoor filters, check the cooling coil and verify gas pressure.",
    workerCounterReason: "For coil cleaning, drain unclogging and 90-day warranty, I can offer ₹{counter}?",
    photos: [
      "https://images.pexels.com/photos/7397453/pexels-photo-7397453.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      "https://images.pexels.com/photos/7647233/pexels-photo-7647233.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
  },
  carpentry: {
    title: "Door lock & cabinet hinge repair",
    defaultDesc: "Main wooden door lock getting stuck and 2 kitchen cabinet hinges loose and misaligned.",
    workerGreeting: "Namaste! I have heavy-duty screws and mortise lock lubricant ready. Will fix both in 45 mins.",
    workerCounterReason: "For replacing the worn hinges and servicing the main lock, ₹{counter} works for me.",
    photos: [
      "https://images.pexels.com/photos/37589666/pexels-photo-37589666.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      "https://images.pexels.com/photos/9271168/pexels-photo-9271168.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    ],
  },
  gardening: {
    title: "Balcony plant pruning & repotting",
    defaultDesc: "Balcony garden pruning, repotting 4 overgrown plants, adding vermicompost and pest spray.",
    workerGreeting: "Namaste! I carry fresh organic manure, trimming shears, and plant nutrient spray.",
    workerCounterReason: "For pruning 12 pots, repotting and organic nourishment, I can do ₹{counter}?",
    photos: [
      "https://images.pexels.com/photos/8819155/pexels-photo-8819155.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
      "https://images.pexels.com/photos/31199562/pexels-photo-31199562.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=627&w=1200",
    ],
  },
};

export const reviews = [
  { name: "Priya S.", area: "Laxmi Nagar", text: "Ramesh fixed our kitchen leak in 40 minutes. Explained the price before starting — no surprise charges. So refreshing!", rating: 5, service: "Plumbing", time: "2 days ago" },
  { name: "Amit Verma", area: "Preet Vihar", text: "Sunita ji deep-cleaned our 2BHK before Diwali. She even cleaned behind the fridge without being asked.", rating: 5, service: "Cleaning", time: "1 week ago" },
  { name: "Kavita R.", area: "Mayur Vihar", text: "Fair negotiation — I countered once and we agreed in minutes. The electrician came with safety gear and tested everything twice.", rating: 5, service: "Electrical", time: "2 weeks ago" },
];

export const impactStats = [
  { value: "12,400+", label: "Jobs completed", hi: "पूरे किए गए काम" },
  { value: "2,150", label: "Workers earning", hi: "कमाने वाले कारीगर" },
  { value: "₹86L+", label: "Earnings generated", hi: "कुल कमाई" },
  { value: "8,900", label: "Households helped", hi: "मदद पाए परिवार" },
];

export type OfferMsg = {
  id: number;
  from: "customer" | "worker" | "system";
  text: string;
  price?: number;
  time: string;
};
