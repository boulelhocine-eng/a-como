import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { X, ShoppingCart, Share2, Link, Check, ChevronLeft, ChevronRight, ZoomIn, Loader2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getProducts } from '../lib/productsService';
import { Product } from '../types';
import { getFormattedOriginalPrice, formatThousandsPrice } from '../utils/price';

export default function ProductGrid({ category, department }: { category?: string; department?: string }) {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const routeParams = useParams();
  const { addToCart, setCheckoutProduct, setIsCheckoutOpen } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang, t, getLocalizedProduct } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [activeSize, setActiveSize] = useState<string>('');

  useEffect(() => {
    const loadProducts = () => {
      getProducts().then(data => {
        setProducts(data);
        setLoading(false);
        
        // Handle deep linking from URL /products/:id or ?product=ID
        const productId = routeParams.id || searchParams.get('product');
        if (productId && data.length > 0) {
          const product = data.find(p => p.id.toString() === productId.toString());
          if (product) {
            const locProd = getLocalizedProduct(product);
            setSelectedProduct(locProd);
            setSelectedImageIndex(0);
            setActiveSize(locProd.sizes && locProd.sizes.length > 0 ? locProd.sizes[0] : '');
          }
        }
      });
    };

    loadProducts();

    const handleProductsUpdated = () => {
      loadProducts();
    };

    window.addEventListener('products_updated', handleProductsUpdated);
    window.addEventListener('focus', loadProducts);

    return () => {
      window.removeEventListener('products_updated', handleProductsUpdated);
      window.removeEventListener('focus', loadProducts);
    };
  }, [searchParams]);

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setSelectedImageIndex(0);
    setActiveSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : '');
    setSearchParams({ product: product.id.toString() });
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setSelectedImageIndex(0);
    setActiveSize('');
    setIsLightboxOpen(false);
    setSearchParams({});
  };

  const localizedProducts = products.map(pRaw => getLocalizedProduct(pRaw));

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
    'Electronics': 'Electrónica'
  };

  const pcHardwareTypes = [
    'Chasis de PC', 
    'Tarjeta madre', 
    'RAM', 
    'Fuente de poder', 
    'Procesador', 
    'Tarjeta gráfica', 
    'Disco duro', 
    'Accesorios',
    'Smartphones', 
    'Audio & Auriculares', 
    'Smartwatches', 
    'Laptops & Tablets', 
    'Accesorios Tech'
  ];

  const filteredProducts = localizedProducts.filter(p => {
    const pCatNormalized = catMap[p.cat] || p.cat;
    const isElectronics = p.department === 'Electrónica' || pCatNormalized === 'Electrónica' || pcHardwareTypes.includes(p.type || '') || pcHardwareTypes.includes(p.cat);
    
    // Department filtering
    if (department && department !== 'all') {
      if (department === 'Electrónica' && !isElectronics) return false;
      if (department === 'Ropa' && isElectronics) return false;
    }

    // Category filtering
    if (category && category !== 'all') {
      const queryCatNormalized = catMap[category] || category;
      const matchesCat = pCatNormalized === queryCatNormalized;
      const matchesType = p.type === category || p.type === queryCatNormalized;
      if (!matchesCat && !matchesType) return false;
    }

    return true;
  });

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
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

  const handleAddToCartFromModal = (product: any, e: React.MouseEvent) => {
    if (!currentUser) {
      setSelectedProduct(null);
      navigate('/login', { 
        state: { 
          from: location, 
          message: 'Lo sentimos, primero debe iniciar sesión para poder agregar productos al carrito o comprar.' 
        } 
      });
      return;
    }
    addToCart({ ...product, selectedSize: activeSize }, e);
    setSelectedProduct(null); // Close modal after adding
  };

  const handleBuyNow = (product: any) => {
    if (!currentUser) {
      setSelectedProduct(null);
      navigate('/login', { 
        state: { 
          from: location, 
          message: 'Lo sentimos, primero debe iniciar sesión para poder agregar productos al carrito o comprar.' 
        } 
      });
      return;
    }
    setCheckoutProduct({ ...product, selectedSize: activeSize });
    setIsCheckoutOpen(true);
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-neutral-500 bg-white rounded-2xl shadow-sm border border-neutral-100">
        <p className="text-lg animate-pulse">
          'Cargando productos...'
        </p>
      </div>
    );
  }

  return (
    <>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 text-neutral-500 bg-white rounded-2xl shadow-sm border border-neutral-100">
          <p className="text-lg">
            'No hay productos en esta categoría.'
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {filteredProducts.map((pRaw) => {
            const p = getLocalizedProduct(pRaw);
            return (
              <div 
                key={p.id} 
                className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-neutral-100 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col" 
                onClick={() => handleProductClick(p)}
              >
                <div className="relative overflow-hidden aspect-square bg-neutral-100">
                  <img
                    src={p.image || `https://picsum.photos/seed/electronics${p.id}/300/400`}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {p.offer > 0 && !p.isOutOfStock && (
                    <div className="absolute top-3 left-3 bg-orange-600 text-white font-black text-xs md:text-[13px] px-3.5 py-1.5 rounded-full shadow-lg z-10 select-none">
                      {`-${p.offer}%`}
                    </div>
                  )}
                  
                  {p.isOutOfStock && (
                    <div className="absolute inset-0 bg-neutral-900/60 flex items-center justify-center z-10">
                      <span className="text-white font-bold bg-neutral-900 px-3 py-1 rounded-full text-xs">
                        {t('outOfStock')}
                      </span>
                    </div>
                  )}
                  
                  {/* Quick Actions Bar for Desktop */}
                  {!p.isOutOfStock && (
                    <div className="absolute bottom-4 right-4 left-4 hidden lg:flex gap-2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                      <button 
                        onClick={(e) => handleAddToCart(e, p)}
                        className="bg-white/95 text-neutral-800 p-3 rounded-full shadow-lg hover:bg-primary-dark hover:text-white transition-all cursor-pointer active:scale-95"
                        title={t('addToCart')}
                      >
                        <ShoppingCart size={20} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBuyNow(p);
                        }}
                        className="flex-1 bg-highlight text-primary-dark font-black text-xs py-3 rounded-full shadow-lg hover:bg-primary-dark hover:text-white transition-all text-center cursor-pointer active:scale-95"
                      >
                        'Comprar Ahora'
                      </button>
                    </div>
                  )}

                  {/* Persistent Cart Button for Mobile/Tablet */}
                  {!p.isOutOfStock && (
                    <button 
                      onClick={(e) => handleAddToCart(e, p)}
                      className={`absolute bottom-3 right-3 bg-highlight text-primary-dark p-3 rounded-full shadow-xl z-10 lg:hidden hover:bg-primary-dark hover:text-white transition-all active:scale-90 animate-in fade-in zoom-in duration-300 cursor-pointer`}
                      title={t('addToCart')}
                    >
                      <ShoppingCart className="w-6 h-6" />
                    </button>
                  )}
                </div>
                
                <div className="p-3 md:p-5 flex flex-col flex-grow">
                  <p className="text-[10px] md:text-xs font-semibold tracking-wider text-neutral-400 uppercase mb-1">{p.cat}</p>
                  <h3 className="font-bold text-sm md:text-lg text-neutral-900 mb-2 line-clamp-2 md:line-clamp-1">{p.name}</h3>
                  <div className="mt-auto flex flex-col justify-end">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="font-extrabold text-base md:text-xl text-primary">
                        COP {formatThousandsPrice(p.price)}
                      </p>
                      {(() => {
                        const origFormatted = getFormattedOriginalPrice(p.originalPrice, p.price, p.offer);
                        if (!origFormatted) return null;
                        return (
                          <span className="italic font-normal text-xs md:text-sm text-orange-500 line-through decoration-1 decoration-orange-500">
                            COP {origFormatted}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProduct && (() => {
        const p = getLocalizedProduct(selectedProduct);
        const shareUrl = `${window.location.origin}/products/${p.id}`;
        const shareText = `Mira este producto increíble: ${p.name}`;

        // Build list of product images
        const mainImg = p.image || `https://picsum.photos/seed/electronics${p.id}/600/800`;
        const productImages = (p.images && Array.isArray(p.images) && p.images.length > 0)
          ? p.images
          : [
              mainImg,
              `https://picsum.photos/seed/item${p.id}_angle1/600/800`,
              `https://picsum.photos/seed/item${p.id}_angle2/600/800`
            ];
        const safeImageIndex = selectedImageIndex % productImages.length;
        const currentImage = productImages[safeImageIndex];

        const handlePrevImg = (e?: React.MouseEvent) => {
          e?.stopPropagation();
          setSelectedImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
        };

        const handleNextImg = (e?: React.MouseEvent) => {
          e?.stopPropagation();
          setSelectedImageIndex((prev) => (prev + 1) % productImages.length);
        };

        const handleShare = async () => {
          if (isSharing) return;
          setIsSharing(true);

          const formattedPrice = formatThousandsPrice(p.price);
          const cleanDesc = p.desc ? p.desc.trim() : '';
          const shareText = cleanDesc 
            ? `${p.name}\nCOP ${formattedPrice}\n\n${cleanDesc}\n\n${shareUrl}`
            : `${p.name}\nCOP ${formattedPrice}\n${shareUrl}`;

          try {
            // Attempt to fetch current image as a File to attach with Web Share API Level 2
            let imageFile: File | null = null;
            if (currentImage && typeof window !== 'undefined' && navigator.share) {
              try {
                let fetchUrl = currentImage;
                if (!fetchUrl.includes('images.weserv.nl') && (fetchUrl.startsWith('http://') || fetchUrl.startsWith('https://'))) {
                  fetchUrl = `https://images.weserv.nl/?url=${encodeURIComponent(fetchUrl)}&output=jpg&w=800&h=800&fit=cover`;
                }
                const res = await fetch(fetchUrl, { mode: 'cors' });
                if (res.ok) {
                  const blob = await res.blob();
                  imageFile = new File([blob], `producto-${p.id}.jpg`, { type: 'image/jpeg' });
                }
              } catch (e) {
                console.warn('Could not prepare image file for native share:', e);
              }
            }

            if (navigator.share) {
              // If browser/device supports sharing files (e.g. mobile Chrome, Safari)
              if (imageFile && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
                await navigator.share({
                  title: p.name,
                  text: shareText,
                  url: shareUrl,
                  files: [imageFile],
                });
                setIsSharing(false);
                return;
              }

              // Fallback to text & URL sharing
              await navigator.share({
                title: p.name,
                text: shareText,
                url: shareUrl,
              });
              setIsSharing(false);
              return;
            }
          } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
              // User cancelled share dialog
              setIsSharing(false);
              return;
            }
            console.warn('Share error, falling back to clipboard:', error);
          }

          // Fallback if share is unavailable
          copyToClipboard();
          setIsSharing(false);
        };

        const copyToClipboard = () => {
          navigator.clipboard.writeText(shareText);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        };

        return (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={handleCloseModal}>
              <div className="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl max-h-[92vh] overflow-y-auto max-w-4xl w-full relative shadow-2xl flex flex-col md:flex-row gap-6 md:gap-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <button 
                  className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-neutral-100 hover:bg-neutral-200 rounded-full text-neutral-500 transition-colors z-20 cursor-pointer" 
                  onClick={handleCloseModal}
                >
                  <X size={22} />
                </button>
                
                {/* Multi-Image Section */}
                <div className="w-full md:w-1/2 flex flex-col gap-3">
                  <div className="relative bg-neutral-50 rounded-2xl overflow-hidden group flex items-center justify-center border border-neutral-100 shadow-inner">
                    <img
                      src={currentImage}
                      alt={`${p.name} - ${safeImageIndex + 1}`}
                      className="w-full aspect-square md:h-80 object-contain cursor-zoom-in transition-transform duration-300 group-hover:scale-102"
                      referrerPolicy="no-referrer"
                      onClick={() => setIsLightboxOpen(true)}
                    />

                    {/* Image Counter Badge */}
                    <div className="absolute top-3 left-3 bg-black/60 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {safeImageIndex + 1} / {productImages.length}
                    </div>

                    {/* Zoom Icon Button */}
                    <button 
                      onClick={() => setIsLightboxOpen(true)}
                      className="absolute top-3 right-3 p-2 bg-white/80 hover:bg-white text-neutral-700 rounded-full shadow-md backdrop-blur-sm transition-all cursor-pointer hover:scale-110"
                      title='Ampliar imagen'
                    >
                      <ZoomIn size={18} />
                    </button>

                    {/* Prev / Next Arrows */}
                    {productImages.length > 1 && (
                      <>
                        <button
                          onClick={handlePrevImg}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-neutral-800 rounded-full shadow-lg backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95"
                          aria-label="Previous image"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        <button
                          onClick={handleNextImg}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-neutral-800 rounded-full shadow-lg backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95"
                          aria-label="Next image"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnail Row */}
                  {productImages.length > 1 && (
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
                      {productImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                            idx === safeImageIndex 
                              ? 'border-primary ring-2 ring-primary/30 scale-105 shadow-md' 
                              : 'border-neutral-200 opacity-70 hover:opacity-100 hover:border-neutral-400'
                          }`}
                        >
                          <img
                            src={img}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Details Section */}
                <div className="w-full md:w-1/2 flex flex-col justify-center space-y-4 md:space-y-5">
                  <div>
                    <p className="text-xs font-bold tracking-wider text-neutral-400 uppercase mb-1.5">{p.cat}</p>
                    <h2 className="text-xl md:text-3xl font-black text-neutral-900 leading-tight mb-2">{p.name}</h2>
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <p className="text-2xl md:text-3xl font-black text-primary">COP {formatThousandsPrice(p.price)}</p>
                      {(() => {
                        const origFormatted = getFormattedOriginalPrice(p.originalPrice, p.price, p.offer);
                        if (!origFormatted) return null;
                        return (
                          <span className="italic font-normal text-base md:text-xl text-orange-500 line-through decoration-1 decoration-orange-500">
                            COP {origFormatted}
                          </span>
                        );
                      })()}
                      {p.offer > 0 && (
                        <span className="bg-orange-600 text-white font-black text-xs px-2.5 py-0.5 rounded-full">
                          -{p.offer}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="h-px w-full bg-neutral-100"></div>
                  
                  <p className="text-sm md:text-base text-neutral-600 leading-relaxed">{p.desc}</p>
                  
                  {/* Sizes & Measurements Selection */}
                  {p.sizes && p.sizes.length > 0 && (
                    <div className="space-y-2.5">
                      <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">
                        {(p.department === 'Electrónica' || (p.cat || '').toLowerCase().includes('electr')) 
                          ? 'Opción / Capacidad / Color:' 
                          : ((p.type || '').toLowerCase().includes('zapato') ? 'Talla de Calzado:' : 'Selecciona tu Talla:')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {p.sizes.map((sz: string) => {
                          const isSelected = activeSize === sz;
                          return (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => setActiveSize(sz)}
                              className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer border ${
                                isSelected
                                  ? 'bg-primary border-primary text-white shadow-sm scale-105'
                                  : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 text-neutral-700'
                              }`}
                            >
                              {sz}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2.5 text-xs md:text-sm bg-neutral-50 p-3.5 rounded-2xl">
                     <p className="text-neutral-700 font-medium">
                       'Estado:' {p.isOutOfStock ? <span className="text-red-500 font-bold">'Agotado'</span> : <span className="text-emerald-500 font-bold">'Disponible'</span>}
                     </p>
                     <p className="text-neutral-700 font-medium">
                       'Stock:' <span className="font-bold">{p.quantityRemaining}</span>
                     </p>
                     <p className="text-neutral-700 font-medium">
                       'Vendido:' <span className="font-bold">{p.quantitySold}</span>
                     </p>
                     {p.offer > 0 && (
                       <p className="text-neutral-700 font-medium">
                         'Oferta:' <span className="text-primary font-bold">{p.offer}%</span>
                       </p>
                     )}
                  </div>

                  {/* Share Section with Website Mini Logo and Link */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                      <div className="w-8 h-8 rounded-xl bg-white p-1 border border-neutral-100 flex items-center justify-center shrink-0 shadow-xs overflow-hidden">
                        <img 
                          src="https://f000.backblazeb2.com/file/jpgshared/WIIoT0Jw" 
                          alt="Como Logo" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-neutral-600 truncate font-mono select-all">
                          {shareUrl}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={copyToClipboard}
                        className="shrink-0 p-1.5 rounded-lg text-neutral-500 hover:text-primary hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-neutral-200"
                        title={copied ? t('linkCopied') : 'Copiar enlace'}
                      >
                        {copied ? <Check size={16} className="text-emerald-600" /> : <Link size={16} />}
                      </button>
                    </div>

                    <button 
                      onClick={handleShare}
                      disabled={isSharing}
                      className="w-full h-11 rounded-full bg-primary text-white hover:bg-primary-dark flex items-center justify-center gap-2.5 transition-all font-black text-sm cursor-pointer active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-80"
                    >
                      {isSharing ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : copied ? (
                        <Check size={18} />
                      ) : (
                        <Share2 size={18} />
                      )}
                      {isSharing 
                        ? (lang === 'ar' ? 'جاري تجهيز المشاركة...' : 'Preparando para compartir...') 
                        : copied 
                        ? t('linkCopied') 
                        : t('shareProduct')}
                    </button>
                  </div>
   
                  {p.isOutOfStock ? (
                    <div className="pt-1">
                      <button 
                        disabled
                        className="w-full h-12 bg-neutral-100 text-neutral-400 font-bold rounded-full flex items-center justify-center gap-2 cursor-not-allowed text-xs sm:text-base border border-neutral-200"
                      >
                        <span>'Producto agotado / no disponible'</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-row gap-2 sm:gap-3 pt-1">
                      <button 
                        onClick={(e) => handleAddToCartFromModal(p, e)}
                        className="flex-1 h-12 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-black rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-xs sm:text-base px-2"
                      >
                        <ShoppingCart size={18} />
                        <span className="truncate">{t('addToCart')}</span>
                      </button>
                      <button 
                        onClick={() => handleBuyNow(p)}
                        className="flex-1 h-12 bg-highlight text-primary-dark font-black rounded-full hover:bg-primary-dark hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-lg shadow-highlight/20 text-xs sm:text-base px-2"
                      >
                        <span className="truncate">'Comprar Ahora'</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lightbox Fullscreen Modal */}
            {isLightboxOpen && (
              <div 
                className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex flex-col items-center justify-between p-4 animate-in fade-in duration-200"
                onClick={() => setIsLightboxOpen(false)}
              >
                <div className="w-full flex justify-between items-center text-white z-10 px-2 pt-2">
                  <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">
                    {safeImageIndex + 1} / {productImages.length}
                  </span>
                  <button 
                    onClick={() => setIsLightboxOpen(false)}
                    className="p-2.5 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors cursor-pointer"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="relative flex-1 w-full max-w-3xl flex items-center justify-center my-auto p-2" onClick={e => e.stopPropagation()}>
                  <img
                    src={currentImage}
                    alt={p.name}
                    className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
                    referrerPolicy="no-referrer"
                  />

                  {productImages.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImg}
                        className="absolute left-2 md:-left-12 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95"
                      >
                        <ChevronLeft size={28} />
                      </button>
                      <button
                        onClick={handleNextImg}
                        className="absolute right-2 md:-right-12 top-1/2 -translate-y-1/2 p-3 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all cursor-pointer hover:scale-110 active:scale-95"
                      >
                        <ChevronRight size={28} />
                      </button>
                    </>
                  )}
                </div>

                {/* Lightbox Thumbnails */}
                {productImages.length > 1 && (
                  <div className="flex gap-2.5 overflow-x-auto p-2 z-10" onClick={e => e.stopPropagation()}>
                    {productImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          idx === safeImageIndex ? 'border-primary ring-2 ring-primary scale-105' : 'border-white/30 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        );
      })()}
    </>
  );
}
