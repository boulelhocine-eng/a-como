import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { User, LogOut, Package, MapPin, Phone, Mail, Edit, CheckCircle, Save, X, Eye, RefreshCw, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getOrders, getDeliveryCode } from '../lib/ordersService';

interface Order {
  id: string;
  customer: string;
  email?: string;
  date: string;
  total: string;
  status: string;
  deliveryCode?: string;
}

export default function Profile() {
  const { currentUser, logout, updateProfile, loading } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');

  // Orders list state
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setPhone(currentUser.phone || '');
      setAddress(currentUser.address || '');

      // Load matching orders asynchronously
      const fetchUserOrders = async () => {
        try {
          const allOrders = await getOrders();
          const matched = allOrders.filter(
            order => 
              (order.email && order.email.toLowerCase() === currentUser.email.toLowerCase()) || 
              order.customer.toLowerCase() === currentUser.name.toLowerCase()
          );
          
          const matchedWithCodes = await Promise.all(
            matched.map(async (order) => {
              const code = await getDeliveryCode(order.id);
              return { ...order, deliveryCode: code || undefined };
            })
          );
          setUserOrders(matchedWithCodes);
        } catch (err) {
          console.error('Failed to load user orders:', err);
        }
      };
      
      fetchUserOrders();
    }
  }, [currentUser]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateProfile({
      name,
      phone,
      address
    });

    setIsEditing(false);
    setMessage('¡Información de cuenta actualizada con éxito!');
    setTimeout(() => setMessage(''), 3000);
  };

  if (loading || !currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-neutral-50 [direction:ltr]`}>
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleLogoutClick = () => {
    logout();
    navigate('/');
  };

  const getLocalizedStatus = (status: string) => {
    if (status === '\u0645\u0643\u062a\u0645\u0644' || status === 'Completado' || status === 'Entregado') return 'Completado';
    if (status === '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0648\u0635\u064a\u0644' || status === 'En entrega' || status === 'En Camino' || status === '\u062a\u0645 \u0627\u0644\u0634\u062d\u0646') return 'En entrega';
    if (status === '\u0642\u064a\u062f \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631' || status === 'Pendiente' || status === '\u0642\u064a\u062f \u0627\u0644\u062a\u062c\u0647\u064a\u0632') return 'Pendiente';
    return status;
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans text-left [direction:ltr] bg-neutral-50`}>
      <Header />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Top Welcome Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                <User size={32} className="stroke-[1.5]" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-neutral-900">{currentUser.name}</h1>
                <p className="text-neutral-500 text-sm mt-1">{currentUser.email}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleLogoutClick}
                className="py-2.5 px-5 text-sm font-bold border border-red-200 text-red-600 hover:bg-red-50 rounded-full transition-all flex items-center gap-2 cursor-pointer"
              >
                <LogOut size={16} />
                <span>'Cerrar Sesión'</span>
              </button>
            </div>
          </div>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-sm rounded-xl font-bold flex items-center gap-2`}
              >
                <CheckCircle size={18} />
                <span>{message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Account Details / Edit Section */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 h-fit space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                  <User size={18} className="text-primary" />
                  <span>'Detalles de la Cuenta'</span>
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-primary hover:text-primary-dark font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Edit size={14} />
                    <span>'Editar'</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">
                      'Nombre Completo'
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-left`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">
                      'Teléfono'
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-left`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 mb-1">
                      'Dirección de Entrega'
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className={`w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none resize-none text-left`}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 px-4 bg-primary text-white font-bold text-xs rounded-full hover:bg-primary-dark transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Save size={14} />
                      <span>'Guardar'</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2 px-4 bg-neutral-100 text-neutral-600 font-semibold text-xs rounded-full hover:bg-neutral-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <X size={14} />
                      <span>'Cancelar'</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4 text-sm text-neutral-700">
                  <div className="flex gap-3 items-center">
                    <Mail size={16} className="text-neutral-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase">
                        'Correo Electrónico'
                      </p>
                      <p className="font-medium text-neutral-800 mt-0.5">{currentUser.email}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-center">
                    <Phone size={16} className="text-neutral-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase">
                        'Teléfono'
                      </p>
                      <p className="font-medium text-neutral-800 mt-0.5">
                        {currentUser.phone || <span className="text-neutral-400 text-xs italic">'No asignado'</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start">
                    <MapPin size={16} className="text-neutral-400 shrink-0 mt-1" />
                    <div>
                      <p className="text-[10px] text-neutral-400 font-bold uppercase">
                        'Dirección Predeterminada'
                      </p>
                      <p className="font-medium text-neutral-800 mt-0.5">
                        {currentUser.address || <span className="text-neutral-400 text-xs italic">'No asignada'</span>}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order History Section */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-neutral-100 lg:col-span-2 space-y-6">
              <h2 className="text-lg font-bold text-neutral-900 pb-4 border-b border-neutral-100 flex items-center gap-2">
                <Package size={18} className="text-primary" />
                <span>
                  {`Mis Pedidos (${userOrders.length})`}
                </span>
              </h2>

              {userOrders.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto text-neutral-300">
                    <Package size={28} />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-700">
                      'No hay pedidos anteriores'
                    </h3>
                    <p className="text-neutral-500 text-xs mt-1">
                      '¡Comienza a comprar para ver tus pedidos aquí!'
                    </p>
                  </div>
                  <Link
                    to="/products"
                    className="inline-block py-2.5 px-6 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary-dark transition-all"
                  >
                    'Explorar Productos'
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {userOrders.map((order) => (
                    <div key={order.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono font-extrabold text-neutral-800 text-sm">{order.id}</span>
                          <span className="text-neutral-400 text-xs">•</span>
                          <span className="text-neutral-500 text-xs">{order.date}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          <p className="text-xs text-neutral-400">
                            'Valor total:' <span className="font-bold text-neutral-800">{order.total}</span>
                          </p>
                          {order.deliveryCode && (
                            <p className="text-xs text-neutral-500 flex items-center gap-1.5">
                              <span>'Código de confirmación:'</span>
                              <span className="font-mono font-extrabold bg-primary/10 text-primary px-2 py-0.5 rounded text-[11px] tracking-wider">{order.deliveryCode}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <span className={`py-1 px-3 rounded-full text-xs font-bold ${
                          order.status === '\u0645\u0643\u062a\u0645\u0644' || order.status === 'Completado' || order.status === 'Entregado' ? 'bg-emerald-50 text-emerald-600' :
                          order.status === '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0648\u0635\u064a\u0644' || order.status === 'En entrega' || order.status === 'En Camino' || order.status === '\u062a\u0645 \u0627\u0644\u0634\u062d\u0646' ? 'bg-blue-50 text-blue-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {getLocalizedStatus(order.status)}
                        </span>
                        
                        <Link
                          to="/track-order"
                          state={{ orderId: order.id }}
                          className="py-2 px-3 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 border border-neutral-100 rounded-full text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <Eye size={12} />
                          <span>'Seguimiento'</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
