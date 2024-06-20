const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const Contenido = require('./contenido');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });
  
const upload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 5 },
}).fields([
  { name: 'caratula', maxCount: 1 },
  { name: 'contenido', maxCount: 1 }
]);

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));


app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); 


app.post('/api/contenido', upload, async (req, res) => {
    try {
      const caratulaFile = req.files['caratula'] ? req.files['caratula'][0] : null;
      const contenidoFile = req.files['contenido'] ? req.files['contenido'][0] : null;

      if (!contenidoFile) {
        return res.status(400).json({ error: 'El archivo de contenido es requerido' });
      }
  
      const contenidoBuffer = fs.readFileSync(contenidoFile.path);
  
      const nuevoContenido = new Contenido({
        titulo: req.body.titulo,
        curso: req.body.curso,
        autor: req.body.autor,
        tipo: req.body.tipo,
        caratula: caratulaFile ? caratulaFile.filename : null,
        contenido: contenidoBuffer,
      });
  
      const contenidoGuardado = await nuevoContenido.save();
      res.status(201).json(contenidoGuardado);
    } catch (error) {
      console.error(error); 
      res.status(500).json({ error: 'Error al crear el contenido' });
    }
  });

app.get('/api/contenido', async (req, res) => {
  try {
    const contenidos = await Contenido.find();
    res.json(contenidos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el contenido' });
  }
});

app.get('/api/contenido/:id', async (req, res) => {
  try {
    const contenido = await Contenido.findById(req.params.id);
    if (!contenido) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }
    res.json(contenido);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el contenido' });
  }
});

app.put('/api/contenido/:id', upload, async (req, res) => {
    try {
      const caratulaFile = req.files['caratula'] ? req.files['caratula'][0] : null;
      const contenidoFile = req.files['contenido'] ? req.files['contenido'][0] : null;
  
      const contenidoBuffer = contenidoFile ? fs.readFileSync(contenidoFile.path) : undefined;
  
      const updateData = {
        ...req.body,
        caratula: caratulaFile ? caratulaFile.filename : req.body.caratula,
        contenido: contenidoBuffer ? contenidoBuffer : req.body.contenido,
      };
  
      const contenidoActualizado = await Contenido.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );
  
      if (!contenidoActualizado) {
        return res.status(404).json({ error: 'Contenido no encontrado' });
      }
  
      res.json(contenidoActualizado);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al actualizar el contenido' });
    }
  });

app.delete('/api/contenido/:id', async (req, res) => {
  try {
    const contenidoEliminado = await Contenido.findByIdAndDelete(req.params.id);
    if (!contenidoEliminado) {
      return res.status(404).json({ error: 'Contenido no encontrado' });
    }
    res.json({ mensaje: 'Contenido eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el contenido' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal' });
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
