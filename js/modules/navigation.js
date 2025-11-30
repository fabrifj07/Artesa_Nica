/**
 * MÓDULO DE NAVEGACIÓN
 * Sistema de navegación con historial interno para el SPA
 */

(function() {
  'use strict';

  // =================================================================================
  // VARIABLES DE ESTADO
  // =================================================================================

  // Pila de historial de navegación
  let navigationHistory = ['inicio'];
  
  // Sección actual
  let currentSection = 'inicio';
  
  // ID de tienda actual (para navegación de tiendas)
  let currentStoreId = null;

  // =================================================================================
  // NOMBRES DE SECCIONES PARA EL BOTÓN VOLVER
  // =================================================================================

  const SECTION_NAMES = {
    'inicio': 'Inicio',
    'productos': 'Productos',
    'buscar': 'Búsqueda',
    'carrito': 'Carrito',
    'perfil': 'Perfil',
    'mis-pedidos': 'Mis Pedidos',
    'mis-favoritos': 'Favoritos',
    'noticias': 'Noticias',
    'tiendas': 'Tiendas',
    'mas-tiendas': 'Tiendas',
    'tienda': 'Tienda',
    'configuracion': 'Configuración'
  };

  // =================================================================================
  // FUNCIONES DE NAVEGACIÓN
  // =================================================================================

  /**
   * Navega a una sección
   * @param {string} section - ID de la sección (sin 'seccion-')
   * @param {boolean} updateHistory - Si debe agregar al historial
   */
  function navigateTo(section, updateHistory = true) {
    console.log(`Navegando a: ${section}, updateHistory: ${updateHistory}`);
    
    // Guardar sección actual
    currentSection = section;
    
    // Agregar al historial si es necesario
    if (updateHistory) {
      // Evitar duplicados consecutivos
      const lastSection = navigationHistory[navigationHistory.length - 1];
      if (lastSection !== section) {
        navigationHistory.push(section);
        console.log('Historial actualizado:', navigationHistory);
      }
    }
    
    // Ocultar todas las secciones
    document.querySelectorAll('.seccion-principal').forEach(sec => {
      sec.classList.add('hidden');
    });
    
    // Mostrar la sección correspondiente
    const sectionElement = document.getElementById(`seccion-${section}`);
    if (sectionElement) {
      sectionElement.classList.remove('hidden');
    }
    
    // Actualizar navegación activa
    updateActiveNav(section);
    
    // Actualizar URL sin recargar
    const url = new URL(window.location);
    url.searchParams.set('section', section);
    history.pushState({ section }, '', url);
    
    // Scroll al inicio
    window.scrollTo(0, 0);
  }

  /**
   * Navega a una tienda específica
   * @param {string} storeId - ID de la tienda
   * @param {boolean} updateHistory - Si debe agregar al historial
   */
  function navigateToStore(storeId, updateHistory = true) {
    console.log(`Navegando a tienda: ${storeId}`);
    
    currentStoreId = storeId;
    
    if (updateHistory) {
      navigationHistory.push('tienda');
    }
    
    navigateTo('tienda', false);
    
    // Actualizar URL con ID de tienda
    const url = new URL(window.location);
    url.searchParams.set('section', 'tienda');
    url.searchParams.set('store', storeId);
    history.pushState({ section: 'tienda', storeId }, '', url);
  }

  /**
   * Navega a un producto específico
   * @param {string} productId - ID del producto
   */
  function navigateToProduct(productId) {
    console.log(`Navegando a producto: ${productId}`);
    // Por ahora, solo mostrar el producto en la sección actual
    // Esto se puede expandir si se crea una vista de producto individual
  }

  /**
   * Actualiza la navegación activa
   * @param {string} activeSection - Sección activa
   */
  function updateActiveNav(activeSection) {
    // Actualizar navegación inferior
    document.querySelectorAll('.bottom-nav .nav-item a').forEach(a => {
      a.classList.remove('active');
    });
    
    const activeNav = document.querySelector(`#nav-${activeSection}`);
    if (activeNav) {
      activeNav.classList.add('active');
    }
    
    // Actualizar navegación superior si existe
    const activeEl = document.getElementById(`nav-${activeSection}`);
    if (activeEl) {
      activeEl.classList.add('active');
    }
  }

  /**
   * Maneja la navegación del navegador (botones adelante/atrás)
   */
  function handleBrowserNavigation(event) {
    if (event.state && event.state.section) {
      navigateTo(event.state.section, false);
    }
  }

  // =================================================================================
  // GETTERS
  // =================================================================================

  /**
   * Obtiene el historial de navegación
   * @returns {Array} Copia del historial
   */
  function getHistory() {
    return [...navigationHistory];
  }

  /**
   * Obtiene la sección actual
   * @returns {string} Sección actual
   */
  function getCurrentSection() {
    return currentSection;
  }

  /**
   * Obtiene el ID de la tienda actual
   * @returns {string|null} ID de tienda o null
   */
  function getCurrentStoreId() {
    return currentStoreId;
  }

  // =================================================================================
  // UTILIDADES
  // =================================================================================

  /**
   * Limpia el historial de navegación
   */
  function clearHistory() {
    navigationHistory = ['inicio'];
    currentSection = 'inicio';
    currentStoreId = null;
    console.log('Historial limpiado');
  }

  /**
   * Muestra una sección específica (alias de navigateTo)
   * @param {string} sectionId - ID completo de la sección (con 'seccion-')
   */
  function showSection(sectionId) {
    // Remover 'seccion-' si está presente
    const section = sectionId.replace('seccion-', '');
    navigateTo(section);
  }

  // =================================================================================
  // INICIALIZACIÓN
  // =================================================================================

  /**
   * Inicializa el módulo de navegación
   */
  function init() {
    console.log('NavigationModule inicializado');
    
    // Escuchar eventos de navegación del navegador
    window.addEventListener('popstate', handleBrowserNavigation);
    
    // Verificar si hay una sección en la URL
    const urlParams = new URLSearchParams(window.location.search);
    const section = urlParams.get('section');
    const storeId = urlParams.get('store');
    
    if (section && section !== 'inicio') {
      if (section === 'tienda' && storeId) {
        navigateToStore(storeId, false);
      } else {
        navigateTo(section, false);
      }
    }
  }

  // =================================================================================
  // EXPORTAR MÓDULO
  // =================================================================================

  window.NavigationModule = {
    // Navegación principal
    goTo: navigateTo,
    goToStore: navigateToStore,
    goToProduct: navigateToProduct,
    
    // Alias para compatibilidad
    showSection,
    
    // Getters
    getHistory,
    getCurrentSection,
    getCurrentStoreId,
    
    // Utilidades
    clearHistory,
    updateActive: updateActiveNav,
    
    // Inicialización
    init
  };

  // Auto-inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
