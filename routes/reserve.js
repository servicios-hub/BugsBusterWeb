const express = require('express');
const nodemailer = require('nodemailer');
module.exports = function(db){
  const router = express.Router();
  router.post('/reserve', (req,res)=>{
    const {name,email,service,date} = req.body;
    if(!name||!email||!service||!date) return res.status(400).json({error:'Faltan campos'});
    db.run(`INSERT INTO reservations (name,email,service,date) VALUES (?,?,?,?)`, [name,email,service,date], function(err){
      if(err) return res.status(500).json({error:'DB error'});
      (async()=>{
        try{
          const host = process.env.SMTP_HOST, port = process.env.SMTP_PORT, user = process.env.SMTP_USER, pass = process.env.SMTP_PASS, admin = process.env.ADMIN_EMAIL;
          if(host && port && user && pass && admin){
            const transporter = nodemailer.createTransport({ host, port: Number(port), secure: Number(port)===465, auth:{user,pass} });
            const info = await transporter.sendMail({
              from: process.env.FROM_EMAIL || user,
              to: email,
              cc: admin,
              subject: 'Confirmación de reserva - Bugs Buster',
              html: `<p>Hola ${name},</p><p>Reserva confirmada: <b>${service}</b> - ${date}</p>`
            });
            console.log('Email sent', info.messageId);
          } else {
            console.log('SMTP no configurado - skip email');
          }
        }catch(e){ console.error('Mail error',e) }
      })();
      res.json({ok:true,id:this.lastID});
    });
  });
  return router;
}