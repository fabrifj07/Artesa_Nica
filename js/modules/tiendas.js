/**
 * Módulo de Tiendas
 * Maneja la lógica relacionada con las tiendas/artesanos
 */

const TiendasModule = (function() {
    // Estado interno
    let tiendas = [];
    
    // Referencias a elementos del DOM
    let tiendasContainer;
    
    // Inicializar el módulo
    function init() {
        console.log('Inicializando módulo de tiendas...');
        
        // Obtener referencias a los elementos del DOM
        tiendasContainer = document.getElementById('tiendas-container');
        
        // Verificar que el contenedor exista
        if (!tiendasContainer) {
            console.error('No se encontró el contenedor de tiendas');
            return;
        }
        
        // Escuchar el evento de datos listos
        if (window.AppState && window.AppState.events) {
            window.AppState.events.on('app:ready', function(data) {
                if (data && data.tiendas) {
                    tiendas = data.tiendas;
                    renderTiendasDestacadas();
                }
            });
        }
        
        console.log('Módulo de tiendas inicializado');
    }
    
    // Renderizar tiendas destacadas
    function renderTiendasDestacadas() {
        if (!tiendasContainer) return;
        
        try {
            // Limpiar contenedor
            tiendasContainer.innerHTML = '';
            
            // Obtener tiendas destacadas (por ejemplo, las primeras 4)
            const tiendasDestacadas = tiendas.slice(0, 4);
            
            // Renderizar cada tienda
            tiendasDestacadas.forEach(tienda => {
                const tiendaElement = crearElementoTienda(tienda);
                if (tiendaElement) {
                    tiendasContainer.appendChild(tiendaElement);
                }
            });
            
            console.log('Tiendas destacadas renderizadas');
            
        } catch (error) {
            console.error('Error al renderizar tiendas destacadas:', error);
        }
    }
    
    // Crear elemento HTML para una tienda
    function crearElementoTienda(tienda) {
        if (!tienda) return null;
        
        try {
            const isSpanish = document.documentElement.lang === 'es';
            const nombre = isSpanish ? tienda.nombre : (tienda.nombre_en || tienda.nombre);
            const descripcion = isSpanish ? tienda.descripcion : (tienda.descripcion_en || tienda.descripcion);
            
            const tiendaDiv = document.createElement('div');
            tiendaDiv.className = 'tienda-card';
            tiendaDiv.dataset.id = tienda.id;
            
            tiendaDiv.innerHTML = `
                <div class="tienda-imagen">
                    <img src="${tienda.imagen || 'img/placeholder-store.jpg'}" alt="${nombre}">
                </div>
                <div class="tienda-info">
                    <h3 class="tienda-nombre">${nombre}</h3>
                    <p class="tienda-descripcion">${descripcion || ''}</p>
                    <div class="tienda-calificacion">
                        ${generarEstrellas(tienda.calificacion || 0)}
                        <span class="tienda-resenas">(${tienda.reseñas || 0} ${isSpanish ? 'reseñas' : 'reviews'})</span>
                    </div>
                    <button class="btn btn-outline btn-block ver-tienda" data-tienda-id="${tienda.id}">
                        ${isSpanish ? 'Ver tienda' : 'View store'}
                    </button>
                </div>
            `;
            
            // Agregar manejador de eventos al botón
            const verTiendaBtn = tiendaDiv.querySelector('.ver-tienda');
            if (verTiendaBtn) {
                verTiendaBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    verTienda(tienda.id);
                });
            }
            
            // Hacer clic en la tarjeta para ver la tienda
            tiendaDiv.addEventListener('click', () => {
                verTienda(tienda.id);
            });
            
            return tiendaDiv;
            
        } catch (error) {
            console.error('Error al crear elemento de tienda:', error);
            return null;
        }
    }
    
    // Generar estrellas de calificación
    function generarEstrellas(calificacion) {
        const estrellasLlenas = Math.floor(calificacion);
        const tieneMediaEstrella = calificacion % 1 >= 0.5;
        const estrellasVacias = 5 - estrellasLlenas - (tieneMediaEstrella ? 1 : 0);
        
        let html = '';
        
        // Estrellas llenas
        for (let i = 0; i < estrellasLlenas; i++) {
            html += '<i class="fas fa-star"></i>';
        }
        
        // Media estrella si es necesario
        if (tieneMediaEstrella) {
            html += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Estrellas vacías
        for (let i = 0; i < estrellasVacias; i++) {
            html += '<i class="far fa-star"></i>';
        }
        
        return html;
    }
    
    // Ver tienda
    function verTienda(tiendaId) {
        console.log(`Viendo tienda ${tiendaId}`);
        // Implementar navegación a la tienda
        if (window.app && window.app.navigateToStore) {
            window.app.navigateToStore(tiendaId);
        } else if (window.app && window.app.navigateTo) {
            window.app.navigateTo('tienda', { store: tiendaId });
        }
    }
    
    // API Pública del módulo
    return {
        init: init,
        getTiendas: () => [...tiendas],
        getTienda: (id) => tiendas.find(t => t.id === id),
        renderTiendasDestacadas: renderTiendasDestacadas
    };
})();

// Inicializar el módulo cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Registrar el módulo en el estado global
    if (window.AppState) {
        window.AppState.modules.tiendas = TiendasModule;
    }
    
    // Inicializar el módulo
    TiendasModule.init();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TiendasModule;
}
