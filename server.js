const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const app = express();

app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage });

const LOGO_PATH = path.join(__dirname, 'public', 'fondobingo.png');
const CARTONES_DIR = path.join(__dirname, 'cartones');

// Verifica que exista la carpeta cartones
if (!fs.existsSync(CARTONES_DIR)) {
  fs.mkdirSync(CARTONES_DIR);
}

// Configuración del correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'bingosdanyoficial@gmail.com',
    pass: 'hfrs uvfz dewp psgl' // contraseña de aplicación
  }
});

app.get('/', (req, res) => {
  res.send('Servidor Bingos Dany activo');
});

app.post('/upload', upload.single('archivo'), async (req, res) => {
  const { nombre, correo, cantidad } = req.body;
  const archivo = req.file;

  console.log('--- NUEVO ENVÍO ---');
  console.log('Nombre:', nombre);
  console.log('Correo:', correo);
  console.log('Cantidad de cartones:', cantidad);
  console.log('Archivo recibido:', archivo?.originalname || 'Ninguno');

  if (!nombre || !correo || !archivo || !cantidad) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  const pdfPath = path.join(CARTONES_DIR, `cartones_${Date.now()}.pdf`);
  const doc = new PDFDocument({ autoFirstPage: false });

  const stream = fs.createWriteStream(pdfPath);
  doc.pipe(stream);

  for (let i = 1; i <= parseInt(cantidad); i++) {
    doc.addPage({ size: 'A4' });
    doc.image(LOGO_PATH, 100, 100, { width: 400 });
    doc.text(`Cartón ${i}`, 270, 520, { align: 'center' });
  }

  doc.end();

  stream.on('finish', () => {
    transporter.sendMail({
      from: '"Bingos Dany" <bingosdanyoficial@gmail.com>',
      to: correo,
      subject: 'Tus cartones de Bingo',
      text: `Hola ${nombre}, adjunto encontrarás tus ${cantidad} cartones para el Bingo.`,
      attachments: [
        {
          filename: 'cartones_bingo.pdf',
          path: pdfPath
        }
      ]
    }, (error, info) => {
      if (error) {
        console.error('Error al enviar correo:', error);
        return res.status(500).json({ error: 'Error al enviar el correo' });
      }

      console.log('Correo enviado:', info.response);
      res.json({ mensaje: 'Formulario recibido y cartones enviados correctamente' });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
