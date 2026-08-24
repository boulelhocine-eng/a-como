import { ShoppingCart, User, Menu, X, Trash2, Plus, Minus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { cart, cartTotal, cartCount, removeFromCart, updateQuantity, setIsCheckoutOpen, isCartBumping, isCartOpen, setIsCartOpen } = useCart();
  const { currentUser } = useAuth();
  const { lang, t, setLang } = useLanguage();

  return (
    <>
      <header className="sticky top-0 flex items-center justify-between p-4 md:p-6 bg-white z-40 border-b border-gray-100/80 shadow-sm">
        {/* Mobile/Tablet Menu Button - Visible below md */}
        <div className="flex items-center md:hidden">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="p-2 text-gray-700 active:scale-95 transition-transform"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Logo - Centered on Mobile/Tablet, Static on Desktop */}
        <Link 
          to="/" 
          className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 flex items-center"
        >
          <img 
            src="https://f000.backblazeb2.com/file/jpgshared/WIIoT0Jw" 
            alt="Logo" 
            className="h-16 md:h-24 w-auto object-contain max-h-[110px] py-1" 
            referrerPolicy="no-referrer"
          />
        </Link>

        {/* Desktop Navigation - Visible on md and up */}
        <nav className="hidden md:flex gap-6 text-sm font-medium text-gray-700">
          <Link to="/" className="hover:text-primary transition-colors">{t('home')}</Link>
          <Link to="/products" className="hover:text-primary transition-colors">{t('products')}</Link>
          <Link to="/about" className="hover:text-primary transition-colors">{t('about')}</Link>
          <Link to="/contact" className="hover:text-primary transition-colors">{t('contact')}</Link>
          {currentUser && <Link to="/track-order" className="hover:text-primary transition-colors">{t('trackOrder')}</Link>}
        </nav>

        {/* Actions - Cart, User, and Language Selector */}
        <div className="flex items-center gap-2 md:gap-4 text-sm font-medium text-gray-700">
          {currentUser && (
            <>
              <span className="hidden sm:block text-gray-400 font-mono">${cartTotal.toFixed(2)}</span>
              <div 
                id="header-cart-icon" 
                className={`relative p-2 cursor-pointer hover:text-primary transition-all duration-300 ease-out select-none ${
                  isCartBumping ? 'scale-110 text-primary' : 'scale-100'
                }`} 
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart size={22} className={`transition-all duration-300 ${isCartBumping ? 'stroke-[2.5px]' : ''}`} />
                {cartCount > 0 && (
                  <span className={`absolute top-1 right-1 bg-highlight text-primary-dark text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${
                    isCartBumping ? 'scale-125 bg-primary text-white rotate-12' : ''
                  }`}>
                    {cartCount}
                  </span>
                )}
              </div>
            </>
          )}
          <Link 
            to={currentUser ? "/profile" : "/login"} 
            className="flex items-center gap-1.5 p-2 hover:text-primary transition-colors duration-200 cursor-pointer"
            title={currentUser ? t('profile') : t('login')}
          >
            <User size={22} />
            {currentUser && (
              <span className="hidden lg:inline text-xs font-bold max-w-[80px] truncate">
                {currentUser.name.split(' ')[0]}
              </span>
            )}
          </Link>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="fixed inset-0 top-[64px] md:top-[80px] w-full bg-white z-50 animate-in fade-in slide-in-from-top-4 duration-300 md:hidden">
            <nav className="flex flex-col p-8 gap-6 text-lg font-bold text-gray-800">
              <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between border-b border-gray-50 pb-4 hover:text-primary transition-colors">
                <span>{t('home')}</span>
              </Link>
              <Link to="/products" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between border-b border-gray-50 pb-4 hover:text-primary transition-colors">
                <span>{t('products')}</span>
              </Link>
              <Link to="/about" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between border-b border-gray-50 pb-4 hover:text-primary transition-colors">
                <span>{t('about')}</span>
              </Link>
              <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between border-b border-gray-50 pb-4 hover:text-primary transition-colors">
                <span>{t('contact')}</span>
              </Link>
              {currentUser && (
                <Link to="/track-order" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between border-b border-gray-50 pb-4 hover:text-primary transition-colors">
                  <span>{t('trackOrder')}</span>
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Cart Slide-over */}
      {currentUser && isCartOpen && (
        <div className={`fixed inset-0 z-50 flex justify-end`}>
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col z-10 animate-in fade-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold">{t('cart')} ({cartCount})</h2>
              <button onClick={() => setIsCartOpen(false)} className="hover:text-gray-500">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                  {t('emptyCart')}
                </div>
              ) : (
                cart.map((item) => {
                  const itemKey = item.id + '-' + (item.selectedSize || 'default');
                  return (
                    <div key={itemKey} className="flex gap-4 border-b border-gray-50 pb-4">
                      <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-md" referrerPolicy="no-referrer" />
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-sm">{item.name}</h3>
                          <div className="flex flex-wrap gap-1.5 items-center mt-1">
                            <span className="text-gray-500 text-xs">{item.price}</span>
                            {item.selectedSize && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                                <span className="bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded font-black text-[10px]">
                                  Talla: {item.selectedSize}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-gray-200 rounded-md">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize)} className="p-1 hover:bg-gray-50 cursor-pointer">
                              <Minus size={14} />
                            </button>
                            <span className="px-3 text-sm font-medium">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize)} className="p-1 hover:bg-gray-50 cursor-pointer">
                              <Plus size={14} />
                            </button>
                          </div>
                          <button onClick={() => removeFromCart(item.id, item.selectedSize)} className="text-red-500 hover:text-red-600 p-1 cursor-pointer">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between font-bold text-lg mb-4">
                  <span>{t('total')}</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3 bg-primary text-white font-bold rounded-full hover:bg-primary-dark transition-colors"
                >
                  {t('checkout')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
