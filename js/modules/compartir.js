/**
 * Módulo de Compartir Web
 * Permite compartir la plataforma en redes sociales
 */

(function() {
    'use strict';

    const APP_URL = 'https://artesanica.netlify.app/';
    const APP_NAME = 'ArtesaNica';
    const APP_DESCRIPTION = 'Descubre productos artesanales únicos de Niquinohomo, Nicaragua';

    // Mostrar modal de compartir
    function showShareModal() {
        const container = document.getElementById('share-modal-container');
        if (!container) {
            // Crear contenedor si no existe
            const newContainer = document.createElement('div');
            newContainer.id = 'share-modal-container';
            document.body.appendChild(newContainer);
        }

        const modalContainer = document.getElementById('share-modal-container');
        modalContainer.innerHTML = `
            <div class="share-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem;" onclick="if(event.target === this) window.CompartirModule.closeModal()">
                <div class="share-card" style="background: white; border-radius: 16px; padding: 2rem; max-width: 500px; width: 100%; box-shadow: 0 8px 32px rgba(0,0,0,0.2);">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">
                            <i class="fas fa-share-alt" style="color: var(--color-primario);"></i>
                        </div>
                        <h3 style="color: #2c3e50; margin-bottom: 0.5rem;">Compartir ArtesaNica</h3>
                        <p style="color: #7f8c8d; font-size: 0.9rem;">Ayúdanos a crecer compartiendo nuestra plataforma</p>
                    </div>

                    <div class="share-options" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
                        
                        <!-- WhatsApp -->
                        <button onclick="window.CompartirModule.shareWhatsApp()" class="share-btn" style="background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; border: none; border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; transition: transform 0.2s;">
                            <i class="fab fa-whatsapp" style="font-size: 2rem;"></i>
                            <span style="font-weight: 500;">WhatsApp</span>
                        </button>

                        <!-- Facebook -->
                        <button onclick="window.CompartirModule.shareFacebook()" class="share-btn" style="background: linear-gradient(135deg, #1877F2 0%, #0C63D4 100%); color: white; border: none; border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; transition: transform 0.2s;">
                            <i class="fab fa-facebook-f" style="font-size: 2rem;"></i>
                            <span style="font-weight: 500;">Facebook</span>
                        </button>

                        <!-- Twitter/X -->
                        <button onclick="window.CompartirModule.shareTwitter()" class="share-btn" style="background: linear-gradient(135deg, #1DA1F2 0%, #0C85D0 100%); color: white; border: none; border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; transition: transform 0.2s;">
                            <i class="fab fa-twitter" style="font-size: 2rem;"></i>
                            <span style="font-weight: 500;">Twitter</span>
                        </button>

                        <!-- Email -->
                        <button onclick="window.CompartirModule.shareEmail()" class="share-btn" style="background: linear-gradient(135deg, #EA4335 0%, #C5221F 100%); color: white; border: none; border-radius: 12px; padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; cursor: pointer; transition: transform 0.2s;">
                            <i class="fas fa-envelope" style="font-size: 2rem;"></i>
                            <span style="font-weight: 500;">Email</span>
                        </button>

                    </div>

                    <!-- Copiar enlace -->
                    <div style="background: #f8f9fa; border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
                        <label style="display: block; color: #7f8c8d; font-size: 0.85rem; margin-bottom: 0.5rem;">Enlace de la plataforma</label>
                        <div style="display: flex; gap: 0.5rem;">
                            <input type="text" id="share-url-input" value="${APP_URL}" readonly class="form-input" style="flex: 1; background: white;">
                            <button onclick="window.CompartirModule.copyLink()" class="btn btn-primary" style="white-space: nowrap;">
                                <i class="fas fa-copy"></i> Copiar
                            </button>
                        </div>
                    </div>

                    <!-- Botón de cerrar -->
                    <button onclick="window.CompartirModule.closeModal()" class="btn btn-secondary" style="width: 100%;">
                        Cerrar
                    </button>
                </div>
            </div>

            <style>
                .share-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
                .share-btn:active {
                    transform: translateY(0);
                }
            </style>
        `;
    }

    // Compartir en WhatsApp
    function shareWhatsApp() {
        const text = encodeURIComponent(`¡Mira ${APP_NAME}! ${APP_DESCRIPTION}\n${APP_URL}`);
        const url = `https://wa.me/?text=${text}`;
        window.open(url, '_blank');
    }

    // Compartir en Facebook
    function shareFacebook() {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(APP_URL)}`;
        window.open(url, '_blank', 'width=600,height=400');
    }

    // Compartir en Twitter
    function shareTwitter() {
        const text = encodeURIComponent(`¡Descubre ${APP_NAME}! ${APP_DESCRIPTION}`);
        const url = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(APP_URL)}`;
        window.open(url, '_blank', 'width=600,height=400');
    }

    // Compartir por Email
    function shareEmail() {
        const subject = encodeURIComponent(`Te recomiendo ${APP_NAME}`);
        const body = encodeURIComponent(`Hola,\n\nQuiero compartir contigo ${APP_NAME}, una plataforma increíble para descubrir productos artesanales de Niquinohomo, Nicaragua.\n\n${APP_DESCRIPTION}\n\nVisítala aquí: ${APP_URL}\n\n¡Espero que te guste!`);
        const url = `mailto:?subject=${subject}&body=${body}`;
        window.location.href = url;
    }

    // Copiar enlace al portapapeles
    function copyLink() {
        const input = document.getElementById('share-url-input');
        if (!input) return;

        // Seleccionar el texto
        input.select();
        input.setSelectionRange(0, 99999); // Para móviles

        // Intentar copiar con la API moderna
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(APP_URL)
                .then(() => {
                    showCopySuccess();
                })
                .catch(() => {
                    // Fallback al método antiguo
                    fallbackCopy();
                });
        } else {
            // Fallback al método antiguo
            fallbackCopy();
        }
    }

    // Método de copia fallback
    function fallbackCopy() {
        const input = document.getElementById('share-url-input');
        try {
            document.execCommand('copy');
            showCopySuccess();
        } catch (err) {
            alert('No se pudo copiar el enlace. Por favor, cópialo manualmente.');
        }
    }

    // Mostrar mensaje de éxito al copiar
    function showCopySuccess() {
        if (window.app && window.app.notify) {
            window.app.notify('share.copied', 'Enlace copiado al portapapeles', 'success');
        } else {
            // Mostrar feedback visual temporal
            const btn = event.target.closest('button');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copiado';
            btn.style.background = '#27ae60';
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
            }, 2000);
        }
    }

    // Usar Web Share API si está disponible (principalmente móviles)
    function shareNative() {
        if (navigator.share) {
            navigator.share({
                title: APP_NAME,
                text: APP_DESCRIPTION,
                url: APP_URL
            })
            .then(() => {
                if (window.app && window.app.notify) {
                    window.app.notify('share.success', 'Compartido exitosamente', 'success');
                }
            })
            .catch((error) => {
                // Usuario canceló o error
                console.log('Error al compartir:', error);
            });
        } else {
            // Si no está disponible, mostrar modal
            showShareModal();
        }
    }

    // Cerrar modal
    function closeModal() {
        const container = document.getElementById('share-modal-container');
        if (container) {
            container.innerHTML = '';
        }
    }

    // Inicializar módulo
    function init() {
        // Intentar usar Web Share API si está disponible
        if (navigator.share) {
            shareNative();
        } else {
            showShareModal();
        }
    }

    // Exponer API pública
    window.CompartirModule = {
        init,
        showShareModal,
        shareWhatsApp,
        shareFacebook,
        shareTwitter,
        shareEmail,
        copyLink,
        shareNative,
        closeModal
    };

})();
