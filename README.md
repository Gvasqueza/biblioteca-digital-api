
## Introducción
Este proyecto es una aplicación backend construida con Node.js y Express que permite gestionar contenido multimedia utilizando MongoDB como base de datos y Cloudinary para el almacenamiento de archivos. La aplicación permite crear, leer, actualizar y eliminar (CRUD) contenido, incluyendo la subida de archivos multimedia.


## ¿Cómo usarlo?

1. Debes realizar el clonado  `git clone` `https://github.com/Gvasqueza/biblioteca-digital-api.git`.
2. Abrir en tu editor de codigo y poner en la terminal `npm install`.
3. Debes armar tu variable de entorno `.env`. (MONGODB_URI=??? , PORT=9000 , CLOUDINARY_CLOUD_NAME=??? , CLOUDINARY_API_KEY=??? , CLOUDINARY_API_SECRET=???).
4. Agregar las dependencies: `npm i express`, `npm i mongoose`, `npm i multer`, `npm i cors` , `npm i dotenv` y `npm i cloudinary`
5. Ya puedes ejecutar el proyecto usando `node index.js`
