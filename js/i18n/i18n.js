(function(){
  const STORAGE_KEY = 'artesanica_lang';
  const DEFAULT_LANG = 'es';
  const SUPPORTED = ['es','en'];

  let currentLang = DEFAULT_LANG;
  let dictionaries = { es: {}, en: {} };

  function detectInitialLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    const nav = (navigator.language || navigator.userLanguage || 'es').toLowerCase();
    if (nav.startsWith('en')) return 'en';
    return 'es';
  }

  async function loadDictionaries() {
    const [esRes, enRes] = await Promise.all([
      fetch('js/i18n/es.json').then(r => r.json()).catch(() => ({})),
      fetch('js/i18n/en.json').then(r => r.json()).catch(() => ({}))
    ]);
    dictionaries.es = esRes || {};
    dictionaries.en = enRes || {};
  }

  function t(key, params) {
    const dict = dictionaries[currentLang] || {};
    const fallback = dictionaries.es || {};
    let str = getByPath(dict, key) ?? getByPath(fallback, key) ?? key;
    if (str === key) {
      return undefined;
    }
    if (params && typeof str === 'string') {
      Object.keys(params).forEach(k => {
        str = str.replace(new RegExp('{' + k + '}', 'g'), params[k]);
      });
    }
    return str;
  }

  function getByPath(obj, path) {
    return path.split('.').reduce((acc, part) => (acc && acc[part] != null ? acc[part] : undefined), obj);
  }

  function translateDOM(root=document) {
    // data-i18n: replace textContent
    root.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const txt = t(key);
      if (typeof txt === 'string') el.textContent = txt;
    });
    // data-i18n-attr: comma-separated attr=key
    root.querySelectorAll('[data-i18n-attr]').forEach(el => {
      const attrMap = el.getAttribute('data-i18n-attr');
      attrMap.split(',').map(s => s.trim()).forEach(pair => {
        const [attr, key] = pair.split('=').map(s => s.trim());
        if (attr && key) {
          const val = t(key);
          if (typeof val === 'string') el.setAttribute(attr, val);
        }
      });
    });
    updateLangBadges();
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang) || currentLang === lang) return;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    
    // Traducir el contenido del DOM
    translateDOM();
    
    // Actualizar manualmente los botones de agregar al carrito
    document.querySelectorAll('.add-to-cart span[data-i18n="actions.addToCart"]').forEach(span => {
      const translation = t('actions.addToCart');
      if (translation) span.textContent = translation;
    });
    
    // Notificar a la aplicación principal para que actualice la interfaz
    try { 
      window.dispatchEvent(new CustomEvent('i18n:lang-changed', { detail: { lang } })); 
    } catch(_) {}
    
    // Forzar actualización de la sección actual
    if (window.app && window.app.updateUI) {
      window.app.updateUI();
    }
  }

  function getLang() {
    return currentLang;
  }

  function updateLangBadges() {
    const code = currentLang.toUpperCase();
    const d = document.getElementById('lang-code-desktop');
    if (d) d.textContent = code;
    const m = document.getElementById('lang-code-mobile');
    if (m) m.textContent = code;
  }

  function setupLangSelectors() {
    const desktopBtn = document.getElementById('lang-selector');
    const mobileBtn = document.getElementById('lang-selector-mobile');

    const toggle = () => setLang(currentLang === 'es' ? 'en' : 'es');

    if (desktopBtn) desktopBtn.addEventListener('click', (e) => { e.preventDefault(); toggle(); });
    if (mobileBtn) mobileBtn.addEventListener('click', (e) => { e.preventDefault(); toggle(); });
  }

  async function init() {
    await loadDictionaries();
    currentLang = detectInitialLang();
    updateLangBadges();
    setupLangSelectors();
    translateDOM();
    try { window.dispatchEvent(new CustomEvent('i18n:lang-changed', { detail: { lang: currentLang } })); } catch(_) {}
  }

  window.i18n = { t, setLang, getLang, translateDOM };
  document.addEventListener('DOMContentLoaded', init);
})();
