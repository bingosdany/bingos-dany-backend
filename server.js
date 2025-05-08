
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

let cartones = JSON.parse(fs.readFileSync('cartones.json', 'utf8'));

app.post('/enviar', upload.single('comprobante'), async (req, res) => {
  const { nombre, correo } = req.body;
  const comprobante = req.file;

  const cartonDisponible = cartones.find(c => !c.usado);

  if (!cartonDisponible) {
    return res.status(400).send('No hay cartones disponibles.');
  }

  cartonDisponible.usado = true;
  fs.writeFileSync('cartones.json', JSON.stringify(cartones, null, 2));

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'tartaraexpressalvajadas@gmail.com',
      pass: 'rwzgvsxdipsuvntg'
    }
  });

  const mailOptions = {
    from: 'Bingos Dany <tartaraexpressalvajadas@gmail.com>',
    to: correo,
    subject: '🎉 Tu cartón de Bingos Dany está listo',
    text: `¡Gracias por participar en Bingos Dany!

Adjuntamos tu cartón exclusivo para el próximo sorteo.

✅ Guárdalo y tenlo a la mano durante el juego.

¡Mucha suerte y que la alegría del bingo te acompañe! 🎊`,
    attachments: [
      {
        filename: `carton_${cartonDisponible.numero}.pdf`,
        path: `cartones/carton_${cartonDisponible.numero}.pdf`
      }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    res.send('Correo enviado con éxito');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error al enviar el correo.');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
