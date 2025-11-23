document.addEventListener("DOMContentLoaded", () => {
  // Inicializar el módulo de compartir
  if (typeof window.CompartirModule !== "undefined") {
    window.CompartirModule.init();
  }

  // --- ESTADO DE LA APLICACIÓN ---
  let currentUser = null;
  let users = [];
  let products = [];
  let stores = [];
  let currentSection = "inicio";
  let currentStoreId = null;
  let currentStoreForPayment = null; // Para rastrear qué tienda se está procesando
  let deliveryMethod = "retiro"; // 'retiro' o 'domicilio'
  let deliveryAddress = "";

  // --- SELECTORES CACHEADOS ---
  const logoLink = document.getElementById("logo-link");
  const backButton = document.getElementById("back-button");
  const searchInputSection = document.getElementById("buscar-productos");

  // =================================================================================
  // CONFIGURACIÓN DEL MENÚ DE PERFIL
  // =================================================================================
  function setupProfileMenu() {
    // Configurar el botón de compartir web
    const shareButton = document
      .querySelector(".menu-item .fa-share-alt")
      ?.closest(".menu-item");
    if (shareButton) {
      shareButton.addEventListener("click", function (e) {
        e.preventDefault();
        if (typeof window.CompartirModule !== "undefined") {
          window.CompartirModule.showShareModal();
        } else {
          console.error("El módulo de compartir no está disponible");
        }
      });
    }

    // Configurar el botón de configuración
    const configButton = document
      .querySelector(".menu-item .fa-cog")
      ?.closest(".menu-item");
    if (configButton) {
      configButton.addEventListener("click", function (e) {
        e.preventDefault();
        // Actualizar la URL para incluir el parámetro de configuración
        if (typeof updateUrl === "function") {
          updateUrl("configuracion", { configuracion: "true" });
        } else {
          // Si la función updateUrl no está disponible, redirigir manualmente
          const url = new URL(window.location);
          url.searchParams.set("configuracion", "true");
          window.location.href = url.toString();
          return;
        }

        // Navegar a la sección de configuración
        navigateTo("configuracion");

        // Renderizar la configuración si el módulo está disponible
        if (typeof window.ConfiguracionModule !== "undefined") {
          window.ConfiguracionModule.renderConfiguracion();
        } else {
          console.error("El módulo de configuración no está disponible");
        }
      });
    }

    // Configurar el botón de cerrar sesión
    const logoutButton = document
      .querySelector(".menu-item .fa-sign-out-alt")
      ?.closest(".menu-item");
    if (logoutButton) {
      logoutButton.addEventListener("click", function (e) {
        e.preventDefault();
        logout();
      });
    }
  }

  // =================================================================================
  // INICIALIZACIÓN
  // =================================================================================
  function initialize() {
    loadMasterData();
    initializeExtendedProducts();
    syncKnownProductsAndExtendNew();
    checkActiveSession();
    syncCartCounter(); // Sincronizar contador del carrito después de cargar la sesión
    setupEventListeners();
    try {
      window.addEventListener("i18n:lang-changed", () => updateUI());
    } catch (_) {}

    // Manejar el evento de retroceso/avance del navegador
    window.addEventListener("popstate", (event) => {
      const url = new URL(window.location);
      const section = url.searchParams.get("section") || "inicio";
      const storeId = url.searchParams.get("store");

      if (section === "tienda" && storeId) {
        navigateToStore(storeId, false);
      } else {
        navigateTo(section, false);
      }
    });

    // Restaurar el estado desde la URL
    const url = new URL(window.location);
    const section = url.searchParams.get("section");
    const storeId = url.searchParams.get("store");

    if (section === "tienda" && storeId) {
      // Restaurar la vista de la tienda específica
      navigateToStore(storeId, false);
    } else if (section) {
      // Navegar a la sección guardada
      navigateTo(section, false);
    } else {
      // Por defecto, ir al inicio
      navigateTo("inicio", false);
    }
  }

  // =================================================================================
  // GESTIÓN DE DATOS (LocalStorage)
  // =================================================================================
  function loadMasterData() {
    products = window.productosData || [];
    stores = window.tiendasData || [];
    const storedUsers =
      JSON.parse(localStorage.getItem("artesanica_users")) || [];
    users = [...(window.usersData || [])];
    storedUsers.forEach((storedUser) => {
      const index = users.findIndex((u) => u.id === storedUser.id);
      if (index !== -1) {
        users[index] = storedUser;
      } else {
        users.push(storedUser);
      }
    });
  }

  // ---------------------------------------------------------------------------------
  // Productos extendidos (persistencia de los movidos a la nueva vista)
  // ---------------------------------------------------------------------------------
  let extendedProductIds = new Set();
  let knownProductIds = new Set();

  function initializeExtendedProducts() {
    try {
      const saved =
        JSON.parse(localStorage.getItem("artesanica_extended_products")) || [];
      if (Array.isArray(saved) && saved.length > 0) {
        extendedProductIds = new Set(saved);
        // Saneamiento: si por error se guardaron casi todos los productos como extendidos,
        // restablecer a los últimos 4 para no vaciar la página de inicio
        const total = (products || []).length;
        if (total > 0 && extendedProductIds.size >= total) {
          const lastFourFix = (products || []).slice(-4).map((p) => p.id);
          extendedProductIds = new Set(lastFourFix);
          syncExtendedProductsStorage();
        }
      } else {
        // Inicial: tomar los últimos 4 productos actuales
        const lastFour = (products || []).slice(-4).map((p) => p.id);
        extendedProductIds = new Set(lastFour);
        syncExtendedProductsStorage();
      }
    } catch (e) {
      // En caso de error, fallback a últimos 4
      const lastFour = (products || []).slice(-4).map((p) => p.id);
      extendedProductIds = new Set(lastFour);
      syncExtendedProductsStorage();
    }
  }

  function syncExtendedProductsStorage() {
    localStorage.setItem(
      "artesanica_extended_products",
      JSON.stringify(Array.from(extendedProductIds))
    );
  }

  function syncKnownProductsAndExtendNew() {
    const currentIds = (products || []).map((p) => p.id);

    // Si es la primera vez, solo inicializamos known con los actuales y no movemos nada
    if (savedKnownNeedsInit()) {
      knownProductIds = new Set(currentIds);
      localStorage.setItem(
        "artesanica_known_products",
        JSON.stringify(currentIds)
      );
      return;
    }

    // Cargar conocidos previamente
    try {
      const savedKnown =
        JSON.parse(localStorage.getItem("artesanica_known_products")) || [];
      knownProductIds = new Set(Array.isArray(savedKnown) ? savedKnown : []);
    } catch (_) {
      knownProductIds = new Set(currentIds);
    }

    // Detectar solo productos realmente nuevos para moverlos a extendidos
    let changed = false;
    currentIds.forEach((id) => {
      if (!knownProductIds.has(id)) {
        extendedProductIds.add(id);
        knownProductIds.add(id);
        changed = true;
      }
    });

    if (changed) {
      syncExtendedProductsStorage();
      localStorage.setItem(
        "artesanica_known_products",
        JSON.stringify(Array.from(knownProductIds))
      );
    }
  }

  function savedKnownNeedsInit() {
    try {
      return !localStorage.getItem("artesanica_known_products");
    } catch (_) {
      return true;
    }
  }

  function getHomeProducts() {
    return (products || []).filter((p) => !extendedProductIds.has(p.id));
  }

  function getExtendedProducts() {
    return (products || []).filter((p) => extendedProductIds.has(p.id));
  }

  function saveUsersToStorage() {
    localStorage.setItem("artesanica_users", JSON.stringify(users));
    if (currentUser) {
      const updatedUser = users.find((u) => u.id === currentUser.id);
      if (updatedUser) {
        currentUser = updatedUser;
        localStorage.setItem("artesanica_session", JSON.stringify(currentUser));
      }
    }
  }

  function checkActiveSession() {
    const sessionUser = JSON.parse(localStorage.getItem("artesanica_session"));
    if (sessionUser) {
      const foundUser = users.find((u) => u.id === sessionUser.id);
      currentUser = foundUser ? foundUser : null;
    }
  }

  // =================================================================================
  // LÓGICA DE AUTENTICACIÓN
  // =================================================================================
  function register(name, email, password) {
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      notify(
        "auth.emailExists",
        "Ya existe una cuenta con este correo",
        "error"
      );
      return;
    }
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
    users.push(newUser);
    saveUsersToStorage();
    notify(
      "auth.registerSuccess",
      "¡Registro exitoso! Iniciando sesión...",
      "exito"
    );
    login(email, password);
  }

  function login(email, password) {
    const user = users.find(
      (u) =>
        u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (user) {
      currentUser = user;
      localStorage.setItem("artesanica_session", JSON.stringify(currentUser));
      hideAuthModal();
      notify(
        "auth.welcomeBack",
        `¡Bienvenido de nuevo, ${currentUser.nombre}!`,
        "exito",
        { name: currentUser.nombre }
      );
      navigateTo("inicio");
      return true;
    }
    notify("auth.badCredentials", "Correo o contraseña incorrectos", "error");
    return false;
  }

  function logout() {
    notify(
      "auth.goodbye",
      `Hasta pronto, ${currentUser?.nombre || ""}`,
      "info",
      { name: currentUser?.nombre || "" }
    );
    currentUser = null;
    localStorage.removeItem("artesanica_session");
    navigateTo("inicio");
  }

  function ensureAuth() {
    if (currentUser) return true;
    notify(
      "auth.loginRequired",
      "Por favor, inicia sesión para continuar",
      "info"
    );
    showAuthModal("login");
    return false;
  }

  // =================================================================================
  // LÓGICA DE NEGOCIO
  // =================================================================================
  function setDeliveryMethod(method) {
    deliveryMethod = method;
    updateUI();
  }

  function setDeliveryAddress(address) {
    deliveryAddress = address;
  }
  function getText(obj, esKey, enKey) {
    const lang = window.i18n?.getLang?.() || "es";
    if (lang === "en" && obj && obj[enKey]) return obj[enKey];
    return obj ? obj[esKey] : "";
  }
  function getCategoryLabel(catId) {
    const key = `categories.${catId}`;
    const val = window.i18n?.t?.(key);
    return val && val !== key ? val : catId;
  }
  function notify(key, fallback, type = "info", params = {}) {
    const msg = window.i18n?.t?.(key, params) || fallback;
    showNotification(msg, type);
  }
  function getLocale() {
    const lang = window.i18n?.getLang?.() || "es";
    return lang === "en" ? "en-US" : "es-ES";
  }
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

  function performSearch(query) {
    const lowerCaseQuery = query.trim().toLowerCase();
    if (lowerCaseQuery) {
      const results = products.filter((p) => {
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
      renderProducts(results, "resultados-busqueda");
    } else {
      renderProducts([], "resultados-busqueda");
    }
  }

  function toggleFavorite(productId) {
    console.log("toggleFavorite llamado para el producto:", productId);
    if (!ensureAuth()) {
      console.log("Usuario no autenticado");
      return false;
    }

    // Asegurarse de que currentUser.favoritos existe y es un array
    if (!Array.isArray(currentUser.favoritos)) {
      console.log("Inicializando array de favoritos");
      currentUser.favoritos = [];
    }

    const index = currentUser.favoritos.indexOf(productId);
    let isFavorite;

    if (index === -1) {
      // Añadir a favoritos
      console.log("Añadiendo a favoritos");
      currentUser.favoritos.push(productId);
      notify("favorites.added", "Añadido a favoritos", "exito");
      isFavorite = true;
    } else {
      // Quitar de favoritos
      console.log("Eliminando de favoritos");
      currentUser.favoritos.splice(index, 1);
      notify("favorites.removed", "Eliminado de favoritos", "info");
      isFavorite = false;
    }

    console.log("Favoritos actuales:", currentUser.favoritos);

    // Guardar cambios en localStorage
    saveUsersToStorage();

    // Actualizar el botón de favorito en la interfaz actual
    // Usamos un selector más específico para evitar problemas con comillas
    const favButtons = document.querySelectorAll(
      `[onclick*="toggleFavorite('${productId}')"], [onclick*='toggleFavorite(\"${productId}\")']`
    );
    console.log("Botones encontrados:", favButtons.length);

    favButtons.forEach((btn) => {
      console.log("Actualizando botón:", btn);
      const icon = btn.querySelector("i.fa-heart") || btn.querySelector("i");
      if (icon) {
        console.log(
          "Icono encontrado, cambiando a:",
          isFavorite ? "fas fa-heart" : "far fa-heart"
        );
        icon.className = isFavorite ? "fas fa-heart" : "far fa-heart";
        btn.setAttribute("aria-pressed", isFavorite);
      } else {
        console.log("No se encontró el ícono en el botón");
      }
    });

    // Actualizar la interfaz de usuario
    syncCartCounter(); // Actualizar contador después de cambiar favoritos

    // Si estamos en la sección de favoritos, actualizarla
    if (
      document.getElementById("seccion-perfil") &&
      !document.getElementById("seccion-perfil").classList.contains("hidden")
    ) {
      renderFavoritesSection();
    }

    // Forzar actualización de la interfaz
    if (currentSection === "inicio") {
      renderProducts(getHomeProducts(), "productos-destacados");
    }

    return isFavorite;
  }

  function addToCart(productId) {
    if (!ensureAuth()) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const existingItem = currentUser.carrito.find(
      (item) => item.id === productId
    );
    if (existingItem) {
      existingItem.cantidad++;
    } else {
      currentUser.carrito.push({ id: productId, cantidad: 1 });
    }
    saveUsersToStorage();
    const name = getText(product, "nombre", "nombre_en");
    notify("cart.added", `'${name}' fue añadido al carrito.`, "exito", {
      name,
    });
    syncCartCounter(); // Actualizar contador después de agregar al carrito
    // Forzar la actualización de la vista del carrito
    if (currentSection === "carrito") {
      renderCartSection();
    }
    updateUI();
  }

  function updateCartQuantity(productId, newQuantity) {
    if (!ensureAuth()) return;
    const item = currentUser.carrito.find((i) => i.id === productId);
    if (item) {
      if (newQuantity > 0) {
        item.cantidad = newQuantity;
      } else {
        // Si la cantidad es 0, eliminar el producto del carrito
        const index = currentUser.carrito.findIndex((i) => i.id === productId);
        if (index > -1) {
          currentUser.carrito.splice(index, 1);
        }
      }
      saveUsersToStorage();
      syncCartCounter(); // Sincronizar contador después de actualizar cantidad
      updateUI();
    }
  }

  function processPayment(storeId = null) {
    if (!currentUser) {
      notify(
        "pay.loginRequired",
        "Debes iniciar sesión para realizar un pago",
        "error"
      );
      showAuthModal();
      return;
    }

    // Validar dirección de envío si es necesario
    if (deliveryMethod === "domicilio" && !deliveryAddress.trim()) {
      notify(
        "pay.addressRequired",
        "Por favor ingresa una dirección de envío",
        "error"
      );
      document.getElementById("direccion-envio")?.focus();
      return;
    }

    // Obtener los productos a pagar
    let itemsToPay;
    if (storeId) {
      // Pagar solo los productos de la tienda especificada
      itemsToPay = currentUser.carrito.filter((item) => {
        const product = products.find((p) => p.id === item.id);
        return product && product.tienda.id === storeId;
      });
    } else {
      // Pagar todos los productos (comportamiento anterior)
      itemsToPay = [...currentUser.carrito];
    }

    if (itemsToPay.length === 0) {
      notify("pay.noItems", "No hay productos para pagar", "error");
      return;
    }

    // Obtener información de la tienda
    let storeInfo = {};
    if (storeId) {
      const firstItem = itemsToPay[0];
      const product = products.find((p) => p.id === firstItem.id);
      if (product && product.tienda) {
        storeInfo = {
          storeId: product.tienda.id,
          storeName: product.tienda.nombre,
        };
      }
    }

    // Calcular totales
    const subtotal = itemsToPay.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.id);
      return sum + (product ? product.precio * item.cantidad : 0);
    }, 0);

    const envio = deliveryMethod === "domicilio" ? 150.0 : 0;
    const total = subtotal + envio;

    // Crear orden con información detallada
    const order = {
      id: `order_${Date.now()}`,
      userId: currentUser.id,
      items: itemsToPay.map((item) => {
        const product = products.find((p) => p.id === item.id);
        return {
          ...item,
          productName: product?.nombre || "Producto no disponible",
          productPrice: product?.precio || 0,
          productImage: product?.imagen || "",
        };
      }),
      ...storeInfo, // Añadir información de la tienda
      subtotal,
      envio,
      total,
      fecha: new Date().toISOString(),
      estado: "pendiente",
      direccionEnvio:
        deliveryMethod === "domicilio" ? deliveryAddress : "Retiro en local",
      metodoEntrega: deliveryMethod,
      facturaId: `FAC-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 5)
        .toUpperCase()}`,
    };

    // Aquí iría la lógica de procesamiento de pago
    // Por ahora, simulamos un pago exitoso después de 1.5 segundos
    notify("pay.processing", "Procesando pago...", "info");

    setTimeout(() => {
      // 1. Agregar la orden al historial
      if (!currentUser.historialCompras) {
        currentUser.historialCompras = [];
      }
      currentUser.historialCompras.push(order);

      // 2. Eliminar solo los productos pagados del carrito
      currentUser.carrito = currentUser.carrito.filter(
        (cartItem) =>
          !itemsToPay.some((orderItem) => orderItem.id === cartItem.id)
      );

      // 3. Guardar cambios
      const userIndex = users.findIndex((u) => u.id === currentUser.id);
      if (userIndex !== -1) {
        users[userIndex] = currentUser;
        saveUsersToStorage();
      }

      // 4. Actualizar la interfaz de usuario
      updateCartCounter();

      // 5. Mostrar notificación de éxito
      notify(
        "pay.success",
        "¡Pago exitoso! Tu pedido ha sido procesado.",
        "exito"
      );

      // 6. Redirigir a Mis Pedidos y mostrar el detalle de la orden
      // Esto permite al usuario ver la lista de productos que acaba de comprar
      showMisPedidos();
      
      // Abrir el detalle de la orden automáticamente después de un breve retraso
      // para asegurar que la vista de pedidos se haya renderizado
      setTimeout(() => {
        showOrderDetails(order.id);
      }, 500);

      // 7. Resetear estado de pago
      currentStoreForPayment = null;
    }, 1500);
  }

  // =================================================================================
  // NAVEGACIÓN Y RENDERIZADO
  // =================================================================================
  function navigateTo(sectionId, updateHistory = true) {
    const protectedSections = ["favoritos", "carrito", "perfil"];
    if (protectedSections.includes(sectionId) && !ensureAuth()) return;

    currentSection = sectionId;
    document
      .querySelectorAll(".seccion-principal")
      .forEach((s) => s.classList.add("hidden"));
    const sectionToShow = document.getElementById(`seccion-${sectionId}`);
    if (sectionToShow) {
      sectionToShow.classList.remove("hidden");
    }

    const isHomePage = sectionId === "inicio";
    logoLink?.classList.toggle("hidden", !isHomePage);
    backButton?.classList.toggle("hidden", isHomePage);

    // Actualizar la URL sin recargar la página
    if (updateHistory) {
      const url = new URL(window.location);
      if (sectionId === "inicio") {
        history.pushState({ section: "inicio" }, "", url.pathname);
      } else {
        url.searchParams.set("section", sectionId);
        history.pushState({ section: sectionId }, "", url);
      }
    }

    window.scrollTo(0, 0);
    updateUI();
  }

  function navigateToStore(storeId, updateHistory = true) {
    currentStoreId = storeId;
    if (updateHistory) {
      const url = new URL(window.location);
      url.searchParams.set("store", storeId);
      history.pushState({ section: "tienda", storeId: storeId }, "", url);
    }
    navigateTo("tienda", updateHistory);
  }

  // Escuchar cambios de idioma para actualizar la interfaz
  window.addEventListener("i18n:lang-changed", () => {
    // Forzar actualización de la sección actual
    const container = document.querySelector(`#${currentSection}-container`);
    if (container) {
      // Volver a traducir el DOM
      if (window.i18n?.translateDOM) {
        window.i18n.translateDOM(container);
      }

      // Volver a renderizar la sección actual
      if (currentSection === "productos") {
        const extended = getExtendedProducts();
        renderProducts(extended, "todos-productos");
      } else if (currentSection === "inicio") {
        const homeProducts = getHomeProducts();
        renderProducts(homeProducts, "productos-container");
        renderStores(stores);
      }
    }
  });

  function updateUI() {
    switch (currentSection) {
      case "inicio":
        renderCategoriesAndFilters();
        const homeProducts = getHomeProducts();
        renderProducts(homeProducts, "productos-container");
        renderStores(stores);
        break;
      case "productos":
        const extended = getExtendedProducts();
        renderProducts(extended, "todos-productos");
        break;
      case "buscar":
        performSearch(searchInputSection.value || "");
        break;
      case "perfil":
        renderProfileSection();
        break;
      case "favoritos":
        renderFavoritesSection();
        break;
      case "carrito":
        renderCartSection();
        break;
      case "tienda":
        renderStorePage(currentStoreId);
        break;
      case "noticias":
        // La sección de noticias ya está renderizada en el HTML
        break;
      case "mas-tiendas":
        const moreStoresContainer = document.getElementById(
          "mas-tiendas-container"
        );
        if (moreStoresContainer) {
          moreStoresContainer.innerHTML = "";
        }
        break;
    }
    syncCartCounter(); // Sincronizar contador al actualizar UI
    updateActiveNav(currentSection);
  }

  function renderCategoriesAndFilters() {
    const container = document.getElementById("categorias-container");
    if (!container) return;
    const cats = (window.categoriasData || [])
      .map(
        (c) => `
            <div class="category-card" data-category="${c.id}">
                <div class="category-icon"><i class="${c.icono}"></i></div>
                <div class="category-name">${getCategoryLabel(c.id)}</div>
            </div>
        `
      )
      .join("");
    container.innerHTML = cats || "";
  }

  function renderProducts(productsToDisplay, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const productsHtml = (productsToDisplay || [])
      .map((product) => {
        const isFavorite = currentUser?.favoritos.includes(product.id);
        const name = getText(product, "nombre", "nombre_en");
        const storeName =
          getText(product?.tienda || {}, "nombre", "nombre_en") ||
          window.i18n?.t?.("stores.generic") ||
          "Tienda";
        return `
            <div class="product-card" onclick="app.navigateToProduct('${
              product.id
            }')">
                <div class="product-image-container">
                    <img src="${
                      product.imagen
                    }" alt="${name}" class="product-image">
                    <button class="favorite-btn" onclick="event.stopPropagation(); app.toggleFavorite('${
                      product.id
                    }')">
                        <i class="${isFavorite ? "fas" : "far"} fa-heart"></i>
                    </button>
                </div>
                <div class="product-content">
                    <h3 class="product-name">${name}</h3>
                    <p class="store-name">${storeName}</p>
                    <p class="product-price">${formatCurrency(
                      product.precio
                    )}</p>
                    <button class="btn btn-primary add-to-cart" 
                            onclick="event.stopPropagation(); app.addToCart('${
                              product.id
                            }')"
                            data-i18n-attr="title=actions.addToCart">
                        <i class="fas fa-shopping-cart"></i> <span class="add-to-cart-text" data-i18n="actions.addToCart">${
                          window.i18n?.t?.("actions.addToCart") || "Agregar"
                        }</span>
                    </button>
                </div>
            </div>`;
      })
      .join("");

    let emptyMessage = `<p>${
      window.i18n?.t?.("common.emptyProducts") ||
      "No hay productos para mostrar."
    }</p>`;
    if (containerId === "resultados-busqueda") {
      emptyMessage = `<p style="text-align:center; grid-column: 1 / -1;">${
        window.i18n?.t?.("search.emptyPrompt") || "Busca productos o artesanos."
      }</p>`;
      if (searchInputSection.value) {
        emptyMessage = `<p style="text-align:center; grid-column: 1 / -1;">${
          window.i18n?.t?.("search.noResults") || "No se encontraron productos."
        }</p>`;
      }
    }

    container.innerHTML = productsHtml || emptyMessage;
  }

  function renderStores(storesToDisplay) {
    const container = document.getElementById("tiendas-container");
    if (!container) return;

    // Asegurarse de que el contenedor tenga la clase correcta
    container.className = "stores-grid";

    container.innerHTML = (storesToDisplay || [])
      .map((store) => {
        const sName = getText(store, "nombre", "nombre_en");
        const sDesc =
          getText(store, "descripcion", "descripcion_en") ||
          window.i18n?.t?.("stores.defaultDescription") ||
          "Tienda de artesanías";
        return `
            <div class="store-card" onclick="app.navigateToStore('${
              store.id
            }')">
                <div class="store-image-container">
                    <img src="${store.imagen || "img/default-store.jpg"}" 
                         alt="${sName}" 
                         class="store-image">
                </div>
                <div class="store-content">
                    <h3 class="store-name">${sName}</h3>
                    <p class="store-description">${sDesc}</p>
                    <div class="store-button">
                        <span>${
                          window.i18n?.t?.("actions.viewStore") || "Ver Tienda"
                        }</span>
                        <i class="fas fa-arrow-right" style="margin-left: 0.5rem;"></i>
                    </div>
                </div>
            </div>`;
      })
      .join("");

    // Si no hay tiendas para mostrar
    if ((!storesToDisplay || storesToDisplay.length === 0) && container) {
      container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <i class="fas fa-store-slash" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <p>${
                      window.i18n?.t?.("stores.empty") ||
                      "No hay tiendas disponibles en este momento."
                    }</p>
                </div>`;
    }
  }

  function renderStorePage(storeId) {
    const store = stores.find((s) => s.id === storeId);
    if (!store) {
      navigateTo("inicio");
      notify("store.notFound", "Tienda no encontrada", "error");
      return;
    }

    // Renderizar encabezado de la tienda
    const headerContainer = document.getElementById("tienda-detalle-header");
    if (headerContainer) {
      const storeName = getText(store, "nombre", "nombre_en");
      const storeDesc = getText(store, "descripcion", "descripcion_en");

      headerContainer.innerHTML = `
                <div class="store-profile-card">
                    <div class="store-profile-header">
                        <img src="${
                          store.foto_perfil || "img/default-store.jpg"
                        }" 
                             alt="${storeName}" 
                             class="store-profile-image">
                        <h2 class="store-profile-name">${storeName}</h2>
                        <div class="store-rating">
                            ${Array(5)
                              .fill(0)
                              .map(
                                (_, i) =>
                                  `<i class="fas fa-star ${
                                    i < 4 ? "filled" : ""
                                  }"></i>`
                              )
                              .join("")}
                            <span class="rating-text">4.8 (124)</span>
                        </div>
                    </div>
                    
                    <div class="store-details">
                        <div class="store-detail-item">
                            <i class="fas fa-info-circle"></i>
                            <p class="store-description">${storeDesc}</p>
                        </div>
                        
                        <div class="store-detail-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <div>
                                <p class="detail-label">Ubicación</p>
                                <p>${store.direccion}, ${store.ubicacion}</p>
                            </div>
                        </div>
                        
                        <div class="store-detail-item">
                            <i class="fas fa-phone"></i>
                            <div>
                                <p class="detail-label">Contacto</p>
                                <p>${store.contacto}</p>
                            </div>
                        </div>
                        
                        <div class="store-detail-item">
                            <i class="fas fa-clock"></i>
                            <div>
                                <p class="detail-label">Horario</p>
                                <p>${
                                  store.horarios ||
                                  "Lunes a Viernes: 9:00 AM - 6:00 PM"
                                }</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="store-actions">
                        <button class="btn btn-outline" onclick="window.open('tel:${store.contacto.replace(
                          /\D/g,
                          ""
                        )}')">
                            <i class="fas fa-phone"></i> Llamar
                        </button>
                        <button class="btn btn-primary" 
                                onclick="window.open('https://maps.google.com/?q=${encodeURIComponent(
                                  store.direccion + ", " + store.ubicacion
                                )}')">
                            <i class="fas fa-directions"></i> Cómo llegar
                        </button>
                    </div>
                </div>`;
    }

    const storeProducts = products.filter((p) => p.tienda.id === storeId);
    const categories = [
      "Todas",
      ...new Set(storeProducts.map((p) => p.categoria)),
    ];

    // Renderizar filtros
    const filtersContainer = document.getElementById(
      "tienda-filtros-container"
    );
    if (filtersContainer) {
      filtersContainer.innerHTML = categories
        .map((cat, index) => {
          const label = cat === "Todas" ? "Todas" : getCategoryLabel(cat);
          return `
                <button class="btn ${
                  index === 0 ? "btn-primary" : "btn-secondary"
                } btn-sm filter-btn" data-category="${cat}">${label}</button>
                `;
        })
        .join("");
    }

    // Renderizar productos de la tienda
    renderProducts(storeProducts, "tienda-productos-grid");

    // =================================================================================
    // DELEGACIÓN DE EVENTOS PARA FILTROS (previene memory leaks)
    // =================================================================================
    // En lugar de agregar listeners a cada botón, usamos delegación de eventos
    // Esto significa que agregamos UN SOLO listener al contenedor padre
    
    // Primero, remover listener anterior si existe (prevenir duplicados)
    const existingHandler = filtersContainer?._filterHandler;
    if (existingHandler) {
      filtersContainer.removeEventListener("click", existingHandler);
    }

    // Crear el handler de eventos
    const filterHandler = (e) => {
      // Verificar si el click fue en un botón de filtro
      const filterBtn = e.target.closest(".filter-btn");
      if (!filterBtn) return;

      const category = filterBtn.dataset.category;
      
      // Actualizar estilos de botones (solo dentro de este contenedor)
      filtersContainer
        .querySelectorAll(".filter-btn")
        .forEach((b) => {
          b.classList.remove("btn-primary");
          b.classList.add("btn-secondary");
        });
      
      filterBtn.classList.remove("btn-secondary");
      filterBtn.classList.add("btn-primary");

      // Filtrar y renderizar productos
      const filteredProducts =
        category === "Todas"
          ? storeProducts
          : storeProducts.filter((p) => p.categoria === category);
      
      renderProducts(filteredProducts, "tienda-productos-grid");
    };

    // Agregar el listener al contenedor (delegación de eventos)
    if (filtersContainer) {
      filtersContainer.addEventListener("click", filterHandler);
      // Guardar referencia para poder removerlo después
      filtersContainer._filterHandler = filterHandler;
    }
  }

  // =================================================================================
  // RENDERIZADO DE PESTAÑAS DEL PERFIL
  // =================================================================================
  function renderProfileSection() {
    // Configurar los eventos del menú de perfil
    setupProfileMenu();

    // Actualizar el total de compras
    updateTotalPurchases();

    // Verificar si hay un hash de pestaña en la URL
    const hash = window.location.hash.substring(1);
    if (hash.startsWith("perfil/")) {
      const tabId = hash.split("/")[1];
      showProfileTab(tabId);
    } else {
      // Mostrar la pestaña de perfil por defecto
      showProfileTab("perfil");
    }
  }

  // Función para mostrar una pestaña específica del perfil
  function showProfileTab(tabId = "perfil") {
    // Validar el ID de la pestaña
    const validTabs = ["perfil", "favoritos", "compras"];
    if (!validTabs.includes(tabId)) {
      tabId = "perfil";
    }

    // Actualizar la URL sin recargar la página
    history.pushState({}, "", `#perfil/${tabId}`);

    // Actualizar la clase activa en las pestañas
    document.querySelectorAll(".profile-nav-item").forEach((tab) => {
      tab.classList.toggle("active", tab.getAttribute("data-tab") === tabId);
    });

    // Ocultar todas las pestañas
    document.querySelectorAll(".profile-tab").forEach((tab) => {
      tab.classList.remove("active");
    });

    // Mostrar la pestaña seleccionada
    const activeTab = document.getElementById(`${tabId}-tab`);
    if (activeTab) {
      activeTab.classList.add("active");

      // Cargar el contenido de la pestaña
      switch (tabId) {
        case "perfil":
          renderProfileInfo();
          break;
        case "favoritos":
          renderFavoritesSection();
          break;
        case "compras":
          renderPurchaseHistory();
          break;
      }
    }
  }

  // Función para renderizar la información del perfil
  function renderProfileInfo() {
    const profileInfo = document.querySelector(".profile-info");
    if (!profileInfo || !currentUser) return;

    profileInfo.innerHTML = `
            <div class="profile-card">
                <i class="fas fa-user-circle profile-avatar"></i>
                <h2 class="profile-name">${currentUser.nombre}</h2>
                <p class="profile-email">${currentUser.email}</p>
                <p class="profile-member-since">
                    Miembro desde: ${new Date(
                      currentUser.fechaRegistro
                    ).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                </p>
                <button class="btn btn-secondary logout-btn" onclick="app.logout()">
                    <i class="fas fa-sign-out-alt"></i> Cerrar sesión
                </button>
            </div>
        `;
  }

  function updateTotalPurchases() {
    if (!currentUser || !currentUser.historialCompras) return;

    // Calculate total from all purchases
    const totalPurchases = currentUser.historialCompras.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    // Update the UI
    const balanceAmount = document.querySelector('.balance-amount');
    if (balanceAmount) {
      balanceAmount.textContent = `C$${totalPurchases.toFixed(2)}`;
    }
  }

  function renderPurchaseHistory() {
    const historialCompras = document.getElementById("historial-compras");
    if (!historialCompras || !currentUser) return;

    // Agrupar órdenes por tienda
    const ordersByStore = {};
    currentUser.historialCompras.forEach((order) => {
      const storeKey = order.storeId || "varios";
      if (!ordersByStore[storeKey]) {
        ordersByStore[storeKey] = {
          storeName: order.storeName || "Varios vendedores",
          orders: [],
        };
      }
      ordersByStore[storeKey].orders.push(order);
    });

    // Ordenar las tiendas por fecha (más reciente primero)
    const sortedStoreOrders = Object.values(ordersByStore)
      .map((store) => ({
        ...store,
        orders: store.orders.sort(
          (a, b) => new Date(b.fecha) - new Date(a.fecha)
        ),
      }))
      .sort((a, b) => {
        if (a.orders.length === 0 || b.orders.length === 0) return 0;
        return new Date(b.orders[0].fecha) - new Date(a.orders[0].fecha);
      });

    // Generar el HTML para las órdenes agrupadas por tienda
    const ordersHtml =
      sortedStoreOrders.length > 0
        ? sortedStoreOrders
            .map(
              (store) => `
                <div class="purchase-item">
                    <div class="purchase-header">
                        <h4 class="profile-section-title" style="margin: 0;">
                            <i class="fas fa-store" style="color: var(--color-primary);"></i>
                            ${store.storeName}
                        </h4>
                    </div>
                    <div class="purchase-list">
                        ${store.orders
                          .map(
                            (order) => `
                            <div class="purchase-details">
                                <div class="purchase-info">
                                    <div class="purchase-product-name">
                                        Factura #${
                                          order.facturaId || order.id.slice(-6)
                                        }
                                    </div>
                                    <div class="purchase-meta">
                                        <span class="purchase-date">
                                            ${formatDate(order.fecha, {
                                              year: "numeric",
                                              month: "long",
                                              day: "numeric",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                        </span>
                                        <span class="purchase-status" style="background-color: ${getStatusColor(
                                          order.estado,
                                          0.1
                                        )}; color: ${getStatusColor(
                              order.estado
                            )};">
                                            ${
                                              order.estado
                                                .charAt(0)
                                                .toUpperCase() +
                                              order.estado.slice(1)
                                            }
                                        </span>
                                        <span class="purchase-price">
                                            C$${order.total.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <button class="btn btn-text" 
                                        onclick="app.showOrderDetails('${
                                          order.id
                                        }')">
                                    Ver detalles <i class="fas fa-chevron-right" style="margin-left: 0.25rem;"></i>
                                </button>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>
            `
            )
            .join("")
        : '<div class="empty-state">No tienes compras anteriores.</div>';

    // Renderizar el historial de compras
    historialCompras.innerHTML = `
            <h3 class="profile-section-title">
                <i class="fas fa-shopping-bag" style="margin-right: 0.5rem; color: var(--color-primary);"></i>
                Historial de Compras
            </h3>
            <div class="purchases-list">
                ${ordersHtml}
            </div>
        `;
  }

  function renderFavoritesSection() {
    const container = document.getElementById("lista-favoritos");
    const emptyState = document.getElementById("empty-favorites");

    if (!container || !currentUser) {
      console.log(
        "No se pudo encontrar el contenedor o el usuario no está autenticado"
      );
      return;
    }

    // Asegurarse de que favoritos existe
    if (!currentUser.favoritos) {
      currentUser.favoritos = [];
      saveUsersToStorage(); // Guardar el cambio
    }

    console.log("Favoritos del usuario:", currentUser.favoritos); // Debug
    console.log("Total de productos cargados:", products.length); // Debug

    // Filtrar productos favoritos que existen en la lista de productos
    const favoriteProducts = [];
    currentUser.favoritos.forEach((favId) => {
      const product = products.find((p) => p.id === favId);
      if (product) {
        favoriteProducts.push(product);
      } else {
        console.log("Producto no encontrado en la lista de productos:", favId);
        // Opcional: Eliminar el favorito que ya no existe
        currentUser.favoritos = currentUser.favoritos.filter(
          (id) => id !== favId
        );
      }
    });

    console.log("Productos favoritos encontrados:", favoriteProducts); // Debug

    // Mostrar/ocultar estado vacío
    if (emptyState) {
      emptyState.style.display =
        favoriteProducts.length === 0 ? "flex" : "none";
    }

    // Mostrar productos favoritos si hay alguno
    if (favoriteProducts.length > 0) {
      console.log("Renderizando productos favoritos:", favoriteProducts); // Debug
      renderProducts(favoriteProducts, "lista-favoritos");

      // Asegurarse de que los botones de favoritos estén actualizados
      favoriteProducts.forEach((product) => {
        const favButton = document.querySelector(
          `[onclick*="toggleFavorite('${product.id}')"]`
        );
        if (favButton) {
          favButton.innerHTML = '<i class="fas fa-heart"></i>';
          favButton.classList.add("active");
        }
      });
    } else {
      container.innerHTML = "";
    }

    // Actualizar la interfaz de usuario
    syncCartCounter(); // Actualizar contador después de cambios en favoritos

    // Guardar cambios en el almacenamiento
    saveUsersToStorage();
  }

  function renderCartSection() {
    const itemsContainer = document.getElementById("contenido-carrito");
    const summaryContainer = document.getElementById("resumen-carrito");
    if (!itemsContainer || !summaryContainer || !currentUser) return;

    if (!products || products.length === 0) {
         console.error('No hay productos cargados en el sistema');
         itemsContainer.innerHTML = '<div class="card" style="padding: 2rem; text-align: center; color: red;">Error: No se pudieron cargar los datos de productos. Por favor recarga la página.</div>';
         summaryContainer.classList.add('hidden');
         return;
    }

    if (currentUser.carrito.length === 0) {
      itemsContainer.innerHTML = `<div class="card" style="padding: 2rem; text-align: center;" data-i18n="cart.empty">Tu carrito está vacío.</div>`;
      summaryContainer.classList.add("hidden");
      currentStoreForPayment = null; // Resetear la tienda seleccionada
      return;
    }

    summaryContainer.classList.remove("hidden");

    // Agrupar productos por tienda
    const cartByStore = currentUser.carrito.reduce((acc, item) => {
      const product = products.find((p) => p.id === item.id);

      if (product) {
        const storeId = product.tienda.id;
        if (!acc[storeId]) {
          acc[storeId] = {
            storeId: storeId,
            storeName: product.tienda.nombre,
            items: [],
          };
        }
        acc[storeId].items.push({ ...item, productData: product });
      } else {
        // Manejar productos que ya no existen en la base de datos
        console.warn(
          `Producto con ID ${item.id} no encontrado en la base de datos.`
        );
        const unknownId = "unknown";
        if (!acc[unknownId]) {
          acc[unknownId] = {
            storeId: unknownId,
            storeName: "Productos no disponibles",
            items: [],
          };
        }
        acc[unknownId].items.push({
          ...item,
          productData: {
            id: item.id,
            nombre: "Producto no disponible",
            nombre_en: "Product unavailable",
            precio: 0,
            imagen: "https://via.placeholder.com/80?text=N/A",
            tienda: { id: unknownId, nombre: "Desconocido" },
          },
        });
      }
      return acc;
    }, {});

    // Si hay una tienda seleccionada, mostrar solo los productos de esa tienda
    if (currentStoreForPayment && cartByStore[currentStoreForPayment]) {
      const storeOrder = cartByStore[currentStoreForPayment];
      renderStoreCheckout(storeOrder);
      return;
    }

    // Si no hay tienda seleccionada, mostrar todos los productos agrupados por tienda
    let itemsHtml = Object.values(cartByStore)
      .map((storeOrder) => {
        let storeSubtotal = storeOrder.items.reduce(
          (sum, item) => sum + item.productData.precio * item.cantidad,
          0
        );

        const storeItemsHtml = storeOrder.items
          .map(
            (item) => `
                <div class="card" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; margin-bottom: 1rem;">
                    <img src="${item.productData.imagen}" alt="${getText(
              item.productData,
              "nombre",
              "nombre_en"
            )}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 0.25rem;">
                    <div style="flex: 1;">
                        <h3 style="font-weight: 600;">${getText(
                          item.productData,
                          "nombre",
                          "nombre_en"
                        )}</h3>
                        <p class="price">${formatCurrency(
                          item.productData.precio
                        )}</p>
                    </div>
                    <div style="text-align: right;">
                        <input type="number" min="1" value="${item.cantidad}" 
                               onchange="app.updateCartQuantity('${
                                 item.id
                               }', this.valueAsNumber)" 
                               class="form-input" style="width: 70px; text-align: center; margin-bottom: 0.5rem;">
                        <button onclick="app.updateCartQuantity('${
                          item.id
                        }', 0)" class="btn-icon" title="${
              window.i18n?.t?.("actions.delete") || "Eliminar"
            }" data-i18n-attr="title=actions.delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>`
          )
          .join("");

        return `
                <div class="store-cart-group" style="margin-bottom: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--color-borde);">
                        <h3 style="font-size: 1.2rem; font-weight: 600; margin: 0;">${
                          storeOrder.storeName
                        }</h3>
                        <button class="btn btn-primary" onclick="app.payForStore('${
                          storeOrder.storeId
                        }')" data-i18n="[html]cart.payOrder">
                            ${
                              window.i18n?.t?.("cart.payOrder", {
                                amount: formatCurrency(storeSubtotal),
                              }) ||
                              `Pagar Pedido (${formatCurrency(storeSubtotal)})`
                            }
                        </button>
                    </div>
                    ${storeItemsHtml}
                    <div style="text-align: right; font-weight: bold; margin-top: 1rem;" data-i18n="[html]cart.storeSubtotal">
                        ${
                          window.i18n?.t?.("cart.storeSubtotal", {
                            amount: formatCurrency(storeSubtotal),
                          }) ||
                          `Subtotal Tienda: ${formatCurrency(storeSubtotal)}`
                        }
                    </div>
                </div>
            `;
      })
      .join("");

    itemsContainer.innerHTML = itemsHtml;
    summaryContainer.classList.add("hidden"); // Ocultar resumen general cuando se muestran todas las tiendas

    // Aplicar traducciones a los elementos dinámicos
    if (window.i18n) {
      window.i18n.localizePage();
    }
  }

  // Función para renderizar el checkout de una tienda específica
  function renderStoreCheckout(storeOrder) {
    const itemsContainer = document.getElementById("contenido-carrito");
    const summaryContainer = document.getElementById("resumen-carrito");

    // Renderizar productos de la tienda
    const storeItemsHtml = storeOrder.items
      .map(
        (item) => `
            <div class="card" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; margin-bottom: 1rem;">
                <img src="${item.productData.imagen}" alt="${getText(
          item.productData,
          "nombre",
          "nombre_en"
        )}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 0.25rem;">
                <div style="flex: 1;">
                    <h3 style="font-weight: 600;">${getText(
                      item.productData,
                      "nombre",
                      "nombre_en"
                    )}</h3>
                    <p class="price">${formatCurrency(
                      item.productData.precio
                    )}</p>
                </div>
                <div style="text-align: right;">
                    <input type="number" min="1" value="${item.cantidad}" 
                           onchange="app.updateCartQuantity('${
                             item.id
                           }', this.valueAsNumber)" 
                           class="form-input" style="width: 70px; text-align: center; margin-bottom: 0.5rem;">
                    <button onclick="app.updateCartQuantity('${
                      item.id
                    }', 0)" class="btn-icon" title="${
          window.i18n?.t?.("actions.delete") || "Eliminar"
        }" data-i18n-attr="title=actions.delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>`
      )
      .join("");

    // Calcular subtotal
    const subtotal = storeOrder.items.reduce(
      (sum, item) => sum + item.productData.precio * item.cantidad,
      0
    );

    const envio = deliveryMethod === "domicilio" ? 150.0 : 0;
    const total = subtotal + envio;

    // Actualizar la interfaz
    itemsContainer.innerHTML = `
            <div style="margin-bottom: 1.5rem;">
                <button class="btn btn-text" onclick="app.returnToCartView()" data-i18n="[html]cart.backToCart">
                    <i class="fas fa-arrow-left"></i> ${
                      window.i18n?.t?.("cart.backToCart") || "Volver al carrito"
                    }
                </button>
            </div>
            <div class="store-cart-group">
                <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1.5rem;" data-i18n="[html]cart.orderFrom">
                    ${
                      window.i18n?.t?.("cart.orderFrom", {
                        store: storeOrder.storeName,
                      }) || `Pedido de ${storeOrder.storeName}`
                    }
                </h2>
                ${storeItemsHtml}
            </div>
        `;

    // Actualizar el resumen del pedido
    summaryContainer.innerHTML = `
            <div style="padding: 1.5rem;">
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;" data-i18n="cart.orderSummary">Resumen del Pedido</h3>
                
                <!-- Opciones de Entrega -->
                <div class="form-group">
                    <label class="form-label" data-i18n="cart.delivery.method">Método de Entrega</label>
                    <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="deliveryMethod" value="retiro" 
                                   onchange="app.setDeliveryMethod('retiro')" ${
                                     deliveryMethod === "retiro"
                                       ? "checked"
                                       : ""
                                   }>
                            <span style="margin-left: 0.5rem;" data-i18n="cart.delivery.pickup">Retiro en Local</span>
                        </label>
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="deliveryMethod" value="domicilio" 
                                   onchange="app.setDeliveryMethod('domicilio')" ${
                                     deliveryMethod === "domicilio"
                                       ? "checked"
                                       : ""
                                   }>
                            <span style="margin-left: 0.5rem;" data-i18n="cart.delivery.home">A Domicilio</span>
                        </label>
                    </div>
                </div>
                
                <div id="direccion-container" class="form-group" style="margin-top: 1rem; ${
                  deliveryMethod !== "domicilio" ? "display: none;" : ""
                }">
                    <label for="direccion-envio" class="form-label" data-i18n="cart.delivery.address">Dirección de Envío</label>
                    <input type="text" id="direccion-envio" class="form-input" 
                           value="${deliveryAddress}" 
                           oninput="app.setDeliveryAddress(this.value)" 
                           placeholder="${
                             window.i18n?.t?.(
                               "cart.delivery.addressPlaceholder"
                             ) || "Escribe tu dirección completa"
                           }"
                           data-i18n-attr="placeholder=cart.delivery.addressPlaceholder">
                </div>

                <!-- Resumen de Costos -->
                <div style="margin-top: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span data-i18n="[html]cart.summary.subtotal">
                            ${
                              window.i18n?.t?.("cart.summary.subtotal", {
                                count: storeOrder.items.length,
                              }) ||
                              `Subtotal (${storeOrder.items.length} productos):`
                            }
                        </span>
                        <span id="subtotal">${formatCurrency(subtotal)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                        <span data-i18n="cart.summary.shipping">Costo de envío:</span>
                        <span id="costo-envio">${formatCurrency(envio)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.25rem;">
                        <span data-i18n="cart.summary.total">Total:</span>
                        <span id="total-pedido">${formatCurrency(total)}</span>
                    </div>
                </div>
                
                <button class="btn btn-primary" style="width: 100%; margin-top: 1.5rem;" 
                        onclick="app.processPayment('${storeOrder.storeId}')"
                        data-i18n="cart.proceedPayment">
                    ${
                      window.i18n?.t?.("cart.proceedPayment") ||
                      "Proceder al Pago"
                    }
                </button>
            </div>
        `;

    // Aplicar traducciones a los elementos dinámicos
    if (window.i18n) {
      window.i18n.localizePage();
    }
  }

  // =================================================================================
  // MANEJO DE PESTAÑAS DEL PERFIL
  // =================================================================================
  function setupProfileTabs() {
    // Manejar clic en las pestañas
    document.querySelectorAll(".profile-nav-item").forEach((tab) => {
      tab.addEventListener("click", function (e) {
        e.preventDefault();
        const tabId = this.getAttribute("data-tab");
        showProfileTab(tabId);
      });
    });

    // Manejar cambios en la URL
    window.addEventListener("hashchange", handleProfileHashChange);
  }

  // Función para manejar cambios en el hash de la URL
  function handleProfileHashChange() {
    const hash = window.location.hash.substring(1);
    if (hash.startsWith("perfil/")) {
      const tabId = hash.split("/")[1];
      showProfileTab(tabId);
    }
  }

  // =================================================================================
  // MANEJADORES DE EVENTOS
  // =================================================================================
  function setupEventListeners() {
    const navMapping = {
      "nav-inicio": "inicio",
      "nav-buscar": "buscar",
      "nav-noticias": "noticias",
      "nav-carrito": "carrito",
      "desktop-buscar": "buscar",
      "desktop-carrito": "carrito",
      "desktop-noticias": "noticias",
    };
    Object.keys(navMapping).forEach((id) => {
      document.getElementById(id)?.addEventListener("click", (e) => {
        e.preventDefault();
        if (navMapping[id] === "noticias" && !ensureAuth()) return;
        navigateTo(navMapping[id]);
      });
    });

    ["nav-perfil", "desktop-perfil"].forEach((id) => {
      document.getElementById(id)?.addEventListener("click", (e) => {
        e.preventDefault();
        if (currentUser) {
          navigateTo("perfil");
        } else {
          showAuthModal("login");
        }
      });
    });

    logoLink?.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo("inicio");
    });
    backButton?.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo("inicio");
    });
    searchInputSection?.addEventListener("input", (e) =>
      performSearch(e.target.value)
    );

    document.getElementById("login-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      login(e.target.elements[0].value, e.target.elements[1].value);
    });
    document
      .getElementById("register-form")
      ?.addEventListener("submit", (e) => {
        e.preventDefault();
        register(
          e.target.elements[0].value,
          e.target.elements[1].value,
          e.target.elements[2].value
        );
      });
    document
      .getElementById("close-auth-modal")
      ?.addEventListener("click", hideAuthModal);
    document.getElementById("auth-modal")?.addEventListener("click", (e) => {
      if (e.target.id === "auth-modal") hideAuthModal();
    });
    document
      .getElementById("login-tab")
      ?.addEventListener("click", () => showAuthModal("login"));
    document
      .getElementById("register-tab")
      ?.addEventListener("click", () => showAuthModal("register"));
  }

  // =================================================================================
  // UI HELPERS
  // =================================================================================
  function showAuthModal(tab = "login") {
    const modal = document.getElementById("auth-modal");
    if (!modal) return;
    modal.classList.add("show");
    document
      .getElementById("login-tab")
      .classList.toggle("active", tab === "login");
    document
      .getElementById("register-tab")
      .classList.toggle("active", tab !== "login");
    document
      .getElementById("login-content")
      .classList.toggle("hidden", tab !== "login");
    document
      .getElementById("register-content")
      .classList.toggle("hidden", tab === "login");
  }

  function hideAuthModal() {
    document.getElementById("auth-modal")?.classList.remove("show");
    document.getElementById("login-form")?.reset();
    document.getElementById("register-form")?.reset();
  }

  // =================================================================================
  // SINCRONIZACIÓN DE CONTADORES
  // =================================================================================
  
  /**
   * Función centralizada para sincronizar el contador del carrito
   * Esta es la ÚNICA función que debe actualizar el contador del carrito
   */
  function syncCartCounter() {
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

  /**
   * Alias para compatibilidad con código existente
   * @deprecated Usar syncCartCounter() en su lugar
   */
  function updateAuthUI() {
    syncCartCounter();
  }

  /**
   * Alias para compatibilidad con código existente
   * @deprecated Usar syncCartCounter() en su lugar
   */
  function updateCartCounter() {
    syncCartCounter();
  }

  function updateActiveNav(activeSection) {
    document
      .querySelectorAll(".bottom-nav .nav-item a")
      .forEach((a) => a.classList.remove("active"));
    const activeNav = document.querySelector(`#nav-${activeSection}`);
    if (activeNav) activeNav.classList.add("active");
    const activeEl = document.getElementById(`nav-${activeSection}`);
    if (activeEl) activeEl.classList.add("active");
  }

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

  function renderCategoriesAndFilters() {
    const container = document.getElementById("categorias-container");
    if (!container) return;

    const categories = window.categoriasData || [];
    container.innerHTML =
      categories
        .map((cat) => {
          const categoryName = window.i18n?.t?.(cat.i18nKey) || cat.id;

          // Ícono especial para hamacas
          if (cat.id === "hamacas") {
            return `
                    <a href="#" class="card category-card" data-categoria="${cat.id}" data-i18n-attr="title=${cat.i18nKey}">
                        <svg class="category-icon hammock-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 7C4 5.34315 5.34315 4 7 4H17C18.6569 4 20 5.34315 20 7V17C20 18.6569 18.6569 20 17 20H7C5.34315 20 4 18.6569 4 17V7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M8 8V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M16 8V16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <span class="category-name" data-i18n="${cat.i18nKey}">${categoryName}</span>
                    </a>
                `;
          }

          // Para las demás categorías
          return `
                <a href="#" class="card category-card" data-categoria="${cat.id}" data-i18n-attr="title=${cat.i18nKey}">
                    <i class="${cat.icono} category-icon"></i>
                    <span class="category-name" data-i18n="${cat.i18nKey}">${categoryName}</span>
                </a>
            `;
        })
        .join("") +
      `
            <a href="#" class="card category-card active" data-categoria="todas" data-i18n-attr="title=categories.all">
                <i class="fas fa-border-all category-icon"></i>
                <span class="category-name" data-i18n="categories.all">${
                  window.i18n?.t?.("categories.all") || "All"
                }</span>
            </a>
        `;

    container.addEventListener("click", (e) => {
      e.preventDefault();
      const targetCard = e.target.closest(".category-card");
      if (!targetCard) return;

      container
        .querySelectorAll(".category-card")
        .forEach((card) => card.classList.remove("active"));
      targetCard.classList.add("active");

      const categoryId = targetCard.dataset.categoria;
      const filteredProducts =
        categoryId === "todas"
          ? products
          : products.filter((p) => p.categoria === categoryId);

      renderProducts(filteredProducts, "productos-container");
    });
  }

  function returnToCartView() {
    currentStoreForPayment = null;
    renderCartSection();
  }

  function payForStore(storeId) {
    currentStoreForPayment = storeId;
    renderCartSection();
  }

  function markAsDelivered(orderId) {
    if (!currentUser) {
      showNotification(
        "Debes iniciar sesión para marcar el pedido como recibido",
        "error"
      );
      return;
    }

    // Encontrar el pedido en el historial del usuario
    const orderIndex = currentUser.historialCompras.findIndex(
      (o) => o.id === orderId
    );
    if (orderIndex === -1) {
      showNotification("No se encontró el pedido", "error");
      return;
    }

    // Actualizar el estado del pedido
    currentUser.historialCompras[orderIndex].estado = "completado";

    // Guardar cambios
    const userIndex = users.findIndex((u) => u.id === currentUser.id);
    if (userIndex !== -1) {
      users[userIndex] = currentUser;
      saveUsersToStorage();

      // Cerrar el modal actual
      const modal = document.querySelector(".modal");
      if (modal) {
        document.body.removeChild(modal);
      }

      // Mostrar notificación
      showNotification(
        "¡Producto marcado como recibido correctamente!",
        "exito"
      );

      // Actualizar la vista del perfil
      if (currentSection === "perfil") {
        renderProfileSection();
      }
    }
  }

  function getStatusColor(status, type = "background") {
    const statusColors = {
      pendiente: {
        background: "#ffc107", // Amarillo
        text: "#000",
        buttonBg: "#ffc107",
        buttonText: "#000",
      },
      procesando: {
        background: "#17a2b8", // Azul claro
        text: "#fff",
        buttonBg: "#17a2b8",
        buttonText: "#fff",
      },
      enviado: {
        background: "#007bff", // Azul
        text: "#fff",
        buttonBg: "#007bff",
        buttonText: "#fff",
      },
      entregado: {
        background: "#28a745", // Verde
        text: "#fff",
        buttonBg: "#6c757d", // Gris para botón
        buttonText: "#fff",
      },
      completado: {
        background: "#28a745", // Verde
        text: "#fff",
        buttonBg: "#6c757d", // Gris para botón
        buttonText: "#fff",
      },
      cancelado: {
        background: "#dc3545", // Rojo
        text: "#fff",
        buttonBg: "#dc3545",
        buttonText: "#fff",
        disabled: true,
      },
    };

    const statusLower = status.toLowerCase();
    const colorInfo = statusColors[statusLower] || {
      background: "#6c757d",
      text: "#fff",
      buttonBg: "#6c757d",
      buttonText: "#fff",
    };

    return type === "buttonBg"
      ? colorInfo.buttonBg
      : type === "buttonText"
      ? colorInfo.buttonText
      : type === "text"
      ? colorInfo.text
      : type === "background"
      ? colorInfo.background
      : colorInfo.background;
  }

  function showOrderDetails(orderId) {
    const order = currentUser.historialCompras.find((o) => o.id === orderId);
    if (!order) {
      showNotification("No se encontró el pedido solicitado", "error");
      return;
    }

    // Crear un modal para mostrar los detalles del pedido
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 2rem;
            z-index: 1000;
            overflow-y: auto;
        `;

    // Contenido del modal
    modal.innerHTML = `
            <div class="modal-content" style="
                background-color: white;
                border-radius: 8px;
                width: 100%;
                max-width: 800px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                overflow: hidden;
            ">
                <!-- Encabezado del modal -->
                <div style="
                    padding: 1.5rem;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h3 style="margin: 0; font-size: 1.5rem; font-weight: 600;">
                        <i class="fas fa-receipt" style="margin-right: 0.5rem; color: var(--color-primary);"></i>
                        Factura #${order.facturaId || order.id.slice(-6)}
                    </h3>
                    <button id="closeModal" class="btn-icon" style="font-size: 1.25rem; color: #6c757d;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- Cuerpo del modal -->
                <div style="padding: 1.5rem;">
                    <!-- Información de la tienda -->
                    <div style="margin-bottom: 2rem; padding: 1rem; background-color: #f8f9fa; border-radius: 6px;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                            <div style="
                                width: 50px;
                                height: 50px;
                                border-radius: 50%;
                                background-color: var(--color-primary);
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                font-size: 1.5rem;
                            ">
                                <i class="fas fa-store"></i>
                            </div>
                            <div>
                                <h4 style="margin: 0 0 0.25rem 0; font-size: 1.1rem; font-weight: 600;">
                                    ${order.storeName || "Tienda"}
                                </h4>
                                <p style="margin: 0; font-size: 0.9rem; color: var(--color-texto-secundario);">
                                    ${
                                      order.storeId
                                        ? `ID: ${order.storeId}`
                                        : ""
                                    }
                                </p>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                            <div>
                                <div style="font-size: 0.8rem; color: var(--color-texto-secundario); margin-bottom: 0.25rem;">Fecha</div>
                                <div>${new Date(order.fecha).toLocaleDateString(
                                  "es-ES",
                                  {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.8rem; color: var(--color-texto-secundario); margin-bottom: 0.25rem;">Estado</div>
                                <div>
                                    <span class="status-badge" style="
                                        background-color: ${getStatusColor(
                                          order.estado
                                        )};
                                        color: white;
                                        padding: 0.25rem 0.75rem;
                                        border-radius: 12px;
                                        font-size: 0.8rem;
                                        display: inline-block;
                                    ">${
                                      order.estado.charAt(0).toUpperCase() +
                                      order.estado.slice(1)
                                    }</span>
                                </div>
                            </div>
                            <div>
                                <div style="font-size: 0.8rem; color: var(--color-texto-secundario); margin-bottom: 0.25rem;">Método de entrega</div>
                                <div>${
                                  order.metodoEntrega === "domicilio"
                                    ? "A domicilio"
                                    : "Retiro en local"
                                }</div>
                            </div>
                        </div>
                    </div>

                    <!-- Productos del pedido -->
                    <h4 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">
                        Productos
                    </h4>
                    
                    <div style="margin-bottom: 2rem;">
                        ${
                          order.items && order.items.length > 0
                            ? order.items
                                .map(
                                  (item) => `
                                <div style="display: flex; gap: 1rem; padding: 1rem 0; border-bottom: 1px solid #f0f0f0;">
                                    <img src="${
                                      item.productData?.imagen ||
                                      "https://via.placeholder.com/80"
                                    }" 
                                         alt="${
                                           item.productData?.nombre ||
                                           "Producto"
                                         }" 
                                         style="width: 80px; height: 80px; object-fit: cover; border-radius: 4px;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; margin-bottom: 0.25rem;">
                                            ${
                                              item.productData?.nombre ||
                                              "Producto no disponible"
                                            }
                                        </div>
                                        <div style="font-size: 0.9rem; color: var(--color-texto-secundario); margin-bottom: 0.5rem;">
                                            Cantidad: ${item.cantidad} x C$${
                                    item.productData?.precio?.toFixed(2) ||
                                    "0.00"
                                  }
                                        </div>
                                        <div style="font-weight: 600; color: var(--color-primary);">
                                            C$${
                                              (
                                                item.productData?.precio *
                                                item.cantidad
                                              ).toFixed(2) || "0.00"
                                            }
                                        </div>
                                    </div>
                                </div>
                            `
                                )
                                .join("")
                            : "<p>No se encontraron productos en este pedido.</p>"
                        }
                    </div>

                    <!-- Resumen del pedido -->
                    <div style="background-color: #f8f9fa; border-radius: 6px; padding: 1.5rem; margin-top: 2rem;">
                        <h4 style="font-size: 1.1rem; font-weight: 600; margin-top: 0; margin-bottom: 1.5rem; text-align: center;">
                            Resumen del Pedido
                        </h4>
                        
                        <div style="margin-bottom: 1.5rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem;">
                                <span>Subtotal (${
                                  order.items?.length || 0
                                } productos):</span>
                                <span>C$${
                                  order.subtotal?.toFixed(2) || "0.00"
                                }</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid #ddd;">
                                <span>Envío:</span>
                                <span>C$${
                                  order.envio?.toFixed(2) || "0.00"
                                }</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 600; margin-top: 1rem;">
                                <span>Total:</span>
                                <span style="color: var(--color-primary);">C$${
                                  order.total?.toFixed(2) || "0.00"
                                }</span>
                            </div>
                        </div>

                        <!-- Información de envío si aplica -->
                        ${
                          order.metodoEntrega === "domicilio"
                            ? `
                            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #eee;">
                                <h5 style="font-size: 1rem; font-weight: 600; margin-top: 0; margin-bottom: 0.75rem;">
                                    <i class="fas fa-truck" style="margin-right: 0.5rem; color: var(--color-primary);"></i>
                                    Dirección de Envío
                                </h5>
                                <p style="margin: 0; line-height: 1.5;">
                                    ${order.direccionEnvio || "No especificada"}
                                </p>
                            </div>
                        `
                            : `
                            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #eee; text-align: center;">
                                <i class="fas fa-store" style="font-size: 1.5rem; color: var(--color-primary); margin-bottom: 0.5rem; display: block;"></i>
                                <p style="margin: 0; font-weight: 500;">Recogerás tu pedido en la tienda</p>
                                <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: var(--color-texto-secundario);">
                                    Te notificaremos cuando tu pedido esté listo
                                </p>
                            </div>
                        `
                        }
                    </div>

                    <!-- Botones de acción -->
                    <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #eee; flex-wrap: wrap;">
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: flex-end; width: 100%;">
                            <button id="printReceipt" class="btn btn-outline" style="display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-print"></i> Imprimir Recibo
                            </button>
                            ${
                              ["enviado", "pendiente", "procesando"].includes(
                                order.estado
                              )
                                ? `
                            <button id="markAsDelivered" class="btn btn-success" style="display: flex; align-items: center; gap: 0.5rem; background-color: #28a745; color: white; border: none;">
                                <i class="fas fa-check-circle"></i> Marcar como Recibido
                            </button>
                            `
                                : ""
                            }
                            <button id="contactSeller" class="btn" style="display: flex; align-items: center; gap: 0.5rem; 
                                background-color: ${getStatusColor(
                                  order.estado,
                                  "buttonBg"
                                )}; 
                                color: ${getStatusColor(
                                  order.estado,
                                  "buttonText"
                                )}; 
                                border: none;
                                ${
                                  ["entregado", "completado"].includes(
                                    order.estado
                                  )
                                    ? "opacity: 0.8;"
                                    : ""
                                }">
                                <i class="fab fa-whatsapp"></i> Contactar al Vendedor
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Agregar el modal al documento
    document.body.appendChild(modal);

    // Configurar eventos del modal
    const closeButton = modal.querySelector("#closeModal");
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        document.body.removeChild(modal);
      });
    }

    // Cerrar al hacer clic fuera del contenido
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    // Configurar botón de impresión
    const printButton = modal.querySelector("#printReceipt");
    if (printButton) {
      printButton.addEventListener("click", () => {
        window.print();
      });
    }

    // Configurar botón de contacto
    const contactButton = modal.querySelector("#contactSeller");
    if (contactButton) {
      contactButton.addEventListener("click", () => {
        if (!order || !order.storeId) {
          showNotification(
            "No se encontró la información del vendedor",
            "error"
          );
          return;
        }

        // Obtener información del vendedor
        const store = window.tiendasData.find((t) => t.id === order.storeId);
        if (!store || !store.contacto) {
          console.error("No se encontró la tienda o el contacto:", {
            storeId: order.storeId,
            store,
          });
          showNotification(
            "No se encontró la información de contacto del vendedor",
            "error"
          );
          return;
        }

        let message = `*¡Hola!* 👋\n\n`;
        message += `Soy *${currentUser.nombre || "Cliente"}* `;

        // Personalizar mensaje según el estado del pedido
        const estado = order.estado.toLowerCase();

        if (estado === "pendiente") {
          message += `y quiero confirmar mi pedido.\n\n`;
          message += `*📋 Detalles del Pedido*\n\n`;
          message += `*N° de Factura:* ${
            order.facturaId || order.id.slice(-6)
          }\n`;
          message += `*Estado:* ${
            order.estado.charAt(0).toUpperCase() + order.estado.slice(1)
          }\n\n`;

          // Productos
          message += `*🛍️ Productos Solicitados:*\n\n`;
          order.items.forEach((item, index) => {
            const productName = item.productData?.nombre || "Producto";
            message += `${index + 1}. *${productName}* (${item.cantidad} x C$${
              item.productData?.precio?.toFixed(2) || "0.00"
            })\n`;
          });

          message += `\n*💰 Total: C$${order.total?.toFixed(2) || "0.00"}*\n\n`;
          message += `Por favor, confírmame la disponibilidad de los productos y las opciones de pago.`;
        } else if (estado === "procesando") {
          message += `y quiero consultar el estado de mi pedido.\n\n`;
          message += `*N° de Pedido:* ${
            order.facturaId || order.id.slice(-6)
          }\n`;
          message += `*Realizado el:* ${new Date(
            order.fecha
          ).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}\n\n`;
          message += `¿Podrían indicarme en qué estado se encuentra mi pedido y cuándo podría estar listo para envío?`;
        } else if (estado === "enviado") {
          message += `y necesito información sobre el envío de mi pedido.\n\n`;
          message += `*N° de Pedido:* ${
            order.facturaId || order.id.slice(-6)
          }\n`;
          message += `*Método de envío:* ${
            order.metodoEntrega === "domicilio"
              ? "A domicilio"
              : "Recoger en tienda"
          }\n\n`;

          if (order.metodoEntrega === "domicilio") {
            message += `¿Podrían proporcionarme el número de seguimiento o información sobre la entrega?\n\n`;
            if (order.direccionEnvio) {
              message += `*Dirección de envío:*\n${order.direccionEnvio}\n\n`;
            }
          } else {
            message += `¿Podrían indicarme si ya está listo para ser recogido en tienda?\n\n`;
          }
        } else if (["entregado", "completado"].includes(estado)) {
          message += `¡Espero que se encuentre bien! \n\n`;
          message += `Me comunico para realizar una consulta sobre un pedido anterior.\n\n`;
          message += `¿Podrían ayudarme por favor?`;
        }

        // Información de contacto del cliente
        message += `\n\n*Mis datos de contacto:*\n`;
        message += `📱 ${currentUser.telefono || "Sin teléfono registrado"}\n`;
        message += `📧 ${currentUser.email || "Sin correo registrado"}`;

        // Codificar el mensaje para URL
        const encodedMessage = encodeURIComponent(message);

        // Formatear número de teléfono (eliminar cualquier carácter que no sea dígito)
        const phoneNumber = store.contacto.replace(/\D/g, "");

        // Verificar si el número tiene el formato correcto (al menos 8 dígitos)
        if (!phoneNumber || phoneNumber.length < 8) {
          console.error("Número de teléfono no válido:", store.contacto);
          showNotification(
            "El número de teléfono del vendedor no es válido",
            "error"
          );
          return;
        }

        // Agregar el código de país si no está presente (asumiendo Nicaragua +505)
        const fullPhoneNumber = phoneNumber.startsWith("505")
          ? phoneNumber
          : phoneNumber.startsWith("8")
          ? "505" + phoneNumber
          : phoneNumber;

        // Crear la URL de WhatsApp
        const whatsappUrl = `https://wa.me/${fullPhoneNumber}?text=${encodedMessage}`;
        console.log("Abriendo WhatsApp con URL:", whatsappUrl);

        // Abrir en una nueva pestaña
        const newWindow = window.open(whatsappUrl, "_blank");

        // Si la ventana no se abrió (posible bloqueador de ventanas emergentes)
        if (
          !newWindow ||
          newWindow.closed ||
          typeof newWindow.closed === "undefined"
        ) {
          showNotification(
            "No se pudo abrir WhatsApp. Por favor, verifica si tienes un bloqueador de ventanas emergentes.",
            "error"
          );
        }
      });
    }

    // Configurar botón de marcar como recibido
    const markDeliveredButton = modal.querySelector("#markAsDelivered");
    if (markDeliveredButton) {
      markDeliveredButton.addEventListener("click", () => {
        markAsDelivered(order.id);
      });
    }
  }

  // Función para navegar a la página de un producto
  function navigateToProduct(productId) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // Aquí puedes implementar la navegación a la página de detalle del producto
    // Por ahora, solo mostramos una alerta con el ID del producto
    alert(`Mostrando detalles del producto: ${productId}`);

    // Opcional: Actualizar la URL sin recargar la página
    const url = new URL(window.location);
    url.searchParams.set("section", "producto");
    url.searchParams.set("id", productId);
    window.history.pushState({}, "", url);
  }

  // Función para mostrar la sección de Mis Pedidos
  function showMisPedidos() {
    if (!ensureAuth()) return;

    // Mostrar la sección de Mis Pedidos
    document
      .querySelectorAll(".seccion-principal")
      .forEach((s) => s.classList.add("hidden"));
    const misPedidosSection = document.getElementById("seccion-mis-pedidos");
    if (misPedidosSection) {
      misPedidosSection.classList.remove("hidden");

      // Actualizar el título de la página
      document.title = "Mis Pedidos | Artesanica";

      // Forzar la actualización del historial de compras
      renderPurchaseHistory();
    }
  }

  // Función para mostrar una sección específica (compatibilidad con navegación existente)
  function showSection(sectionId) {
    if (sectionId === "mis-pedidos") {
      showMisPedidos();
    } else if (sectionId === "seccion-mis-favoritos") {
      // Mostrar la sección de favoritos
      document.querySelectorAll(".seccion-principal").forEach((section) => {
        section.classList.add("hidden");
      });
      const favoritesSection = document.getElementById("seccion-mis-favoritos");
      if (favoritesSection) {
        favoritesSection.classList.remove("hidden");
        renderFavoritesSection(); // Asegurarse de que se rendericen los favoritos
      }
    } else {
      navigateTo(sectionId);
    }
  }

  window.app = {
    toggleFavorite,
    addToCart,
    updateCartQuantity,
    showSection,
    showMisPedidos,
    showOrderDetails,
    markAsDelivered,
    payForStore,
    logout,
    processPayment,
    navigateTo,
    navigateToStore,
    navigateToProduct,
    login,
    register,
    setDeliveryMethod,
    setDeliveryAddress,
    returnToCartView,
    showOrderDetails,
    markAsDelivered,
  };

  initialize();
});
