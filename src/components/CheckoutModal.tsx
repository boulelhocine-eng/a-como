import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShoppingBag, Truck, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import AddressInputWithMap from './AddressInputWithMap';
import { saveOrder, saveDeliveryCode } from '../lib/ordersService';
import { getProducts, updateProduct } from '../lib/productsService';
import { sanitizeInput, validatePhone, checkRateLimit } from '../lib/security';

export default function CheckoutModal() {
  const { 
    isCheckoutOpen, 
    setIsCheckoutOpen, 
    checkoutProduct, 
    setCheckoutProduct, 
    cart, 
    cartTotal, 
    clearCart 
  } = useCart();

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod'); // cod = Cash on Delivery
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [deliveryCode, setDeliveryCode] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [localQuantities, setLocalQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isCheckoutOpen) {
      const initialQtys: Record<string, number> = {};
      if (checkoutProduct) {
        const itemKey = checkoutProduct.id + '-' + ((checkoutProduct as any).selectedSize || 'default');
        initialQtys[itemKey] = (checkoutProduct as any).quantity || 1;
      } else {
        cart.forEach(item => {
          const itemKey = item.id + '-' + (item.selectedSize || 'default');
          initialQtys[itemKey] = item.quantity || 1;
        });
      }
      setLocalQuantities(initialQtys);
    }
  }, [isCheckoutOpen, checkoutProduct, cart]);

  useEffect(() => {
    if (currentUser && isCheckoutOpen) {
      setFullName(currentUser.name);
      setPhone(currentUser.phone || '');
      setAddress(currentUser.address || '');
    }
  }, [currentUser, isCheckoutOpen]);

  const handleClose = () => {
    setIsCheckoutOpen(false);
    setCheckoutProduct(null);
    setIsSuccess(false);
    setFullName('');
    setPhone('');
    setAddress('');
    setErrors({});
  };

  if (!isCheckoutOpen) return null;

  if (!currentUser) {
    return (
      <AnimatePresence>
        <div 
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={handleClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="bg-white rounded-3xl max-w-md w-full relative shadow-2xl p-8 text-center space-y-6 text-right"
            onClick={e => e.stopPropagation()}
          >
            <button 
              className="absolute top-4 left-4 p-2 bg-neutral-100 hover:bg-neutral-200 rounded-full text-neutral-500 transition-colors" 
              onClick={handleClose}
            >
              <X size={20} />
            </button>

            <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500">
              <Truck size={32} />
            </div>

            <div className="space-y-2 text-center">
              <h3 className="text-xl font-bold text-neutral-900">
                Inicio de Sesión Requerido
              </h3>
              <p className="text-sm text-neutral-500">
                Debe iniciar sesión primero para poder completar la compra.
              </p>
            </div>

            <button
              onClick={() => {
                handleClose();
                navigate('/login', {
                  state: {
                    message: 'Disculpe, debe iniciar sesión primero para poder realizar la compra.'
                  }
                });
              }}
              className="w-full py-3 bg-primary text-white font-bold rounded-full hover:bg-primary-dark transition-all duration-300 text-center"
            >
              Ir a la Página de Inicio de Sesión
            </button>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  }

  // Calculate purchase list and total
  const isSingleItem = !!checkoutProduct;
  const itemsToBuy = isSingleItem 
    ? (checkoutProduct ? [{ ...checkoutProduct, quantity: localQuantities[checkoutProduct.id + '-' + ((checkoutProduct as any).selectedSize || 'default')] || 1 }] : [])
    : cart.map(item => {
        const itemKey = item.id + '-' + (item.selectedSize || 'default');
        return { ...item, quantity: localQuantities[itemKey] || item.quantity || 1 };
      });
    
  const totalAmount = itemsToBuy.reduce((sum, item) => {
    const priceNum = parseFloat(item.price.replace('$', ''));
    return sum + priceNum * (item.quantity || 1);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    // 1. Rate Limiting Check (OWASP)
    const rateCheck = checkRateLimit('checkout_order', 3, 60000); // Max 3 checkouts per minute
    if (!rateCheck.allowed) {
      newErrors.form = 'Ha excedido el límite temporal de pedidos. Por favor, espere un minuto e intente nuevamente.';
      setErrors(newErrors);
      return;
    }

    // 2. Validate empty fields & lengths
    const trimmedName = fullName.trim();
    const trimmedPhone = phone.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName) {
      newErrors.fullName = 'Por favor, ingrese el nombre completo';
    } else if (trimmedName.length < 3 || trimmedName.length > 100) {
      newErrors.fullName = 'El nombre debe tener entre 3 y 100 caracteres';
    }

    if (!trimmedPhone) {
      newErrors.phone = 'Por favor, ingrese el número de teléfono';
    } else if (!validatePhone(trimmedPhone)) {
      newErrors.phone = 'Por favor, ingrese un número de teléfono válido (ej: +34600000000)';
    }

    if (!trimmedAddress) {
      newErrors.address = 'Por favor, ingrese la dirección de envío';
    } else if (trimmedAddress.length < 10 || trimmedAddress.length > 500) {
      newErrors.address = 'Por favor, ingrese una dirección de envío detallada (mínimo 10 caracteres)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 3. Sanitization (OWASP - Prevention of XSS / Script Injection)
    const sanitizedName = sanitizeInput(trimmedName);
    const sanitizedPhone = sanitizeInput(trimmedPhone);
    const sanitizedAddress = sanitizeInput(trimmedAddress);

    // Generate random order id
    const randomId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    // Generate 6-char alphanumeric delivery code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    setOrderId(randomId);
    setDeliveryCode(code);
    setIsSuccess(true);
    
    // Store code in Firebase / LocalStorage
    saveDeliveryCode(randomId, code);
    
    // Store order in Firebase / LocalStorage (using sanitized values)
    const newOrder = {
      id: randomId,
      customer: sanitizedName,
      email: currentUser?.email ? sanitizeInput(currentUser.email) : '',
      date: new Date().toISOString().split('T')[0],
      total: `${totalAmount.toFixed(2)}`,
      status: 'Pendiente',
      phone: sanitizedPhone,
      address: sanitizedAddress + " [" + itemsToBuy.map(item => `${item.name} (Talla: ${item.selectedSize || 'Sin talla'}) x${item.quantity}`).join(', ') + "]"
    };
    saveOrder(newOrder);

    // Auto update product stock quantities (Real Stock Management)
    try {
      const allProducts = await getProducts();
      for (const item of itemsToBuy) {
        const dbProduct = allProducts.find(p => p.id === Number(item.id));
        if (dbProduct) {
          const newQtyRemaining = Math.max(0, (dbProduct.quantityRemaining !== undefined ? dbProduct.quantityRemaining : 10) - (item.quantity || 1));
          const newQtySold = (dbProduct.quantitySold || 0) + (item.quantity || 1);
          // Auto trigger out of stock if completely sold out
          const isOutOfStock = newQtyRemaining === 0;

          await updateProduct({
            ...dbProduct,
            quantityRemaining: newQtyRemaining,
            quantitySold: newQtySold,
            isOutOfStock: isOutOfStock
          });
        }
      }
    } catch (stockError) {
      console.error('Failed to update product stock quantities on checkout:', stockError);
    }
    
    // Clear cart if we purchased the entire cart
    if (!isSingleItem) {
      clearCart();
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleClose}
      >
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="bg-white rounded-3xl max-w-3xl w-full relative shadow-2xl overflow-hidden flex flex-col md:flex-row my-8 text-left [direction:ltr]"
            onClick={e => e.stopPropagation()}
          >
          {/* Close Button & Header */}
          <div className="absolute top-4 left-0 right-0 z-10 flex items-center justify-between px-6">
            <Link 
              to="/" 
              className="text-xl font-bold text-primary"
              onClick={handleClose}
            >
              Tienda de Moda
            </Link>
            <button 
              className="p-2 bg-neutral-100 hover:bg-neutral-200 rounded-full text-neutral-500 transition-colors" 
              onClick={handleClose}
            >
              <X size={20} />
            </button>
          </div>

          {!isSuccess ? (
            <>
              {/* Left Side: Order Summary */}
              <div className="w-full md:w-[35%] bg-neutral-50 pt-16 p-4 md:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-neutral-100">
                <div>
                  <h3 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <ShoppingBag size={18} className="text-primary" />
                    Resumen de Pedido
                  </h3>
                  
                  <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                    {itemsToBuy.map((item) => {
                      const itemKey = item.id + '-' + (item.selectedSize || 'default');
                      return (
                        <div key={itemKey} className="flex gap-2.5 items-center">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-10 h-10 object-cover rounded-lg border border-neutral-200 shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-neutral-800 truncate text-left">{item.name}</h4>
                            {item.selectedSize && (
                              <p className="text-[10px] text-neutral-500 font-bold text-left mt-0.5">
                                Talla: {item.selectedSize}
                              </p>
                            )}
                            <div className="flex items-center gap-2 justify-start mt-1">
                              <span className="text-[11px] text-neutral-400">Cant:</span>
                              <div className="flex items-center gap-1.5 bg-neutral-100 rounded-lg px-1.5 py-0.5 border border-neutral-200/60">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentQty = localQuantities[itemKey] || 1;
                                    if (currentQty > 1) {
                                      setLocalQuantities(prev => ({ ...prev, [itemKey]: currentQty - 1 }));
                                    }
                                  }}
                                  className="w-4 h-4 rounded-md bg-white flex items-center justify-center text-xs font-extrabold text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 transition-colors shadow-2xs cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="text-xs font-black text-neutral-800 min-w-[12px] text-center">
                                  {localQuantities[itemKey] || 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentQty = localQuantities[itemKey] || 1;
                                    const maxStock = item.quantityRemaining !== undefined ? item.quantityRemaining : 10;
                                    if (currentQty < maxStock) {
                                      setLocalQuantities(prev => ({ ...prev, [itemKey]: currentQty + 1 }));
                                    }
                                  }}
                                  className="w-4 h-4 rounded-md bg-white flex items-center justify-center text-xs font-extrabold text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 transition-colors shadow-2xs cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                          <span className="font-bold text-sm text-neutral-900 shrink-0">{item.price}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-200">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-neutral-500 text-xs">Envío</span>
                    <span className="text-accent text-xs font-bold">Gratis</span>
                  </div>
                  <div className="flex justify-between items-center text-base font-extrabold text-neutral-900">
                    <span>Total</span>
                    <span className="text-primary">${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Checkout Form */}
              <form onSubmit={handleSubmit} className="w-full md:w-[65%] md:pt-16 p-4 md:p-6 flex flex-col justify-between text-left">
                <div className="space-y-3.5">
                  <div className="text-left">
                    <h2 className="text-xl font-extrabold text-neutral-900 mb-0.5">Completar Compra</h2>
                    <p className="text-xs text-neutral-500">Por favor ingrese la información de entrega para confirmar su pedido.</p>
                  </div>

                  {errors.form && (
                    <div className="p-3 bg-red-50 text-red-600 border border-red-200 text-xs rounded-xl font-medium text-left mb-3">
                      {errors.form}
                    </div>
                  )}

                  {/* Name Input */}
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold text-neutral-700">Nombre Completo *</label>
                    <input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors(prev => ({ ...prev, fullName: '' }));
                      }}
                      placeholder="Ingrese su nombre completo"
                      className={`w-full p-2.5 bg-neutral-50 border ${errors.fullName ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-200'} rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-left text-xs`} 
                    />
                    {errors.fullName && <p className="text-red-500 text-[10px] mt-0.5">{errors.fullName}</p>}
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-1 text-left">
                    <label className="block text-xs font-bold text-neutral-700">Número de Teléfono *</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
                      }}
                      placeholder="05xxxxxxxx"
                      className={`w-full p-2.5 bg-neutral-50 border ${errors.phone ? 'border-red-500 ring-1 ring-red-500' : 'border-neutral-200'} rounded-lg focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-left text-xs`} 
                    />
                    {errors.phone && <p className="text-red-500 text-[10px] mt-0.5">{errors.phone}</p>}
                  </div>

                  {/* Address Input */}
                  <AddressInputWithMap 
                    value={address}
                    onChange={(val) => {
                      setAddress(val);
                      if (errors.address) setErrors(prev => ({ ...prev, address: '' }));
                    }}
                    error={errors.address}
                  />

                  {/* Payment Method Selector */}
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-neutral-700">Método de Pago</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-center gap-1 ${paymentMethod === 'cod' ? 'border-primary bg-primary-dark/5 text-primary-dark font-bold' : 'border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50'}`}
                      >
                        <Truck size={16} className={paymentMethod === 'cod' ? 'text-primary' : 'text-neutral-400'} />
                        <span className="text-[10px]">Pago contra entrega (COD)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-center gap-1 ${paymentMethod === 'card' ? 'border-primary bg-primary-dark/5 text-primary-dark font-bold' : 'border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50'}`}
                      >
                        <CreditCard size={16} className={paymentMethod === 'card' ? 'text-primary' : 'text-neutral-400'} />
                        <span className="text-[10px]">Tarjeta de Crédito / Mada</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full py-3 bg-primary text-white text-sm font-bold rounded-full hover:bg-primary-dark hover:shadow-lg transition-all duration-300 text-center shadow-md flex items-center justify-center gap-2"
                  >
                    Confirmar Pedido (${totalAmount.toFixed(2)})
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Success Celebration State */
            <div className="w-full pt-20 p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6 [direction:ltr]">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600"
              >
                <CheckCircle size={54} className="stroke-[2.5]" />
              </motion.div>

              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-neutral-900">¡Pedido Realizado con Éxito!</h2>
                <p className="text-neutral-500 max-w-md mx-auto">
                  ¡Gracias por comprar con nosotros, <span className="font-bold text-neutral-800">{fullName}</span>! Hemos recibido tu pedido y ya está en preparación para envío rápido.
                </p>
              </div>

              {/* Order Details Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                <div className="bg-neutral-50 border border-neutral-100 p-4 rounded-2xl text-left">
                  <p className="text-xs text-neutral-400 font-medium mb-1">ID de Pedido</p>
                  <p className="text-primary-dark font-mono font-extrabold text-lg">{orderId}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-left">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Código de Entrega</p>
                  <p className="text-emerald-700 font-mono font-extrabold text-lg tracking-widest">{deliveryCode}</p>
                </div>
              </div>

              <button 
                onClick={handleClose}
                className="px-10 py-3.5 bg-primary text-white font-bold rounded-full hover:bg-primary-dark hover:shadow-lg transition-all duration-300"
              >
                Continuar Comprando
              </button>
            </div>
          )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
