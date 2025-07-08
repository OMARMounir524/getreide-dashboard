const express   = require("express");
const session   = require("express-session");
const path      = require("path");
const cors      = require("cors");
const mysql     = require("mysql2");
const bcrypt    = require("bcrypt");
require("dotenv").config();

const app  = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public"), { index: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || "supergeheimer_schluessel",
  resave: false,
  saveUninitialized: false
}));

// === HIER BEGINNT DIE NEUE CACHE-CONTROL MIDDLEWARE ===
app.use((req, res, next) => {
  // Pfade, die nach Login geschützt sind:
  const protectedPaths = [
    "/", 
    "/profile", 
    "/api/data", 
    "/api/locations", 
    "/api/me"
  ];
  // gilt auch für Unterpfade (z.B. /api/data?...)
  if (protectedPaths.some(p => req.path === p || req.path.startsWith(p))) {
    res.set("Cache-Control",       "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma",              "no-cache");
    res.set("Expires",             "0");
    res.set("Surrogate-Control",   "no-store");
  }
  next();
});
// === HIER ENDET DIE NEUE CACHE-CONTROL MIDDLEWARE ===

// --- DB-Verbindung ---
const db = mysql.createConnection({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
db.connect(err => {
  if (err) {
    console.error("DB-Verbindung fehlgeschlagen:", err);
    process.exit(1);
  }
  console.log("Mit Datenbank verbunden");
});

// Auth-Checker
function checkAuth(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/login");
}

// --- Auth-Routen ---
// Login-Seite
app.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/");
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
// Login-Verarbeitung
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.redirect("/login");

  db.query(
    "SELECT * FROM users_ofj WHERE username = ?",
    [username],
    async (err, results) => {
      if (err || results.length === 0) return res.redirect("/login");
      const user = results[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.redirect("/login");
      req.session.user = username;
      res.redirect("/");
    }
  );
});

// Register-Seite
app.get("/register", (req, res) => {
  if (req.session.user) return res.redirect("/");
  res.sendFile(path.join(__dirname, "public", "register.html"));
});
// Register-Verarbeitung
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.redirect("/register");

  db.query(
    "SELECT id FROM users_ofj WHERE username = ?",
    [username],
    async (err, results) => {
      if (err || results.length) return res.redirect("/register");
      const hash = await bcrypt.hash(password, 10);
      db.query(
        "INSERT INTO users_ofj (username, password_hash) VALUES (?, ?)",
        [username, hash],
        err2 => {
          if (err2) return res.redirect("/register");
          res.redirect("/login");
        }
      );
    }
  );
});

// Logout
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// --- Geschützte Routen ---
// Dashboard
app.get("/", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
// API: Daten
app.get("/api/data", checkAuth, (req, res) => {
  const loc = req.query.location;
  let sql = "SELECT * FROM messungen_locations";
  const params = [];
  if (loc) {
    sql += " WHERE location = ?";
    params.push(loc);
  }
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: "DB-Fehler" });
    res.json(results);
  });
});
// API: Locations-Liste
app.get("/api/locations", checkAuth, (req, res) => {
  const sql = "SELECT DISTINCT location FROM messungen_locations";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: "DB-Fehler" });
    res.json(results.map(r => r.location));
  });
});
// Profil-Seite
app.get("/profile", checkAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});
// API: aktueller User
app.get("/api/me", checkAuth, (req, res) => {
  res.json({ username: req.session.user });
});

// --- Server starten ---
app.listen(PORT, () => {
  console.log(`Server läuft unter http://localhost:${PORT}`);
});
