const express = require('express');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static('public'));

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Función que genera un cartón individual con números aleatorios
function generarCarton() {
  const columnas = {
    B: generarNumeros(1, 15),
    I: generarNumeros(16, 30),
    N: generarNumeros(31, 45),
    G: generarNumeros(46, 60),
    O: generarNumeros(61, 75),
  };

  const carton = [];
  for (let i = 0; i < 5; i++) {
    carton.push([
      columnas.B[i],
      columnas.I[i],
      i === 2 ? 'FREE' : columnas.N[i],
      columnas.G[i],
      columnas.O[i]
    ]);
  }
  return carton;
}

function generarNumeros(min, max) {
  const numeros = [];
  while (numeros.length < 5) {
    const n = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!numeros.includes(n)) numeros.push(n);
  }
  return numeros;
}

// Genera el PDF con 4 cartones por hoja
function generarCartonesPDF(cantidad, rutaSalida) {
  const doc = new PDFDocument({ size: 'A4', margin: 20 });
  const stream = fs.createWriteStream(rutaSalida);
  doc.pipe(stream);

  const cartonesPorHoja = 4;
  const ancho = 130;
  const alto = 160;
  const margenX = 40;
  const margenY = 40;
  const espacioX = 260;
  const espacioY = 250;

  for (let i = 0; i < cantidad; i++) {
    const carton = generarCarton();
    const fila = Math.floor((i % cartonesPorHoja) / 2);
    const col = i % 2;

    const x = margenX + col * espacioX;
    const y = margenY + fila * espacioY;

    // Título
    doc.fontSize(16).text("B  I  N  G  O", x + 25, y);

    // Números
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const val = carton[r][c].toString();
        doc.fontSize(12).text(val.padStart(2, ' '), x + c * 30, y + 30 + r * 25);
      }
    }

    if ((i + 1) % cartonesPorHoja === 0 && i !== cantidad - 1) doc.addPage();
  }

  doc.end();
}

// Configuración de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'bingosdanyoficial@gmail.com',
    pass: 'pxvhbnxtjqfysksa'
  }
});

// Ruta de recepción
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
