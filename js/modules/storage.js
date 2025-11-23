/**
 * MÓDULO DE ALMACENAMIENTO
 * Gestión de datos y persistencia en localStorage
 */

(function() {
  'use strict';

  // =================================================================================
  // VARIABLES DE ESTADO
  // =================================================================================

  let products = [];
  let stores = [];
  let users = [];
  let currentUser = null;
  let extendedProductIds = new Set();
  let knownProductIds = new Set();

  // =================================================================================
  // CONSTANTES
  // =================================================================================

  const STORAGE_KEYS = {
    USERS: 'artesanica_users',
    SESSION: 'artesanica_session',
    EXTENDED_PRODUCTS: 'artesanica_extended_products',
    KNOWN_PRODUCTS: 'artesanica_known_products'
  };

  // =================================================================================
  // CARGA DE DATOS MAESTROS
  // =================================================================================

  /**
   * Carga los datos maestros de productos, tiendas y usuarios
   */
  function loadMasterData() {
    // Cargar productos y tiendas desde datos globales
    products = window.productosData || [];
    stores = window.tiendasData || [];
    
    // Cargar usuarios desde localStorage
    const storedUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
    users = [...(window.usersData || [])];
    
    // Fusionar usuarios almacenados con usuarios iniciales
    storedUsers.forEach((storedUser) => {
      const index = users.findIndex((u) => u.id === storedUser.id);
      if (index !== -1) {
        users[index] = storedUser;
      } else {
        users.push(storedUser);
      }
    });
  }

  /**
   * Guarda los usuarios en localStorage
   */
  function saveUsersToStorage() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // Si hay un usuario actual, actualizar su sesión
    if (currentUser) {
      const updatedUser = users.find((u) => u.id === currentUser.id);
      if (updatedUser) {
        currentUser = updatedUser;
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(currentUser));
      }
    }
  }

  /**
   * Verifica y carga la sesión activa
   * @returns {Object|null} Usuario actual o null
   */
  function checkActiveSession() {
    try {
      const sessionUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION));
      if (sessionUser) {
        const foundUser = users.find((u) => u.id === sessionUser.id);
        currentUser = foundUser || null;
        return currentUser;
      }
    } catch (e) {
      console.error('Error al cargar sesión:', e);
    }
    return null;
  }

  /**
   * Guarda la sesión del usuario actual
   * @param {Object} user - Usuario a guardar en sesión
   */
  function saveSession(user) {
    currentUser = user;
    if (user) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }

  // =================================================================================
  // GESTIÓN DE PRODUCTOS EXTENDIDOS
  // =================================================================================

  /**
   * Inicializa los productos extendidos desde localStorage
   */
  function initializeExtendedProducts() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXTENDED_PRODUCTS)) || [];
      
      if (Array.isArray(saved) && saved.length > 0) {
        extendedProductIds = new Set(saved);
        
        // Saneamiento: si casi todos los productos están extendidos, resetear
        const total = products.length;
        if (total > 0 && extendedProductIds.size >= total) {
          const lastFour = products.slice(-4).map((p) => p.id);
          extendedProductIds = new Set(lastFour);
          syncExtendedProductsStorage();
        }
      } else {
        // Inicial: tomar los últimos 4 productos
        const lastFour = products.slice(-4).map((p) => p.id);
        extendedProductIds = new Set(lastFour);
        syncExtendedProductsStorage();
      }
    } catch (e) {
      console.error('Error al inicializar productos extendidos:', e);
      // Fallback a últimos 4
      const lastFour = products.slice(-4).map((p) => p.id);
      extendedProductIds = new Set(lastFour);
      syncExtendedProductsStorage();
    }
  }

  /**
   * Sincroniza los productos extendidos con localStorage
   */
  function syncExtendedProductsStorage() {
    localStorage.setItem(
      STORAGE_KEYS.EXTENDED_PRODUCTS,
      JSON.stringify(Array.from(extendedProductIds))
    );
  }

  /**
   * Sincroniza productos conocidos y extiende los nuevos
   */
  function syncKnownProductsAndExtendNew() {
    const currentIds = products.map((p) => p.id);

    // Primera vez: solo inicializar
    if (savedKnownNeedsInit()) {
      knownProductIds = new Set(currentIds);
      localStorage.setItem(
        STORAGE_KEYS.KNOWN_PRODUCTS,
        JSON.stringify(currentIds)
      );
      return;
    }

    // Cargar productos conocidos
    try {
      const savedKnown = JSON.parse(localStorage.getItem(STORAGE_KEYS.KNOWN_PRODUCTS)) || [];
      knownProductIds = new Set(Array.isArray(savedKnown) ? savedKnown : []);
    } catch (_) {
      knownProductIds = new Set(currentIds);
    }

    // Detectar productos nuevos
    let changed = false;
    currentIds.forEach((id) => {
      if (!knownProductIds.has(id)) {
        extendedProductIds.add(id);
        knownProductIds.add(id);
        changed = true;
      }
    });

    // Guardar cambios si hubo nuevos productos
    if (changed) {
      syncExtendedProductsStorage();
      localStorage.setItem(
        STORAGE_KEYS.KNOWN_PRODUCTS,
        JSON.stringify(Array.from(knownProductIds))
      );
    }
  }

  /**
   * Verifica si necesita inicializar productos conocidos
   * @returns {boolean}
   */
  function savedKnownNeedsInit() {
    try {
      return !localStorage.getItem(STORAGE_KEYS.KNOWN_PRODUCTS);
    } catch (_) {
      return true;
    }
  }

  // =================================================================================
  // GETTERS
  // =================================================================================

  /**
   * Obtiene todos los productos
   * @returns {Array}
   */
  function getProducts() {
    return products;
  }

  /**
   * Obtiene todas las tiendas
   * @returns {Array}
   */
  function getStores() {
    return stores;
  }

  /**
   * Obtiene todos los usuarios
   * @returns {Array}
   */
  function getUsers() {
    return users;
  }

  /**
   * Obtiene el usuario actual
   * @returns {Object|null}
   */
  function getCurrentUser() {
    return currentUser;
  }

  /**
   * Obtiene los productos para la página de inicio (no extendidos)
   * @returns {Array}
   */
  function getHomeProducts() {
    return products.filter((p) => !extendedProductIds.has(p.id));
  }

  /**
   * Obtiene los productos extendidos
   * @returns {Array}
   */
  function getExtendedProducts() {
    return products.filter((p) => extendedProductIds.has(p.id));
  }

  /**
   * Obtiene un producto por ID
   * @param {string} productId
   * @returns {Object|null}
   */
  function getProductById(productId) {
    return products.find((p) => p.id === productId) || null;
  }

  /**
   * Obtiene una tienda por ID
   * @param {string} storeId
   * @returns {Object|null}
   */
  function getStoreById(storeId) {
    return stores.find((s) => s.id === storeId) || null;
  }

  /**
   * Obtiene un usuario por ID
   * @param {string} userId
   * @returns {Object|null}
   */
  function getUserById(userId) {
    return users.find((u) => u.id === userId) || null;
  }

  // =================================================================================
  // SETTERS
  // =================================================================================

  /**
   * Actualiza el usuario actual
   * @param {Object} user
   */
  function setCurrentUser(user) {
    currentUser = user;
    saveSession(user);
  }

  /**
   * Actualiza un usuario en la lista
   * @param {Object} updatedUser
   */
  function updateUser(updatedUser) {
    const index = users.findIndex((u) => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      
      // Si es el usuario actual, actualizar también
      if (currentUser && currentUser.id === updatedUser.id) {
        currentUser = updatedUser;
      }
      
      saveUsersToStorage();
    }
  }

  /**
   * Agrega un nuevo usuario
   * @param {Object} newUser
   */
  function addUser(newUser) {
    users.push(newUser);
    saveUsersToStorage();
  }

  // =================================================================================
  // EXPORTAR MÓDULO
  // =================================================================================

  window.StorageModule = {
    // Inicialización
    load: loadMasterData,
    initExtendedProducts: initializeExtendedProducts,
    syncKnownProducts: syncKnownProductsAndExtendNew,
    
    // Sesión
    checkSession: checkActiveSession,
    saveSession,
    
    // Getters
    getProducts,
    getStores,
    getUsers,
    getCurrentUser,
    getHomeProducts,
    getExtendedProducts,
    getProductById,
    getStoreById,
    getUserById,
    
    // Setters
    setCurrentUser,
    updateUser,
    addUser,
    saveUsers: saveUsersToStorage
  };

})();
