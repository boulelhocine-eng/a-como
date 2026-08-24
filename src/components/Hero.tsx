import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Hero() {
  const { lang, t } = useLanguage();

  return (
    <section className="relative min-h-[100vh] md:min-h-0 md:h-[700px] text-white overflow-hidden flex items-center">
      <img
        src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1920&auto=format&fit=crop"
        alt="Hero"
        className="absolute inset-0 w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
      <div className={`absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-black/90 via-black/60 to-transparent`}></div>
      <div className="relative z-10 w-full h-auto md:h-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 pt-20 md:pt-0">
        
        {/* Text Content */}
        <div className={`flex flex-col items-start text-left justify-center space-y-5 md:space-y-6 lg:space-y-8 w-full py-10`}>
          <span className={`px-4 py-2 bg-primary text-white text-xs md:text-sm font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-primary/20 self-start`}>
            'Colección Verano 2026'
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[1.1] font-black tracking-tight">
            {(
              <>
                Moda Femenina que <br className="hidden md:block" />
                <span className="text-accent">define</span> tu esencia
              </>
            )}
          </h1>
          <p className={`text-base sm:text-lg md:text-xl lg:text-2xl text-neutral-300 max-w-xl leading-relaxed mr-auto`}>
            'Descubre las últimas tendencias con descuentos de hasta el 40% en toda nuestra nueva colección.'
          </p>
          <div className={`flex flex-row sm:flex-row gap-3 sm:gap-4 pt-4 w-full sm:w-auto justify-start items-start`}>
            <Link to="/products" className="flex-1 sm:flex-none px-4 sm:px-10 py-4 md:py-5 bg-primary text-white font-black rounded-full hover:bg-primary-dark transition-all flex items-center justify-center gap-2 sm:gap-3 hover:gap-5 shadow-xl hover:shadow-2xl shadow-primary/30 text-sm sm:text-lg group active:scale-95">
              <span className="truncate">{t('shopNow')}</span>
              <span className="group-hover:translate-x-1 transition-transform">
                <ArrowRight size={20} />
              </span>
            </Link>
            <Link to="/about" className="flex-1 sm:flex-none px-4 sm:px-10 py-4 md:py-5 bg-white/10 backdrop-blur-xl border border-white/20 text-white font-black rounded-full hover:bg-white/20 transition-all flex items-center justify-center text-sm sm:text-lg shadow-xl active:scale-95">
              <span className="truncate">{t('discoverMore')}</span>
            </Link>
          </div>
        </div>

        {/* Empty col for layout alignment with the background image */}
        <div className="hidden md:block"></div>

      </div>
    </section>
  );
}
