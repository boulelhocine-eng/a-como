import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  LogOut,
  Phone,
  Navigation,
  Globe,
  Power,
  Package,
  History,
  LayoutDashboard,
  Coins,
  DollarSign,
  Sparkles,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { getOrders, updateOrderStatus as syncUpdateOrderStatus, getDeliveryCode } from '../../lib/ordersService';
import { updateDriverActiveStatus } from '../../lib/driversService';
import { getDeliveryFee } from '../../lib/deliveryFeeService';
import { formatThousandsPrice } from '../../utils/price';
import { useLanguage } from '../../context/LanguageContext';

export default function DriverDashboard() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'delivered'>('all');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState('Juan Pérez');
  const [driverVehicle, setDriverVehicle] = useState('Toyota Corolla');
  const [driverPlateNumber, setDriverPlateNumber] = useState('ABC-1234');
  const [currentDriverId, setCurrentDriverId] = useState<string>('');
  const [isDriverActive, setIsDriverActive] = useState<boolean>(true);
  const [deliveryFee, setDeliveryFee] = useState<string>('5.000');
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  useEffect(() => {
    const isAuth = localStorage.getItem('driverAuth');
    if (isAuth !== 'true') {
      navigate('/driver/login');
      return;
    }

    const currentDriverStr = localStorage.getItem('currentDriver');
    if (currentDriverStr) {
      try {
        const driver = JSON.parse(currentDriverStr);
        setDriverName(driver.name || 'Juan Pérez');
        if (driver.vehicle) setDriverVehicle(driver.vehicle);
        if (driver.plateNumber) setDriverPlateNumber(driver.plateNumber);
        const drvId = driver.id || driver.phone || '';
        setCurrentDriverId(drvId);
        setIsDriverActive(true);
        if (drvId) {
          updateDriverActiveStatus(drvId, true);
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Load current delivery fee configured by admin
    getDeliveryFee().then(fee => setDeliveryFee(fee));

    // Load persisted orders asynchronously from ordersService
    const fetchOrders = async () => {
      try {
        const storedOrders = await getOrders();
        setOrders(storedOrders as any[]);
      } catch (err) {
        console.error('Failed to load driver orders:', err);
      }
    };

    fetchOrders();
  }, [navigate]);

  const toggleActiveStatus = async () => {
    const nextState = !isDriverActive;
    setIsDriverActive(nextState);
    if (currentDriverId) {
      await updateDriverActiveStatus(currentDriverId, nextState);
    }
  };

  const handleLogout = async () => {
    if (currentDriverId) {
      await updateDriverActiveStatus(currentDriverId, false);
    }
    localStorage.removeItem('driverAuth');
    localStorage.removeItem('currentDriver');
    navigate('/driver/login');
  };

  const verifyAndComplete = async (orderId: string) => {
    try {
      const correctCode = await getDeliveryCode(orderId);
      
      if (!correctCode || verificationCode.trim().toUpperCase() === correctCode.trim().toUpperCase()) {
        await handleUpdateOrderStatus(orderId, 'Entregado', deliveryFee);
        setVerifyingOrderId(null);
        setVerificationCode('');
        
        // Trigger celebratory notification
        setSuccessNotification(`تم تأكيد التوصيل بنجاح! +${deliveryFee} COP أرباح التوصيلة`);
        setTimeout(() => setSuccessNotification(null), 5000);
      } else {
        alert('كود غير صحيح! يرجى التأكد من العميل / Código incorrecto');
      }
    } catch (err) {
      console.error('Failed to verify delivery code:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string, feeForOrder?: string) => {
    const feeToApply = feeForOrder || deliveryFee;
    const updatedOrders = orders.map((order: any) => 
      order.id === orderId 
        ? { 
            ...order, 
            status: newStatus, 
            driver_id: currentDriverId, 
            driver_name: driverName,
            ...(newStatus === 'Entregado' || newStatus === '\u0645\u0643\u062a\u0645\u0644' ? { delivery_fee: feeToApply } : {})
          } 
        : order
    );
    setOrders(updatedOrders);
    
    try {
      await syncUpdateOrderStatus(
        orderId, 
        newStatus, 
        currentDriverId, 
        driverName, 
        (newStatus === 'Entregado' || newStatus === '\u0645\u0643\u062a\u0645\u0644') ? feeToApply : undefined
      );
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  // Orders associated with current driver or available for pickup
  const relevantOrders = orders.filter(o => 
    o.driver_id === currentDriverId || (!o.driver_id && (o.status === '\u062a\u0645 \u0627\u0644\u0634\u062d\u0646' || o.status === '\u0642\u064a\u062f \u0627\u0644\u062a\u062c\u0647\u064a\u0632' || o.status === 'En Camino' || o.status === 'Pendiente'))
  );

  const completedCount = orders.filter(o => o.driver_id === currentDriverId && (o.status === '\u0645\u0643\u062a\u0645\u0644' || o.status === 'Entregado' || o.status === 'Completado')).length;
  const inCaminoCount = orders.filter(o => o.driver_id === currentDriverId && (o.status === '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0648\u0635\u064a\u0644' || o.status === 'En Camino' || o.status === 'En entrega')).length;
  const inEsperaCount = orders.filter(o => o.driver_id === currentDriverId && (o.status === '\u062a\u0645 \u0627\u0644\u0634\u062d\u0646' || o.status === '\u0642\u064a\u062f \u0627\u0644\u062a\u062c\u0647\u064a\u0632' || o.status === 'Pendiente')).length;

  // Earnings today
  const todayStr = new Date().toISOString().split('T')[0];
  const earningsToday = orders
    .filter(o => o.driver_id === currentDriverId && (o.status === '\u0645\u0643\u062a\u0645\u0644' || o.status === 'Entregado' || o.status === 'Completado') && (o.date || '').startsWith(todayStr))
    .reduce((sum, o) => {
      const val = parseFloat((o.total || '0').replace(/[^0-9.]/g, '')) || 0;
      return sum + val;
    }, 0);

  const filteredOrders = relevantOrders.filter(order => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return order.status === '\u062a\u0645 \u0627\u0644\u0634\u062d\u0646' || order.status === '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0648\u0635\u064a\u0644' || order.status === '\u0642\u064a\u062f \u0627\u0644\u062a\u062c\u0647\u064a\u0632' || order.status === 'En Camino' || order.status === 'Pendiente' || order.status === 'En entrega';
    if (activeTab === 'delivered') return order.status === '\u0645\u0643\u062a\u0645\u0644' || order.status === 'Entregado' || order.status === 'Completado';
    return true;
  });

  return (
    <div className={`min-h-screen bg-neutral-100 flex flex-col font-sans pb-24 md:pb-8 text-left [direction:ltr]`}>
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 px-4 md:px-8 py-3 md:py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-sm">
            <Truck size={22} />
          </div>
          <div>
            <h1 className="font-bold text-neutral-900 leading-tight text-sm md:text-base">
              'Portal de Repartidores'
            </h1>
            <p className="text-[10px] md:text-xs text-neutral-500 font-medium">{driverName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button
              onClick={toggleActiveStatus}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full border text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 md:gap-2 cursor-pointer shadow-xs ${
                isDriverActive 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                  : 'bg-neutral-100 border-neutral-300 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <span className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${isDriverActive ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`}></span>
              <span className="hidden sm:inline">
                {isDriverActive 
                  ? ('Activo') 
                  : ('Inactivo')}
              </span>
            </button>
            <button 
              onClick={handleLogout}
              className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
            >
              <LogOut size={18} />
            </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {/* Success Toast Notification */}
        {successNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 p-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg flex items-center justify-between gap-3 text-sm md:text-base border border-emerald-400"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-white" />
              </div>
              <span>{successNotification}</span>
            </div>
            <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
          </motion.div>
        )}

        {/* Driver Delivery Rate Info Card */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 rounded-3xl p-5 md:p-6 text-white shadow-lg mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex items-center gap-4 z-10">
            <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
              <Coins size={28} className="text-amber-300" />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-wider text-emerald-100 mb-0.5">
                سعر كل توصيلة (Tarifa por Entrega)
              </div>
              <div className="text-2xl md:text-3xl font-black tracking-tight flex items-baseline gap-2">
                <span>COP {deliveryFee}</span>
                <span className="text-xs font-semibold text-emerald-200">لكل طلب مؤكد بكود التوصيل</span>
              </div>
            </div>
          </div>

          <div className="bg-white/15 border border-white/25 rounded-2xl p-3.5 backdrop-blur-md flex items-center gap-4 w-full md:w-auto justify-between z-10">
            <div>
              <div className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider">
                إجمالي أرباح التوصيل
              </div>
              <div className="text-lg md:text-xl font-black text-amber-300 font-mono">
                COP {formatThousandsPrice(completedCount * (parseFloat(deliveryFee.replace(/[^0-9]/g, '')) || 5000))}
              </div>
            </div>
            <div className="bg-emerald-400/30 border border-emerald-300/40 px-3 py-1.5 rounded-full text-xs font-black shrink-0">
              {completedCount} توصيلة مكتملة
            </div>
          </div>
        </div>

        {/* Stats Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
            <div className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              التوصيلات المكتملة
            </div>
            <div className="text-2xl font-black text-neutral-900">{completedCount}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-xs">
            <div className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              جاري التوصيل
            </div>
            <div className="text-2xl font-black text-blue-600">{inCaminoCount}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 shadow-xs">
            <div className="text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <Coins size={12} /> سعر التوصيلة
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">COP {deliveryFee}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/30 shadow-xs">
            <div className="text-amber-700 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <DollarSign size={12} /> أرباح التوصيلات
            </div>
            <div className="text-xl font-black text-amber-700 font-mono truncate">
              COP {formatThousandsPrice(completedCount * (parseFloat(deliveryFee.replace(/[^0-9]/g, '')) || 5000))}
            </div>
          </div>
        </div>

        {/* Tab Controls - Custom Styled for Mobile */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-neutral-900">
            {activeTab === 'all' && ('Todos los pedidos')}
            {activeTab === 'pending' && ('Pedidos activos')}
            {activeTab === 'delivered' && ('Entregas hechas')}
          </h2>
        </div>

        {/* Orders List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-neutral-300">
              <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={32} className="text-neutral-300" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900">
                'Lista vacía'
              </h3>
              <p className="text-neutral-400 text-sm max-w-xs mx-auto mt-2 px-6">
                'Todo al día por ahora. Los nuevos pedidos aparecerán aquí.'
              </p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded text-[10px] font-black font-mono tracking-tight uppercase">
                        #{order.id}
                      </span>
                      {order.status === '\u0645\u0643\u062a\u0645\u0644' || order.status === 'Entregado' || order.status === 'Completado' ? (
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1">
                          <CheckCircle2 size={10} /> 'Entregado'
                        </span>
                      ) : order.status === '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0648\u0635\u064a\u0644' || order.status === 'En Camino' || order.status === 'En entrega' ? (
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1">
                          <Truck size={10} /> 'En camino'
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1">
                          <Clock size={10} /> 'Espera'
                        </span>
                      )}
                    </div>
                    <h4 className="text-lg font-black text-neutral-900">{order.customer}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-600">{order.total}</div>
                    <div className="text-[10px] text-neutral-400 font-bold uppercase">{order.date || ('Hoy')}</div>
                  </div>
                </div>

                <div className="space-y-3 mb-5 p-3 bg-neutral-50 rounded-2xl">
                  <div className="flex items-start gap-2.5">
                    <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
                    <span className="text-sm font-bold text-neutral-700 leading-snug">
                      {order.address || ('Dirección no disponible')}
                    </span>
                  </div>
                  {order.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone size={16} className="text-primary shrink-0" />
                      <span className="text-sm font-black text-neutral-900 font-mono tracking-tighter">{order.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2.5">
                  {(order.status === '\u062a\u0645 \u0627\u0644\u0634\u062d\u0646' || order.status === '\u0642\u064a\u062f \u0627\u0644\u062a\u062c\u0647\u064a\u0632' || order.status === 'Pendiente' || order.status === 'Espera') && (
                    <button 
                      onClick={() => handleUpdateOrderStatus(order.id, 'En Camino')}
                      className="w-full py-4 bg-primary text-white font-black rounded-2xl transition-all active:scale-[0.98] shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      <Truck size={20} />
                      <span>'Aceptar y entregar'</span>
                    </button>
                  )}
                  
                  {(order.status === '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0648\u0635\u064a\u0644' || order.status === 'En Camino' || order.status === 'En entrega') && (
                    <div className="space-y-2.5">
                      {verifyingOrderId === order.id ? (
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder='Cod'
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value)}
                            className="flex-1 p-4 bg-neutral-100 border-2 border-neutral-200 rounded-2xl text-center font-black outline-none focus:border-primary"
                          />
                          <button 
                            onClick={() => verifyAndComplete(order.id)}
                            className="px-8 bg-emerald-600 text-white font-black rounded-2xl active:scale-[0.98]"
                          >
                            'Ok'
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setVerifyingOrderId(order.id)}
                          className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl active:scale-[0.98] shadow-md shadow-emerald-200 flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={20} />
                          <span>'Confirmar entrega'</span>
                        </button>
                      )}
                    </div>
                  )}

                  {order.phone && (
                    <a 
                      href={`tel:${order.phone}`}
                      className="w-full py-4 bg-white border-2 border-neutral-200 text-neutral-900 font-black rounded-2xl flex items-center justify-center gap-2 active:bg-neutral-50"
                    >
                      <Phone size={20} />
                      <span>'Llamar'</span>
                    </a>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 h-20 px-6 flex items-center justify-between md:hidden z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <button 
          onClick={() => setActiveTab('pending')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'pending' ? 'text-primary scale-110' : 'text-neutral-400'}`}
        >
          <LayoutDashboard size={24} strokeWidth={activeTab === 'pending' ? 3 : 2} />
          <span className="text-[10px] font-black uppercase tracking-tighter">'Activos'</span>
        </button>
        <button 
          onClick={() => setActiveTab('all')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'all' ? 'text-primary scale-110' : 'text-neutral-400'}`}
        >
          <Package size={24} strokeWidth={activeTab === 'all' ? 3 : 2} />
          <span className="text-[10px] font-black uppercase tracking-tighter">'Todos'</span>
        </button>
        <button 
          onClick={() => setActiveTab('delivered')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'delivered' ? 'text-primary scale-110' : 'text-neutral-400'}`}
        >
          <History size={24} strokeWidth={activeTab === 'delivered' ? 3 : 2} />
          <span className="text-[10px] font-black uppercase tracking-tighter">'Historial'</span>
        </button>
      </nav>
    </div>
  );
}
