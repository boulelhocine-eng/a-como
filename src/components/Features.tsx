import { Truck, Award, Percent, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Features() {
  const { lang } = useLanguage();

  const features = [
    { icon: Truck, title: 'Entrega Rápida', desc: 'Brindamos un servicio de entrega veloz en todo el territorio.' },
    { icon: Award, title: 'Alta Calidad', desc: 'Garantizamos the mejor confección y materiales en cada prenda.' },
    { icon: Percent, title: 'Mejores Ofertas', desc: 'Descubre los precios más competitivos y descuentos exclusivos.' },
    { icon: ShieldCheck, title: 'Pago Seguro', desc: 'Tus transacciones están protegidas con el mayor cifrado de seguridad.' },
  ];

  return (
    <section className="bg-white py-16 md:py-24 border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {features.map((f, i) => (
            <div key={i} className="flex flex-col items-center text-center space-y-4 p-6 rounded-3xl hover:bg-neutral-50 transition-colors duration-300">
              <div className="w-16 h-16 bg-primary-dark/10 text-primary rounded-2xl flex items-center justify-center shadow-sm mb-2">
                <f.icon size={32} />
              </div>
              <h3 className="text-xl font-bold text-neutral-900">{f.title}</h3>
              <p className="text-neutral-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
