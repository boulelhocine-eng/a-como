import React, { useState, useEffect } from 'react';
import { ShoppingCart, ArrowRight, Sparkles, Shirt, Smartphone, Layers } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { useLanguage } from '../context/LanguageContext';
import { getProducts } from '../lib/productsService';
import { useAuth } from '../context/AuthContext';
import { Product } from '../types';
import { getFormattedOriginalPrice, formatThousandsPrice } from '../utils/price';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'Ropa' | 'Electrónica'>('all');
  const { addToCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, getLocalizedProduct } = useLanguage();

  const loadFeatured = () => {
    getProducts().then(data => {
      // Sort products by ID descending so newly uploaded products (Date.now() timestamps) appear FIRST!
      const sortedNewest = [...data].sort((a, b) => {
        const idA = typeof a.id === 'number' ? a.id : (Number(a.id) || 0);
        const idB = typeof b.id === 'number' ? b.id : (Number(b.id) || 0);
        return idB - idA;
      });
      setProducts(sortedNewest);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadFeatured();

    const handleProductsUpdated = () => {
      loadFeatured();
    };

    window.addEventListener('products_updated', handleProductsUpdated);
    window.addEventListener('focus', loadFeatured);

    return () => {
      window.removeEventListener('products_updated', handleProductsUpdated);
      window.removeEventListener('focus', loadFeatured);
    };
  }, []);

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login', { 
        state: { 
          from: location, 
          message: 'Lo sentimos, primero debe iniciar sesión para poder agregar productos al carrito o comprar.' 
        } 
      });
      return;
    }
    const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined;
    addToCart({ ...product, selectedSize: defaultSize }, e);
  };

  const pcHardwareTypes = [
    'Chasis de PC', 'Tarjeta madre', 'RAM', 'Fuente de poder', 'Procesador', 
    'Tarjeta gráfica', 'Disco duro', 'Accesorios', 'Smartphones', 
    'Laptops & Tablets', 'Audio & Auriculares', 'Smartwatches', 'Accesorios Tech', 'Electrónica'
  ];

  const filteredProducts = products.filter(p => {
    const isElectronics = p.department === 'Electrónica' || p.cat === 'Electrónica' || pcHardwareTypes.includes(p.type || '') || pcHardwareTypes.includes(p.cat);
    if (activeFilter === 'Ropa') return !isElectronics;
    if (activeFilter === 'Electrónica') return isElectronics;
    return true;
  });

  if (loading) {
    return (
      <section className="bg-neutral-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 text-center text-neutral-500 font-medium">
          <p className="text-lg animate-pulse">
            Cargando nuevas novedades...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-neutral-50 py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary font-bold text-xs px-3 py-1 rounded-full mb-3">
              <Sparkles size={14} />
              <span>Recién Subidos y Destacados</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mb-3 tracking-tight">
              Nuevas Novedades
            </h2>
            <p className="text-base md:text-lg text-neutral-600 max-w-2xl">
              Las últimas prendas, colecciones exclusivas y tecnología que hemos añadido recientemente para ti.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Filter Pills */}
            <div className="inline-flex p-1 bg-neutral-200/60 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Layers size={13} />
                <span>Todos ({products.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('Ropa')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'Ropa'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Shirt size={13} />
                <span>Ropa</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('Electrónica')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeFilter === 'Electrónica'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Smartphone size={13} />
                <span>Electrónica</span>
              </button>
            </div>

            <div className="relative inline-block group">
              <div className="absolute inset-0 bg-primary/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity animate-pulse"></div>
              <Link to="/products" className="relative inline-flex items-center gap-2 bg-primary text-white font-bold py-2.5 px-6 rounded-full hover:bg-primary-dark transition-all shadow-md hover:shadow-lg text-xs md:text-sm">
                <span>Ver Catálogo Completo</span>
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200/80 shadow-sm">
            <p className="text-neutral-500 font-medium">No hay novedades registradas en esta categoría actualmente.</p>
          </div>
        ) : (
          <Swiper
            spaceBetween={16}
            slidesPerView={1.3}
            centeredSlides={false}
            breakpoints={{
              480: { slidesPerView: 2, spaceBetween: 16 },
              768: { slidesPerView: 3, spaceBetween: 24 },
              1024: { slidesPerView: 4, spaceBetween: 28 },
            }}
            className="pb-10"
          >
            {filteredProducts.map((pRaw, index) => {
              const p = getLocalizedProduct(pRaw);
              const isElectronics = p.department === 'Electrónica' || p.cat === 'Electrónica' || pcHardwareTypes.includes(p.type || '') || pcHardwareTypes.includes(p.cat);
              const isNew = index < 6 || (typeof p.id === 'number' && p.id > 10000000);

              return (
                <SwiperSlide key={p.id}>
                  <Link to={`/products?product=${p.id}`} className="group bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-sm border border-neutral-100 hover:shadow-xl transition-all duration-300 flex flex-col h-full relative">
                    <div className="relative overflow-hidden aspect-square bg-neutral-100">
                      <img
                        src={p.image || `https://picsum.photos/seed/product${p.id}/300/400`}
                        alt={p.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                        {isNew && (
                          <span className="bg-primary text-white font-extrabold text-[10px] md:text-[11px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 select-none">
                            <Sparkles size={11} />
                            <span>¡NUEVO!</span>
                          </span>
                        )}
                        {p.offer > 0 && !p.isOutOfStock && (
                          <span className="bg-orange-600 text-white font-black text-[10px] md:text-xs px-2.5 py-0.5 rounded-full shadow-lg select-none">
                            {`-${p.offer}%`}
                          </span>
                        )}
                      </div>
                      
                      {p.isOutOfStock && (
                        <div className="absolute inset-0 bg-neutral-900/60 flex items-center justify-center z-10">
                          <span className="text-white font-bold bg-neutral-900 px-3 py-1 rounded-full text-xs">
                            {t('outOfStock')}
                          </span>
                        </div>
                      )}
                      
                      {!p.isOutOfStock && (
                        <button 
                          onClick={(e) => handleAddToCart(e, p)}
                          className="absolute bottom-3 right-3 lg:bottom-4 lg:right-4 bg-highlight text-primary-dark p-3 rounded-full shadow-xl lg:translate-y-12 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 translate-y-0 opacity-100 transition-all duration-300 hover:bg-primary-dark hover:text-white active:scale-90 cursor-pointer"
                          title={t('addToCart')}
                        >
                          <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                        </button>
                      )}
                    </div>
                    
                    <div className="p-4 md:p-5 flex flex-col flex-grow">
                      <div className="flex items-center justify-between mb-1.5 gap-1">
                        <span className="text-[10px] md:text-xs font-semibold tracking-wider text-neutral-400 uppercase truncate">
                          {p.cat}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase flex-shrink-0 ${
                          isElectronics ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {isElectronics ? 'Tech' : 'Moda'}
                        </span>
                      </div>

                      <h3 className="font-bold text-sm md:text-base text-neutral-900 mb-2 line-clamp-2 leading-snug">
                        {p.name}
                      </h3>

                      <div className="mt-auto pt-2 flex flex-col border-t border-neutral-100">
                        <div className="flex items-baseline justify-between gap-1 flex-wrap">
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <p className="font-extrabold text-base md:text-lg text-neutral-900">
                              COP {formatThousandsPrice(p.price)}
                            </p>
                            {(() => {
                              const origFormatted = getFormattedOriginalPrice(p.originalPrice, p.price, p.offer);
                              if (!origFormatted) return null;
                              return (
                                <span className="italic font-normal text-xs text-orange-500 line-through decoration-1 decoration-orange-500">
                                  COP {origFormatted}
                                </span>
                              );
                            })()}
                          </div>
                          <p className="text-[11px] text-neutral-500 font-medium">
                            {t('sold', { count: p.quantitySold })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>
        )}
      </div>
    </section>
  );
}

