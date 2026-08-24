import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Truck, LogIn, ArrowRight, ArrowLeft, UserPlus, Phone, User, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { updateDriverActiveStatus } from '../../lib/driversService';

export default function DriverLogin() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const navigate = useNavigate();

  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Registration state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regVehicle, setRegVehicle] = useState('');
  const [regPlateNumber, setRegPlateNumber] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem('driverAuth');
    if (isAuth === 'true') {
      navigate('/driver/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const cleanIdentifier = loginIdentifier.trim();
    if (!cleanIdentifier || !password.trim()) {
      setError('Por favor, ingrese teléfono/usuario y contraseña');
      return;
    }

    setIsSubmitting(true);

    try {
      // Fetch driver from Supabase
      const { data, error: dbError } = await supabase
        .from('drivers')
        .select('*')
        .or(`phone.eq.${cleanIdentifier},username.eq.${cleanIdentifier.toLowerCase()}`);

      if (dbError) {
        throw dbError;
      }

      if (data && data.length > 0) {
        const foundDriver = data[0];

        // Verify password
        if (foundDriver.password !== password) {
          setIsSubmitting(false);
          setError('Contraseña incorrecta');
          return;
        }

        // Check if the driver is active (approved by admin)
        if (foundDriver.is_active === false) {
          setIsSubmitting(false);
          setError('Su cuenta está en revisión, por favor espere la aprobación del administrador');
          return;
        }

        const driverData = {
          id: foundDriver.id,
          name: foundDriver.name,
          username: foundDriver.username,
          phone: foundDriver.phone,
          vehicle: foundDriver.vehicle,
          plateNumber: foundDriver.plate_number,
          createdAt: foundDriver.created_at,
          isActive: true
        };

        localStorage.setItem('driverAuth', 'true');
        localStorage.setItem('currentDriver', JSON.stringify(driverData));
        
        // Update active status online & local
        await updateDriverActiveStatus(foundDriver.id, true);

        // Update local list
        const localDrivers = JSON.parse(localStorage.getItem('fashion_drivers') || '[]');
        const updatedLocal = [{ ...driverData, isActive: true }, ...localDrivers.filter((d: any) => d.id !== driverData.id)];
        localStorage.setItem('fashion_drivers', JSON.stringify(updatedLocal));

        setIsSubmitting(false);
        setSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
        setTimeout(() => {
          navigate('/driver/dashboard');
        }, 1200);

      } else {
        // Fallback to local storage
        const localDrivers = JSON.parse(localStorage.getItem('fashion_drivers') || '[]');
        const foundLocal = localDrivers.find(
          (d: any) => (d.phone === cleanIdentifier || d.username?.toLowerCase() === cleanIdentifier.toLowerCase()) && d.password === password
        );

        setIsSubmitting(false);
        if (foundLocal) {
          if (foundLocal.isActive === false || foundLocal.is_active === false) {
            setError('Su cuenta está en revisión, por favor espere la aprobación del administrador');
            return;
          }
          const activeLocal = { ...foundLocal, isActive: true };
          localStorage.setItem('driverAuth', 'true');
          localStorage.setItem('currentDriver', JSON.stringify(activeLocal));
          await updateDriverActiveStatus(foundLocal.id || foundLocal.phone, true);

          setSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
          setTimeout(() => {
            navigate('/driver/dashboard');
          }, 1200);
        } else {
          setError('Credenciales o contraseña incorrectas');
        }
      }
    } catch (err: any) {
      console.warn('Supabase driver login error, trying localStorage fallback:', err.message);
      
      const localDrivers = JSON.parse(localStorage.getItem('fashion_drivers') || '[]');
      const foundLocal = localDrivers.find(
        (d: any) => (d.phone === cleanIdentifier || d.username?.toLowerCase() === cleanIdentifier.toLowerCase()) && d.password === password
      );

      setIsSubmitting(false);
      if (foundLocal) {
        if (foundLocal.isActive === false || foundLocal.is_active === false) {
          setError('Su cuenta está en revisión, por favor espere la aprobación del administrador');
          return;
        }
        const activeLocal = { ...foundLocal, isActive: true };
        localStorage.setItem('driverAuth', 'true');
        localStorage.setItem('currentDriver', JSON.stringify(activeLocal));
        await updateDriverActiveStatus(foundLocal.id || foundLocal.phone, true);

        setSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
        setTimeout(() => {
          navigate('/driver/dashboard');
        }, 1200);
      } else {
        setError('Credenciales o contraseña incorrectas');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedName = regName.trim();
    const trimmedPhone = regPhone.trim();
    const trimmedPlate = regPlateNumber.trim();
    const trimmedPassword = regPassword.trim();
    const trimmedVehicle = regVehicle.trim() || ('Motocicleta');

    if (!trimmedName || !trimmedPassword || !trimmedPhone || !trimmedPlate) {
      setError('Por favor, complete todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Check if phone already exists in Supabase
      const { data: existingData, error: checkError } = await supabase
        .from('drivers')
        .select('phone,username')
        .or(`phone.eq.${trimmedPhone},username.eq.drv_${trimmedPhone}`);

      if (checkError) {
        throw checkError;
      }

      if (existingData && existingData.length > 0) {
        setIsSubmitting(false);
        setError('Este teléfono o usuario ya está registrado.');
        return;
      }

      // 2. Generate driver profile
      const derivedUsername = 'drv_' + trimmedPhone;
      const driverId = 'DRV-' + Math.floor(100 + Math.random() * 900);

      const newDriver = {
        id: driverId,
        name: trimmedName,
        username: derivedUsername,
        phone: trimmedPhone,
        vehicle: trimmedVehicle,
        plate_number: trimmedPlate,
        password: trimmedPassword,
        is_active: false
      };

      // 3. Save to Supabase
      const { error: insertError } = await supabase
        .from('drivers')
        .insert([newDriver]);

      if (insertError) {
        throw insertError;
      }

      const mappedDriver = {
        id: newDriver.id,
        name: newDriver.name,
        username: newDriver.username,
        phone: newDriver.phone,
        vehicle: newDriver.vehicle,
        plateNumber: newDriver.plate_number,
        createdAt: new Date().toISOString(),
        isActive: false
      };

      // 4. Save to LocalStorage
      const localDrivers = JSON.parse(localStorage.getItem('fashion_drivers') || '[]');
      localStorage.setItem('fashion_drivers', JSON.stringify([...localDrivers, mappedDriver]));

      setIsSubmitting(false);
      setSuccess('¡Registro de cuenta de repartidor exitoso! Su cuenta está bajo revisión, por favor espere la aprobación del administrador.');
      
      setTimeout(() => {
        setActiveTab('login');
        setLoginIdentifier(trimmedPhone);
        setSuccess('');
      }, 5000);

    } catch (err: any) {
      console.warn('Supabase driver register error, trying localStorage fallback:', err.message);
      
      const localDrivers = JSON.parse(localStorage.getItem('fashion_drivers') || '[]');
      const phoneExists = localDrivers.some((d: any) => d.phone === trimmedPhone);

      if (phoneExists) {
        setIsSubmitting(false);
        setError('Este teléfono ya está registrado.');
        return;
      }

      const derivedUsername = 'drv_' + trimmedPhone;
      const driverId = 'DRV-' + Math.floor(100 + Math.random() * 900);

      const mappedDriver = {
        id: driverId,
        name: trimmedName,
        username: derivedUsername,
        phone: trimmedPhone,
        vehicle: trimmedVehicle,
        plateNumber: trimmedPlate,
        createdAt: new Date().toISOString(),
        password: trimmedPassword,
        isActive: false
      };

      localStorage.setItem('fashion_drivers', JSON.stringify([...localDrivers, mappedDriver]));

      setIsSubmitting(false);
      setSuccess('¡Registro de cuenta de repartidor exitoso! Su cuenta está bajo revisión, por favor espere la aprobación del administrador.');
      
      setTimeout(() => {
        setActiveTab('login');
        setLoginIdentifier(trimmedPhone);
        setSuccess('');
      }, 5000);
    }
  };

  return (
    <div className={`min-h-screen bg-neutral-100 flex items-center justify-center p-4 font-sans text-left [direction:ltr]`}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <button 
          onClick={() => navigate('/')} 
          className="mb-6 flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-full transition-all text-sm font-bold cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span>'Volver al Inicio'</span>
        </button>
        
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">
            'Portal del Repartidor'
          </h1>
          <p className="text-neutral-500 mt-2">
            {activeTab === 'login' 
              ? ('Inicie sesión para gestionar sus envíos y entregas') 
              : ('Cree una cuenta de repartidor para comenzar con nosotros')}
          </p>
        </div>

        {/* Tab Switching */}
        <div className="flex border-b border-neutral-100 p-1 bg-neutral-50 rounded-full mb-6">
          <button
            onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
            className={`flex-1 py-3 text-sm font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
          >
            <LogIn size={16} />
            <span>'Iniciar Sesión'</span>
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }}
            className={`flex-1 py-3 text-sm font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
          >
            <UserPlus size={16} />
            <span>'Registrarse'</span>
          </button>
        </div>

        {/* Feedback messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-lg mb-4 text-center`}
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-sm rounded-lg mb-4 text-center`}
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-neutral-700">
                'Teléfono o Usuario'
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className={`w-full p-3.5 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-left`}
                  placeholder="05xxxxxxxx"
                />
                <Phone className="absolute left-4 top-4 text-neutral-400" size={18} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-neutral-700">
                'Contraseña'
              </label>
              <div className="relative">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3.5 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-left font-mono"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-4 top-4 text-neutral-400" size={18} />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-75 shadow-md cursor-pointer"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>'Iniciar Sesión'</span>
                </>
              )}
            </button>

            <div className="mt-4 text-center text-xs text-neutral-500">
              <p>
                '¿No tiene cuenta de repartidor? '
                <span onClick={() => setActiveTab('register')} className="text-blue-600 hover:underline cursor-pointer font-bold">
                  'Regístrese ahora'
                </span>
              </p>
            </div>
            

          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-neutral-700">
                'Nombre Completo *'
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className={`w-full p-3 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-left`}
                  placeholder='Nombre completo'
                  required
                />
                <User size={16} className="absolute left-3.5 top-3 text-neutral-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-neutral-700">
                'Número de Teléfono *'
              </label>
              <div className="relative">
                <input 
                  type="tel" 
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className={`w-full p-3 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-mono text-left`}
                  placeholder="05xxxxxxxx"
                  required
                />
                <Phone size={16} className="absolute left-3.5 top-3 text-neutral-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-neutral-700">
                'Tipo de Vehículo'
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={regVehicle}
                  onChange={(e) => setRegVehicle(e.target.value)}
                  className={`w-full p-3 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-left`}
                  placeholder='Ej: Motocicleta / Auto'
                />
                <Truck size={16} className="absolute left-3.5 top-3 text-neutral-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-neutral-700">
                'Número de Matrícula *'
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  value={regPlateNumber}
                  onChange={(e) => setRegPlateNumber(e.target.value)}
                  className={`w-full p-3 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-left`}
                  placeholder='Ej: ABC 1234'
                  required
                />
                <span className={`absolute right-3.5 top-3 text-[10px] font-bold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded`}>
                  'Placa'
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-neutral-700">
                'Contraseña *'
              </label>
              <div className="relative">
                <input 
                  type="password" 
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full p-3 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-left font-mono"
                  placeholder="••••••••"
                  required
                />
                <Lock size={16} className="absolute left-3.5 top-3 text-neutral-400" />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-75 shadow-md cursor-pointer"
            >
              {isSubmitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>'Crear Cuenta'</span>
                </>
              )}
            </button>

            <div className="mt-4 text-center text-xs text-neutral-500">
              <p>
                '¿Ya tiene cuenta? '
                <span onClick={() => setActiveTab('login')} className="text-blue-600 hover:underline cursor-pointer font-bold">
                  'Iniciar Sesión'
                </span>
              </p>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
