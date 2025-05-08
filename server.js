
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Configuración de multer para manejar archivos subidos
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

// Crear carpeta de uploads si no existe
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Cargar lista de cartones
let cartones = JSON.parse(fs.readFileSync('cartones.json', 'utf8'));

// Ruta para manejar envíos
app.post('/enviar', upload.single('comprobante'), async (req, res) => {
  const { nombre, correo } = req.body;
  const comprobante = req.file;

  // Buscar un cartón no usado
  const cartonDisponible = cartones.find(c => !c.usado);

  if (!cartonDisponible) {
    return res.status(400).send('No hay cartones disponibles.');
  }

  // Marcar como usado
  cartonDisponible.usado = true;
  fs.writeFileSync('cartones.json', JSON.stringify(cartones, null, 2));

  // Enviar correo con cartón
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
