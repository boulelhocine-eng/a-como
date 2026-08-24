import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary-dark text-white/85 pt-12 md:pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 mb-12 md:mb-16">
          <div className="space-y-6">
            <Link to="/">
              <img 
                src="https://f000.backblazeb2.com/file/jpgshared/WIIoT0Jw" 
                alt="Logo" 
                className="h-20 md:h-28 w-auto object-contain max-h-[120px]" 
                referrerPolicy="no-referrer"
              />
            </Link>
            <p className="text-white/70 leading-relaxed">
              Las últimas tendencias en moda y prendas contemporáneas a tu alcance. Descubre nuestra nueva colección hoy.
            </p>
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-white/70">
                <Phone size={18} className="text-accent" />
                <span className="text-sm" dir="ltr">+573508643913</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <Mail size={18} className="text-accent" />
                <span className="text-sm">elhocineboul@gmail.com</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-bold text-lg mb-6">
              Categorías
            </h4>
            <ul className="space-y-3">
              {[
                { es: 'Hombres' },
                { es: 'Mujeres' },
                { es: 'Niños' }
              ].map((item) => (
                <li key={item.es}>
                  <Link to="/products" className="text-white/70 hover:text-accent transition-colors text-sm flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {item.es}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-bold text-lg mb-6">
              Servicio al Cliente
            </h4>
            <ul className="space-y-3">
              {[
                { es: 'Centro de Ayuda' },
                { es: 'Devoluciones y Cambios' },
                { es: 'Guía de Tallas' },
                { es: 'Términos y Condiciones' }
              ].map((item) => (
                <li key={item.es}>
                  <a href="#" className="text-white/70 hover:text-accent transition-colors text-sm flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {item.es}
                  </a>
                </li>
              ))}
              <li>
                <Link to="/track-order" className="text-white/70 hover:text-accent transition-colors text-sm flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  {t('trackOrder')}
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="space-y-6">
            <h4 className="text-white font-bold text-lg">
              Suscríbete al Boletín
            </h4>
            <p className="text-sm text-white/70">
              Recibe las últimas noticias y ofertas exclusivas directamente en tu correo electrónico.
            </p>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Tu correo electrónico..." 
                  className="w-full p-3 pl-12 pr-4 bg-white/10 border border-white/15 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent placeholder:text-white/40 transition-all text-sm" 
                />
                <button className="absolute right-2 top-2 bottom-2 bg-primary text-white px-4 font-bold rounded-lg hover:bg-primary-dark transition-colors">
                  →
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <p className="text-xs md:text-sm text-white/50">
              Copyright © {new Date().getFullYear()} Como. Todos los derechos reservados.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-6 justify-center md:justify-start">
              <Link to="/admin/login" className="text-[10px] text-white/20 hover:text-accent transition-colors">
                Admin
              </Link>
              <Link to="/driver/login" className="text-[10px] text-white/20 hover:text-accent transition-colors">
                Driver
              </Link>
            </div>
          </div>
          <div className="flex gap-3">
            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-primary hover:text-white transition-all duration-300">
              <Facebook size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-highlight hover:text-primary-dark transition-all duration-300">
              <Twitter size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-accent hover:text-white transition-all duration-300">
              <Instagram size={18} />
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-primary-dark hover:text-white transition-all duration-300">
              <Linkedin size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
