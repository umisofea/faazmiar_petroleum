require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

/* --- Middleware --- */
app.use(cors({
  origin: ['http://localhost:8081', 'http://127.0.0.1:8081'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

/* --- DB --- */
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

/* --- Healthcheck --- */
app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

/* -------- NEWS -------- */
app.get('/api/news', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM news ORDER BY date DESC, id DESC');
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/news/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM news WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/news', async (req, res) => {
  try {
    const { title, category, image_url, content, date } = req.body;
    const q = `INSERT INTO news (title, category, image_url, content, date)
               VALUES ($1,$2,$3,$4,$5) RETURNING *`;
    const { rows } = await pool.query(q, [title, category, image_url, content, date]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/news/:id', async (req, res) => {
  try {
    const { title, category, image_url, content, date } = req.body;
    const q = `UPDATE news SET title=$1, category=$2, image_url=$3, content=$4, date=$5
               WHERE id=$6 RETURNING *`;
    const { rows } = await pool.query(q, [title, category, image_url, content, date, req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/news/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM news WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ----- CONTACT ----- */
app.post('/api/contact', async (req, res) => {
  try {
    const { first_name, last_name, email, phone, subject, message } = req.body;
    const q = `INSERT INTO contact_messages(first_name,last_name,email,phone,subject,message)
               VALUES($1,$2,$3,$4,$5,$6) RETURNING *`;
    const { rows } = await pool.query(q, [first_name, last_name, email, phone, subject, message]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ----- FEEDBACK ----- */
app.post('/api/feedback', async (req, res) => {
  try {
    const { name, email, rating, message } = req.body;
    const q = `INSERT INTO feedback(name,email,rating,message)
               VALUES($1,$2,$3,$4) RETURNING *`;
    const { rows } = await pool.query(q, [name, email, rating, message]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* --- Start --- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
