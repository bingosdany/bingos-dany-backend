const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Bingos Dany activo');
});

// Ruta principal para recibir formulario
app.post('/upload', upload.single('archivo'), async (req, res) => {
  const { nombre, correo, cantidad } = req.body;
  const archivo = req.file;

  console.log('--- NUEVO ENVÍO ---');
  console.log('Nombre:', nombre);
  console.log('Correo:', correo);
  console.log('Cantidad de cartones:', cantidad);
  console.log('Archivo recibido:', archivo ? archivo.originalname : 'Ninguno');

  if (!nombre || !correo || !archivo || !cantidad) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  // Generar cartones
  const pdfPath = `cartones/cartones_${Date.now()}.pdf`;
  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  for (let i = 1; i <= parseInt(cantidad); i++) {
    doc.image('public/carton_fondo.png', 0, 0, { width: 595.28, height: 841.89 });
    doc.fontSize(20).fillColor('black').text(`Cartón ${i}`, 480, 20);
    if (i < cantidad) doc.addPage();
  }

  doc.end();

  stream.on('finish', () => {
    // Configurar nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'bingosdanyoficial@gmail.com',
        pass: 'pxvhbnxtjqfysksa' // Contraseña de aplicación
      }
    });

    const mailOptions = {
      from: 'Bingos Dany <bingosdanyoficial@gmail.com>',
      to: correo,
      subject: 'Tus cartones de Bingo',
      text: `Hola ${nombre}, adjunto encontrarás tus ${cantidad} cartones para el Bingo.`,
      attachments: [
        {
          filename: 'cartones_bingo.pdf',
          path: pdfPath
        }
      ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar correo:', error);
        return res.status(500).json({ error: 'Error al enviar el correo' });
      } else {
        console.log('Correo enviado:', info.response);
        res.json({ mensaje: 'Formulario enviado con éxito' });
      }
    });
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
