import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, LogIn, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminLogin() {
  const { lang } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const isAuth = localStorage.getItem('adminAuth');
    if (isAuth === 'true') {
      navigate('/admin/dashboard');
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Mock authentication
    if (username === 'boulelhocine@gmail.com' && password === 'wizardgoo@10200') {
      localStorage.setItem('adminAuth', 'true');
      navigate('/admin/dashboard');
    } else {
      setError('Correo electrónico o contraseña incorrectos');
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
            'Volver al Inicio'
        </button>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-dark/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">
            'Acceso de Administración'
          </h1>
          <p className="text-neutral-500 mt-2">
            'Inicie sesión para acceder al panel de control'
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-bold text-neutral-700">
              'Correo electrónico'
            </label>
            <div className="relative">
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full p-3.5 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none text-left`}
                placeholder="admin@example.com"
              />
              <User size={18} className="absolute left-4 top-4 text-neutral-400" />
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
                className={`w-full p-3.5 pl-10 pr-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none font-mono text-left`}
                placeholder="••••••••"
              />
              <Lock size={18} className="absolute left-4 top-4 text-neutral-400" />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-500 text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full py-3.5 bg-primary text-white font-bold rounded-full hover:bg-primary-dark transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            <LogIn size={20} />
            <span>'Iniciar Sesión'</span>
          </button>
        </form>
        
      </motion.div>
    </div>
  );
}
