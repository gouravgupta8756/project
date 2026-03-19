# ✦ PixelLift — AI Photo Enhancer & Background Remover

A full-stack web app that uses AI to enhance photos and remove backgrounds.
Built with HTML/CSS/JS (frontend) and Node.js + Express (backend).

---

## 📁 Project Structure

```
ai-photo-enhancer/
├── frontend/
│   ├── index.html      ← Main page (all sections)
│   ├── style.css       ← Dark editorial design, responsive
│   └── app.js          ← All UI logic, drag-drop, slider, API calls
│
├── backend/
│   ├── server.js       ← Express app entry point
│   ├── package.json    ← Dependencies
│   ├── .env.example    ← Environment variable template
│   ├── middleware/
│   │   └── upload.js   ← Multer file upload validation
│   ├── routes/
│   │   ├── enhance.js  ← Image enhancement (sharp, free)
│   │   └── removeBg.js ← Background removal (remove.bg API)
│   └── utils/
│       └── watermark.js ← SVG watermark overlay
│
├── vercel.json         ← Vercel frontend deployment config
├── render.yaml         ← Render.com backend deployment config
├── .gitignore
└── README.md
```

---

## 🚀 Running Locally (Step-by-Step)

### Prerequisites
- Node.js 18+ installed → https://nodejs.org
- A code editor (VS Code recommended)
- A free remove.bg API key (for background removal)

---

### Step 1 — Clone / Download the project

```bash
# If using git:
git clone https://github.com/yourusername/pixellift.git
cd pixellift

# Or just unzip the downloaded folder and navigate to it
```

---

### Step 2 — Set up the Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

Now open `backend/.env` in your editor and fill in:

```env
PORT=3001
FRONTEND_URL=http://localhost:5500
REMOVE_BG_API_KEY=your_actual_key_here   ← Get free at remove.bg
ADD_WATERMARK=true
```

**Getting a free remove.bg API key:**
1. Go to https://www.remove.bg/api
2. Click "Get API Key Free"
3. Sign up (free tier = 50 HD removals/month)
4. Copy your API key into `.env`

---

### Step 3 — Start the Backend

```bash
# Make sure you're in the backend/ folder
npm start
# or for auto-reload during development:
npm run dev

# You should see:
# ✦ PixelLift backend running on http://localhost:3001
```

Verify it works: open http://localhost:3001/api/health in your browser.
You should see: `{"status":"ok"}`

---

### Step 4 — Open the Frontend

Option A — VS Code Live Server (recommended):
1. Open the `frontend/` folder in VS Code
2. Install the "Live Server" extension
3. Right-click `index.html` → "Open with Live Server"
4. Opens at http://127.0.0.1:5500

Option B — Simple file open:
- Just open `frontend/index.html` directly in your browser
- Note: change `API_BASE` in `app.js` to match your backend port

Option C — Python server:
```bash
cd frontend
python3 -m http.server 5500
# Open http://localhost:5500
```

---

### Step 5 — Test the App

1. Open the frontend URL
2. Enter any email address (no password needed)
3. Upload a JPG or PNG image (drag & drop or click)
4. Click **"Enhance Image"** → processed result + before/after slider
5. Click **"Remove Background"** → requires your remove.bg API key
6. Click **"Download Result"** to save the image

---

## 🌐 Deploying to Production

### Frontend → Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# From project root:
vercel

# Follow prompts:
# - Set root to: frontend
# - Build command: (leave blank)
# - Output directory: .
```

Or connect your GitHub repo at https://vercel.com/new — it auto-detects `vercel.json`.

**After deploying, copy your Vercel URL** (e.g. `https://pixellift.vercel.app`)

---

### Backend → Render.com

1. Push your project to GitHub
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Configure:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
   - **Instance type:** Free
5. Add environment variables in the Render dashboard:
   - `REMOVE_BG_API_KEY` = your key
   - `FRONTEND_URL` = your Vercel URL
   - `ADD_WATERMARK` = true
   - `PORT` = 3001
6. Click **Deploy**

**After deploying, copy your Render URL** (e.g. `https://pixellift-backend.onrender.com`)

---

### Connect Frontend to Backend

Once backend is deployed, update `frontend/app.js`:

```js
// Change this line:
const API_BASE = 'http://localhost:3001';
// To your Render URL:
const API_BASE = 'https://pixellift-backend.onrender.com';
```

Then redeploy the frontend to Vercel.

---

## 🔧 Customization

### Change free usage limit
In `frontend/app.js`, change:
```js
const MAX_FREE = 3; // ← change to any number
```

### Disable watermark
In `backend/.env`:
```env
ADD_WATERMARK=false
```

### Use ClipDrop instead of remove.bg
Sign up at https://clipdrop.co/apis (free tier available)
Then modify `backend/routes/removeBg.js` to call the ClipDrop endpoint.

### Add real AI upscaling
Sign up at https://replicate.com (free credits)
Modify `backend/routes/enhance.js` to call the ESRGAN model via Replicate API.

---

## 📦 Dependencies

### Backend
| Package | Purpose |
|---------|---------|
| express | HTTP server framework |
| multer | File upload handling |
| sharp | Image processing (enhance) |
| axios | HTTP client for API calls |
| form-data | Multipart form for remove.bg |
| cors | Cross-origin request headers |
| express-rate-limit | Prevent API abuse |
| dotenv | Load .env variables |

### Frontend
Pure HTML/CSS/JS — no build step needed!

---

## 🆓 Free Tier Limits

| Service | Free Limit |
|---------|-----------|
| remove.bg API | 50 HD calls/month |
| sharp (enhance) | Unlimited (local) |
| Vercel hosting | 100GB bandwidth/month |
| Render hosting | 750 hours/month |

---

## 📞 Support

If you run into issues:
1. Check the backend console for error messages
2. Check browser DevTools → Console + Network tab
3. Verify your `.env` file has the correct values
4. Make sure the backend is running before using the frontend
