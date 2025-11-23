/**
 * Módulo de Productos
 * Maneja la lógica relacionada con los productos
 */

const ProductosModule = (function() {
    // Estado interno
    let productos = [];
    
    // Referencias a elementos del DOM
    let productosContainer;
    
    // Inicializar el módulo
    function init() {
        console.log('Inicializando módulo de productos...');
        
        // Obtener referencias a los elementos del DOM
        productosContainer = document.getElementById('productos-container');
        
        // Verificar que el contenedor exista
        if (!productosContainer) {
            console.error('No se encontró el contenedor de productos');
            return;
        }
        
        // Escuchar el evento de datos listos
        if (window.AppState && window.AppState.events) {
            window.AppState.events.on('app:ready', function(data) {
                if (data && data.productos) {
                    productos = data.productos;
                    renderProductosDestacados();
                }
            });
        }
        
        console.log('Módulo de productos inicializado');
    }
    
    // Renderizar productos destacados
    function renderProductosDestacados() {
        if (!productosContainer) return;
        
        try {
            // Limpiar contenedor
            productosContainer.innerHTML = '';
            
            // Obtener productos destacados (por ejemplo, los primeros 6)
            const productosDestacados = productos.slice(0, 6);
            
            // Renderizar cada producto
            productosDestacados.forEach(producto => {
                const productoElement = crearElementoProducto(producto);
                if (productoElement) {
                    productosContainer.appendChild(productoElement);
                }
            });
            
            console.log('Productos destacados renderizados');
            
        } catch (error) {
            console.error('Error al renderizar productos destacados:', error);
        }
    }
    
    // Crear elemento HTML para un producto
    function crearElementoProducto(producto) {
        if (!producto) return null;
        
        try {
            const isSpanish = document.documentElement.lang === 'es';
            const nombre = isSpanish ? producto.nombre : (producto.nombre_en || producto.nombre);
            const descripcion = isSpanish ? producto.descripcion : (producto.descripcion_en || producto.descripcion);
            
            const productoDiv = document.createElement('div');
            productoDiv.className = 'producto-card';
            productoDiv.dataset.id = producto.id;
            
            productoDiv.innerHTML = `
                <div class="producto-imagen">
                    <img src="${producto.imagen || 'img/placeholder-product.jpg'}" alt="${nombre}">
                    <button class="favorito-btn" data-product-id="${producto.id}">
                        <i class="far fa-heart"></i>
                    </button>
                </div>
                <div class="producto-info">
                    <h3 class="producto-nombre">${nombre}</h3>
                    <p class="producto-descripcion">${descripcion || ''}</p>
                    <div class="producto-precio">
                        ${formatCurrency(producto.precio || 0)}
                    </div>
                    <div class="producto-acciones">
                        <button class="btn btn-primary btn-sm agregar-carrito" data-product-id="${producto.id}">
                            <i class="fas fa-cart-plus"></i> ${isSpanish ? 'Agregar' : 'Add'}
                        </button>
                    </div>
                </div>
            `;
            
            // Agregar manejadores de eventos
            const favoritoBtn = productoDiv.querySelector('.favorito-btn');
            const agregarBtn = productoDiv.querySelector('.agregar-carrito');
            
            if (favoritoBtn) {
                favoritoBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleFavorito(producto.id);
                });
            }
            
            if (agregarBtn) {
                agregarBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    agregarAlCarrito(producto.id);
                });
            }
            
            // Hacer clic en la tarjeta para ver detalles
            productoDiv.addEventListener('click', () => {
                verDetalleProducto(producto.id);
            });
            
            return productoDiv;
            
        } catch (error) {
            console.error('Error al crear elemento de producto:', error);
            return null;
        }
    }
    
    // Funciones auxiliares
    function formatCurrency(amount) {
        return new Intl.NumberFormat('es-NI', {
            style: 'currency',
            currency: 'NIO',
            minimumFractionDigits: 2
        }).format(amount);
    }
    
    function toggleFavorito(productoId) {
        console.log(`Producto ${productoId} marcado como favorito`);
        // Implementar lógica de favoritos
        if (window.app && window.app.toggleFavorite) {
            window.app.toggleFavorite(productoId);
        }
    }
    
    function agregarAlCarrito(productoId) {
        console.log(`Agregando producto ${productoId} al carrito`);
        // Implementar lógica de carrito
        if (window.app && window.app.addToCart) {
            window.app.addToCart(productoId);
        }
    }
    
    function verDetalleProducto(productoId) {
        console.log(`Viendo detalle del producto ${productoId}`);
        // Implementar navegación a detalle de producto
        if (window.app && window.app.navigateToProduct) {
            window.app.navigateToProduct(productoId);
        }
    }
    
    // API Pública del módulo
    return {
        init: init,
        getProductos: () => [...productos],
        getProducto: (id) => productos.find(p => p.id === id),
        renderProductosDestacados: renderProductosDestacados
    };
})();

// Inicializar el módulo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Registrar el módulo en el estado global
    if (window.AppState) {
        window.AppState.modules.productos = ProductosModule;
    }
    
    // Inicializar el módulo
    ProductosModule.init();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductosModule;
}
