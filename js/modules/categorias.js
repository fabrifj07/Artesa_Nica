/**
 * Módulo de Categorías
 * Maneja la lógica relacionada con las categorías de productos
 */

const CategoriasModule = (function() {
    // Estado interno
    let categorias = [];
    
    // Referencias a elementos del DOM
    let categoriasContainer;
    
    // Mapeo de categorías a íconos
    const categoriaIconos = {
        'hamacas': 'fas fa-bed',
        'bambu': 'fas fa-basketball-ball',
        'madera': 'fas fa-tree',
        'cuero': 'fas fa-tshirt',
        'barro': 'fas fa-mug-hot',
        'textiles': 'fas fa-tshirt',
        'joyeria': 'fas fa-gem',
        'otros': 'fas fa-ellipsis-h'
    };
    
    // Nombres de categorías traducidos
    const categoriaNombres = {
        'hamacas': { es: 'Hamacas', en: 'Hammocks' },
        'bambu': { es: 'Artículos de Bambú', en: 'Bamboo Items' },
        'madera': { es: 'Muebles de Madera', en: 'Wooden Furniture' },
        'cuero': { es: 'Artículos de Cuero', en: 'Leather Items' },
        'barro': { es: 'Cerámica y Barro', en: 'Pottery and Clay' },
        'textiles': { es: 'Textiles', en: 'Textiles' },
        'joyeria': { es: 'Joyería', en: 'Jewelry' },
        'otros': { es: 'Otros', en: 'Others' }
    };
    
    // Inicializar el módulo
    function init() {
        console.log('Inicializando módulo de categorías...');
        
        // Obtener referencias a los elementos del DOM
        categoriasContainer = document.getElementById('categorias-container');
        
        // Verificar que el contenedor exista
        if (!categoriasContainer) {
            console.error('No se encontró el contenedor de categorías');
            return;
        }
        
        // Escuchar el evento de datos listos
        if (window.AppState && window.AppState.events) {
            window.AppState.events.on('app:ready', function(data) {
                if (data && data.productos) {
                    // Extraer categorías únicas de los productos
                    const categoriasUnicas = [...new Set(data.productos.map(p => p.categoria))];
                    
                    // Mapear a objetos de categoría
                    categorias = categoriasUnicas.map(categoriaId => ({
                        id: categoriaId,
                        nombre: categoriaNombres[categoriaId]?.es || categoriaId,
                        nombre_en: categoriaNombres[categoriaId]?.en || categoriaId,
                        icono: categoriaIconos[categoriaId] || 'fas fa-box'
                    }));
                    
                    renderCategorias();
                }
            });
        }
        
        console.log('Módulo de categorías inicializado');
    }
    
    // Renderizar categorías
    function renderCategorias() {
        if (!categoriasContainer) return;
        
        try {
            // Limpiar contenedor
            categoriasContainer.innerHTML = '';
            
            // Renderizar cada categoría
            categorias.forEach(categoria => {
                const categoriaElement = crearElementoCategoria(categoria);
                if (categoriaElement) {
                    categoriasContainer.appendChild(categoriaElement);
                }
            });
            
            console.log('Categorías renderizadas');
            
        } catch (error) {
            console.error('Error al renderizar categorías:', error);
        }
    }
    
    // Crear elemento HTML para una categoría
    function crearElementoCategoria(categoria) {
        if (!categoria) return null;
        
        try {
            const isSpanish = document.documentElement.lang === 'es';
            const nombre = isSpanish ? categoria.nombre : (categoria.nombre_en || categoria.nombre);
            
            const categoriaDiv = document.createElement('div');
            categoriaDiv.className = 'categoria-card';
            categoriaDiv.dataset.id = categoria.id;
            
            categoriaDiv.innerHTML = `
                <div class="categoria-icono">
                    <i class="${categoria.icono}"></i>
                </div>
                <h4 class="categoria-nombre">${nombre}</h4>
            `;
            
            // Hacer clic en la categoría para filtrar productos
            categoriaDiv.addEventListener('click', () => {
                filtrarPorCategoria(categoria.id);
            });
            
            return categoriaDiv;
            
        } catch (error) {
            console.error('Error al crear elemento de categoría:', error);
            return null;
        }
    }
    
    // Filtrar productos por categoría
    function filtrarPorCategoria(categoriaId) {
        console.log(`Filtrando por categoría: ${categoriaId}`);
        
        // Navegar a la sección de productos con el filtro de categoría
        if (window.app && window.app.navigateTo) {
            window.app.navigateTo('productos', { categoria: categoriaId });
        }
        
        // Opcional: Desplazarse suavemente a la sección de productos
        const productosSection = document.getElementById('productos');
        if (productosSection) {
            productosSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    // Obtener categoría por ID
    function getCategoria(id) {
        return categorias.find(c => c.id === id);
    }
    
    // Obtener todas las categorías
    function getCategorias() {
        return [...categorias];
    }
    
    // API Pública del módulo
    return {
        init: init,
        getCategorias: getCategorias,
        getCategoria: getCategoria,
        renderCategorias: renderCategorias
    };
})();

// Inicializar el módulo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Registrar el módulo en el estado global
    if (window.AppState) {
        window.AppState.modules.categorias = CategoriasModule;
    }
    
    // Inicializar el módulo
    CategoriasModule.init();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoriasModule;
}
