import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function SpecialEditionBanner() {
  const { lang } = useLanguage();

  return (
    <section className="py-16 md:py-24 max-w-7xl mx-auto px-6">
      <div className="relative rounded-3xl overflow-hidden flex items-center justify-center md:justify-start p-8 md:p-16 lg:p-24 text-white shadow-2xl min-h-[500px]">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1920&auto=format&fit=crop"
          alt="Special Edition"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/95 via-neutral-900/80 to-transparent"></div>
        <div className={`relative z-10 w-full md:w-2/3 lg:w-1/2 space-y-6 text-center md:text-left`}>
          <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold uppercase tracking-wider rounded-full inline-block mb-2">
            'Colección Exclusiva'
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            {(
              <>
                Edición <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-highlight">Especial</span>
              </>
            )}
          </h2>
          <p className="text-lg md:text-xl text-neutral-300 leading-relaxed max-w-lg mx-auto md:mx-0">
            'Descubre nuestra colección exclusiva y de lujo, diseñada minuciosamente para quienes aprecian el buen gusto. Materiales premium y detalles singulares.'
          </p>
          <div className="pt-4">
            <Link to="/products" className="inline-block px-8 py-4 bg-white text-neutral-900 font-bold rounded-full hover:bg-neutral-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              'Explorar Colección'
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
