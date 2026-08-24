import React, { useState, useEffect, useCallback } from 'react';
import { Package, Search, Truck, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getOrders, getDeliveryCode } from '../lib/ordersService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

type OrderStatus = 'processing' | 'shipped' | 'delivered' | 'not_found';

export default function TrackOrder() {
  const { currentUser } = useAuth();
  const { lang, t } = useLanguage();
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [deliveryCode, setDeliveryCode] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [userOrders, setUserOrders] = useState<any[]>([]);

  const trackSpecificOrder = useCallback(async (id: string) => {
    if (!id.trim()) return;
    setIsSearching(true);
    setStatus(null);
    setDeliveryCode(null);

    try {
      const storedOrders = await getOrders();
      const order = storedOrders.find((o: any) => o.id === id);
      const code = await getDeliveryCode(id);

      // Simulate search delay
      setTimeout(() => {
        if (order) {
          if (order.status === '\u0645\u0643\u062a\u0645\u0644' || order.status === 'Completado' || order.status === 'Entregado') {
            setStatus('delivered');
            setDeliveryCode(code || null);
          }
          else if (order.status === '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0648\u0635\u064a\u0644' || order.status === '\u062a\u0645 \u0627\u0644\u0634\u062d\u0646' || order.status === 'En entrega' || order.status === 'En Camino' || order.status === 'En camino') {
            setStatus('shipped');
            setDeliveryCode(code || null);
          }
          else {
            setStatus('processing');
          }
        } else {
          setStatus('not_found');
        }
        setIsSearching(false);
      }, 800);
    } catch (err) {
      console.error('Failed to track order:', err);
      setStatus('not_found');
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const loadAndAutoTrack = async () => {
      if (currentUser) {
        try {
          const storedOrders = await getOrders();
          const matched = storedOrders.filter(
            (order: any) => 
              (order.email && order.email.toLowerCase() === currentUser.email.toLowerCase()) || 
              order.customer.toLowerCase() === currentUser.name.toLowerCase()
          );
          
          setUserOrders(matched);
          
          if (matched.length > 0) {
            // Auto track the latest order
            const latestOrder = matched[0];
            setOrderId(latestOrder.id);
            trackSpecificOrder(latestOrder.id);
          }
        } catch (err) {
          console.error('Failed to load user orders:', err);
        }
      }
    };
    loadAndAutoTrack();
  }, [currentUser, trackSpecificOrder]);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryId = orderId.trim();
    if (!queryId) return;
    trackSpecificOrder(queryId);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans text-left [direction:ltr]`}>
      <Header />
      
      <main className="flex-grow bg-neutral-50 py-12 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 mb-4">
              'Sigue tu Pedido'
            </h1>
            <p className="text-neutral-500 max-w-xl mx-auto">
              {currentUser 
                ? ('Su pedido se rastrea de forma automática sin necesidad de ingresar códigos.') 
                : ('Ingrese su número de pedido para ver el estado, o inicie sesión para rastreo automático.')}
            </p>
          </div>

          {/* Logged in users with orders */}
          {currentUser && userOrders.length > 0 && (
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-2.5 mb-4 text-primary">
                <Sparkles size={20} className="animate-pulse" />
                <h3 className="font-bold text-neutral-900">
                  'Seguimiento Automático'
                </h3>
              </div>
              <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
                {`¡Hola ${currentUser.name}! Hemos identificado su último pedido. Puede hacer clic en pedidos anteriores para ver detalles:`}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {userOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => {
                      setOrderId(o.id);
                      trackSpecificOrder(o.id);
                    }}
                    className={`px-4 py-2.5 rounded-full text-xs font-bold border transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                      orderId === o.id
                        ? 'bg-primary border-primary text-white shadow-md scale-[1.02]'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300'
                    }`}
                  >
                    <Package size={14} className={orderId === o.id ? 'text-white' : 'text-neutral-400'} />
                    <span className="font-mono">{o.id}</span>
                    <span className="opacity-85">({o.total})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Logged in users without orders */}
          {currentUser && userOrders.length === 0 && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 mb-8 text-center">
              <p className="text-neutral-600 text-sm font-medium">
                {`¡Hola ${currentUser.name}! No hay pedidos para rastrear automáticamente. Ingrese el código manual debajo.`}
              </p>
            </div>
          )}

          {/* Non-logged in users info banner */}
          {!currentUser && (
            <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-700">
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className="text-amber-500 shrink-0" />
                <p>
                  '¿Desea rastreo automático? Inicie sesión para ver sus pedidos al instante.'
                </p>
              </div>
              <a 
                href="/login" 
                className="py-2 px-5 bg-white border border-neutral-200 hover:border-primary hover:text-primary transition-all font-bold text-xs rounded-full shrink-0 shadow-sm"
              >
                'Iniciar Sesión'
              </a>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 md:p-8 mb-8">
            <h3 className="text-sm font-bold text-neutral-800 mb-4">
              'O busque por código de pedido manualmente:'
            </h3>
            <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder='Código de Pedido (ej: ORD-12345)'
                  className={`w-full p-4 pr-4 pl-12 text-left bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-mono`}
                />
                <Package className={`absolute left-4 top-4 text-neutral-400`} size={24} />
              </div>
              <button
                type="submit"
                disabled={isSearching || !orderId.trim()}
                className="py-4 px-8 bg-primary text-white font-bold rounded-full hover:bg-primary-dark transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px] cursor-pointer"
              >
                {isSearching ? (
                  <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Search size={20} />
                    <span>'Rastrear'</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <AnimatePresence mode="wait">
            {status && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 md:p-10"
              >
                {status === 'not_found' ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">
                      'Lo sentimos, no encontramos el pedido'
                    </h3>
                    <p className="text-neutral-500">
                      'Verifique el código de pedido e intente de nuevo.'
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-neutral-100 pb-8">
                      <div>
                        <p className="text-sm text-neutral-500 font-medium mb-1">
                          'Código de Pedido'
                        </p>
                        <p className="text-xl font-extrabold text-primary-dark font-mono">{orderId}</p>
                      </div>
                      <div className='text-left md:text-right'>
                         <p className="text-sm text-neutral-500 font-medium mb-1">
                           'Fecha del Pedido'
                         </p>
                         <p className="text-neutral-800 font-bold">
                           {new Date().toLocaleDateString('es-ES')}
                         </p>
                      </div>
                    </div>

                    <div className="relative pt-4 pb-12">
                      <div className={`absolute top-8 bottom-0 left-7 w-0.5 bg-neutral-100`}></div>
                      
                      <div className="space-y-8 relative">
                        {/* Step 1: Processing */}
                        <div className="flex gap-6 relative z-10">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ${status === 'processing' || status === 'shipped' || status === 'delivered' ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                            <Clock size={24} />
                          </div>
                          <div className="pt-3">
                            <h4 className="font-bold text-neutral-900 text-lg">
                              'En Preparación'
                            </h4>
                            <p className="text-neutral-500 text-sm mt-1">
                              'Su pedido está en proceso de preparación en el almacén.'
                            </p>
                          </div>
                        </div>

                        {/* Step 2: Shipped */}
                        <div className="flex gap-6 relative z-10">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ${status === 'shipped' || status === 'delivered' ? 'bg-primary text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                            <Truck size={24} />
                          </div>
                          <div className="pt-3">
                            <h4 className={`font-bold text-lg ${status === 'shipped' || status === 'delivered' ? 'text-neutral-900' : 'text-neutral-400'}`}>
                              'En Camino'
                            </h4>
                            <p className="text-neutral-500 text-sm mt-1">
                              'Su pedido ha sido enviado y está en camino.'
                            </p>
                            {status === 'shipped' && deliveryCode && (
                              <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-center max-w-sm">
                                <p className="text-blue-700 font-bold mb-1">
                                  'Código de Recepción'
                                </p>
                                <p className="text-2xl font-mono font-extrabold text-blue-800 tracking-widest">{deliveryCode}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Step 3: Delivered */}
                        <div className="flex gap-6 relative z-10">
                          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm ${status === 'delivered' ? 'bg-emerald-500 text-white' : 'bg-neutral-100 text-neutral-400'}`}>
                            <CheckCircle2 size={24} />
                          </div>
                          <div className="pt-3">
                            <h4 className={`font-bold text-lg ${status === 'delivered' ? 'text-neutral-900' : 'text-neutral-400'}`}>
                              'Entregado'
                            </h4>
                            <p className="text-neutral-500 text-sm mt-1">
                              '¡Pedido entregado con éxito! ¡Que lo disfrute!'
                            </p>
                            {status === 'delivered' && deliveryCode && (
                              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-center max-w-sm">
                                <p className="text-emerald-700 font-bold mb-1">
                                  'Código de Recepción'
                                </p>
                                <p className="text-2xl font-mono font-extrabold text-emerald-800 tracking-widest">{deliveryCode}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
