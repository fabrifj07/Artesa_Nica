const selfsigned = require('selfsigned');
const fs = require('fs');
const path = require('path');

// Crear directorio ssl si no existe
const sslDir = path.join(__dirname, '..', 'ssl');
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
}

// Opciones para el certificado
const attrs = [
  { name: 'commonName', value: 'localhost' },
  { name: 'countryName', value: 'NI' },
  { name: 'stateOrProvinceName', value: 'Masaya' },
  { name: 'localityName', value: 'Niquinohomo' },
  { name: 'organizationName', value: 'Artesanica' },
  { name: 'organizationalUnitName', value: 'Development' },
];

const options = {
  days: 365,
  keySize: 4096,
  algorithm: 'sha256',
  extensions: [
    {
      name: 'basicConstraints',
      cA: true,
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: 'subjectAltName',
      altNames: [
        {
          // type 2 is DNS
          type: 2,
          value: 'localhost',
        },
        {
          type: 2,
          value: 'localhost.localdomain',
        },
        {
          type: 2,
          value: '127.0.0.1',
        },
        {
          // type 7 is IP
          type: 7,
          ip: '127.0.0.1',
        },
      ],
    },
  ],
};

// Generar certificado
const pems = selfsigned.generate(attrs, options);

// Guardar archivos
fs.writeFileSync(path.join(sslDir, 'private.key'), pems.private);
fs.writeFileSync(path.join(sslDir, 'certificate.crt'), pems.cert);

console.log('Certificados generados exitosamente en la carpeta ssl/');
