const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// Servir archivos estáticos desde el directorio raíz
app.use(express.static(__dirname));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/img', express.static(path.join(__dirname, 'img')));

// Manejar rutas específicas para archivos HTML
const htmlFiles = ['index', 'tiendas', 'productos', 'noticias'];

htmlFiles.forEach(file => {
  app.get(`/${file === 'index' ? '' : file}`, (req, res) => {
    const filePath = path.join(__dirname, `${file === 'index' ? 'index' : file}.html`);
    
    // Verificar si el archivo existe
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      // Si el archivo no existe, redirigir al inicio
      res.redirect('/');
    }
  });
});

// Manejar rutas no encontradas
app.use((req, res) => {
  res.status(404).send('Página no encontrada');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  console.log(`Accede a la aplicación en: http://localhost:${PORT}`);
  console.log('Rutas disponibles:');
  htmlFiles.forEach(file => {
    console.log(`- http://localhost:${PORT}${file === 'index' ? '' : '/' + file}`);
  });
});
