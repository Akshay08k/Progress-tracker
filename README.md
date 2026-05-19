# 🧵 Progress Tracker

A modern productivity app to plan tasks, track momentum, and stay consistent with a gamified workflow.

---

## ✨ Highlights

- 🔐 **Authentication** with Firebase (email/password + Google)
- ✅ **Task Management** with list + Kanban board views
- 🏆 **Gamified Progress** (XP, levels, streak-focused flow)
- 🤝 **Streak Buddy** invites and pairing
- 📅 **Calendar + Challenge** based productivity pages
- 🤖 **AI Copilot** screen for assisted workflows
- 📣 **Admin Panel** for user controls, announcements, and stats
- 🔔 **Real-time Notifications** with live updates
- ⏱️ **Focus Timer** and 😊 **Mood Log** utilities
- 📤 **Export Support** (Excel/PDF)

---

## 🧱 Tech Stack

### Frontend (`/frontend`)
- React + TypeScript + Vite
- Redux Toolkit + Redux Persist
- Tailwind CSS
- Firebase Web SDK

### Backend (`/backend`)
- Next.js (App Router + API routes)
- Firebase Admin SDK
- Nodemailer

---

## 📂 Project Structure

```text
Progress-tracker/
├── frontend/   # React client app
└── backend/    # Next.js APIs + admin logic
```

---

## ⚙️ Environment Variables

### Frontend (`frontend/.env`)

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
VITE_BACKEND_URL=http://localhost:3000
```

### Backend (`backend/.env.local`)

```env
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

> Note: Keep `FIREBASE_PRIVATE_KEY` escaped correctly if stored on one line (with `\\n` line breaks).

---

## 🚀 Run Locally

### 1) Install dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
```

### 2) Start backend

```bash
cd backend
npm run dev
```

### 3) Start frontend (new terminal)

```bash
cd frontend
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend/API: `http://localhost:3000`

---

## 🛠️ Useful Scripts

### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

### Backend

```bash
npm run dev
npm run build
npm run lint
npm run start
```

---

## 📌 Notes

- Backend `npm run lint` may prompt for initial Next.js ESLint setup in a fresh environment.
- Frontend build currently emits a large bundle-size warning (build still succeeds).

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Open a pull request

---

Built with ❤️ to make daily progress visible and motivating.
