// Simple i18n implementation
const translations = {
  en: {
    'Welcome to YashAgency': 'Welcome to YashAgency',
    'Home': 'Home',
    'Products': 'Products',
    'Cart': 'Cart',
    'Login': 'Login',
    'Logout': 'Logout',
    'Add to Cart': 'Add to Cart',
    'Buy Now': 'Buy Now',
    'Your cart is empty': 'Your cart is empty',
    'Continue Shopping': 'Continue Shopping'
  },
  es: {
    'Welcome to YashAgency': 'Bienvenido a YashAgency',
    'Home': 'Inicio',
    'Products': 'Productos',
    'Cart': 'Carrito',
    'Login': 'Iniciar Sesión',
    'Logout': 'Cerrar Sesión',
    'Add to Cart': 'Añadir al Carrito',
    'Buy Now': 'Comprar Ahora',
    'Your cart is empty': 'Tu carrito está vacío',
    'Continue Shopping': 'Continuar Comprando'
  }
};

let currentLanguage = 'en';

export const t = (key) => {
  if (!key || typeof key !== 'string') {
    return key || '';
  }
  return translations[currentLanguage]?.[key] || key;
};

export const setLanguage = (lang) => {
  if (translations[lang]) {
    currentLanguage = lang;
  }
};

export const getCurrentLanguage = () => currentLanguage;