import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  DollarSign, 
  LogOut,
  ShoppingBag,
  TrendingUp,
  Settings,
  Truck,
  Globe,
  Search,
  Trash2,
  Phone,
  MapPin,
  RefreshCw,
  Coins,
  Check,
  Copy,
  Save,
  Database,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import ProductManagement from '../../components/admin/ProductManagement';
import { getOrders, updateOrderStatus as syncUpdateOrderStatus, deleteOrder, deleteAllOrders } from '../../lib/ordersService';
import { getProducts } from '../../lib/productsService';
import { getDrivers, updateDriverActiveStatus } from '../../lib/driversService';
import { getDeliveryFee, saveDeliveryFee } from '../../lib/deliveryFeeService';
import { formatThousandsPrice } from '../../utils/price';
import { useLanguage } from '../../context/LanguageContext';

// Mock data for dashboard
// Removed RECENT_ORDERS

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [deliveryFee, setDeliveryFee] = useState('5.000');
  const [isSavingFee, setIsSavingFee] = useState(false);
  const [feeSavedMsg, setFeeSavedMsg] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleUpdateDeliveryFee = async () => {
    setIsSavingFee(true);
    const formatted = await saveDeliveryFee(deliveryFee);
    setDeliveryFee(formatted);
    setIsSavingFee(false);
    setFeeSavedMsg('تم حفظ سعر التوصيلة بنجاح! / ¡Tarifa guardada correctamente!');
    setTimeout(() => setFeeSavedMsg(null), 4000);
  };

  const totalSales = orders.reduce((sum, order) => {
    const val = parseFloat(order.total.toString().replace('$', '').replace(',', '') || '0');
    return sum + (isNaN(val) ? 0 : val);
  }, 0).toFixed(2);
  const newOrdersCount = orders.length;
  // Placeholder metrics as specific services for these aren't immediately available
  const totalProductsCount = products.length; 
  const activeCustomersCount = new Set(orders.map(o => o.customer)).size;

  const STATS = [
    { label: 'Ventas Totales', value: `COP ${totalSales}`, icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Nuevos Pedidos', value: `${newOrdersCount}`, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Productos Totales', value: `${totalProductsCount}`, icon: Package, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Clientes Activos', value: `${activeCustomersCount}`, icon: Users, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (isAuth !== 'true') {
      navigate('/admin/login');
      return;
    }
    
    // Load persisted orders asynchronously from ordersService
    const fetchOrders = async () => {
      try {
        const storedOrders = await getOrders();
        setOrders(storedOrders);
      } catch (err) {
        console.error('Failed to load admin orders:', err);
      }
    };

    // Load registered drivers
    const fetchDrivers = async () => {
      try {
        const storedDrivers = await getDrivers();
        setDrivers(storedDrivers);
      } catch (err) {
        console.error('Failed to load admin drivers:', err);
      }
    };

    // Load registered products
    const fetchProducts = async () => {
      try {
        const storedProducts = await getProducts();
        setProducts(storedProducts);
      } catch (err) {
        console.error('Failed to load admin products:', err);
      }
    };

    fetchOrders();
    fetchDrivers();
    fetchProducts();
    getDeliveryFee().then(fee => setDeliveryFee(fee));

    // Periodically sync orders and drivers status every 4 seconds for real-time updates
    const interval = setInterval(() => {
      fetchDrivers();
      fetchOrders();
    }, 4000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/admin/login');
  };

  const handleToggleDriverStatus = async (driverId: string, currentStatus: boolean) => {
    try {
      const nextStatus = !currentStatus;
      await updateDriverActiveStatus(driverId, nextStatus);
      setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, isActive: nextStatus } : d));
    } catch (err) {
      console.error('Failed to toggle driver active status:', err);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    
    try {
      await syncUpdateOrderStatus(orderId, newStatus);
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const confirmDelete = async () => {
    if (isDeletingAll) {
      try {
        await deleteAllOrders();
        setOrders([]);
        setMessage('Eliminado todo con éxito');
        setTimeout(() => setMessage(null), 3000);
      } catch (err) {
        console.error('Failed to delete all orders:', err);
      }
      setIsDeletingAll(false);
    } else if (orderToDelete) {
      try {
        await deleteOrder(orderToDelete);
        const updatedOrders = orders.filter(order => order.id !== orderToDelete);
        setOrders(updatedOrders);
        setMessage('Eliminado con éxito');
        setTimeout(() => setMessage(null), 3000);
      } catch (err) {
        console.error('Failed to delete order:', err);
      }
      setOrderToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('\u062a\u062c\u0647\u064a\u0632') || s.includes('preparación') || s.includes('processing') || s.includes('pendiente')) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (s.includes('\u0634\u062d\u0646') || s.includes('ruta') || s.includes('camino') || s.includes('shipped') || s.includes('\u062a\u0648\u0635\u064a\u0644')) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (s.includes('\u0645\u0643\u062a\u0645\u0644') || s.includes('delivered') || s.includes('entregado') || s.includes('completado')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (s.includes('\u0645\u0644\u063a\u0649') || s.includes('cancelado')) return 'bg-red-50 text-red-700 border-red-100';
    return 'bg-neutral-50 text-neutral-700 border-neutral-100';
  };

  const getRowAccent = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('\u062a\u062c\u0647\u064a\u0632') || s.includes('preparación') || s.includes('processing') || s.includes('pendiente')) return 'bg-amber-500';
    if (s.includes('\u0634\u062d\u0646') || s.includes('ruta') || s.includes('camino') || s.includes('shipped') || s.includes('\u062a\u0648\u0635\u064a\u0644')) return 'bg-blue-500';
    if (s.includes('\u0645\u0643\u062a\u0645\u0644') || s.includes('delivered') || s.includes('entregado') || s.includes('completado')) return 'bg-emerald-500';
    if (s.includes('\u0645\u0644\u063a\u0649') || s.includes('cancelado')) return 'bg-red-500';
    return 'bg-neutral-300';
  };

  const getLocalizedStatus = (status: string) => {
    if (status === '\u0642\u064a\u062f \u0627\u0644\u062a\u062c\u0647\u064a\u0632' || status === 'processing' || status === 'preparación' || status === 'Pendiente') return 'En Preparación';
    if (status === '\u062a\u0645 \u0627\u0644\u0634\u062d\u0646' || status === '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0648\u0635\u064a\u0644' || status === 'shipped' || status === 'ruta' || status === 'camino' || status === 'En Camino') return 'En Camino';
    if (status === '\u0645\u0643\u062a\u0645\u0644' || status === 'delivered' || status === 'entregado' || status === 'Entregado') return 'Entregado';
    if (status === '\u0645\u0644\u063a\u0649' || status === 'cancelado' || status === 'Cancelado') return 'Cancelado';
    return status;
  };

  return (
    <div className={`min-h-screen bg-neutral-50 flex flex-col lg:flex-row font-sans text-left [direction:ltr]`}>
      {/* Mobile & Tablet Top Header */}
      <div className="lg:hidden bg-white border-b border-neutral-200 sticky top-0 z-40 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <h1 className="text-lg sm:text-xl font-extrabold text-primary">
          'Panel de Admin'
        </h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => navigate('/')}
            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            'Tienda'
          </button>
          <button
            onClick={handleLogout}
            className="p-2 sm:px-3 sm:py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
            title='Cerrar Sesión'
          >
            <LogOut size={16} />
            <span className="hidden sm:inline text-xs font-bold">'Salir'</span>
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Horizontal Tabs Navigation */}
      <div className="lg:hidden bg-white border-b border-neutral-200 px-3 sm:px-6 py-2.5 flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar sticky top-[53px] sm:top-[57px] z-30 shadow-xs">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'dashboard' ? 'bg-primary text-white shadow-xs' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
        >
          <LayoutDashboard size={16} />
          <span>'Inicio'</span>
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'orders' ? 'bg-primary text-white shadow-xs' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
        >
          <ShoppingBag size={16} />
          <span>'Pedidos'</span>
        </button>
        <button 
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'products' ? 'bg-primary text-white shadow-xs' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
        >
          <Package size={16} />
          <span>'Productos'</span>
        </button>
        <button 
          onClick={() => setActiveTab('drivers')}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'drivers' ? 'bg-primary text-white shadow-xs' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
        >
          <Truck size={16} />
          <span>'Repartidores'</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-colors cursor-pointer ${activeTab === 'settings' ? 'bg-primary text-white shadow-xs' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
        >
          <Settings size={16} />
          <span>'Ajustes'</span>
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex w-64 bg-white border-r border-neutral-200 flex-col shrink-0 min-h-screen`}>
        <div className="p-6 border-b border-neutral-100 flex items-center justify-center">
          <h1 className="text-xl font-extrabold text-primary">
            'Panel de Admin'
          </h1>
        </div>
        <nav className="p-4 flex-1 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors cursor-pointer ${activeTab === 'dashboard' ? 'bg-primary/10 text-primary' : 'text-neutral-600 hover:bg-neutral-50'}`}
          >
            <LayoutDashboard size={20} />
            <span>'Inicio'</span>
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors cursor-pointer ${activeTab === 'orders' ? 'bg-primary/10 text-primary' : 'text-neutral-600 hover:bg-neutral-50'}`}
          >
            <ShoppingBag size={20} />
            <span>'Pedidos'</span>
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors cursor-pointer ${activeTab === 'products' ? 'bg-primary/10 text-primary' : 'text-neutral-600 hover:bg-neutral-50'}`}
          >
            <Package size={20} />
            <span>'Productos'</span>
          </button>
          <button 
            onClick={() => setActiveTab('drivers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors cursor-pointer ${activeTab === 'drivers' ? 'bg-primary/10 text-primary' : 'text-neutral-600 hover:bg-neutral-50'}`}
          >
            <Truck size={20} />
            <span>'Repartidores'</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors cursor-pointer ${activeTab === 'settings' ? 'bg-primary/10 text-primary' : 'text-neutral-600 hover:bg-neutral-50'}`}
          >
            <Settings size={20} />
            <span>'Ajustes'</span>
          </button>
        </nav>
        <div className="p-4 border-t border-neutral-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={20} />
            <span>'Cerrar Sesión'</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-3 sm:px-0 sm:pb-[31px] md:px-0 md:pb-[31px] lg:p-8 overflow-y-auto">
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-8 right-8 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-lg z-50 font-bold text-sm"
          >
            {message}
          </motion.div>
        )}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 md:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
              '¡Bienvenido de nuevo! 👋'
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm mt-0.5">
              'Aquí tiene un resumen de su tienda hoy.'
            </p>
          </div>
          <div className="hidden lg:flex gap-3">
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-white border border-neutral-200 text-neutral-700 rounded-full hover:bg-neutral-50 transition-colors text-sm font-bold cursor-pointer"
            >
              'Ver Tienda'
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {STATS.map((stat, idx) => (
                <div key={idx} className="bg-white p-3.5 sm:p-6 rounded-2xl border border-neutral-100 shadow-xs flex flex-col sm:flex-row items-start gap-2.5 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-neutral-500 font-medium mb-0.5 sm:mb-1">{stat.label}</p>
                    <h3 className="text-lg sm:text-2xl font-extrabold text-neutral-900">{stat.value}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Orders Section */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-neutral-900">
                  'Pedidos Recientes'
                </h3>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsDeletingAll(true)}
                    className="text-red-500 text-sm font-bold hover:underline cursor-pointer"
                  >
                    'Eliminar Todo'
                  </button>
                  <button className="text-primary text-sm font-bold hover:underline cursor-pointer">
                    'Ver Todo'
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-500 font-medium">
                    <tr>
                      <th className={`p-4 font-bold text-left`}>
                        'ID del Pedido'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Cliente'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Fecha'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Total'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Estado'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Acción'
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {orders.map((order, idx) => (
                      <tr key={idx} className="hover:bg-neutral-50 transition-colors relative group">
                        <td className="p-4 relative">
                          <div className={`absolute top-0 bottom-0 left-0 w-1 ${getRowAccent(order.status)} transition-colors`}></div>
                          <span className="font-mono font-bold text-neutral-700">{order.id}</span>
                        </td>
                        <td className="p-4 font-bold text-neutral-900">{order.customer}</td>
                        <td className="p-4 text-neutral-500">{order.date}</td>
                        <td className="p-4 font-bold text-neutral-900">{order.total}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${getRowAccent(order.status)} ${
                              (order.status.toLowerCase().includes('\u062a\u0648\u0635\u064a\u0644') || order.status.toLowerCase().includes('\u0634\u062d\u0646') || order.status.toLowerCase().includes('camino') || order.status.toLowerCase().includes('entrega')) 
                              ? 'animate-pulse ring-2 ring-offset-1 ring-blue-400' 
                              : ''
                            }`}></span>
                            <select 
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border border-transparent tracking-tighter ${getStatusColor(order.status)} outline-none cursor-pointer transition-all`}
                            >
                              <option value="Pendiente">En Preparación</option>
                              <option value="En Camino">En Camino</option>
                              <option value="Entregado">Entregado</option>
                              <option value="Cancelado">Cancelado</option>
                            </select>
                          </div>
                        </td>
                        <td className="p-4">
                          <button 
                            onClick={() => setOrderToDelete(order.id)}
                            className="text-red-500 hover:text-red-700 font-bold text-xs cursor-pointer"
                          >
                            'Eliminar'
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Orders Header & Search / Filter */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                    <ShoppingBag size={22} className="text-primary" />
                    <span>{`Gestión de Pedidos en Vivo (${orders.length})`}</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                    'Supervise los pedidos entrantes de la tienda en tiempo real.'
                  </p>
                </div>
                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <button
                    onClick={async () => {
                      setIsRefreshing(true);
                      const fresh = await getOrders();
                      setOrders(fresh);
                      setTimeout(() => setIsRefreshing(false), 500);
                    }}
                    className={`p-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl transition-all cursor-pointer ${isRefreshing ? 'animate-spin' : ''}`}
                    title='Actualizar ahora'
                  >
                    <RefreshCw size={18} />
                  </button>
                  {orders.length > 0 && (
                    <button 
                      onClick={() => setIsDeletingAll(true)}
                      className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 size={16} />
                      <span>'Eliminar Todo'</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400`} size={18} />
                  <input 
                    type="text"
                    placeholder='Buscar por nombre, ID o teléfono...'
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:border-primary transition-colors`}
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                  <button
                    onClick={() => setOrderStatusFilter('all')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      orderStatusFilter === 'all' ? 'bg-primary text-white shadow-xs' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    'Todos' ({orders.length})
                  </button>
                  <button
                    onClick={() => setOrderStatusFilter('pending')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      orderStatusFilter === 'pending' ? 'bg-amber-600 text-white shadow-xs' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    'En Preparación'
                  </button>
                  <button
                    onClick={() => setOrderStatusFilter('shipped')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      orderStatusFilter === 'shipped' ? 'bg-blue-600 text-white shadow-xs' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    'En Camino'
                  </button>
                  <button
                    onClick={() => setOrderStatusFilter('completed')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                      orderStatusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    'Entregado'
                  </button>
                </div>
              </div>
            </div>

            {/* Orders List / Table */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-500 font-medium">
                    <tr>
                      <th className={`p-4 font-bold text-left`}>
                        'ID'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Cliente'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Dirección / Teléfono'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Fecha'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Total'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Repartidor'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Estado'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Acción'
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {orders.filter(order => {
                      const query = orderSearchQuery.toLowerCase().trim();
                      const matchesSearch = !query || 
                        (order.id || '').toLowerCase().includes(query) ||
                        (order.customer || '').toLowerCase().includes(query) ||
                        (order.phone || '').includes(query) ||
                        (order.driver_name || '').toLowerCase().includes(query);

                      if (!matchesSearch) return false;

                      if (orderStatusFilter === 'all') return true;
                      if (orderStatusFilter === 'pending') return order.status === '\u0642\u064a\u062f \u0627\u0644\u062a\u062c\u0647\u064a\u0632' || order.status === 'processing' || order.status === 'En Preparación' || order.status === 'Pendiente';
                      if (orderStatusFilter === 'shipped') return order.status === '\u062a\u0645 \u0627\u0644\u0634\u062d\u0646' || order.status === '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0648\u0635\u064a\u0644' || order.status === 'shipped' || order.status === 'En Camino';
                      if (orderStatusFilter === 'completed') return order.status === '\u0645\u0643\u062a\u0645\u0644' || order.status === 'delivered' || order.status === 'Entregado' || order.status === 'Completado';
                      if (orderStatusFilter === 'cancelled') return order.status === '\u0645\u0644\u063a\u0649' || order.status === 'Cancelado';
                      return true;
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-12 text-center text-neutral-400 font-medium">
                          <ShoppingBag size={40} className="mx-auto text-neutral-300 mb-3" />
                          <p className="text-base font-bold text-neutral-600">
                            'No hay pedidos coincidentes actualmente'
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">
                            'Los nuevos pedidos de la tienda aparecerán aquí automáticamente.'
                          </p>
                        </td>
                      </tr>
                    ) : (
                      orders.filter(order => {
                        const query = orderSearchQuery.toLowerCase().trim();
                        const matchesSearch = !query || 
                          (order.id || '').toLowerCase().includes(query) ||
                          (order.customer || '').toLowerCase().includes(query) ||
                          (order.phone || '').includes(query) ||
                          (order.driver_name || '').toLowerCase().includes(query);

                        if (!matchesSearch) return false;

                        if (orderStatusFilter === 'all') return true;
                        if (orderStatusFilter === 'pending') return order.status === '\u0642\u064a\u062f \u0627\u0644\u062a\u062c\u0647\u064a\u0632' || order.status === 'processing' || order.status === 'En Preparación' || order.status === 'Pendiente';
                        if (orderStatusFilter === 'shipped') return order.status === '\u062a\u0645 \u0627\u0644\u0634\u062d\u0646' || order.status === '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u0648\u0635\u064a\u0644' || order.status === 'shipped' || order.status === 'En Camino';
                        if (orderStatusFilter === 'completed') return order.status === '\u0645\u0643\u062a\u0645\u0644' || order.status === 'delivered' || order.status === 'Entregado' || order.status === 'Completado';
                        if (orderStatusFilter === 'cancelled') return order.status === '\u0645\u0644\u063a\u0649' || order.status === 'Cancelado';
                        return true;
                      }).map((order, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50 transition-colors relative group">
                          <td className="p-4 relative">
                            <div className={`absolute top-0 bottom-0 left-0 w-1 ${getRowAccent(order.status)} transition-colors`}></div>
                            <span className="font-mono font-bold text-blue-600">{order.id}</span>
                          </td>
                          <td className="p-4 font-bold text-neutral-900">{order.customer}</td>
                          <td className="p-4 text-xs text-neutral-600">
                            {order.phone && (
                              <div className="flex items-center gap-1 font-mono font-bold text-neutral-700 mb-0.5">
                                <Phone size={13} className="text-neutral-400" />
                                <a href={`tel:${order.phone}`} className="hover:underline">{order.phone}</a>
                              </div>
                            )}
                            {order.address && (
                              <div className="flex items-center gap-1 text-neutral-500">
                                <MapPin size={13} className="text-neutral-400 shrink-0" />
                                <span className="truncate max-w-[180px]">{order.address}</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-xs text-neutral-500 font-mono">{order.date}</td>
                          <td className="p-4 font-bold text-emerald-600">{order.total}</td>
                          <td className="p-4 text-xs font-bold">
                            {order.driver_name ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full">
                                <Truck size={13} />
                                {order.driver_name}
                              </span>
                            ) : (
                              <span className="text-neutral-400 font-normal">
                                'Sin asignar'
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${getRowAccent(order.status)} ${
                                (order.status.toLowerCase().includes('\u062a\u0648\u0635\u064a\u0644') || order.status.toLowerCase().includes('\u0634\u062d\u0646') || order.status.toLowerCase().includes('camino') || order.status.toLowerCase().includes('entrega')) 
                                ? 'animate-pulse ring-2 ring-offset-1 ring-blue-400' 
                                : ''
                              }`}></span>
                              <select 
                                value={order.status}
                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase border tracking-tight ${getStatusColor(order.status)} outline-none cursor-pointer shadow-sm transition-all`}
                              >
                                <option value="Pendiente">En Preparación</option>
                                <option value="En Camino">En Camino</option>
                                <option value="Entregado">Entregado</option>
                                <option value="Cancelado">Cancelado</option>
                              </select>
                            </div>
                          </td>
                          <td className="p-4">
                            <button 
                              onClick={() => setOrderToDelete(order.id)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title='Eliminar'
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'products' && <ProductManagement />}
        
        {activeTab === 'drivers' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 animate-in fade-in duration-300"
          >
            {/* Delivery Fee Setting Control Panel */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Coins size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900">
                      سعر التوصيلة الواحدة للسائق (Tarifa por Entrega)
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      حدد الأجر الذي يتحصل عليه السائق عند إدخال كود التأكيد لكل عملية توصيل
                    </p>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full text-xs font-bold text-emerald-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  السعر الحالي: COP {formatThousandsPrice(deliveryFee)}
                </div>
              </div>

              {feeSavedMsg && (
                <div className="p-4 bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 animate-in fade-in">
                  <Check size={18} />
                  <span>{feeSavedMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 flex items-center justify-between">
                    <span>سعر التوصيلة الواحدة (COP)</span>
                    <span className="text-[10px] text-neutral-400">مثال: 5.000 أو 6000</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      placeholder="مثال: 5.000"
                      className="w-full p-3.5 pr-12 rounded-xl border border-neutral-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none font-bold text-neutral-900 text-lg bg-neutral-50 focus:bg-white transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400 font-mono">
                      COP
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleUpdateDeliveryFee}
                  disabled={isSavingFee}
                  className="w-full md:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingFee ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>حفظ سعر التوصيلة (Guardar Tarifa)</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-xl font-bold text-neutral-900">
                  {`Registro de Repartidores (${drivers.length})`}
                </h3>
                <p className="text-sm text-neutral-500 mt-1">
                  'Lista de todos los repartidores registrados, sus vehículos y números.'
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-500 font-medium">
                    <tr>
                      <th className={`p-4 font-bold text-left`}>
                        'ID'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Nombre Completo'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Estado'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Teléfono'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Vehículo'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Matrícula'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Fecha de Registro'
                      </th>
                      <th className={`p-4 font-bold text-left`}>
                        'Acciones'
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {drivers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-neutral-400 font-medium">
                          'No hay repartidores registrados en el sistema actualmente.'
                        </td>
                      </tr>
                    ) : (
                      drivers.map((drv, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                          <td className="p-4 font-mono font-bold text-blue-600">{drv.id}</td>
                          <td className="p-4 font-bold text-neutral-900">{drv.name}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                              drv.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${drv.isActive !== false ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`}></span>
                              {drv.isActive !== false 
                                ? ('Activo') 
                                : ('Inactivo')}
                            </span>
                          </td>
                          <td className="p-4 text-neutral-600 font-mono">{drv.phone}</td>
                          <td className="p-4">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                              {drv.vehicle || ('Motocicleta')}
                            </span>
                          </td>
                          <td className="p-4 font-bold text-neutral-700">{drv.plateNumber || 'ABC-1234'}</td>
                          <td className="p-4 text-neutral-500 font-mono">
                            {('No especificado')}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleDriverStatus(drv.id, drv.isActive !== false)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs whitespace-nowrap border ${
                                drv.isActive !== false
                                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {drv.isActive !== false
                                ? ('Desactivar')
                                : ('Activar')}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 animate-in fade-in duration-300"
          >
            {/* Delivery Fee Setting Control Panel */}
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6 md:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Coins size={26} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-neutral-900">
                      إعدادات عمولة التوصيل للسائقين (Ajustes de Tarifa de Entrega)
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      يمكنك تعديل عمولة التوصيل لكل طلب عند تأكيده بواسطة السائق
                    </p>
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full text-xs font-bold text-emerald-700 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  السعر النشط حالياً: COP {formatThousandsPrice(deliveryFee)}
                </div>
              </div>

              {feeSavedMsg && (
                <div className="p-4 bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 animate-in fade-in">
                  <Check size={18} />
                  <span>{feeSavedMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 flex items-center justify-between">
                    <span>سعر التوصيلة الواحدة (COP)</span>
                    <span className="text-[10px] text-neutral-400">مثال: 5.000 أو 10.000</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      placeholder="مثال: 5.000"
                      className="w-full p-3.5 pr-12 rounded-xl border border-neutral-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none font-bold text-neutral-900 text-lg bg-neutral-50 focus:bg-white transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-neutral-400 font-mono">
                      COP
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleUpdateDeliveryFee}
                  disabled={isSavingFee}
                  className="w-full md:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingFee ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>حفظ وحفظ التغييرات (Guardar Tarifa)</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Confirmation Modal */}
        {(orderToDelete || isDeletingAll) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full"
            >
              <h3 className="text-lg font-bold text-neutral-900 mb-2">
                {isDeletingAll
                  ? ('Confirmar eliminar todo')
                  : ('Confirmar eliminación')}
              </h3>
              <p className="text-neutral-500 mb-6">
                {isDeletingAll
                  ? ('¿Estás seguro de que quieres eliminar todos los pedidos? Esta acción no se puede deshacer.')
                  : ('¿Estás seguro de que quieres eliminar este pedido? Esta acción no se puede deshacer.')}
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => isDeletingAll ? setIsDeletingAll(false) : setOrderToDelete(null)}
                  className="px-4 py-2 text-neutral-600 font-bold hover:bg-neutral-100 rounded-full transition-colors cursor-pointer"
                >
                  'Cancelar'
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white font-bold hover:bg-red-700 rounded-full transition-colors cursor-pointer"
                >
                  'Eliminar'
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}
