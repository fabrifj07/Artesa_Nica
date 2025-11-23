/**
 * Módulo de Gestión de Sesión
 * Maneja el cierre de sesión y limpieza de datos
 */

(function() {
    'use strict';

    // Cerrar sesión con confirmación
    function logout() {
        // Mostrar confirmación
        if (!confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            return;
        }

        // Limpiar datos de sesión
        clearSessionData();

        // Mostrar mensaje de despedida
        showGoodbyeMessage();

        // Redireccionar después de un breve delay
        setTimeout(() => {
            redirectToHome();
        }, 1500);
    }

    // Limpiar datos de sesión
    function clearSessionData() {
        // Limpiar datos del usuario actual
        localStorage.removeItem('artesanica_currentUser');
        localStorage.removeItem('artesanica_sessionToken');
        
        // Opcional: Limpiar carrito (comentado para mantener el carrito)
        // localStorage.removeItem('artesanica_carrito');
        
        // Limpiar favoritos temporales si los hay
        // localStorage.removeItem('artesanica_favoritos');

        // Disparar evento de cierre de sesión
        window.dispatchEvent(new CustomEvent('user:logout'));
    }

    // Mostrar mensaje de despedida
    function showGoodbyeMessage() {
        // Crear overlay temporal
        const overlay = document.createElement('div');
        overlay.id = 'logout-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease;
        `;

        overlay.innerHTML = `
            <div style="text-align: center; color: white; animation: slideUp 0.5s ease;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">
                    <i class="fas fa-hand-wave"></i>
                </div>
                <h2 style="font-size: 2rem; margin-bottom: 0.5rem;">¡Hasta pronto!</h2>
                <p style="font-size: 1.1rem; opacity: 0.9;">Gracias por visitar ArtesaNica</p>
            </div>
            <style>
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            </style>
        `;

        document.body.appendChild(overlay);
    }

    // Redireccionar a inicio
    function redirectToHome() {
        // Limpiar el overlay
        const overlay = document.getElementById('logout-overlay');
        if (overlay) {
            overlay.remove();
        }

        // Si existe la función de navegación de la app, usarla
        if (window.app && window.app.navigateTo) {
            window.app.navigateTo('inicio');
            
            // Actualizar UI para reflejar que no hay usuario
            if (window.app.updateUI) {
                window.app.updateUI();
            }
        } else {
            // Fallback: recargar la página
            window.location.reload();
        }
    }

    // Cerrar sesión sin confirmación (para uso interno)
    function forceLogout() {
        clearSessionData();
        redirectToHome();
    }

    // Verificar si hay sesión activa
    function hasActiveSession() {
        return localStorage.getItem('artesanica_currentUser') !== null;
    }

    // Obtener información del usuario actual
    function getCurrentUser() {
        const userData = localStorage.getItem('artesanica_currentUser');
        return userData ? JSON.parse(userData) : null;
    }

    // Cerrar todas las sesiones (útil para seguridad)
    function logoutAllDevices() {
        if (!confirm('¿Cerrar sesión en todos los dispositivos? Esta acción no se puede deshacer.')) {
            return;
        }

        // Limpiar todos los datos relacionados con la sesión
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('artesanica_')) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));

        showGoodbyeMessage();
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }

    // Inicializar módulo
    function init() {
        // Verificar si hay sesión activa
        if (!hasActiveSession()) {
            console.log('No hay sesión activa');
            return;
        }

        // Agregar listener para el evento beforeunload (opcional)
        // window.addEventListener('beforeunload', (e) => {
        //     // Opcional: Preguntar antes de cerrar la pestaña
        // });
    }

    // Exponer API pública
    window.SesionModule = {
        init,
        logout,
        forceLogout,
        clearSessionData,
        hasActiveSession,
        getCurrentUser,
        logoutAllDevices
    };

})();
