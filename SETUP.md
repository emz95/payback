# Setup guide (for a new computer)

Use this when you clone the project on a new machine (e.g. your friend’s computer).

## What you need

- **Mac:** Xcode (for iOS Simulator), or just your phone + Expo Go  
- **Node.js** (for the app)  
- **Python 3** (for the backend)

---

## 1. Clone the repo

```bash
git clone <repo-url>
cd payback
```

---

## 2. Backend (API)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate   # Mac/Linux
# On Windows: venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0
```

Leave this running. The API will be at `http://localhost:8000`.  
To test: open http://localhost:8000 in a browser — you should see `{"message":"API is running 🚀"}`.

---

## 3. Get your computer’s IP (for the phone)

The app on your **phone** needs this to talk to the backend.

- **Mac:** In Terminal run `ipconfig getifaddr en0` — use that IP (e.g. `192.168.1.5`).
- **Windows:** Run `ipconfig` and use the IPv4 address for your Wi‑Fi adapter.

---

## 4. Mobile app (Expo)

Open a **new terminal** (keep the backend running in the first one).

```bash
cd mobile
cp .env.example .env
```

Edit `mobile/.env` and set your IP:

```
EXPO_PUBLIC_API_URL=http://YOUR_IP:8000
```

Example: if your IP is `192.168.1.5`:

```
EXPO_PUBLIC_API_URL=http://192.168.1.5:8000
```

Then:

```bash
npm install
npx expo start
```

- Press **w** to open the app in the browser, or  
- Scan the QR code / enter the URL in **Expo Go** on your phone (phone and computer must be on the **same Wi‑Fi**).

---

## 5. If the app on your phone says “Backend not reachable”

- Backend must be running with `--host 0.0.0.0` (see step 2).
- Phone and computer on the **same Wi‑Fi**.
- The IP in `.env` must be your computer’s current IP (check again with `ipconfig getifaddr en0` or `ipconfig`).
- Try turning off your computer’s firewall temporarily to test.

---

## Quick reference

| Terminal 1 (backend)     | Terminal 2 (app)     |
|---------------------------|----------------------|
| `cd backend`              | `cd mobile`          |
| `source venv/bin/activate`| `cp .env.example .env` |
| `uvicorn main:app --reload --host 0.0.0.0` | Edit `.env` with your IP |
|                           | `npm install`        |
|                           | `npx expo start`     |
