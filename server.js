require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const sqlite3 = require('sqlite3').verbose();
const DB_DIR = path.join(__dirname,'data');
const DB_FILE = path.join(DB_DIR,'db.sqlite');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);
let db;
try { db = new sqlite3.Database(DB_FILE); } catch(e){ db = new sqlite3.Database(':memory:'); }
db.serialize(()=>{
  db.run(`CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,email TEXT,service TEXT,date TEXT,created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);
  const bcrypt = require('bcryptjs');
  db.get("SELECT count(*) as c FROM users", (err,row)=>{
    if(!err && row && row.c===0){
      const hash = bcrypt.hashSync('admin123',10);
      db.run("INSERT INTO users (username,password) VALUES (?,?)", ['admin', hash]);
    }
  });
});

const reserve = require('./routes/reserve');
const admin = require('./routes/admin');
app.use('/', reserve(db));
app.use('/admin', admin(db));

app.get('/', (req,res)=>{ res.sendFile(path.join(__dirname,'public','index.html')); });

module.exports = app;
