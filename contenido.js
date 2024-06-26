const mongoose = require('mongoose');

const contenidoSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
  },
  curso: {
    type: String,
  },
  autor: {
    type: String,
  },
  tipo: {
    type: String,
    enum: ['libro', 'imagen', 'video'],
    required: true,
  },
  caratula: {
    type: String,
  },
  contenido: {
    type: String,
    required: true,
  },
});

const Contenido = mongoose.model('Contenido', contenidoSchema);

module.exports = Contenido;
