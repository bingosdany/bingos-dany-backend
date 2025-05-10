const mongoose = require('mongoose');

const compraSchema = new mongoose.Schema({
  nombre: String,
  correo: String,
  comprobanteUrl: String,
  cartones: Number,
  estado: { type: String, default: 'pendiente' },
  fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Compra', compraSchema);
