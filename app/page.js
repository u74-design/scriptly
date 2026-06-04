import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import HeroSection from "../components/sections/HeroSection";
import FeaturesSection from "../components/sections/FeaturesSection";


export default function Home() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <Navbar />
      <HeroSection />  {/* Hero + Demo merged together */}
      <FeaturesSection />
      <Footer />
    </main>
  );
}