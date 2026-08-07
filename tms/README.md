# Tuition Management System

A full-stack tuition/coaching-class management app.

- **Frontend:** React + Vite + Tailwind CSS, Chart.js, jsPDF, SheetJS (xlsx), lucide-react
- **Backend:** Node.js + Express, JWT auth, bcrypt, Multer (photo uploads)
- **Database:** MySQL

Modules: Dashboard analytics, Students, Fees (with a month-by-month matrix and printable
receipts), Attendance, Expenses, Reports (daily/monthly/yearly/student/pending/search),
and Settings.

---

## 1. Prerequisites

- Node.js 18+
- A running MySQL server (local install, XAMPP/WAMP, or Docker)

## 2. Database setup

```bash
mysql -u root -p < server/db/schema.sql
```

This creates the `tuition_db` database and all tables.

## 3. Backend setup

```bash
cd server
cp .env.example .env
# edit .env with your MySQL credentials and a JWT secret
npm install
npm run seed     # creates the default admin user (admin / admin123)
npm run dev       # starts the API on http://localhost:5000
```

## 4. Frontend setup

Open a second terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev       # starts the app on http://localhost:5173
```

Open **http://localhost:5173** and log in with `admin` / `admin123`. Change this
password immediately from Settings → Change Password.

## 5. Building for production

```bash
cd client
npm run build      # outputs static files to client/dist
```

Serve `client/dist` with any static host (Nginx, Vercel, Netlify, etc.) and deploy the
`server/` folder to any Node host (Railway, Render, a VPS, etc.), pointing
`VITE_API_URL` in the client's `.env` at your deployed API URL, and `CLIENT_ORIGIN` in
the server's `.env` at your deployed frontend URL.

## Project structure

```
tuition-management-system/
├── server/
│   ├── config/db.js         MySQL connection pool
│   ├── db/schema.sql        Table definitions
│   ├── db/seed.js           Creates the default admin user
│   ├── middleware/auth.js   JWT verification
│   ├── middleware/upload.js Multer photo upload config
│   ├── routes/              One file per resource (students, payments, ...)
│   ├── uploads/              Uploaded student photos & logo (served at /uploads)
│   └── server.js            Express app entry point
│
└── client/
    └── src/
        ├── components/       Shared UI (Sidebar, Receipt, form primitives)
        ├── context/          AuthContext (JWT session)
        ├── pages/            One page per module
        ├── services/api.js   Axios instance with auth interceptor
        └── utils/            Formatting helpers, Chart.js setup
```

## Notes

- Receipt numbers are generated server-side as `{year}{sequence}`, e.g. `2026001`.
- The Fees page's matrix (student × month) mirrors the spreadsheet layout you're
  replacing — click any empty cell to record that month's payment, or a filled cell to
  reopen its receipt.
- Receipts can be printed, downloaded as a PDF (via jsPDF), or shared straight to
  WhatsApp using the student's mobile number.
- One payment per student per month is enforced at the database level
  (`uniq_student_month_year`), so double-entry isn't possible.
