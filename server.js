const express = require('express');
const path = require('path');

const app = express();

// CORREGIDO: Servir archivos estáticos desde el directorio raíz del proyecto
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const HTTP_PORT = process.env.HTTP_PORT || 3000;

app.listen(HTTP_PORT, () => {
  console.log(`Servidor HTTP ejecutándose en el puerto ${HTTP_PORT}`);
  console.log(`Accede a la aplicación en: http://localhost:${HTTP_PORT}`);
});
