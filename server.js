const path = require('path');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.static('public'));

const storage = multer.memoryStorage();
const upload = multer({ storage });

function generarNumerosUnicos(min, max, cantidad) {
  const numeros = new Set();
  while (numeros.size < cantidad) {
    const numero = Math.floor(Math.random() * (max - min + 1)) + min;
    numeros.add(numero);
  }
  return Array.from(numeros);
}

function generarCartonesPDF(cantidad, rutaSalida) {
  const doc = new PDFDocument({ size: 'A4' });
  const stream = fs.createWriteStream(rutaSalida);
  doc.pipe(stream);

  for (let i = 0; i < cantidad; i++) {
    doc.addPage();
    doc.fontSize(20).text('B I N G O', 100, 80);

    const columnas = {
      B: generarNumerosUnicos(1, 15, 5),
      I: generarNumerosUnicos(16, 30, 5),
      N: generarNumerosUnicos(31, 45, 5),
      G: generarNumerosUnicos(46, 60, 5),
      O: generarNumerosUnicos(61, 75, 5),
    };
    columnas.N[2] = 'FREE';

    const letras = ['B', 'I', 'N', 'G', 'O'];
    const xInicio = 100;
    const yInicio = 120;
    const ancho = 50;
    const alto = 40;

    letras.forEach((letra, col) => {
      for (let fila = 0; fila < 5; fila++) {
        const valor = columnas[letra][fila];
        const texto = valor.toString();
        const x = xInicio + col * ancho;
        const y = yInicio + fila * alto;
        doc.fontSize(14).text(texto, x + 15, y + 10);
      }
    });
  }

  doc.end();
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'bingosdanyoficial@gmail.com',
    pass: 'pxvhbnxtjqfysksa'
  }
});

app.post('/enviar', upload.single('archivo'), async (req, res) => {
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

  const rutaPDF = path.join(__dirname, 'cartones', `cartones_${Date.now()}.pdf`);
  generarCartonesPDF(parseInt(cantidad), rutaPDF);

  setTimeout(() => {
    const mailOptions = {
      from: 'Bingos Dany <bingosdanyoficial@gmail.com>',
      to: correo,
      subject: 'Tus cartones de Bingo',
      text: `Hola ${nombre}, adjunto encontrarás tus ${cantidad} cartones para el Bingo.`,
      attachments: [
        {
          filename: 'cartones_bingo.pdf',
          path: rutaPDF
        }
      ]
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar correo:', error);
        res.status(500).json({ error: 'Error al enviar correo' });
      } else {
        console.log('Correo enviado:', info.response);
        res.json({ mensaje: 'Formulario y cartones enviados correctamente' });
      }
    });
  }, 1000);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
