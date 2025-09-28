const express = require('express');
const bcrypt = require('bcryptjs');
module.exports = function(db){
  const router = express.Router();
  router.post('/login', (req,res)=>{
    const {username,password} = req.body;
    if(!username||!password) return res.status(400).json({error:'Faltan campos'});
    db.get("SELECT * FROM users WHERE username=?", [username], (err,row)=>{
      if(err || !row) return res.status(401).json({error:'Credenciales inválidas'});
      if(!bcrypt.compareSync(password, row.password)) return res.status(401).json({error:'Credenciales inválidas'});
      res.cookie('bb_admin', username, { httpOnly: true });
      res.json({ok:true});
    });
  });
  router.use((req,res,next)=>{
    if(req.cookies && req.cookies.bb_admin) return next();
    return res.status(401).json({error:'No autorizado'});
  });
  router.get('/reservations', (req,res)=>{
    db.all("SELECT * FROM reservations ORDER BY created_at DESC LIMIT 500", (err,rows)=>{
      if(err) return res.status(500).json({error:'DB error'});
      res.json({rows});
    });
  });
  router.get('/reports/services', (req,res)=>{
    db.all("SELECT service, COUNT(*) as cnt FROM reservations GROUP BY service", (err,rows)=>{
      if(err) return res.status(500).json({error:'DB error'});
      res.json({rows});
    });
  });
  router.post('/logout', (req,res)=>{ res.clearCookie('bb_admin'); res.json({ok:true}); });
  return router;
}