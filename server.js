const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static("public"));

// Create database connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Check connection
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.stack);
    return;
  }
  console.log("Connected to database");
});

// API endpoint to get data
app.get("/api/data", (req, res) => {
  const query = "SELECT * FROM messungen_neu";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error querying database:", err);
      res.status(500).send("Error querying database");
      return;
    }
    res.json(results);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.get("/api/data", (req, res) => {
  const query = "SELECT * FROM messungen_neu";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Detailed SQL Error:", err); // <--- New detailed log
      res.status(500).send("Error querying database");
      return;
    }
    res.json(results);
  });
});

