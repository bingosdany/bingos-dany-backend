const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Generador de cartón de bingo
function generarCartonBingo() {
  const columnas = {
    B: Array.from({ length: 15 }, (_, i) => i + 1),
    I: Array.from({ length: 15 }, (_, i) => i + 16),
    N: Array.from({ length: 15 }, (_, i) => i + 31),
    G: Array.from({ length: 15 }, (_, i) => i + 46),
    O: Array.from({ length: 15 }, (_, i) => i + 61)
  };

  const carton = [];
  for (let letra in columnas) {
    const nums = columnas[letra].sort(() => 0.5 - Math.random()).slice(0, 5);
    carton.push(nums);
  }
  carton[2][2] = 'X'; // Espacio libre
  return carton;
}

// Generar PDF con los cartones
function crearPDF(cartones, rutaSalida) {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(rutaSalida));

  cartones.forEach((carton, index) => {
    doc.addPage().fontSize(16).text(`Cartón ${index + 1}`, { align: 'center' });
    const letras = ['B', 'I', 'N', 'G', 'O'];
    letras.forEach((letra, i) => {
      doc.text(letra, 100 + i * 70, 100);
    });

    for (let fila = 0; fila < 5; fila++) {
      for (let col = 0; col < 5; col++) {
        doc.text(
          String(carton[col][fila]),
          100 + col * 70,
          130 + fila * 30
        );
      }
    }
  });

  doc.end();
}

// Configurar envío de correo
function enviarCartonesPorCorreo(destinatario, rutaAdjunto) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'bingosdanyoficial@gmail.com',
      pass: 'bymbkjgdcscbfutp'
    }
  });

  const mailOptions = {
    from: '"Bingos Dany" <bingosdanyoficial@gmail.com>',
    to: destinatario,
    subject: '¡Tus cartones de Bingos Dany!',
    text: 'Gracias por tu compra. Aquí tienes tus cartones de bingo en PDF.',
    attachments: [
      {
        filename: 'cartones.pdf',
        path: rutaAdjunto
      }
    ]
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error('Error al enviar:', error);
    }
    console.log('Correo enviado:', info.response);
  });
}

// Ruta principal
app.post('/upload', upload.single('archivo'), (req, res) => {
  const { nombre, correo, cantidad } = req.body;
  const archivo = req.file;

  if (!nombre || !correo || !archivo || !cantidad) {
    return res.status(400).json({ error: 'Faltan datos del formulario' });
  }

  console.log('--- NUEVO ENVÍO ---');
  console.log('Nombre:', nombre);
  console.log('Correo:', correo);
  console.log('Cantidad de cartones:', cantidad);
  console.log('Archivo recibido:', archivo.originalname);

  const total = parseInt(cantidad);
  const cartones = Array.from({ length: total }, () => generarCartonBingo());

  const rutaPDF = path.join(__dirname, 'cartones', 'cartones.pdf');
  crearPDF(cartones, rutaPDF);
  enviarCartonesPorCorreo(correo, rutaPDF);

  res.json({ mensaje: 'Formulario recibido y cartones enviados al correo' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
