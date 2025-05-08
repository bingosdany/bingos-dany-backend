const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configurar multer para manejar archivos enviados
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor Bingos Dany activo');
});

// Ruta para recibir el formulario
app.post('/upload', upload.single('archivo'), (req, res) => {
  const { nombre, correo } = req.body;
  const archivo = req.file;

  console.log('--- NUEVO ENVÍO ---');
  console.log('Nombre:', nombre);
  console.log('Correo:', correo);
  console.log('Archivo recibido:', archivo ? archivo.originalname : 'Ninguno');

  if (!nombre || !correo || !archivo) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }

  // Por ahora solo confirmamos recepción
  res.json({ mensaje: 'Formulario recibido correctamente' });
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
