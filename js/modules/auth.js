/**
 * MÓDULO DE AUTENTICACIÓN
 * Gestión de registro, login, logout y sesiones de usuario
 */

(function() {
  'use strict';

  // =================================================================================
  // FUNCIONES DE AUTENTICACIÓN
  // =================================================================================

  /**
   * Registra un nuevo usuario
   * @param {string} name - Nombre del usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {boolean} true si el registro fue exitoso
   */
  function register(name, email, password) {
    // Validar que no exista el email
    const users = window.StorageModule.getUsers();
    const existingUser = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      window.UtilsModule.notify(
        "auth.emailExists",
        "Ya existe una cuenta con este correo",
        "error"
      );
      return false;
    }

    // Crear nuevo usuario
    const newUser = {
      id: `user_${Date.now()}`,
      nombre: name,
      email,
      password,
      fechaRegistro: new Date().toISOString(),
      favoritos: [],
      carrito: [],
      historialCompras: [],
    };

    // Guardar usuario
    window.StorageModule.addUser(newUser);
    
    // Notificar éxito
    window.UtilsModule.notify(
      "auth.registerSuccess",
      "¡Registro exitoso! Iniciando sesión...",
      "exito"
    );

    // Iniciar sesión automáticamente
    login(email, password);
    return true;
  }

  /**
   * Inicia sesión de un usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña del usuario
   * @returns {boolean} true si el login fue exitoso
   */
  function login(email, password) {
    const users = window.StorageModule.getUsers();
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (user) {
      // Guardar sesión
      window.StorageModule.setCurrentUser(user);
      
      // Cerrar modal de autenticación
      hideAuthModal();
      
      // Notificar bienvenida
      window.UtilsModule.notify(
        "auth.welcomeBack",
        `¡Bienvenido de nuevo, ${user.nombre}!`,
        "exito",
        { name: user.nombre }
      );

      // Navegar a inicio
      if (window.NavigationModule) {
        window.NavigationModule.goTo("inicio");
      }

      // Sincronizar contador del carrito
      window.UtilsModule.syncCartCounter(user);

      return true;
    }

    // Credenciales incorrectas
    window.UtilsModule.notify(
      "auth.badCredentials",
      "Correo o contraseña incorrectos",
      "error"
    );
    return false;
  }

  /**
   * Cierra la sesión del usuario actual
   */
  function logout() {
    const currentUser = window.StorageModule.getCurrentUser();
    
    // Notificar despedida
    window.UtilsModule.notify(
      "auth.goodbye",
      `Hasta pronto, ${currentUser?.nombre || ""}`,
      "info",
      { name: currentUser?.nombre || "" }
    );

    // Limpiar sesión
    window.StorageModule.setCurrentUser(null);

    // Navegar a inicio
    if (window.NavigationModule) {
      window.NavigationModule.goTo("inicio");
    }

    // Limpiar contador del carrito
    window.UtilsModule.syncCartCounter(null);
  }

  /**
   * Verifica si hay un usuario autenticado
   * Si no hay usuario, muestra el modal de login
   * @returns {boolean} true si hay usuario autenticado
   */
  function ensureAuth() {
    const currentUser = window.StorageModule.getCurrentUser();
    
    if (currentUser) {
      return true;
    }

    // No hay usuario, mostrar modal
    window.UtilsModule.notify(
      "auth.loginRequired",
      "Por favor, inicia sesión para continuar",
      "info"
    );
    
    showAuthModal("login");
    return false;
  }

  /**
   * Verifica si hay un usuario autenticado (sin mostrar modal)
   * @returns {boolean} true si hay usuario autenticado
   */
  function isAuthenticated() {
    return window.StorageModule.getCurrentUser() !== null;
  }

  /**
   * Obtiene el usuario actual
   * @returns {Object|null} Usuario actual o null
   */
  function getCurrentUser() {
    return window.StorageModule.getCurrentUser();
  }

  // =================================================================================
  // GESTIÓN DEL MODAL DE AUTENTICACIÓN
  // =================================================================================

  /**
   * Muestra el modal de autenticación
   * @param {string} tab - Pestaña a mostrar ('login' o 'register')
   */
  function showAuthModal(tab = "login") {
    const modal = document.getElementById("auth-modal");
    if (!modal) return;

    modal.classList.add("show");

    // Actualizar pestañas
    const loginTab = document.getElementById("login-tab");
    const registerTab = document.getElementById("register-tab");
    const loginContent = document.getElementById("login-content");
    const registerContent = document.getElementById("register-content");

    if (loginTab && registerTab && loginContent && registerContent) {
      loginTab.classList.toggle("active", tab === "login");
      registerTab.classList.toggle("active", tab !== "login");
      loginContent.classList.toggle("hidden", tab !== "login");
      registerContent.classList.toggle("hidden", tab === "login");
    }
  }

  /**
   * Oculta el modal de autenticación
   */
  function hideAuthModal() {
    const modal = document.getElementById("auth-modal");
    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    if (modal) {
      modal.classList.remove("show");
    }

    // Resetear formularios
    if (loginForm) loginForm.reset();
    if (registerForm) registerForm.reset();
  }

  /**
   * Inicializa los event listeners del modal de autenticación
   */
  function initAuthListeners() {
    // Formulario de login
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = e.target.elements[0].value;
        const password = e.target.elements[1].value;
        login(email, password);
      });
    }

    // Formulario de registro
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
      registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = e.target.elements[0].value;
        const email = e.target.elements[1].value;
        const password = e.target.elements[2].value;
        register(name, email, password);
      });
    }

    // Botón de cerrar modal
    const closeBtn = document.getElementById("close-auth-modal");
    if (closeBtn) {
      closeBtn.addEventListener("click", hideAuthModal);
    }

    // Click fuera del modal para cerrar
    const modal = document.getElementById("auth-modal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target.id === "auth-modal") {
          hideAuthModal();
        }
      });
    }

    // Pestañas del modal
    const loginTab = document.getElementById("login-tab");
    const registerTab = document.getElementById("register-tab");

    if (loginTab) {
      loginTab.addEventListener("click", () => showAuthModal("login"));
    }

    if (registerTab) {
      registerTab.addEventListener("click", () => showAuthModal("register"));
    }
  }

  // =================================================================================
  // INICIALIZACIÓN
  // =================================================================================

  /**
   * Inicializa el módulo de autenticación
   */
  function init() {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAuthListeners);
    } else {
      initAuthListeners();
    }
  }

  // =================================================================================
  // EXPORTAR MÓDULO
  // =================================================================================

  window.AuthModule = {
    // Funciones principales
    register,
    login,
    logout,
    ensureAuth,
    isAuthenticated,
    getCurrentUser,
    
    // Modal
    showModal: showAuthModal,
    hideModal: hideAuthModal,
    
    // Inicialización
    init
  };

  // Auto-inicializar
  init();

})();
