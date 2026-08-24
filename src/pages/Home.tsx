import Header from '../components/Header';
import Hero from '../components/Hero';
import PromoCards from '../components/PromoCards';
import FeaturedProducts from '../components/FeaturedProducts';
import SpecialEditionBanner from '../components/SpecialEditionBanner';
import Features from '../components/Features';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <PromoCards />
      <FeaturedProducts />
      <SpecialEditionBanner />
      <Features />
      <Footer />
    </div>
  );
}
