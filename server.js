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

  const carton = [];
  for (let fila = 0; fila < 5; fila++) {
    carton[fila] = [
      columnas.B[fila],
      columnas.I[fila],
      fila === 2 ? 'FREE' : columnas.N[fila < 2 ? fila : fila - 1],
      columnas.G[fila],
      columnas.O[fila],
    ];
  }
  return carton;
}

function generarNumeros(min, max) {
  const numeros = [];
  while (numeros.length < 5) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!numeros.includes(num)) numeros.push(num);
  }
  return numeros;
}

function generarCartonesPDF(cantidad, rutaSalida) {
  const doc = new PDFDocument({ size: 'LETTER', margin: 40 });
  const stream = fs.createWriteStream(rutaSalida);
  doc.pipe(stream);

  const anchoCarton = 280;
  const altoCarton = 280;
  const tamañoCelda = 45;

  const posiciones = [
    { x: 40, y: 40 },
    { x: 320, y: 40 },
    { x: 40, y: 350 },
    { x: 320, y: 350 },
  ];

  for (let i = 0; i < cantidad; i++) {
    const carton = generarCarton();
    const { x, y } = posiciones[i % 4];

    // Dibuja título BINGO
    const letras = ['B', 'I', 'N', 'G', 'O'];
    letras.forEach((letra, j) => {
      doc.fontSize(16).text(letra, x + j * tamañoCelda + 15, y);
    });

    // Dibuja celdas con números
    for (let fila = 0; fila < 5; fila++) {
      for (let col = 0; col < 5; col++) {
        const valor = carton[fila][col];
        const celdaX = x + col * tamañoCelda;
        const celdaY = y + 25 + fila * tamañoCelda;
        doc.rect(celdaX, celdaY, tamañoCelda, tamañoCelda).stroke();
        doc.fontSize(12).text(valor.toString(), celdaX + 15, celdaY + 15);
      }
    }

    if ((i + 1) % 4 === 0 && i < cantidad - 1) doc.addPage();
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
        res.status(500).json({ error: 'Error al enviar correo' });
      } else {
        res.json({ mensaje: 'Formulario y cartones enviados correctamente' });
      }
    });
  }, 1000);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
