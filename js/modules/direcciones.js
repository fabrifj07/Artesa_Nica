/**
 * Módulo de Gestión de Direcciones
 * Maneja CRUD de direcciones de entrega del usuario
 */

(function() {
    'use strict';

    const STORAGE_KEY = 'artesanica_direcciones';

    // Clase para gestionar direcciones
    class DireccionesManager {
        constructor() {
            this.direcciones = this.loadDirecciones();
        }

        // Cargar direcciones desde localStorage
        loadDirecciones() {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        }

        // Guardar direcciones en localStorage
        saveDirecciones() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.direcciones));
        }

        // Obtener todas las direcciones
        getAll() {
            return this.direcciones;
        }

        // Obtener dirección por ID
        getById(id) {
            return this.direcciones.find(dir => dir.id === id);
        }

        // Obtener dirección predeterminada
        getDefault() {
            return this.direcciones.find(dir => dir.predeterminada) || this.direcciones[0];
        }

        // Agregar nueva dirección
        add(direccionData) {
            const nuevaDireccion = {
                id: 'addr_' + Date.now(),
                nombre: direccionData.nombre,
                direccion: direccionData.direccion,
                ciudad: direccionData.ciudad || 'Niquinohomo',
                departamento: direccionData.departamento || 'Masaya',
                telefono: direccionData.telefono,
                referencia: direccionData.referencia || '',
                predeterminada: this.direcciones.length === 0 || direccionData.predeterminada || false,
                fechaCreacion: new Date().toISOString()
            };

            // Si es predeterminada, quitar predeterminada de las demás
            if (nuevaDireccion.predeterminada) {
                this.direcciones.forEach(dir => dir.predeterminada = false);
            }

            this.direcciones.push(nuevaDireccion);
            this.saveDirecciones();
            return nuevaDireccion;
        }

        // Actualizar dirección
        update(id, direccionData) {
            const index = this.direcciones.findIndex(dir => dir.id === id);
            if (index === -1) return null;

            // Si se marca como predeterminada, quitar de las demás
            if (direccionData.predeterminada) {
                this.direcciones.forEach(dir => dir.predeterminada = false);
            }

            this.direcciones[index] = {
                ...this.direcciones[index],
                ...direccionData,
                id: id // Mantener el ID original
            };

            this.saveDirecciones();
            return this.direcciones[index];
        }

        // Eliminar dirección
        delete(id) {
            const index = this.direcciones.findIndex(dir => dir.id === id);
            if (index === -1) return false;

            const eraPredeterminada = this.direcciones[index].predeterminada;
            this.direcciones.splice(index, 1);

            // Si era predeterminada y quedan direcciones, marcar la primera como predeterminada
            if (eraPredeterminada && this.direcciones.length > 0) {
                this.direcciones[0].predeterminada = true;
            }

            this.saveDirecciones();
            return true;
        }

        // Marcar como predeterminada
        setDefault(id) {
            this.direcciones.forEach(dir => {
                dir.predeterminada = dir.id === id;
            });
            this.saveDirecciones();
        }
    }

    // Instancia global del manager
    const manager = new DireccionesManager();

    // Renderizar lista de direcciones
    function renderDirecciones() {
        const container = document.getElementById('lista-direcciones');
        if (!container) return;

        const direcciones = manager.getAll();

        if (direcciones.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="text-align: center; padding: 3rem 1rem;">
                    <div class="empty-icon" style="font-size: 3rem; color: #95a5a6; margin-bottom: 1rem;">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <h3 style="color: #2c3e50; margin-bottom: 0.5rem;">No tienes direcciones guardadas</h3>
                    <p style="color: #7f8c8d; margin-bottom: 1.5rem;">Agrega una dirección para facilitar tus compras</p>
                    <button onclick="window.DireccionesModule.showAddForm()" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Agregar Dirección
                    </button>
                </div>
            `;
            return;
        }

        const html = direcciones.map(dir => `
            <div class="direccion-card" data-id="${dir.id}" style="background: white; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 4px rgba(0,0,0,0.05); position: relative;">
                ${dir.predeterminada ? '<span class="badge-default" style="position: absolute; top: 1rem; right: 1rem; background: var(--color-primario); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem;">Predeterminada</span>' : ''}
                
                <div style="margin-bottom: 1rem;">
                    <h4 style="color: #2c3e50; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-map-marker-alt" style="color: var(--color-primario);"></i>
                        ${dir.nombre}
                    </h4>
                    <p style="color: #555; margin: 0.25rem 0;">${dir.direccion}</p>
                    <p style="color: #7f8c8d; margin: 0.25rem 0; font-size: 0.9rem;">${dir.ciudad}, ${dir.departamento}</p>
                    ${dir.referencia ? `<p style="color: #95a5a6; margin: 0.25rem 0; font-size: 0.85rem;"><i class="fas fa-info-circle"></i> ${dir.referencia}</p>` : ''}
                    <p style="color: #7f8c8d; margin: 0.25rem 0; font-size: 0.9rem;">
                        <i class="fas fa-phone"></i> ${dir.telefono}
                    </p>
                </div>

                <div class="direccion-actions" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    ${!dir.predeterminada ? `
                        <button onclick="window.DireccionesModule.setDefault('${dir.id}')" class="btn btn-secondary" style="font-size: 0.85rem; padding: 0.5rem 1rem;">
                            <i class="fas fa-star"></i> Predeterminada
                        </button>
                    ` : ''}
                    <button onclick="window.DireccionesModule.showEditForm('${dir.id}')" class="btn btn-secondary" style="font-size: 0.85rem; padding: 0.5rem 1rem;">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="window.DireccionesModule.confirmDelete('${dir.id}')" class="btn btn-text" style="font-size: 0.85rem; padding: 0.5rem 1rem; color: #e74c3c;">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    // Mostrar formulario de agregar
    function showAddForm() {
        const container = document.getElementById('form-direccion-container');
        if (!container) return;

        container.innerHTML = `
            <div class="form-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem;">
                <div class="form-card" style="background: white; border-radius: 12px; padding: 2rem; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;">
                    <h3 style="margin-bottom: 1.5rem; color: #2c3e50;">
                        <i class="fas fa-map-marker-alt"></i> Nueva Dirección
                    </h3>
                    <form id="form-direccion" onsubmit="window.DireccionesModule.handleSubmit(event)">
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Nombre de la dirección *</label>
                            <input type="text" name="nombre" class="form-input" placeholder="Ej: Casa, Trabajo, etc." required>
                        </div>
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Dirección completa *</label>
                            <input type="text" name="direccion" class="form-input" placeholder="Calle, número, barrio" required>
                        </div>
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Ciudad</label>
                            <input type="text" name="ciudad" class="form-input" value="Niquinohomo">
                        </div>
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Departamento</label>
                            <input type="text" name="departamento" class="form-input" value="Masaya">
                        </div>
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Teléfono *</label>
                            <input type="tel" name="telefono" class="form-input" placeholder="+505 8888 1234" required>
                        </div>
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Referencia (opcional)</label>
                            <textarea name="referencia" class="form-input" rows="2" placeholder="Ej: Frente al parque, casa color azul"></textarea>
                        </div>
                        <div class="form-group" style="margin-bottom: 1.5rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="predeterminada">
                                <span>Marcar como dirección predeterminada</span>
                            </label>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <i class="fas fa-save"></i> Guardar
                            </button>
                            <button type="button" onclick="window.DireccionesModule.closeForm()" class="btn btn-secondary">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // Mostrar formulario de editar
    function showEditForm(id) {
        const direccion = manager.getById(id);
        if (!direccion) return;

        const container = document.getElementById('form-direccion-container');
        if (!container) return;

        container.innerHTML = `
            <div class="form-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1rem;">
                <div class="form-card" style="background: white; border-radius: 12px; padding: 2rem; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;">
                    <h3 style="margin-bottom: 1.5rem; color: #2c3e50;">
                        <i class="fas fa-edit"></i> Editar Dirección
                    </h3>
                    <form id="form-direccion" onsubmit="window.DireccionesModule.handleSubmit(event, '${id}')">
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Nombre de la dirección *</label>
                            <input type="text" name="nombre" class="form-input" value="${direccion.nombre}" required>
                        </div>
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Dirección completa *</label>
                            <input type="text" name="direccion" class="form-input" value="${direccion.direccion}" required>
                        </div>
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Ciudad</label>
                            <input type="text" name="ciudad" class="form-input" value="${direccion.ciudad}">
                        </div>
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Departamento</label>
                            <input type="text" name="departamento" class="form-input" value="${direccion.departamento}">
                        </div>
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Teléfono *</label>
                            <input type="tel" name="telefono" class="form-input" value="${direccion.telefono}" required>
                        </div>
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label class="form-label">Referencia (opcional)</label>
                            <textarea name="referencia" class="form-input" rows="2">${direccion.referencia || ''}</textarea>
                        </div>
                        <div class="form-group" style="margin-bottom: 1.5rem;">
                            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                <input type="checkbox" name="predeterminada" ${direccion.predeterminada ? 'checked' : ''}>
                                <span>Marcar como dirección predeterminada</span>
                            </label>
                        </div>
                        <div style="display: flex; gap: 0.5rem;">
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <i class="fas fa-save"></i> Guardar Cambios
                            </button>
                            <button type="button" onclick="window.DireccionesModule.closeForm()" class="btn btn-secondary">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // Manejar envío del formulario
    function handleSubmit(event, id = null) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);

        const direccionData = {
            nombre: formData.get('nombre'),
            direccion: formData.get('direccion'),
            ciudad: formData.get('ciudad'),
            departamento: formData.get('departamento'),
            telefono: formData.get('telefono'),
            referencia: formData.get('referencia'),
            predeterminada: formData.get('predeterminada') === 'on'
        };

        if (id) {
            manager.update(id, direccionData);
            if (window.app && window.app.notify) {
                window.app.notify('addresses.updated', 'Dirección actualizada correctamente', 'success');
            }
        } else {
            manager.add(direccionData);
            if (window.app && window.app.notify) {
                window.app.notify('addresses.added', 'Dirección agregada correctamente', 'success');
            }
        }

        closeForm();
        renderDirecciones();
    }

    // Cerrar formulario
    function closeForm() {
        const container = document.getElementById('form-direccion-container');
        if (container) {
            container.innerHTML = '';
        }
    }

    // Confirmar eliminación
    function confirmDelete(id) {
        const direccion = manager.getById(id);
        if (!direccion) return;

        if (confirm(`¿Estás seguro de eliminar la dirección "${direccion.nombre}"?`)) {
            manager.delete(id);
            if (window.app && window.app.notify) {
                window.app.notify('addresses.deleted', 'Dirección eliminada correctamente', 'success');
            }
            renderDirecciones();
        }
    }

    // Marcar como predeterminada
    function setDefault(id) {
        manager.setDefault(id);
        if (window.app && window.app.notify) {
            window.app.notify('addresses.defaultSet', 'Dirección predeterminada actualizada', 'success');
        }
        renderDirecciones();
    }

    // Inicializar módulo
    function init() {
        renderDirecciones();
    }

    // Exponer API pública
    window.DireccionesModule = {
        init,
        renderDirecciones,
        showAddForm,
        showEditForm,
        handleSubmit,
        closeForm,
        confirmDelete,
        setDefault,
        manager
    };

})();
