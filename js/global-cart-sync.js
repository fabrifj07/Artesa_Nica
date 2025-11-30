/**
 * SINCRONIZACIÓN GLOBAL DEL CARRITO
 * Este script asegura que el contador del carrito se sincronice en todas las páginas
 */
(function() {
    'use strict';

    // =================================================================================
    // FUNCIÓN GLOBAL DE SINCRONIZACIÓN
    // =================================================================================

    /**
     * Función global para sincronizar el contador del carrito en todas las páginas
     * Esta función se puede llamar desde cualquier página
     */
    window.syncCartCounterGlobal = function() {
        try {
            // Obtener el usuario actual desde localStorage
            const currentUser = JSON.parse(localStorage.getItem('artesanica_session'));
            
            // Calcular el total de productos en el carrito
            const cartCount = currentUser?.carrito?.reduce((sum, item) => sum + (item.cantidad || 0), 0) || 0;
            
            console.log('🛒 SyncCartCounterGlobal - Usuario:', currentUser?.nombre || 'No logueado');
            console.log('🛒 SyncCartCounterGlobal - Items en carrito:', cartCount);
            
            // Actualizar todos los contadores de carrito (móvil y escritorio)
            document.querySelectorAll('#contador-carrito, #contador-carrito-desk').forEach(el => {
                if (el) {
                    el.textContent = cartCount;
                    el.style.display = cartCount > 0 ? 'flex' : 'none';
                    el.classList.toggle('hidden', cartCount === 0);
                    console.log('🛒 Contador actualizado:', el.id || el.className, '→', cartCount);
                }
            });

            // También actualizar badges con clase .badge o .nav-counter
            document.querySelectorAll('.badge, .nav-counter').forEach(el => {
                if (el && (el.id === 'contador-carrito' || el.id === 'contador-carrito-desk')) {
                    el.textContent = cartCount;
                    el.style.display = cartCount > 0 ? 'flex' : 'none';
                    el.classList.toggle('hidden', cartCount === 0);
                }
            });

        } catch (error) {
            console.error('❌ Error en syncCartCounterGlobal:', error);
        }
    };

    // =================================================================================
    // INICIALIZACIÓN AUTOMÁTICA
    // =================================================================================

    /**
     * Inicializa la sincronización del carrito cuando el DOM está listo
     */
    function initializeCartSync() {
        console.log('🛒 Inicializando sincronización global del carrito...');
        
        // Sincronizar inmediatamente
        window.syncCartCounterGlobal();
        
        // Sincronizar cuando la página gane foco (cuando el usuario vuelve a la página)
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                console.log('🛒 Página visible, sincronizando carrito...');
                setTimeout(window.syncCartCounterGlobal, 100);
            }
        });

        // Sincronizar cuando la ventana gane foco
        window.addEventListener('focus', function() {
            console.log('🛒 Ventana enfocada, sincronizando carrito...');
            setTimeout(window.syncCartCounterGlobal, 100);
        });

        // Sincronizar cuando el usuario interactúa con localStorage (cambios en otras pestañas)
        window.addEventListener('storage', function(e) {
            if (e.key === 'artesanica_session' || e.key === 'artesanica_users') {
                console.log('🛒 Cambio en localStorage detectado, sincronizando carrito...');
                setTimeout(window.syncCartCounterGlobal, 100);
            }
        });

        // Sincronizar periódicamente (cada 3 segundos) solo si la página está visible
        setInterval(function() {
            if (!document.hidden) {
                window.syncCartCounterGlobal();
            }
        }, 3000);

        console.log('✅ Sincronización global del carrito inicializada');
    }

    // =================================================================================
    // EVENT LISTENERS PARA ACTUALIZACIONES DEL CARRITO
    // =================================================================================

    /**
     * Escucha eventos personalizados de actualización del carrito
     */
    function setupCartEventListeners() {
        // Escuchar eventos de actualización del carrito
        window.addEventListener('cartUpdated', function() {
            console.log('🛒 Evento cartUpdated recibido');
            setTimeout(window.syncCartCounterGlobal, 50);
        });

        // Escuchar clics en botones de agregar al carrito
        document.addEventListener('click', function(e) {
            const target = e.target;
            
            // Buscar botones de agregar al carrito
            if (target.matches('.add-to-cart, .btn-cart-custom, [onclick*="addToCart"]')) {
                console.log('🛒 Clic en botón agregar al carrito detectado');
                setTimeout(window.syncCartCounterGlobal, 200);
            }
            
            // Buscar botones de actualizar cantidad
            if (target.matches('.quantity-btn, [onclick*="updateCartQuantity"]')) {
                console.log('🛒 Clic en botón de cantidad detectado');
                setTimeout(window.syncCartCounterGlobal, 200);
            }
        });

        console.log('✅ Event listeners del carrito configurados');
    }

    // =================================================================================
    // INICIALIZAR CUANDO EL DOM ESTÉ LISTO
    // =================================================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initializeCartSync();
            setupCartEventListeners();
        });
    } else {
        // El DOM ya está cargado
        initializeCartSync();
        setupCartEventListeners();
    }

    // =================================================================================
    // HACER DISPONIBLE LA FUNCIÓN GLOBALMENTE
    // =================================================================================

    // También hacer disponible como función del window para compatibilidad
    window.updateCartCounter = window.syncCartCounterGlobal;
    
    console.log('🛒 Módulo de sincronización global del carrito cargado');

})();
