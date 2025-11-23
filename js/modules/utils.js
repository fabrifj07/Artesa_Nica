/**
 * MÓDULO DE UTILIDADES
 * Funciones utilitarias reutilizables en toda la aplicación
 */

(function() {
  'use strict';

  // =================================================================================
  // FUNCIONES DE TEXTO E INTERNACIONALIZACIÓN
  // =================================================================================

  /**
   * Obtiene el texto en el idioma actual
   * @param {Object} obj - Objeto con las traducciones
   * @param {string} esKey - Clave para español
   * @param {string} enKey - Clave para inglés
   * @returns {string} Texto en el idioma actual
   */
  function getText(obj, esKey, enKey) {
    const lang = window.i18n?.getLang?.() || "es";
    if (lang === "en" && obj && obj[enKey]) return obj[enKey];
    return obj ? obj[esKey] : "";
  }

  /**
   * Obtiene la etiqueta traducida de una categoría
   * @param {string} catId - ID de la categoría
   * @returns {string} Etiqueta traducida
   */
  function getCategoryLabel(catId) {
    const key = `categories.${catId}`;
    const val = window.i18n?.t?.(key);
    return val && val !== key ? val : catId;
  }

  /**
   * Obtiene el locale actual para formateo
   * @returns {string} Locale (es-ES o en-US)
   */
  function getLocale() {
    const lang = window.i18n?.getLang?.() || "es";
    return lang === "en" ? "en-US" : "es-ES";
  }

  // =================================================================================
  // FUNCIONES DE FORMATEO
  // =================================================================================

  /**
   * Formatea un valor como moneda
   * @param {number} value - Valor a formatear
   * @returns {string} Valor formateado como moneda
   */
  function formatCurrency(value) {
    try {
      const nf = new Intl.NumberFormat(getLocale(), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `C$${nf.format(Number(value || 0))}`;
    } catch (_) {
      return `C$${Number(value || 0).toFixed(2)}`;
    }
  }

  /**
   * Formatea una fecha ISO
   * @param {string} dateISO - Fecha en formato ISO
   * @param {Object} options - Opciones de formateo
   * @returns {string} Fecha formateada
   */
  function formatDate(dateISO, options) {
    try {
      const d = new Date(dateISO);
      const fmt = new Intl.DateTimeFormat(
        getLocale(),
        options || { year: "numeric", month: "long", day: "numeric" }
      );
      return fmt.format(d);
    } catch (_) {
      return new Date(dateISO).toLocaleDateString();
    }
  }

  // =================================================================================
  // NOTIFICACIONES
  // =================================================================================

  /**
   * Muestra una notificación al usuario
   * @param {string} key - Clave de traducción
   * @param {string} fallback - Texto por defecto
   * @param {string} type - Tipo de notificación (info, exito, error)
   * @param {Object} params - Parámetros para la traducción
   */
  function notify(key, fallback, type = "info", params = {}) {
    const msg = window.i18n?.t?.(key, params) || fallback;
    showNotification(msg, type);
  }

  /**
   * Muestra una notificación visual
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de notificación
   */
  function showNotification(message, type = "info") {
    const notif = document.createElement("div");
    notif.className = `notification ${type}`;
    notif.textContent = message;
    document.body.appendChild(notif);
    
    setTimeout(() => {
      notif.classList.add("show");
    }, 10);
    
    setTimeout(() => {
      notif.classList.remove("show");
      setTimeout(() => notif.remove(), 500);
    }, 3000);
  }

  // =================================================================================
  // BÚSQUEDA
  // =================================================================================

  /**
   * Realiza una búsqueda de productos
   * @param {string} query - Término de búsqueda
   * @param {Array} products - Array de productos
   * @returns {Array} Productos que coinciden con la búsqueda
   */
  function performSearch(query, products) {
    const lowerCaseQuery = query.trim().toLowerCase();
    
    if (!lowerCaseQuery) {
      return [];
    }

    return products.filter((p) => {
      const fields = [
        p.nombre,
        p.descripcion,
        p?.tienda?.nombre,
        p.nombre_en,
        p.descripcion_en,
        p?.tienda?.nombre_en,
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());
      
      return fields.some((f) => f.includes(lowerCaseQuery));
    });
  }

  // =================================================================================
  // SINCRONIZACIÓN DE UI
  // =================================================================================

  /**
   * Función centralizada para sincronizar el contador del carrito
   * Esta es la ÚNICA función que debe actualizar el contador del carrito
   * @param {Object} currentUser - Usuario actual con su carrito
   */
  function syncCartCounter(currentUser) {
    // Calcular el total de productos en el carrito
    const cartCount =
      currentUser?.carrito?.reduce(
        (sum, item) => sum + (item.cantidad || 0),
        0
      ) || 0;

    // Actualizar todos los contadores de carrito (móvil y escritorio)
    document
      .querySelectorAll("#contador-carrito, #contador-carrito-desk")
      .forEach((el) => {
        if (el) {
          el.textContent = cartCount;
          el.style.display = cartCount > 0 ? "flex" : "none";
          el.classList.toggle("hidden", cartCount === 0);
        }
      });
  }

  // =================================================================================
  // EXPORTAR MÓDULO
  // =================================================================================

  window.UtilsModule = {
    // Texto e i18n
    getText,
    getCategoryLabel,
    getLocale,
    
    // Formateo
    formatCurrency,
    formatDate,
    
    // Notificaciones
    notify,
    showNotification,
    
    // Búsqueda
    search: performSearch,
    
    // UI
    syncCartCounter
  };

})();
