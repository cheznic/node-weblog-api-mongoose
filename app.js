// initialize express
const express = require('express');
const app = express();

// initialize request body parser
const bodyParser = require('body-parser');
app.use(bodyParser.json());

// initialize static file path for images (not scalable)
const path = require('path');
app.use('/images', express.static(path.join(__dirname, 'images')));

// initialize multi-part handler for image file upload
const multer = require('multer');
const nanoid = require('nanoid');
const filter = (req, file, cb) => {
   if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg') {
      cb(null, true);
   } else {
      cb(null, false);
   }
}
const fileStorage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, 'images');
   },
   filename: (req, file, cb) => {
      let name = nanoid();
      let ext = file.originalname.split('.').pop();
      cb(null, `${name}.${ext}`);
   }
})
app.use(multer({ storage: fileStorage, fileFilter: filter }).single('image'));


// CORS configuration - allow access from other domains 
app.use((req, res, next) => {
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
   next();
});

// Initialize HTTP routes
const feedRoutes = require('./routes/feed');
app.use('/feed', feedRoutes);
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Initialize error handler
app.use((error, req, res, next) => {
   console.error(error);
   const status = error.statusCode || 500;
   const errors = error.errors || {};
   const message = err.message || '500.HTTP.INTERNAL_SYSTEM_ERROR';
   res.status(status).json({ message: message, errors: errors });
});

// Initialize mongo/mongoose and start HTTP server
const mongoose = require('mongoose');
const { connectionString } = require('./secure');
mongoose
   .connect(connectionString, { useNewUrlParser: true })
   .then(result => {
      const port = 8000;
      app.listen(port, () => console.log(`Node listening on port: ${port}`));
   })
   .catch(err => {
      console.error(err);
   });
