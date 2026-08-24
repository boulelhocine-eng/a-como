import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, User, Phone, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { sanitizeInput, validateEmail, validatePhone, checkRateLimit } from '../lib/security';

export default function Login() {
  const { login, register, currentUser } = useAuth();
  const { lang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState(''); // Simulated password
  
  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (currentUser) {
      const from = (location.state as any)?.from?.pathname || '/profile';
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, location]);

  // Set initial warning message if passed in navigation state
  React.useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message);
    }
  }, [location.state]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 1. Rate Limiting Check (OWASP)
    const rateCheck = checkRateLimit('auth_login', 5, 60000); // Max 5 login attempts per minute
    if (!rateCheck.allowed) {
      setError('Límite de intentos de inicio de sesión excedido. Por favor espere un minuto.');
      return;
    }

    const trimmedEmail = loginEmail.trim();
    if (!trimmedEmail) {
      setError('Por favor ingrese su correo electrónico');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Correo electrónico no válido');
      return;
    }

    // 2. Input Sanitization (OWASP)
    const sanitizedEmail = sanitizeInput(trimmedEmail);
    const sanitizedPassword = sanitizeInput(loginPassword);

    setIsSubmitting(true);

    // Simulate network latency
    setTimeout(async () => {
      try {
        const success = await login(sanitizedEmail, sanitizedPassword);
        setIsSubmitting(false);
        if (success) {
          setSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
          setTimeout(() => {
            const from = (location.state as any)?.from?.pathname || '/profile';
            navigate(from, { replace: true });
          }, 1200);
        } else {
          setError('El correo no está registrado, por favor cree una cuenta.');
        }
      } catch (err: any) {
        setIsSubmitting(false);
        setError(err.message || ('Error al iniciar sesión. Verifique sus credenciales.'));
      }
    }, 1000);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 1. Rate Limiting Check (OWASP)
    const rateCheck = checkRateLimit('auth_register', 3, 60000); // Max 3 register attempts per minute
    if (!rateCheck.allowed) {
      setError('Límite de intentos de registro excedido. Por favor espere un minuto.');
      return;
    }

    const trimmedName = regName.trim();
    const trimmedEmail = regEmail.trim();
    const trimmedPhone = regPhone.trim();
    const trimmedAddress = regAddress.trim();
    const trimmedPassword = regPassword.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setError('Por favor complete los campos obligatorios (Nombre, Correo y Contraseña)');
      return;
    }

    if (trimmedName.length < 3 || trimmedName.length > 100) {
      setError('El nombre debe tener entre 3 y 100 caracteres');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Correo electrónico no válido');
      return;
    }

    if (trimmedPhone && !validatePhone(trimmedPhone)) {
      setError('Número de teléfono no válido');
      return;
    }

    if (trimmedPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    // 2. Input Sanitization (OWASP)
    const sanitizedName = sanitizeInput(trimmedName);
    const sanitizedEmail = sanitizeInput(trimmedEmail);
    const sanitizedPhone = sanitizeInput(trimmedPhone);
    const sanitizedAddress = sanitizeInput(trimmedAddress);
    const sanitizedPassword = sanitizeInput(trimmedPassword);

    setIsSubmitting(true);

    // Simulate network latency
    setTimeout(async () => {
      try {
        const success = await register(sanitizedName, sanitizedEmail, sanitizedPhone, sanitizedAddress, sanitizedPassword);
        setIsSubmitting(false);
        if (success) {
          setSuccess('¡Cuenta creada con éxito! Redirigiendo...');
          setTimeout(() => {
            const from = (location.state as any)?.from?.pathname || '/profile';
            navigate(from, { replace: true });
          }, 1200);
        } else {
          setError('El correo ya está registrado, por favor inicie sesión.');
        }
      } catch (err: any) {
        setIsSubmitting(false);
        setError(err.message || ('Ocurrió un error durante el registro.'));
      }
    }, 1000);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans text-left [direction:ltr] bg-neutral-50`}>
      <Header />

      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-sm border border-neutral-100">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
              {activeTab === 'login' 
                ? ('¡Bienvenido de nuevo!') 
                : ('Únete a nosotros hoy')}
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              {activeTab === 'login' 
                ? ('Inicia sesión para acceder a tu cuenta y realizar un seguimiento de tus pedidos') 
                : ('Crea una nueva cuenta para disfrutar de una experiencia de compra personalizada')}
            </p>
          </div>

          {/* Custom Navigation Tabs */}
          <div className="flex border-b border-neutral-100 p-1 bg-neutral-50 rounded-full">
            <button
              onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 text-sm font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'login' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
            >
              <LogIn size={16} />
              <span>'Iniciar Sesión'</span>
            </button>
            <button
              onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }}
              className={`flex-1 py-3 text-sm font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'register' ? 'bg-white text-primary shadow-sm' : 'text-neutral-500 hover:text-neutral-800'}`}
            >
              <UserPlus size={16} />
              <span>'Registrarse'</span>
            </button>
          </div>

          {/* Form Feedback Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-lg`}
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-sm rounded-lg`}
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          {activeTab === 'login' ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="relative">
                  <label htmlFor="email" className="block text-xs font-bold text-neutral-700 mb-1">
                    'Correo electrónico *'
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={`w-full p-3.5 pl-11 text-left bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none`}
                    />
                    <Mail className={`absolute left-4 top-3.5 text-neutral-400`} size={18} />
                  </div>
                </div>

                <div className="relative">
                  <label htmlFor="pass" className="block text-xs font-bold text-neutral-700 mb-1">
                    'Contraseña (opcional para demo)'
                  </label>
                  <div className="relative">
                    <input
                      id="pass"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full p-3.5 pl-11 text-left bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-mono`}
                    />
                    <Lock className={`absolute left-4 top-3.5 text-neutral-400`} size={18} />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-primary text-white font-bold rounded-full hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-75 shadow-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <LogIn size={20} />
                    <span>'Ingresar'</span>
                  </>
                )}
              </button>

              <div className="mt-4 text-center text-xs text-neutral-500">
                <span>'¿No tienes cuenta? '</span>
                <button
                  type="button"
                  onClick={() => { setActiveTab('register'); setError(''); setSuccess(''); }}
                  className="text-primary hover:underline font-bold cursor-pointer inline-block bg-transparent border-none p-0"
                >
                  'Crea una cuenta ahora'
                </button>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-3.5">
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-bold text-neutral-700 mb-1">
                    'Nombre completo *'
                  </label>
                  <div className="relative">
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder='Nombre y apellidos'
                      className={`w-full p-3 pl-11 text-left bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none`}
                    />
                    <User className={`absolute left-4 top-3.5 text-neutral-400`} size={18} />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-xs font-bold text-neutral-700 mb-1">
                    'Correo electrónico *'
                  </label>
                  <div className="relative">
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={`w-full p-3 pl-11 text-left bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none`}
                    />
                    <Mail className={`absolute left-4 top-3.5 text-neutral-400`} size={18} />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-password" className="block text-xs font-bold text-neutral-700 mb-1">
                    'Contraseña *'
                  </label>
                  <div className="relative">
                    <input
                      id="reg-password"
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full p-3 pl-11 text-left bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-mono`}
                    />
                    <Lock className={`absolute left-4 top-3.5 text-neutral-400`} size={18} />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-phone" className="block text-xs font-bold text-neutral-700 mb-1">
                    'Teléfono'
                  </label>
                  <div className="relative">
                    <input
                      id="reg-phone"
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="05xxxxxxxx"
                      className={`w-full p-3 pl-11 text-left bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-mono`}
                    />
                    <Phone className={`absolute left-4 top-3.5 text-neutral-400`} size={18} />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-address" className="block text-xs font-bold text-neutral-700 mb-1">
                    'Dirección de envío'
                  </label>
                  <div className="relative">
                    <input
                      id="reg-address"
                      type="text"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder='Ciudad, calle y número'
                      className={`w-full p-3 pl-11 text-left bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none`}
                    />
                    <MapPin className={`absolute left-4 top-3.5 text-neutral-400`} size={18} />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-primary text-white font-bold rounded-full hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-75 shadow-sm mt-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <UserPlus size={20} />
                    <span>'Crear Cuenta'</span>
                  </>
                )}
              </button>

              <div className="mt-4 text-center text-xs text-neutral-500">
                <span>'¿Ya tienes una cuenta? '</span>
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
                  className="text-primary hover:underline font-bold cursor-pointer inline-block bg-transparent border-none p-0"
                >
                  'Iniciar Sesión'
                </button>
              </div>
            </form>
          )}

          {/* Quick Sandbox Login Disclaimer/Info */}
          <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center gap-2 text-neutral-400 text-xs justify-center">
            <ShieldCheck size={14} className="text-neutral-400" />
            <span>
              'Entorno de pruebas seguro - Sin verificación de correo'
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
