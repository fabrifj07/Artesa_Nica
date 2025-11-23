/**
 * Módulo de Configuración
 * Maneja preferencias y ajustes de la cuenta del usuario
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'artesanica_configuracion';

    // Configuración por defecto
    const DEFAULT_CONFIG = {
        idioma: 'es',
        notificacionesEmail: true,
        notificacionesPush: false,
        tema: 'light',
        moneda: 'NIO',
        mostrarPrecios: true,
        privacidadPerfil: 'publico'
    };

    // Clase para gestionar configuración
    class ConfiguracionManager {
        constructor() {
            this.config = this.loadConfig();
        }

        // Cargar configuración desde localStorage
        loadConfig() {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? { ...DEFAULT_CONFIG, ...JSON.parse(data) } : { ...DEFAULT_CONFIG };
        }

        // Guardar configuración en localStorage
        saveConfig() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
        }

        // Obtener configuración completa
        getAll() {
            return { ...this.config };
        }

        // Obtener valor específico
        get(key) {
            return this.config[key];
        }

        // Actualizar configuración
        update(updates) {
            this.config = { ...this.config, ...updates };
            this.saveConfig();
            
            // Aplicar cambios inmediatamente
            this.applyChanges(updates);
            
            return this.config;
        }

        // Aplicar cambios en la interfaz
        applyChanges(updates) {
            // Cambio de idioma
            if (updates.idioma && window.i18n) {
                window.i18n.setLanguage(updates.idioma);
            }

            // Cambio de tema (preparado para futuro)
            if (updates.tema) {
                document.documentElement.setAttribute('data-theme', updates.tema);
            }

            // Disparar evento personalizado
            window.dispatchEvent(new CustomEvent('config:changed', { detail: updates }));
        }

        // Resetear a valores por defecto
        reset() {
            this.config = { ...DEFAULT_CONFIG };
            this.saveConfig();
            this.applyChanges(this.config);
            return this.config;
        }
    }

    // Instancia global del manager
    const manager = new ConfiguracionManager();

    // Renderizar panel de configuración
    function renderConfiguracion() {
        const container = document.getElementById('panel-configuracion');
        if (!container) return;

        const config = manager.getAll();

        container.innerHTML = `
            <div class="config-container" style="max-width: 600px; margin: 0 auto;">
                
                <!-- Sección: Idioma y Región -->
                <div class="config-section" style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <h3 style="color: #2c3e50; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-globe"></i> Idioma y Región
                    </h3>
                    
                    <div class="config-item" style="margin-bottom: 1rem;">
                        <label class="form-label">Idioma</label>
                        <select id="config-idioma" class="form-input" onchange="window.ConfiguracionModule.updateConfig('idioma', this.value)">
                            <option value="es" ${config.idioma === 'es' ? 'selected' : ''}>Español</option>
                            <option value="en" ${config.idioma === 'en' ? 'selected' : ''}>English</option>
                        </select>
                    </div>

                    <div class="config-item">
                        <label class="form-label">Moneda</label>
                        <select id="config-moneda" class="form-input" onchange="window.ConfiguracionModule.updateConfig('moneda', this.value)">
                            <option value="NIO" ${config.moneda === 'NIO' ? 'selected' : ''}>Córdoba (C$)</option>
                            <option value="USD" ${config.moneda === 'USD' ? 'selected' : ''}>Dólar ($)</option>
                        </select>
                    </div>
                </div>

                <!-- Sección: Notificaciones -->
                <div class="config-section" style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <h3 style="color: #2c3e50; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-bell"></i> Notificaciones
                    </h3>
                    
                    <div class="config-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #eee;">
                        <div>
                            <div style="font-weight: 500; color: #2c3e50;">Notificaciones por Email</div>
                            <div style="font-size: 0.85rem; color: #7f8c8d;">Recibe actualizaciones de pedidos por correo</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="config-email" ${config.notificacionesEmail ? 'checked' : ''} onchange="window.ConfiguracionModule.updateConfig('notificacionesEmail', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>

                    <div class="config-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0;">
                        <div>
                            <div style="font-weight: 500; color: #2c3e50;">Notificaciones Push</div>
                            <div style="font-size: 0.85rem; color: #7f8c8d;">Recibe notificaciones en el navegador</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="config-push" ${config.notificacionesPush ? 'checked' : ''} onchange="window.ConfiguracionModule.updateConfig('notificacionesPush', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>

                <!-- Sección: Apariencia -->
                <div class="config-section" style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <h3 style="color: #2c3e50; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-palette"></i> Apariencia
                    </h3>
                    
                    <div class="config-item" style="margin-bottom: 1rem;">
                        <label class="form-label">Tema</label>
                        <select id="config-tema" class="form-input" onchange="window.ConfiguracionModule.updateConfig('tema', this.value)">
                            <option value="light" ${config.tema === 'light' ? 'selected' : ''}>Claro</option>
                            <option value="dark" ${config.tema === 'dark' ? 'selected' : ''}>Oscuro</option>
                            <option value="auto" ${config.tema === 'auto' ? 'selected' : ''}>Automático</option>
                        </select>
                        <small style="color: #7f8c8d; font-size: 0.85rem;">Próximamente disponible</small>
                    </div>

                    <div class="config-item" style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0;">
                        <div>
                            <div style="font-weight: 500; color: #2c3e50;">Mostrar Precios</div>
                            <div style="font-size: 0.85rem; color: #7f8c8d;">Mostrar precios en los productos</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="config-precios" ${config.mostrarPrecios ? 'checked' : ''} onchange="window.ConfiguracionModule.updateConfig('mostrarPrecios', this.checked)">
                            <span class="slider"></span>
                        </label>
                    </div>
                </div>

                <!-- Sección: Privacidad -->
                <div class="config-section" style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <h3 style="color: #2c3e50; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-shield-alt"></i> Privacidad
                    </h3>
                    
                    <div class="config-item">
                        <label class="form-label">Privacidad del Perfil</label>
                        <select id="config-privacidad" class="form-input" onchange="window.ConfiguracionModule.updateConfig('privacidadPerfil', this.value)">
                            <option value="publico" ${config.privacidadPerfil === 'publico' ? 'selected' : ''}>Público</option>
                            <option value="privado" ${config.privacidadPerfil === 'privado' ? 'selected' : ''}>Privado</option>
                        </select>
                    </div>
                </div>

                <!-- Sección: Cuenta -->
                <div class="config-section" style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <h3 style="color: #2c3e50; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-user-cog"></i> Cuenta
                    </h3>
                    
                    <button onclick="window.ConfiguracionModule.showChangePassword()" class="btn btn-secondary" style="width: 100%; margin-bottom: 0.5rem;">
                        <i class="fas fa-key"></i> Cambiar Contraseña
                    </button>
                    
                    <button onclick="window.ConfiguracionModule.confirmReset()" class="btn btn-text" style="width: 100%; color: #e74c3c;">
                        <i class="fas fa-undo"></i> Restablecer Configuración
                    </button>
                </div>

            </div>

            <!-- Estilos para el switch -->
            <style>
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 24px;
                }
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                    border-radius: 24px;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                input:checked + .slider {
                    background-color: var(--color-primario);
                }
                input:checked + .slider:before {
                    transform: translateX(26px);
                }
            </style>
        `;
    }

    // Actualizar configuración individual
    function updateConfig(key, value) {
        const updates = { [key]: value };
        manager.update(updates);
        
        if (window.app && window.app.notify) {
            window.app.notify('config.updated', 'Configuración actualizada', 'success');
        }
    }

    // Mostrar formulario de cambio de contraseña
    function showChangePassword() {
        const container = document.getElementById('form-password-container');
        if (!container) {
            // Crear contenedor si no existe
            const newContainer = document.createElement('div');
            newContainer.id = 'form-password-container';
            document.body.appendChild(newContainer);
        }

        const formContainer = document.getElementById('form-password-container');
        formContainer.innerHTML = `
            <div class="form-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem;">
                <div class="form-card" style="background: white; border-radius: 12px; padding: 2rem; max-width: 400px; width: 100%;">
                    <h3 style="margin-bottom: 1.5rem; color: #2c3e50;">
                        <i class="fas fa-key"></i> Cambiar Contraseña
                    </h3>
                    <form id="form-change-password" onsubmit="window.ConfiguracionModule.handleChangePassword(event)">
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Contraseña Actual</label>
                            <input type="password" name="currentPassword" class="form-input" required>
                        </div>
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Nueva Contraseña</label>
                            <input type="password" name="newPassword" class="form-input" minlength="6" required>
                        </div>
                        <div class="form-group" style="margin-bottom: 1.5rem;">
                            <label class="form-label">Confirmar Nueva Contraseña</label>
                            <input type="password" name="confirmPassword" class="form-input" minlength="6" required>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <i class="fas fa-save"></i> Cambiar
                            </button>
                            <button type="button" onclick="window.ConfiguracionModule.closePasswordForm()" class="btn btn-secondary">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // Manejar cambio de contraseña
    function handleChangePassword(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const currentPassword = formData.get('currentPassword');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');

        if (newPassword !== confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }

        // Aquí iría la lógica real de cambio de contraseña
        // Por ahora solo simulamos
        if (window.app && window.app.notify) {
            window.app.notify('password.changed', 'Contraseña cambiada correctamente', 'success');
        }

        closePasswordForm();
    }

    // Cerrar formulario de contraseña
    function closePasswordForm() {
        const container = document.getElementById('form-password-container');
        if (container) {
            container.innerHTML = '';
        }
    }

    // Confirmar reset de configuración
    function confirmReset() {
        if (confirm('¿Estás seguro de restablecer toda la configuración a los valores predeterminados?')) {
            manager.reset();
            renderConfiguracion();
            if (window.app && window.app.notify) {
                window.app.notify('config.reset', 'Configuración restablecida', 'success');
            }
        }
    }

    // Inicializar módulo
    function init() {
        renderConfiguracion();
        
        // Aplicar configuración actual
        manager.applyChanges(manager.getAll());
    }

    // Exponer API pública
    window.ConfiguracionModule = {
        init,
        renderConfiguracion,
        updateConfig,
        showChangePassword,
        handleChangePassword,
        closePasswordForm,
        confirmReset,
        manager
    };

})();
