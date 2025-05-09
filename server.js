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

function generarCarton() {
  const columnas = {
    B: generarNumeros(1, 15),
    I: generarNumeros(16, 30),
    N: generarNumeros(31, 45),
    G: generarNumeros(46, 60),
    O: generarNumeros(61, 75),
  };
  columnas.N[2] = 'FREE';
  return [
    [columnas.B[0], columnas.I[0], columnas.N[0], columnas.G[0], columnas.O[0]],
    [columnas.B[1], columnas.I[1], columnas.N[1], columnas.G[1], columnas.O[1]],
    [columnas.B[2], columnas.I[2], 'FREE', columnas.G[2], columnas.O[2]],
    [columnas.B[3], columnas.I[3], columnas.N[3], columnas.G[3], columnas.O[3]],
    [columnas.B[4], columnas.I[4], columnas.N[4], columnas.G[4], columnas.O[4]],
  ];
}

function generarNumeros(min, max) {
  const numeros = new Set();
  while (numeros.size < 5) {
    numeros.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return Array.from(numeros);
}

function dibujarCarton(doc, x, y, datos) {
  const tamCelda = 45;
  const columnas = ['B', 'I', 'N', 'G', 'O'];

  for (let fila = 0; fila < 6; fila++) {
    for (let col = 0; col < 5; col++) {
      const posX = x + col * tamCelda;
      const posY = y - fila * tamCelda;
      doc.rect(posX, posY, tamCelda, tamCelda).stroke();

      doc.fontSize(fila === 0 ? 18 : 14);
      const texto = fila === 0 ? columnas[col] : datos[fila - 1][col].toString();
      doc.text(texto, posX + 12, posY + 12);
    }
  }
}

function generarCartonesPDF(cantidad, rutaSalida) {
  const doc = new PDFDocument({ size: 'LETTER' });
  const stream = fs.createWriteStream(rutaSalida);
  doc.pipe(stream);

  const anchoCarton = 280;
  const altoCarton = 280;
  const margenX = 40;
  const margenY = 60;
  const espacioX = 20;
  const espacioY = 30;

  for (let i = 0; i < cantidad; i++) {
    const col = i % 2;
    const fila = Math.floor((i % 4) / 2);
    const x = margenX + col * (anchoCarton + espacioX);
    const y = 720 - fila * (altoCarton + espacioY);
    const datos = generarCarton();
    dibujarCarton(doc, x, y, datos);

    if ((i + 1) % 4 === 0 && i !== cantidad - 1) {
      doc.addPage();
    }
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
