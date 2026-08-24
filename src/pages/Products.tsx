import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductGrid from '../components/ProductGrid';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Shirt, Smartphone, Sparkles, Layers } from 'lucide-react';

export default function Products() {
  const { lang, t } = useLanguage();
  const [activeDepartment, setActiveDepartment] = useState<'all' | 'Ropa' | 'Electrónica'>('all');
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);

  const clothingCategories = [
    { key: 'all', label: 'Toda la Ropa' },
    { key: 'Mujeres', label: 'Mujeres' },
    { key: 'Hombres', label: 'Hombres' },
    { key: 'Niños', label: 'Niños' },
  ];

  const electronicsCategories = [
    { key: 'all', label: 'Toda la Electrónica & Hardware' },
    { key: 'Chasis de PC', label: 'Chasis de PC' },
    { key: 'Tarjeta madre', label: 'Tarjeta Madre' },
    { key: 'RAM', label: 'RAM' },
    { key: 'Fuente de poder', label: 'Fuente de Poder' },
    { key: 'Procesador', label: 'Procesador (CPU)' },
    { key: 'Tarjeta gráfica', label: 'Tarjeta Gráfica (GPU)' },
    { key: 'Disco duro', label: 'Disco Duro & SSD' },
    { key: 'Accesorios', label: 'Accesorios' },
    { key: 'Electrónica', label: 'Gadgets & Móviles' },
  ];

  const allCategories = [
    { key: 'all', label: 'Todo el Catálogo' },
    { key: 'Chasis de PC', label: 'Chasis de PC' },
    { key: 'Tarjeta madre', label: 'Tarjeta Madre' },
    { key: 'RAM', label: 'RAM' },
    { key: 'Fuente de poder', label: 'Fuente de Poder' },
    { key: 'Procesador', label: 'Procesador' },
    { key: 'Tarjeta gráfica', label: 'Tarjeta Gráfica' },
    { key: 'Disco duro', label: 'Disco Duro' },
    { key: 'Accesorios', label: 'Accesorios' },
    { key: 'Electrónica', label: 'Electrónica General' },
    { key: 'Mujeres', label: 'Mujeres' },
    { key: 'Hombres', label: 'Hombres' },
    { key: 'Niños', label: 'Niños' },
  ];

  const currentCategoryList = activeDepartment === 'Ropa'
    ? clothingCategories
    : (activeDepartment === 'Electrónica' ? electronicsCategories : allCategories);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Header />
      <main className="flex-grow w-full">
        {/* Banner Section */}
        <div className="bg-neutral-900 text-white py-10 md:py-12 relative overflow-hidden mb-8">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-primary/20 blur-3xl rounded-full"></div>
            <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-accent/20 blur-3xl rounded-full"></div>
          </div>
          <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
              Nuestra Colección
            </h1>
            <p className="text-base md:text-lg text-neutral-300 max-w-2xl mx-auto mb-6">
              Explora nuestra cuidada selección de moda, calzado y la última tecnología electrónica.
            </p>

            {/* Macro Department Switcher (Ropa vs Electrónica) */}
            <div className="inline-flex p-1.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 gap-1.5 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveDepartment('all');
                  setActiveCategory(undefined);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer ${
                  activeDepartment === 'all'
                    ? 'bg-white text-neutral-900 shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Layers size={16} />
                <span>Todos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveDepartment('Ropa');
                  setActiveCategory(undefined);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer ${
                  activeDepartment === 'Ropa'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Shirt size={16} />
                <span>Ropa y Moda</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveDepartment('Electrónica');
                  setActiveCategory(undefined);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-black transition-all cursor-pointer ${
                  activeDepartment === 'Electrónica'
                    ? 'bg-primary text-white shadow-md'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Smartphone size={16} />
                <span>Electrónica</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 flex flex-col lg:flex-row gap-8">
          {/* Sidebar / Mobile Filters */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-neutral-100 sticky top-20 md:top-24 z-30 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base md:text-lg text-neutral-900 shrink-0 flex items-center gap-2">
                  <Sparkles size={18} className="text-primary" />
                  <span>Categorías</span>
                </h3>
                {activeDepartment !== 'all' && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                    {activeDepartment}
                  </span>
                )}
              </div>

              <div className="flex lg:flex-col gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
                {currentCategoryList.map((cat) => {
                  const isSelected = (cat.key === 'all' && !activeCategory) || cat.key === activeCategory;
                  return (
                    <button 
                      key={cat.key}
                      onClick={() => setActiveCategory(cat.key === 'all' ? undefined : cat.key)}
                      className={`whitespace-nowrap px-4 py-2.5 rounded-xl transition-all text-xs md:text-sm font-bold flex items-center justify-center min-w-fit lg:w-full lg:justify-start cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-white shadow-sm shadow-primary/20'
                          : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <ProductGrid category={activeCategory} department={activeDepartment} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

