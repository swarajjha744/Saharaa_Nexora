# Saharaa — Local Skills. Fair Work. Trusted Connections.

Saharaa connects local skilled workers with customers seeking trusted, high-quality on-demand services — emphasizing fair wages, transparent pricing, verified worker profiles, and reliable community impact.

---

## 🚀 Features

- **Customer Platform**:
  - Discover verified local service professionals (electricians, plumbers, carpenters, cleaners, etc.).
  - Search, filter by skill, rating, and location.
  - Transparent pricing and real user reviews.
  - Streamlined booking flow with tracking and secure payment review.

- **Worker Platform**:
  - Worker onboarding and profile management.
  - Interactive worker dashboard with job requests and scheduling.
  - Earnings overview and payout tracking.

- **Admin & Impact Analytics**:
  - Real-time marketplace metrics and social impact measurements.
  - Dispute resolution and verification pipeline.

- **Supabase Integration**:
  - Realtime database and authentication.
  - SQL migrations and RPC functions for booking negotiations and status handling.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, Lucide React Icons
- **Backend / Database**: Supabase (PostgreSQL, Auth, Realtime)

---

## 🏁 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/swarajjha744/Saharaa_Nexora.git
cd Saharaa_Nexora
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and configure your Supabase credentials:

```bash
cp .env.example .env.local
```

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key-here
```

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:5173/](http://localhost:5173/).

### 5. Build for Production

```bash
npm run build
```
