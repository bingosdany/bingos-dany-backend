const path = require('path');
const fondoPath = path.join(__dirname, 'public', 'carton_fondo.png');
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

// Función que genera el PDF con cartones usando el fondo personalizado
function generarCartonesPDF(cantidad, rutaSalida) {
  const doc = new PDFDocument({ size: 'A4', margin: 0 });
  const stream = fs.createWriteStream(rutaSalida);
  doc.pipe(stream);

  const imagenFondo = fondoPath;

  const cartonesPorFila = 2;
  const espacioX = 290;
  const espacioY = 360;
  const margenX = 10;
  const margenY = 20;

  let contador = 0;
  const filas = Math.ceil(cantidad / cartonesPorFila);

  for (let fila = 0; fila < filas; fila++) {
    for (let col = 0; col < cartonesPorFila; col++) {
      if (contador >= cantidad) break;

      const x = margenX + col * espacioX;
      const y = margenY + fila * espacioY;

      doc.image(imagenFondo, x, y, { width: 280 });
      doc.fontSize(12).fillColor('black').text(`Cartón ${contador + 1}`, x + 90, y + 260);

      contador++;
    }
  }

  doc.end();
}

// Configuración de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'bingosdanyoficial@gmail.com',
    pass: 'pxvhbnxtjqfysksa' // tu contraseña de aplicación
  }
});

// Ruta para recibir formulario
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

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
