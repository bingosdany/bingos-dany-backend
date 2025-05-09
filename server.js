// === SERVER.JS (BACKEND) ===
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
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

let cartonesVendidos = 0;
const TOTAL_CARTONES = 100; // Puedes cambiar este valor

function generarCartonesPDF(cantidad, rutaSalida) {
  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const stream = fs.createWriteStream(rutaSalida);
  doc.pipe(stream);

  const cartonesPorHoja = 4;
  const anchoCarton = 280;
  const altoCarton = 280;
  const celdaSize = 45;
  const margenX = 40;
  const margenY = 40;

  let contador = 0;
  for (let i = 0; i < cantidad; i++) {
    const posX = margenX + (i % 2) * (anchoCarton + margenX);
    const posY = margenY + Math.floor((i % cartonesPorHoja) / 2) * (altoCarton + margenY);

    // Dibujar tabla básica de bingo
    const columnas = [[], [], [], [], []];
    for (let col = 0; col < 5; col++) {
      const min = col * 15 + 1;
      const max = col === 4 ? 75 : min + 14;
      const nums = Array.from({ length: max - min + 1 }, (_, j) => min + j);
      columnas[col] = nums.sort(() => 0.5 - Math.random()).slice(0, 5);
    }
    columnas[2][2] = 'FREE';

    const letras = ['B', 'I', 'N', 'G', 'O'];
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row < 6; row++) {
        const x = posX + col * celdaSize;
        const y = posY + row * celdaSize;

        doc.rect(x, y, celdaSize, celdaSize).stroke();
        doc.fontSize(12).text(
          row === 0 ? letras[col] : columnas[col][row - 1],
          x + 12,
          y + 14
        );
      }
    }
    if ((i + 1) % cartonesPorHoja === 0) doc.addPage();
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

app.post('/enviar', upload.single('archivo'), (req, res) => {
  const { nombre, correo, cantidad } = req.body;
  if (!nombre || !correo || !req.file || !cantidad) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const cantidadNum = parseInt(cantidad);
  cartonesVendidos += cantidadNum;

  const rutaPDF = path.join(__dirname, 'cartones', `cartones_${Date.now()}.pdf`);
  generarCartonesPDF(cantidadNum, rutaPDF);

  setTimeout(() => {
    transporter.sendMail({
      from: 'Bingos Dany <bingosdanyoficial@gmail.com>',
      to: correo,
      subject: 'Tus cartones de Bingo',
      text: `Hola ${nombre}, adjunto encontrarás tus ${cantidad} cartones para el Bingo.`,
      attachments: [{ filename: 'cartones_bingo.pdf', path: rutaPDF }]
    }, (error) => {
      if (error) return res.status(500).json({ error: 'Error al enviar correo' });
      res.json({ mensaje: 'Cartones enviados correctamente' });
    });
  }, 1000);
});

app.get('/progreso', (req, res) => {
  const porcentaje = Math.min(100, Math.round((cartonesVendidos / TOTAL_CARTONES) * 100));
  res.json({ porcentaje });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
