# Clean Loop (ക്ലീൻ ലൂപ്പ്)
> **Tagline:** *"Segregate. Collect. Recycle. Repeat."*

A smart municipal waste management and doorstep scrap collection web application tailored specifically for **Kochi city, Kerala, India**. 

Clean Loop empowers Kochi residents to segregate domestic refuse into color-coded bins, schedule morning and evening collections, request certified doorstep scrap weighing with calibrated digital scales and instant UPI wallet cashouts, explore indicative Kochi Municipal Corporation (KMC) rules and fines with an AI plain-language assistant, report civic illegal dumping blackspots, track personal CO2 reduction metrics, and classify items using Google Gemini Multimodal Vision AI.

---

## 🌟 Key Features

1. **Kerala-Inspired Modern Design:**
   - Deep coconut-palm green (`#1F5D3A`), fresh leaf green accents, Kerala Kasavu gold (`#D4A017`), warm cream backgrounds (`#FAF5E9`), and dark forest mode.
   - Original vector logo depicting a looping arrow transforming into a Kasavu leaf.
   - Glassmorphism cards, glowing buttons, and smooth responsive layouts.
2. **Bilingual i18n (English & മലയാളം):**
   - Seamless language toggle persisted in browser local storage.
   - Dual-language database storage for categories, disposal guides, Kerala waste facts, tips, and rules.
3. **Phone Number + OTP Authentication (Twilio Verify & Dev Mode):**
   - 10-digit Indian mobile numbers (`+91XXXXXXXXXX`).
   - 6-box auto-focusing OTP input with paste support and countdown timer.
   - SimpleJWT access and refresh tokens with refresh token blacklisting on signout.
   - `OTP_DEV_MODE=True` for seamless local testing without consuming Twilio SMS units (fixed code: `123456`).
4. **Waste Collection Booking & Subscriptions:**
   - One-time doorstep pickups and Daily/Monthly/Yearly automated collection subscriptions.
   - Zone-level capacity slots that automatically mark as full when quota is reached.
   - Calendar generation of upcoming scheduled pickups.
5. **Certified Scrap Collection & Wallet Payouts:**
   - Live wholesale Kochi scrap rate card (copper, brass, aluminium, batteries, motherboards, cardboard, etc.).
   - Doorstep digital weighing by certified scrap agents.
   - Locked historical rates and instant credit to the in-app wallet.
   - UPI / Bank withdrawal request simulation.
6. **Razorpay Payments (Test Mode):**
   - Subscription orders and pickup fees integrated with Razorpay Checkout.
   - Backend order creation and cryptographic signature verification.
   - Option to pay 100% or partially using in-app wallet scrap earnings.
7. **Google Gemini Multimodal AI Features:**
   - **Waste Assistant Chatbot:** Grounded in Kochi rules and local collection procedures.
   - **Photo Waste Classifier:** Upload a photo of any item to get structured JSON analysis: name, bin color, recyclable status, scrap eligibility, and disposal steps.
   - **Smart Scrap Estimator:** Plain-language scrap estimation multiplied by live rate card.
   - **Rules & Fines Q&A:** Plain-language questions answered strictly against KMC bye-laws.
8. **Civic Grievances & Green Credits Rewards:**
   - Report illegal dumping, waste burning, or canal dumping with photo proof and GPS map pins.
   - Earn Green Credits for well-segregated waste and resolved civic complaints.
   - Badges (Seedling, Sapling, Grand Banyan) and credit redemption for wallet cash.
9. **Interactive Leaflet Maps & Geolocation:**
   - Draggable pins with OpenStreetMap tiles and reverse geocoding via Nominatim.
   - Interactive coverage map of Kochi zones (Kakkanad, Fort Kochi, Marine Drive, Edappally, etc.).
10. **Comprehensive Admin Dashboard:**
    - Real-time operational overview, today's pickups map view, scrap weighing management, staff assignments, and CSV exports.

---

## 🛠️ Tech Stack

- **Backend:** Python 3.14, Django 5.x / 6.x, Django REST Framework, SQLite
- **Auth:** Twilio Verify SDK, `djangorestframework-simplejwt` with token blacklist
- **Frontend:** React 19, Vite 6, Tailwind CSS, Framer Motion, Axios, React Router 7
- **i18n:** `react-i18next` with English and Malayalam locales
- **Maps:** Leaflet & `react-leaflet` with OpenStreetMap & Nominatim reverse geocoding
- **Payments:** Razorpay Test Mode with backend HMAC SHA256 signature verification
- **AI:** Google Gemini API (`google-genai` SDK) with configurable vision models and offline fallbacks
- **Documentation:** `drf-spectacular` OpenAPI / Swagger UI

---

## 🚀 Local Installation and Setup

### 1. Prerequisites
- **Python 3.10+** (verified on Python 3.14)
- **Node.js LTS** (Node v20+ / v24+ and npm)

### 2. Backend Setup

```powershell
# Navigate to backend directory
cd backend

# Install Python dependencies
python -m pip install django djangorestframework djangorestframework-simplejwt django-cors-headers python-decouple twilio google-genai razorpay pillow reportlab requests drf-spectacular

# Create .env from template
copy .env.example .env

# Run database migrations
python manage.py migrate

# Seed complete demo data (zones, facts, tips, rules, scrap rates, admin, demo customer)
python manage.py seed_cleanloop_data

# Run backend development server
python manage.py runserver 127.0.0.1:8000
```
Backend API will be live at `http://127.0.0.1:8000/api/`  
Swagger API Docs: `http://127.0.0.1:8000/api/docs/`  
Django Admin backup: `http://127.0.0.1:8000/admin/`

---

### 3. Frontend Setup

```powershell
# In a new terminal, navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
Frontend will be running at `http://localhost:5173/`

---

## 🔑 Pre-Seeded Demo Credentials

In local dev mode (`OTP_DEV_MODE=True`), any mobile number receives the fixed code `123456`. Fast-fill buttons are also provided on the sign-in screen.

| Role | Phone Number | OTP Code | Description |
|---|---|---|---|
| **Municipal Admin** | `+919846012345` | `123456` | Access to custom React Admin Dashboard (`/admin/dashboard`) |
| **Demo Resident** | `+919846098765` | `123456` | Customer account with pre-seeded wallet balance and subscriptions |

---

## ⚙️ Environment Variables (`.env`)

| Variable | Default Value | Description |
|---|---|---|
| `SECRET_KEY` | django-insecure-cleanloop... | Django cryptographic secret |
| `DEBUG` | `True` | Django debug mode |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Permitted server hostnames |
| `OTP_DEV_MODE` | `True` | Set `True` to accept `123456` without Twilio SMS |
| `TWILIO_ACCOUNT_SID` | `AC_...` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | `...` | Twilio Auth Token |
| `TWILIO_VERIFY_SERVICE_SID`| `VA_...` | Twilio Verify Service SID |
| `RAZORPAY_KEY_ID` | `rzp_test_...` | Razorpay Key ID in Test Mode |
| `RAZORPAY_KEY_SECRET` | `...` | Razorpay Key Secret in Test Mode |
| `GEMINI_API_KEY` | `...` | Google Gemini API Key |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini Multimodal Model name |
| `AI_ENABLED` | `True` | Toggle server-side AI processing |
| `ADMIN_PHONE` | `+919846012345` | Auto-promoted admin user phone |
| `DEMO_CUSTOMER_PHONE`| `+919846098765` | Seed demo customer phone |

---

## 🧪 Running Automated Tests

Run backend core flow tests (OTP login, booking capacity, scrap payout calculation, subscription generation):
```powershell
cd backend
python manage.py test cleanloop_core
```

---

## 📋 Assumptions & Indicative Legal Notice

1. **Statutory Information:** The Rules & Fines table contains realistic samples based on Kochi Municipal Corporation (KMC) bye-laws and Kerala LSGD orders. Entries are marked with a verification notice reminding users to confirm with local authorities.
2. **Offline AI Mode:** When `GEMINI_API_KEY` is not provided or set to dummy in `.env`, the system gracefully switches to offline Kerala-grounded fallback responses without crashing.
3. **Razorpay Payments:** Tested in Sandbox/Test Mode. If Razorpay client credentials are dummy, the system automatically simulates successful order and signature verification.
