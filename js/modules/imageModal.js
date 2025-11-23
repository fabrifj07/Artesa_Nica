/**
 * Módulo para manejar el modal de imágenes
 * Permite visualizar imágenes en pantalla completa con opciones de cierre
 */

(function () {
  "use strict";

  /**
   * Inicializa el modal de imágenes
   */
  function initImageModal() {
    // Esperar a que el DOM esté cargado
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", setupModalListeners);
    } else {
      setupModalListeners();
    }
  }

  /**
   * Configura los event listeners del modal
   */
  function setupModalListeners() {
    const modal = document.getElementById("imageModal");
    const closeBtn = document.querySelector(".close");

    if (!modal) {
      console.warn("Modal de imágenes no encontrado en el DOM");
      return;
    }

    // Cerrar el modal al hacer clic en la X
    if (closeBtn) {
      closeBtn.addEventListener("click", closeModal);
    }

    // Cerrar el modal al hacer clic fuera de la imagen
    modal.addEventListener("click", function (event) {
      if (event.target === modal) {
        closeModal();
      }
    });

    // Cerrar con la tecla ESC
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" || event.key === "Esc") {
        closeModal();
      }
    });
  }

  /**
   * Cierra el modal de imágenes
   */
  function closeModal() {
    const modal = document.getElementById("imageModal");
    if (modal) {
      modal.style.display = "none";
    }
  }

  /**
   * Abre el modal con una imagen específica
   * @param {string} imageSrc - URL de la imagen a mostrar
   */
  function openModal(imageSrc) {
    const modal = document.getElementById("imageModal");
    const modalImage = document.getElementById("modalImage");

    if (modal && modalImage) {
      modalImage.src = imageSrc;
      modal.style.display = "block";
    }
  }

  // Exponer funciones públicas
  window.ImageModalModule = {
    init: initImageModal,
    open: openModal,
    close: closeModal,
  };

  // Auto-inicializar el módulo
  initImageModal();
})();
