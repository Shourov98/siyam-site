import CoreModules from "./components/CoreModules";
import Footer from "./components/Footer";
import Features from "./components/Features";
import Hero from "./components/Hero";
import Navbar from "./components/Navbar";
import PricingSection from "./components/PricingSection";
import TestimonialSection from "./components/TestimonialSection";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <CoreModules />
      <TestimonialSection />
      <PricingSection />
      <Footer />
    </div>
  );
}
