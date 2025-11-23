/**
 * Módulo de Gestión de Métodos de Pago
 * Maneja CRUD de tarjetas y métodos de pago del usuario
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'artesanica_metodosPago';

    // Clase para gestionar métodos de pago
    class MetodosPagoManager {
        constructor() {
            this.metodos = this.loadMetodos();
        }

        // Cargar métodos desde localStorage
        loadMetodos() {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        }

        // Guardar métodos en localStorage
        saveMetodos() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.metodos));
        }

        // Obtener todos los métodos
        getAll() {
            return this.metodos;
        }

        // Obtener método por ID
        getById(id) {
            return this.metodos.find(m => m.id === id);
        }

        // Obtener método predeterminado
        getDefault() {
            return this.metodos.find(m => m.predeterminado) || this.metodos[0];
        }

        // Enmascarar número de tarjeta
        maskCardNumber(numero) {
            const cleaned = numero.replace(/\s/g, '');
            return '****' + cleaned.slice(-4);
        }

        // Validar tarjeta con algoritmo de Luhn
        validateCard(numero) {
            const cleaned = numero.replace(/\s/g, '');
            if (!/^\d{13,19}$/.test(cleaned)) return false;

            let sum = 0;
            let isEven = false;

            for (let i = cleaned.length - 1; i >= 0; i--) {
                let digit = parseInt(cleaned[i]);

                if (isEven) {
                    digit *= 2;
                    if (digit > 9) digit -= 9;
                }

                sum += digit;
                isEven = !isEven;
            }

            return sum % 10 === 0;
        }

        // Detectar tipo de tarjeta
        detectCardType(numero) {
            const cleaned = numero.replace(/\s/g, '');
            
            if (/^4/.test(cleaned)) return 'visa';
            if (/^5[1-5]/.test(cleaned)) return 'mastercard';
            if (/^3[47]/.test(cleaned)) return 'amex';
            if (/^6(?:011|5)/.test(cleaned)) return 'discover';
            
            return 'other';
        }

        // Agregar nuevo método de pago
        add(metodoData) {
            // Validar tarjeta si es tipo tarjeta
            if (metodoData.tipo === 'tarjeta') {
                if (!this.validateCard(metodoData.numeroTarjeta)) {
                    throw new Error('Número de tarjeta inválido');
                }
            }

            const nuevoMetodo = {
                id: 'pay_' + Date.now(),
                tipo: metodoData.tipo || 'tarjeta',
                nombre: metodoData.nombre,
                numeroTarjeta: metodoData.tipo === 'tarjeta' ? this.maskCardNumber(metodoData.numeroTarjeta) : null,
                numeroCompleto: metodoData.tipo === 'tarjeta' ? metodoData.numeroTarjeta : null, // Solo para validación, no mostrar
                titular: metodoData.titular || '',
                vencimiento: metodoData.vencimiento || '',
                tipoTarjeta: metodoData.tipo === 'tarjeta' ? this.detectCardType(metodoData.numeroTarjeta) : null,
                predeterminado: this.metodos.length === 0 || metodoData.predeterminado || false,
                fechaCreacion: new Date().toISOString()
            };

            // Si es predeterminado, quitar predeterminado de los demás
            if (nuevoMetodo.predeterminado) {
                this.metodos.forEach(m => m.predeterminado = false);
            }

            this.metodos.push(nuevoMetodo);
            this.saveMetodos();
            return nuevoMetodo;
        }

        // Actualizar método
        update(id, metodoData) {
            const index = this.metodos.findIndex(m => m.id === id);
            if (index === -1) return null;

            // Si se marca como predeterminado, quitar de los demás
            if (metodoData.predeterminado) {
                this.metodos.forEach(m => m.predeterminado = false);
            }

            // Si se actualiza el número de tarjeta, validar
            if (metodoData.numeroTarjeta && metodoData.numeroTarjeta !== this.metodos[index].numeroCompleto) {
                if (!this.validateCard(metodoData.numeroTarjeta)) {
                    throw new Error('Número de tarjeta inválido');
                }
                metodoData.numeroTarjeta = this.maskCardNumber(metodoData.numeroTarjeta);
                metodoData.tipoTarjeta = this.detectCardType(metodoData.numeroTarjeta);
            }

            this.metodos[index] = {
                ...this.metodos[index],
                ...metodoData,
                id: id
            };

            this.saveMetodos();
            return this.metodos[index];
        }

        // Eliminar método
        delete(id) {
            const index = this.metodos.findIndex(m => m.id === id);
            if (index === -1) return false;

            const eraPredeterminado = this.metodos[index].predeterminado;
            this.metodos.splice(index, 1);

            // Si era predeterminado y quedan métodos, marcar el primero como predeterminado
            if (eraPredeterminado && this.metodos.length > 0) {
                this.metodos[0].predeterminado = true;
            }

            this.saveMetodos();
            return true;
        }

        // Marcar como predeterminado
        setDefault(id) {
            this.metodos.forEach(m => {
                m.predeterminado = m.id === id;
            });
            this.saveMetodos();
        }
    }

    // Instancia global del manager
    const manager = new MetodosPagoManager();

    // Obtener icono de tarjeta
    function getCardIcon(tipo) {
        const icons = {
            'visa': 'fab fa-cc-visa',
            'mastercard': 'fab fa-cc-mastercard',
            'amex': 'fab fa-cc-amex',
            'discover': 'fab fa-cc-discover',
            'other': 'fas fa-credit-card'
        };
        return icons[tipo] || icons.other;
    }

    // Renderizar lista de métodos de pago
    function renderMetodosPago() {
        const container = document.getElementById('lista-metodos-pago');
        if (!container) return;

        const metodos = manager.getAll();

        if (metodos.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem 1rem;">
                    <div class="empty-icon" style="font-size: 3rem; color: #95a5a6; margin-bottom: 1rem;">
                        <i class="fas fa-credit-card"></i>
                    </div>
                    <h3 style="color: #2c3e50; margin-bottom: 0.5rem;">No tienes métodos de pago guardados</h3>
                    <p style="color: #7f8c8d; margin-bottom: 1.5rem;">Agrega un método de pago para agilizar tus compras</p>
                    <button onclick="window.MetodosPagoModule.showAddForm()" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Agregar Método de Pago
                    </button>
                </div>
            `;
            return;
        }

        const html = metodos.map(metodo => `
            <div class="metodo-card" data-id="${metodo.id}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 1.5rem; margin-bottom: 1rem; color: white; position: relative; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                ${metodo.predeterminado ? '<span class="badge-default" style="position: absolute; top: 1rem; right: 1rem; background: rgba(255,255,255,0.3); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; backdrop-filter: blur(10px);">Predeterminado</span>' : ''}
                
                <div style="margin-bottom: 1.5rem;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">
                        <i class="${getCardIcon(metodo.tipoTarjeta)}"></i>
                    </div>
                    <h4 style="margin-bottom: 0.5rem; font-weight: 500;">${metodo.nombre}</h4>
                    ${metodo.tipo === 'tarjeta' ? `
                        <p style="font-size: 1.25rem; letter-spacing: 2px; margin: 0.5rem 0; font-family: 'Courier New', monospace;">
                            ${metodo.numeroTarjeta}
                        </p>
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; opacity: 0.9;">
                            <span>${metodo.titular}</span>
                            <span>${metodo.vencimiento}</span>
                        </div>
                    ` : `
                        <p style="opacity: 0.9;">${metodo.tipo === 'transferencia' ? 'Transferencia Bancaria' : 'Pago en Efectivo'}</p>
                    `}
                </div>

                <div class="metodo-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${!metodo.predeterminado ? `
                        <button onclick="window.MetodosPagoModule.setDefault('${metodo.id}')" class="btn" style="font-size: 0.85rem; padding: 0.5rem 1rem; background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); backdrop-filter: blur(10px);">
                            <i class="fas fa-star"></i> Predeterminado
                        </button>
                    ` : ''}
                    <button onclick="window.MetodosPagoModule.confirmDelete('${metodo.id}')" class="btn" style="font-size: 0.85rem; padding: 0.5rem 1rem; background: rgba(231,76,60,0.8); color: white; border: none;">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    // Mostrar formulario de agregar
    function showAddForm() {
        const container = document.getElementById('form-metodo-pago-container');
        if (!container) return;

        container.innerHTML = `
            <div class="form-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem;">
                <div class="form-card" style="background: white; border-radius: 12px; padding: 2rem; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;">
                    <h3 style="margin-bottom: 1.5rem; color: #2c3e50;">
                        <i class="fas fa-credit-card"></i> Nuevo Método de Pago
                    </h3>
                    <form id="form-metodo-pago" onsubmit="window.MetodosPagoModule.handleSubmit(event)">
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Tipo de pago *</label>
                            <select name="tipo" class="form-input" onchange="window.MetodosPagoModule.toggleCardFields(this.value)" required>
                                <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                                <option value="transferencia">Transferencia Bancaria</option>
                                <option value="efectivo">Efectivo</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Nombre del método *</label>
                            <input type="text" name="nombre" class="form-input" placeholder="Ej: Tarjeta Personal, Cuenta BAC" required>
                        </div>
                        <div id="card-fields">
                            <div class="form-group" style="margin-bottom: 1rem;">
                                <label class="form-label">Número de tarjeta *</label>
                                <input type="text" name="numeroTarjeta" class="form-input" placeholder="1234 5678 9012 3456" maxlength="19" oninput="window.MetodosPagoModule.formatCardNumber(this)">
                            </div>
                            <div class="form-group" style="margin-bottom: 1rem;">
                                <label class="form-label">Titular de la tarjeta *</label>
                                <input type="text" name="titular" class="form-input" placeholder="Nombre como aparece en la tarjeta">
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                                <div class="form-group">
                                    <label class="form-label">Vencimiento *</label>
                                    <input type="text" name="vencimiento" class="form-input" placeholder="MM/AA" maxlength="5" oninput="window.MetodosPagoModule.formatExpiry(this)">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">CVV *</label>
                                    <input type="text" name="cvv" class="form-input" placeholder="123" maxlength="4" oninput="this.value=this.value.replace(/[^0-9]/g,'')">
                                </div>
                            </div>
                        </div>
                        <div class="form-group" style="margin-bottom: 1.5rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="predeterminado">
                                <span>Marcar como método predeterminado</span>
                            </label>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <i class="fas fa-save"></i> Guardar
                            </button>
                            <button type="button" onclick="window.MetodosPagoModule.closeForm()" class="btn btn-secondary">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // Alternar campos de tarjeta
    function toggleCardFields(tipo) {
        const cardFields = document.getElementById('card-fields');
        if (!cardFields) return;

        if (tipo === 'tarjeta') {
            cardFields.style.display = 'block';
            cardFields.querySelectorAll('input').forEach(input => input.required = true);
        } else {
            cardFields.style.display = 'none';
            cardFields.querySelectorAll('input').forEach(input => {
                input.required = false;
                input.value = '';
            });
        }
    }

    // Formatear número de tarjeta
    function formatCardNumber(input) {
        let value = input.value.replace(/\s/g, '');
        value = value.replace(/[^0-9]/g, '');
        
        let formatted = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formatted += ' ';
            }
            formatted += value[i];
        }
        
        input.value = formatted;
    }

    // Formatear fecha de vencimiento
    function formatExpiry(input) {
        let value = input.value.replace(/\//g, '');
        value = value.replace(/[^0-9]/g, '');
        
        if (value.length >= 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        
        input.value = value;
    }

    // Manejar envío del formulario
    function handleSubmit(event, id = null) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const metodoData = {
            tipo: formData.get('tipo'),
            nombre: formData.get('nombre'),
            numeroTarjeta: formData.get('numeroTarjeta'),
            titular: formData.get('titular'),
            vencimiento: formData.get('vencimiento'),
            predeterminado: formData.get('predeterminado') === 'on'
        };

        try {
            if (id) {
                manager.update(id, metodoData);
                if (window.app && window.app.notify) {
                    window.app.notify('payment.updated', 'Método de pago actualizado', 'success');
                }
            } else {
                manager.add(metodoData);
                if (window.app && window.app.notify) {
                    window.app.notify('payment.added', 'Método de pago agregado', 'success');
                }
            }

            closeForm();
            renderMetodosPago();
        } catch (error) {
            alert(error.message);
        }
    }

    // Cerrar formulario
    function closeForm() {
        const container = document.getElementById('form-metodo-pago-container');
        if (container) {
            container.innerHTML = '';
        }
    }

    // Confirmar eliminación
    function confirmDelete(id) {
        const metodo = manager.getById(id);
        if (!metodo) return;

        if (confirm(`¿Estás seguro de eliminar el método "${metodo.nombre}"?`)) {
            manager.delete(id);
            if (window.app && window.app.notify) {
                window.app.notify('payment.deleted', 'Método de pago eliminado', 'success');
            }
            renderMetodosPago();
        }
    }

    // Marcar como predeterminado
    function setDefault(id) {
        manager.setDefault(id);
        if (window.app && window.app.notify) {
            window.app.notify('payment.defaultSet', 'Método predeterminado actualizado', 'success');
        }
        renderMetodosPago();
    }

    // Inicializar módulo
    function init() {
        renderMetodosPago();
    }

    // Exponer API pública
    window.MetodosPagoModule = {
        init,
        renderMetodosPago,
        showAddForm,
        handleSubmit,
        closeForm,
        confirmDelete,
        setDefault,
        toggleCardFields,
        formatCardNumber,
        formatExpiry,
        manager
    };

})();
