import Header from '../components/Header';
import Footer from '../components/Footer';
import { Users, Target, Shield, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function About() {
  const { lang, t } = useLanguage();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-24 bg-neutral-900 text-white overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/20 blur-3xl rounded-full"></div>
            <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-accent/20 blur-3xl rounded-full"></div>
          </div>
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto">
              <h1 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">
                {t('aboutTitle')}
              </h1>
              <p className="text-xl text-neutral-300 leading-relaxed">
                'Creemos que la elegancia y la moda deben estar al alcance de todos. No vendemos solo ropa, ofrecemos diseños que expresan tu personalidad y te dan confianza en cada paso.'
              </p>
            </div>
          </div>
        </section>

        {/* Image & Story Section */}
        <section className="py-16 md:py-24 max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3]">
              <img 
                src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1000&auto=format&fit=crop" 
                alt='Nuestra tienda' 
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900">
                '¿Quiénes Somos?'
              </h2>
              <p className="text-lg text-neutral-600 leading-relaxed">
                {t('aboutPara1')}
              </p>
              <p className="text-lg text-neutral-600 leading-relaxed">
                {t('aboutPara2')}
              </p>
              <div className="pt-4 flex gap-8">
                <div>
                  <p className="text-4xl font-extrabold text-primary mb-1">10k+</p>
                  <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
                    'Clientes Felices'
                  </p>
                </div>
                <div>
                  <p className="text-4xl font-extrabold text-primary mb-1">50+</p>
                  <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
                    'Marcas Asociadas'
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
                'Nuestros Valores'
              </h2>
              <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                'Los principios que guían nuestras decisiones y nos ayudan a ofrecerte el mejor servicio.'
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { 
                  icon: Users, 
                  title: 'Enfoque al Cliente', 
                  desc: 'Su satisfacción es nuestra máxima prioridad en todo lo que hacemos.' 
                },
                { 
                  icon: Target, 
                  title: 'Calidad Excepcional', 
                  desc: 'Seleccionamos cada prenda con extremo cuidado para ofrecer solo lo mejor.' 
                },
                { 
                  icon: Shield, 
                  title: 'Confianza y Seguridad', 
                  desc: 'Garantizamos una experiencia de compra segura y altamente confiable.' 
                },
                { 
                  icon: Zap, 
                  title: 'Innovación Constante', 
                  desc: 'Mantenernos al día con las últimas tendencias de la moda mundial.' 
                },
              ].map((value, idx) => (
                <div key={idx} className="bg-neutral-50 p-8 rounded-2xl border border-neutral-100 hover:shadow-lg transition-shadow duration-300">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm mb-6 text-primary">
                    <value.icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">{value.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
