const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const Contenido = require('./contenido');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ storage: multer.memoryStorage() });

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

app.use(cors());
app.use(express.json());

const uploadToCloudinary = (fileBuffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
    const stream = Readable.from(fileBuffer);
    stream.pipe(uploadStream);
  });
};

app.post('/api/contenido', upload.fields([
  { name: 'caratula', maxCount: 1 },
  { name: 'contenido', maxCount: 1 }
]), async (req, res) => {
  try {
      const caratulaFile = req.files['caratula'] ? req.files['caratula'][0] : null;
      const contenidoFile = req.files['contenido'] ? req.files['contenido'][0] : null;

      let caratulaUrl = null;
      let contenidoUrl = null;

      if (caratulaFile) {
          const caratulaResult = await uploadToCloudinary(caratulaFile.buffer);
          caratulaUrl = caratulaResult.secure_url;
      }

      if (contenidoFile) {
          const contenidoResult = await uploadToCloudinary(contenidoFile.buffer, {
              resource_type: req.body.tipo === 'imagen' ? 'image' : 'raw'
          });
          contenidoUrl = contenidoResult.secure_url;
      }

      const nuevoContenido = new Contenido({
          titulo: req.body.titulo,
          curso: req.body.curso,
          autor: req.body.autor,
          tipo: req.body.tipo,
          caratula: caratulaUrl,
          contenido: contenidoUrl 
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

app.put('/api/contenido/:id', upload.fields([
  { name: 'caratula', maxCount: 1 },
  { name: 'contenido', maxCount: 1 }
]), async (req, res) => {
  try {
      const contenidoExistente = await Contenido.findById(req.params.id);
      if (!contenidoExistente) {
          return res.status(404).json({ error: 'Contenido no encontrado' });
      }

      const caratulaFile = req.files['caratula'] ? req.files['caratula'][0] : null;
      const contenidoFile = req.files['contenido'] ? req.files['contenido'][0] : null;

      let caratulaUrl = contenidoExistente.caratula;
      let contenidoUrl = contenidoExistente.contenido; 

      if (caratulaFile) {
          const caratulaResult = await uploadToCloudinary(caratulaFile.buffer);
          caratulaUrl = caratulaResult.secure_url;
      }

      if (contenidoFile) {
          const contenidoResult = await uploadToCloudinary(contenidoFile.buffer, {
              resource_type: req.body.tipo === 'imagen' ? 'image' : 'raw'
          });
          contenidoUrl = contenidoResult.secure_url;
      }

      const updateData = {
          ...req.body,
          caratula: caratulaUrl,
          contenido: contenidoUrl 
      };

      const contenidoActualizado = await Contenido.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true }
      );

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

      if (contenidoEliminado.caratula) {
          const publicId = contenidoEliminado.caratula.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId); 
      }

      const contenidoPublicId = contenidoEliminado.contenido.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(contenidoPublicId, { resource_type: contenidoEliminado.tipo === 'imagen' ? 'image' : 'raw' });

      res.json({ mensaje: 'Contenido eliminado correctamente' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error al eliminar el contenido' });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
