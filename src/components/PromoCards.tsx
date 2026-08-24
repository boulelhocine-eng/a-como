import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function PromoCards() {
  const { lang } = useLanguage();

  const cards = [
    { title: '30% Desc en Vestidos', desc: 'Renueva tu look con colores vibrantes y diseños deslumbrantes.', btn: 'Comprar Ahora', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800&auto=format&fit=crop' },
    { title: 'Tecnología y Gadgets 5G', desc: 'Smartphones, smartwatches y auriculares con la mejor tecnología de última generación.', btn: 'Ver Electrónica', image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=800&auto=format&fit=crop' },
    { title: 'Moda Masculina Elegante', desc: 'Descubre nuestra nueva colección para oficina y eventos especiales.', btn: 'Descubrir', image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=80&w=800&auto=format&fit=crop' },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-12 md:py-24">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
        {cards.map((card, i) => (
          <div key={i} className="group relative h-72 sm:h-80 md:h-96 flex flex-col justify-end p-6 md:p-8 text-white rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300">
            <img
              src={card.image}
              alt={card.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
            <div className="relative z-10 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{card.title}</h2>
              <p className="text-neutral-300 mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">{card.desc}</p>
              <Link to="/products" className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-accent hover:text-highlight transition-colors">
                {card.btn} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
