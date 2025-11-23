/**
 * Inicialización de la aplicación Artesanica
 * Maneja la carga de módulos y dependencias
 */

// Estado de la aplicación
window.AppState = {
    isInitialized: false,
    modules: {},
    events: {}
};

// Sistema de eventos simple
window.AppState.events = {
    on: function(event, callback) {
        if (!this[event]) this[event] = [];
        this[event].push(callback);
    },
    emit: function(event, data) {
        if (this[event]) {
            this[event].forEach(callback => callback(data));
        }
    }
};

// Función para inicializar la aplicación
function initializeApp() {
    console.log('Inicializando aplicación...');
    
    // Verificar dependencias críticas
    if (!window.productosData || !window.tiendasData) {
        console.error('Error: Datos de productos o tiendas no cargados');
        return;
    }
    
    // Inicializar módulos
    try {
        // Notificar que los datos están listos
        window.AppState.events.emit('app:ready', {
            productos: window.productosData,
            tiendas: window.tiendasData
        });
        
        // Marcar como inicializado
        window.AppState.isInitialized = true;
        console.log('Aplicación inicializada correctamente');
        
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
    }
}

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si los datos están disponibles
    if (window.productosData && window.tiendasData) {
        initializeApp();
    } else {
        // Si los datos no están disponibles, esperar un momento y reintentar
        setTimeout(function() {
            if (window.productosData && window.tiendasData) {
                initializeApp();
            } else {
                console.error('No se pudieron cargar los datos necesarios');
                // Mostrar mensaje de error al usuario
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.textContent = 'Error al cargar la aplicación. Por favor, recarga la página.';
                document.body.prepend(errorDiv);
            }
        }, 1000);
    }
});

// Manejar errores no capturados
window.addEventListener('error', function(event) {
    console.error('Error no capturado:', event.error);
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeApp };
}
