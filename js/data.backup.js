// Datos de ejemplo para productos
window.productosData = [
    {
        id: 'p9',
        nombre: 'Hamaca familiar',
        descripcion: 'Hamaca tejida a mano con hilos de algodón resistente, ideal para toda la familia.',
        precio: 2500.00,
        imagen: 'https://i.postimg.cc/RhxN25nY/00000000002.jpg',
        categoria: 'hamacas',
        stock: 10,
        tienda: { id: 't5', nombre: 'Hamacas Niquinohomeñas' },
        calificacion: 4.9,
        reseñas: 36
    },
    {
        id: 'p1',
        nombre: 'Canasto de bambu',
        descripcion: 'Tamaño pequeño para frutas',
        precio: 170.00,
        imagen: 'https://i.postimg.cc/L4xMFVKv/Canastos-Pavon-Niquinohomo.jpg',
        categoria: 'bambu',
        stock: 15,
        tienda: { id: 't1', nombre: 'Canastos Pavon' },
        calificacion: 4.5,
        reseñas: 28
    },
    {
        id: 'p2',
        nombre: 'Hamaca columpio',
        descripcion: 'Cómoda hamaca columpio de gran tamaño, tejida a mano con materiales resistentes y cómodos. Perfecta para relajarse en el jardín o la terraza.',
        precio: 900.00,
        imagen: 'https://i.postimg.cc/Z5q3ZmCD/Hamaca-Silla-Grande-Naranja-1.png',
        categoria: 'hamacas',
        stock: 8,
        tienda: { id: 't5', nombre: 'Hamacas Niquinohomeñas' },
        calificacion: 4.8,
        reseñas: 42
    },
    {
        id: 'p3',
        nombre: 'Virgen repujada en aluminio',
        descripcion: 'Exquisita imagen de la Virgen María elaborada en aluminio repujado a mano, con detalles artesanales únicos. Ideal para decoración de interiores o como objeto de devoción.',
        precio: 250.00,
        imagen: 'https://i.postimg.cc/HxNQnsPh/Virgen-repujada-en-aluminio.jpg',
        categoria: 'repujado',
        stock: 40,
        tienda: { id: 't3', nombre: 'Creaciones Gutiérrez' },
        calificacion: 4.9,
        reseñas: 55
    },
    {
        id: 'p4',
        nombre: 'Mesedora con forro de cuero',
        descripcion: 'Cómoda mecedora de madera con forro de cuero de alta calidad. Ideal para relajarse en la sala o el balcón. Hecha a mano con maderas seleccionadas y terminados de lujo.',
        precio: 2300.00,
        imagen: 'https://i.postimg.cc/kGSr2GfG/Mesedora-con-forro-de-cuero.png',
        categoria: 'madera',
        stock: 5,
        tienda: { id: 't4', nombre: 'Mueblería El Águila' },
        calificacion: 4.8,
        reseñas: 42
    },
    {
        id: 'p5',
        nombre: 'Canasto frutero',
        descripcion: 'Práctico canasto tejido a mano con fibras naturales, ideal para almacenar y exhibir frutas frescas en tu cocina o comedor.',
        precio: 110.00,
        imagen: 'https://i.postimg.cc/ZKbTnF6v/canasto-frutero.jpg',
        categoria: 'bambu',
        stock: 20,
        tienda: { id: 't1', nombre: 'Canastos Pavon' },
        calificacion: 4.6,
        reseñas: 18
    },
    {
        id: 'p6',
        nombre: 'Mesita de sala',
        descripcion: 'Elegante mesita de sala en madera de cedro color miel, con terminados de lujo y detalles artesanales. Ideal para complementar cualquier espacio de tu hogar.',
        precio: 2100.00,
        imagen: 'https://i.postimg.cc/1XwT9T3R/mesita-de-sala.png',
        categoria: 'madera',
        stock: 30,
        tienda: { id: 't4', nombre: 'Mueblería El Águila' },
        calificacion: 4.8,
        reseñas: 25
    },
    {
        id: 'p7',
        nombre: 'Cristo repujado en Aluminio',
        descripcion: 'Impresionante figura de Cristo elaborada en aluminio repujado a mano, con detalles artesanales únicos. Perfecta para decoración de interiores o como objeto de devoción.',
        precio: 350.00,
        imagen: 'https://i.postimg.cc/KzQkCsxf/Picsart-25-11-11-22-31-18-130.jpg',
        categoria: 'repujado',
        stock: 8,
        tienda: { id: 't3', nombre: 'Creaciones Gutiérrez' },
        calificacion: 4.9,
        reseñas: 28
    },
    {
        id: 'p8',
        nombre: 'Maceta para ornamentar',
        descripcion: 'Encantadora maceta de cemento artesanal, perfecta para decorar interiores y exteriores. Ideal para plantas pequeñas o como elemento decorativo por sí misma.',
        precio: 800.00,
        imagen: 'https://i.postimg.cc/G90jph5r/maceta-de-cemento.jpg',
        categoria: 'barro',
        stock: 15,
        tienda: { id: 't2', nombre: 'Macetas Shalom' },
        calificacion: 4.8,
        reseñas: 32
    },
    {
        id: 'p10',
        nombre: 'Baúl decorado con estaño repujado',
        descripcion: 'Exclusivo baúl artesanal decorado con finos detalles en estaño repujado a mano. Ideal para guardar objetos de valor o como pieza decorativa en cualquier ambiente del hogar.',
        precio: 850.00,
        imagen: 'https://i.postimg.cc/5tb8Gz80/baul-de-madera-con-repujado.png',
        categoria: 'repujado',
        stock: 6,
        tienda: { id: 't3', nombre: 'Creaciones Gutiérrez' },
        calificacion: 5.0,
        reseñas: 15
    },
    {
        id: 'p11',
        nombre: 'Canastita para dulces',
        descripcion: 'Encantadora canastita tejida a mano, perfecta para presentar dulces, frutas pequeñas o como detalle decorativo. Hecha con materiales naturales y gran atención al detalle.',
        precio: 55.00,
        imagen: 'https://i.postimg.cc/3NbxjkH6/canastita-para-dulces.jpg',
        categoria: 'bambu',
        stock: 25,
        tienda: { id: 't1', nombre: 'Canastos Pavon' },
        calificacion: 4.9,
        reseñas: 18
    },
    {
        id: 'p12',
        nombre: 'Copas de madera',
        descripcion: 'Elegantes copas talladas a mano en madera de roble, ideales para vinos y cócteles. Cada pieza es única, mostrando la belleza natural de la madera con un acabado suave y seguro para alimentos.',
        precio: 650.00,
        imagen: 'https://i.postimg.cc/hjH1M1qD/copas-de-madera.jpg',
        categoria: 'madera',
        stock: 12,
        tienda: { id: 't6', nombre: 'Artesanía Alvarado' },
        calificacion: 4.8,
        reseñas: 24
    }
];

// Datos de ejemplo para tiendas
window.tiendasData = [
    {
        id: 't6',
        nombre: 'Artesanía Alvarado',
        descripcion: 'Especialistas en muebles y artesanías en madera de la más alta calidad, elaborados con maderas finas y técnicas tradicionales.',
        imagen: 'https://i.postimg.cc/SsBNsJcs/Artesania-Alvarado.jpg',
        foto_perfil: 'https://i.postimg.cc/SsBNsJcs/Artesania-Alvarado.jpg',
        ubicacion: 'Niquinohomo, Masaya',
        direccion: 'Frente Costado Sur del Parque Niquinohomo',
        contacto: '88559291',
        horarios: 'Lunes a Sábado: 8am - 5pm',
        whatsapp: 'https://wa.link/ejemplo'
    },
    {
        id: 't5',
        nombre: 'Hamacas Niquinohomeñas',
        descripcion: 'Las hamacas más cómodas y resistentes, tejidas a mano con materiales de la más alta calidad.',
        imagen: 'https://i.postimg.cc/h40yD9SL/Columpios-Hamaca-de-Nicaragua-de.webp',
        foto_perfil: 'https://i.postimg.cc/h40yD9SL/Columpios-Hamaca-de-Nicaragua-de.webp',
        ubicacion: 'Niquinohomo, Masaya',
        direccion: 'De la iglesia 2c. al sur',
        contacto: '+505 8888 1234',
        horarios: 'Lunes a Sábado: 8am - 5pm',
        whatsapp: 'https://wa.link/ejemplo'
    },
    {
        id: 't1',
        nombre: 'Canastos Pavon',
        descripcion: 'Tradición en cada canasto una Artesanía que florece.',
        imagen: 'https://i.postimg.cc/Zntm2stf/logo-tienda-canastos.png',
        foto_perfil: 'https://i.postimg.cc/Zntm2stf/logo-tienda-canastos.png',
        ubicacion: 'Niquinohomo, Masaya',
        direccion: 'Comarca Los Pocitos, Niquinohomo',
        contacto: '+505 8888 5555',
        horarios: 'Lunes a Viernes: 8am - 5pm'
    },
    {
        id: 't2',
        nombre: 'Macetas Shalom',
        descripcion: 'Especialistas en la creación de hermosas macetas de barro y cerámica, cada una elaborada con técnicas tradicionales y mucho amor. Ofrecemos una amplia variedad de diseños para decorar tus espacios con elegancia natural.',
        imagen: 'https://i.postimg.cc/MTP3bQ9v/Macetas-Shalom.jpg',
        foto_perfil: 'https://i.postimg.cc/MTP3bQ9v/Macetas-Shalom.jpg',
        ubicacion: 'Catarina, Masaya',
        direccion: 'Rotonda de Catarina 300 metros al oeste',
        contacto: '86547212',
        horarios: 'Lunes a Sábado: 8am - 5pm'
    },
    {
        id: 't3',
        nombre: 'Creaciones Gutiérrez',
        descripcion: 'Especialistas en artesanías de repujado en aluminio, creando piezas únicas de gran belleza y detalle artesanal. Ofrecemos recuerdos para bodas, aniversarios, comuniones, cuadros, retrateras, baúles y más.',
        imagen: 'https://i.postimg.cc/PfFtLkxb/Trabajo-especialniquinomo-5.png',
        foto_perfil: 'https://i.postimg.cc/PfFtLkxb/Trabajo-especialniquinomo-5.png',
        ubicacion: 'Niquinohomo, Masaya',
        direccion: 'Costado Sur del Parque Central de Niquinohomo 3 cuadras abajo',
        telefono: '+505 8888 8888',
        correo: 'creacionesgutierrez@ejemplo.com',
        horarios: 'Lunes a Domingo: 10am - 6pm'
    },
    {
        id: 't4',
        nombre: 'Mueblería El Águila',
        descripcion: 'En Mueblería El Águila cuidamos cada detalle en la elaboración de los muebles de tu preferencia.',
        imagen: 'https://i.postimg.cc/zBccLyGL/338005333-740146800927449-669123.webp',
        foto_perfil: 'https://i.postimg.cc/zBccLyGL/338005333-740146800927449-669123.webp',
        ubicacion: 'Masaya, Nicaragua',
        direccion: 'Km 53 1/2 Carretera Niquinohomo, Masatepe',
        contacto: '+505 8336 8339',
        horarios: 'Lunes a Viernes: 8am - 5pm',
        whatsapp: 'https://wa.link/cble6a'
    }
];

// DATOS DE USUARIOS INICIALES
window.usersData = [
    {
        id: 'user_comprador_1',
        nombre: 'Juan Comprador',
        email: 'comprador@correo.com',
        password: 'comprador123',
        fechaRegistro: '2023-01-15T10:00:00Z',
        favoritos: ['p1', 'p3'],
        carrito: [],
        historialCompras: []
    }
];

// Categorías para el filtrado
window.categoriasData = [
    { id: 'barro', i18nKey: 'categories.barro', icono: 'fas fa-palette' },
    { id: 'bambu', i18nKey: 'categories.bambu', icono: 'fas fa-leaf' },
    { id: 'madera', i18nKey: 'categories.madera', icono: 'fas fa-tree' },
    { id: 'hamacas', i18nKey: 'categories.hamacas', icono: 'fas fa-bed' },
    { id: 'repujado', i18nKey: 'categories.repujado', icono: 'fas fa-hammer' }
];
