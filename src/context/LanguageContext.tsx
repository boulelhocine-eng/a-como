import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es';

export const translations = {
  es: {
    // Navigation
    home: "Inicio",
    products: "Productos",
    about: "Nosotros",
    contact: "Contacto",
    trackOrder: "Seguimiento",
    cart: "Carrito",
    emptyCart: "El carrito está vacío.",
    total: "Total",
    checkout: "Proceder al Pago",
    profile: "Mi Perfil",
    login: "Iniciar Sesión",
    logout: "Cerrar Sesión",
    backToHome: "Volver al Inicio",

    // Hero / Banners
    heroTitle: "Nuestra Nueva Colección 2026",
    heroSub: "Descubre las últimas tendencias de moda diseñadas para adaptarse a tu estilo único.",
    shopNow: "Comprar Ahora",
    discoverMore: "Descubrir Más",

    // Categories
    all: "Todos",
    clothing: "Ropa",
    electronics: "Electrónica",
    men: "Hombres",
    women: "Mujeres",
    children: "Niños",

    // Products
    searchPlaceholder: "Buscar productos...",
    filterByCategory: "Filtrar por categoría",
    sortBy: "Ordenar por",
    priceLowHigh: "Precio: Menor a Mayor",
    priceHighLow: "Precio: Mayor a Menor",
    addToCart: "Añadir al Carrito",
    outOfStock: "Agotado",
    remaining: "Quedan: {count} unids",
    sold: "Vendidos: {count} unids",
    
    // About Page
    aboutTitle: "Nuestra Historia",
    aboutPara1: "Somos una tienda de ropa líder dedicada a ofrecer la mejor y más reciente moda a nuestros clientes con alta calidad y precios competitivos.",
    aboutPara2: "Nuestra marca fue fundada con la visión de empoderar a las personas para expresar su identidad a través de sus prendas con confianza y comodidad.",

    // Contact Page
    contactTitle: "Contáctanos",
    contactSub: "Siempre estamos encantados de estar en contacto contigo y responder a tus dudas.",
    contactName: "Nombre Completo",
    contactEmail: "Correo Electrónico",
    contactMsg: "Mensaje",
    sendMsg: "Enviar Mensaje",
    msgSuccess: "¡Tu mensaje ha sido enviado con éxito! Te responderemos lo antes posible.",

    // Cart Context
    addedToCart: "Producto añadido al carrito",
    removedFromCart: "Producto eliminado del carrito",

    // Checkout
    checkoutTitle: "Completar Pedido",
    fullName: "Nombre Completo *",
    phone: "Número de Teléfono *",
    address: "Dirección y Detalles *",
    selectAddressOnMap: "Por favor, seleccione la ubicación exacta en el mapa",
    placeOrder: "Confirmar y Enviar Pedido",
    orderSuccess: "¡Pedido realizado con éxito!",
    verificationCodeIs: "Tu código de verificación de entrega es:",
    keepVerificationCode: "Por favor guarda este código para compartirlo con el repartidor al recibir tu pedido.",
    close: "Cerrar",

    // Tracking
    trackTitle: "Sigue tu Pedido",
    enterOrderId: "Introduce el número de pedido",
    trackBtn: "Seguir Ahora",
    orderNotFound: "No se encontró ningún pedido con este número",
    orderStatus: "Estado del Pedido",
    pending: "Pendiente",
    delivered: "Entregado",
    driverAssigned: "Repartidor Asignado:",
    driverPhone: "Teléfono del Repartidor:",
    vehicleDetails: "Detalles del Vehículo:",
    plateNumber: "Matrícula/Placa:",

    // Login
    customerPortal: "Portal de Clientes",
    adminPortal: "Portal de Administración",
    driverPortal: "Portal de Repartidores",
    loginTab: "Iniciar Sesión",
    registerTab: "Registrarse",
    username: "Nombre de usuario",
    password: "Contraseña",
    email: "Correo Electrónico",
    hasAccount: "¿Ya tienes una cuenta?",
    noAccount: "¿No tienes una cuenta?",
    registerNow: "Crea una cuenta ahora",
    invalidCredentials: "Credenciales incorrectas",
    regSuccess: "¡Cuenta creada con éxito!",
    loginSuccess: "¡Inicio de sesión exitoso!",

    // Admin Dashboard
    adminDashboard: "Panel de Administración",
    statsOverview: "Resumen de Estadísticas",
    totalSales: "Ventas Totales",
    ordersCount: "Total Pedidos",
    productsCount: "Total Productos",
    driversCount: "Total Repartidores",
    recentOrders: "Pedidos Recientes",
    orderId: "ID de Pedido",
    customer: "Cliente",
    amount: "Monto",
    status: "Estado",
    actions: "Acciones",
    tabDashboard: "Tablero",
    tabProducts: "Gestión de Productos",
    tabDrivers: "Lista de Repartidores",
    tabSettings: "Configuración",
    vehicle: "Vehículo",
    regDate: "Fecha de Registro",
    noDrivers: "No hay repartidores registrados en este momento.",
    
    // Driver Dashboard
    driverDashboard: "Panel del Repartidor",
    driverVehicleInfo: "Vehículo y Placa",
    myDeliveries: "Mis Entregas",
    deliveriesCount: "Tus entregas",
    verificationCodeLabel: "Código de Verificación del Cliente",
    confirmDelivery: "Confirmar Entrega",
    invalidVerifyCode: "Código incorrecto, por favor inténtalo de nuevo.",
    deliveryCompletedSuccess: "¡Entrega confirmada con éxito!",
    activeShipments: "Entregas Activas",
    deliveredShipments: "Entregas Realizadas",
    callCustomer: "Llamar Cliente",
    addressOnMap: "Ubicación en Mapa",
    shareProduct: "Compartir producto",
    copyLink: "Copiar enlace",
    linkCopied: "¡Enlace copiado!"
  }
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations.es, replacements?: Record<string, string | number>) => string;
  getLocalizedProduct: (product: any) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang] = useState<Language>('es');

  const setLang = (newLang: Language) => {
    // No-op or update if necessary, but lang is always 'es'
  };

  useEffect(() => {
    // Force document attributes for Spanish (LTR)
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'es';
    localStorage.setItem('app_language', 'es');
  }, []);

  const t = (key: keyof typeof translations.es, replacements?: Record<string, string | number>): string => {
    const section = translations.es;
    let text = section[key] || '';
    
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  const getLocalizedProduct = (product: any) => {
    if (!product) return product;
    
    // Default translation mapping for categories
    const catMap: Record<string, string> = {
      '\u0646\u0633\u0627\u0626\u064a': 'Mujeres',
      '\u0631\u062c\u0627\u0644\u064a': 'Hombres',
      '\u0623\u0637\u0641\u0627\u0644': 'Niños',
      '\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0627\u062a': 'Electrónica',
      '\u0627\u0644\u0627\u062c\u0647\u0632\u0629 \u0627\u0644\u0627\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0629': 'Electrónica',
      'Mujeres': 'Mujeres',
      'Hombres': 'Hombres',
      'Niños': 'Niños',
      'Electrónica': 'Electrónica',
      'Electronics': 'Electrónica',
      'Ropa': 'Ropa',
      'Chasis de PC': 'Chasis de PC',
      'Tarjeta madre': 'Tarjeta madre',
      'RAM': 'RAM',
      'Fuente de poder': 'Fuente de poder',
      'Procesador': 'Procesador',
      'Tarjeta gráfica': 'Tarjeta gráfica',
      'Disco duro': 'Disco duro',
      'Accesorios': 'Accesorios',
      'صناديق الكمبيوتر': 'Chasis de PC',
      'كيسات': 'Chasis de PC',
      'اللوحة الأم': 'Tarjeta madre',
      'لوحات أم': 'Tarjeta madre',
      'الذاكرة العشوائية': 'RAM',
      'رامات': 'RAM',
      'مزود الطاقة': 'Fuente de poder',
      'باور سبلاي': 'Fuente de poder',
      'المعالج': 'Procesador',
      'بروسيسور': 'Procesador',
      'كرت الشاشة': 'Tarjeta gráfica',
      'بطاقة الرسومات': 'Tarjeta gráfica',
      'القرص الصلب': 'Disco duro',
      'وحدات التخزين': 'Disco duro',
      'إكسسوارات': 'Accesorios',
      'ملحقات': 'Accesorios',
    };
    
    const localizedCat = catMap[product.cat] || product.cat;

    const translationsMap: Record<number, { name: string; cat: string; desc: string }> = {
      13: { name: 'Conjunto de Ropa Infantil', cat: 'Niños', desc: 'Conjunto de ropa cómodo y moderno para niños.' },
      14: { name: 'Vestido Infantil Delicado', cat: 'Niños', desc: 'Vestido de niña con un diseño suave y elegante.' },
      15: { name: 'Zapatillas Deportivas Infantiles', cat: 'Niños', desc: 'Zapatos deportivos cómodos para niños.' },
      10: { name: 'Vestido Femenino Moderno', cat: 'Mujeres', desc: 'Vestido de mujer con diseño moderno y elegante.' },
      11: { name: 'Falda Femenina Elegante', cat: 'Mujeres', desc: 'Falda elegante y cómoda para ocasiones diarias.' },
      1: { name: 'Camiseta de Algodón Masculina', cat: 'Hombres', desc: 'Camiseta de algodón cómoda y de alta calidad, perfecta para el uso diario.' },
      3: { name: 'Vestido Femenino de Verano', cat: 'Mujeres', desc: 'Vestido de verano ligero y cómodo en colores brillantes.' },
      5: { name: 'Conjunto Infantil de Juego', cat: 'Niños', desc: 'Conjunto de algodón cómodo y elegante para niños.' },
    };

    const local = translationsMap[product.id];
    
    // Fallback name-based translation
    const nameMap: Record<string, string> = {
      'Pijama': 'Pijama',
      'Pijama de satén': 'Pijama de satén',
    };
    const nameLocal = nameMap[product.name];

    if (local) {
      return {
        ...product,
        name: local.name,
        cat: localizedCat,
        desc: local.desc
      };
    } else if (nameLocal) {
        return {
          ...product,
          name: nameLocal,
          cat: localizedCat
        };
    }
    
    // Return with translated category if not in map
    return { ...product, cat: localizedCat };
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, getLocalizedProduct }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
