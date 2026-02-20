import AboutUsCarousel from "../components/AboutUsCarousel";
import AboutUsPerksSection from "../components/AboutUsPerksSection";
import AboutUsPropertiesSection from "../components/AboutUsPropertiesSection";
import AboutUsTopHeading from "../components/AboutUsTopHeading";
import AboutUsJourneySection from "../components/AboutUsJourneySection";

export default function AboutUsPage() {
  return (
    <main className="overflow-x-hidden bg-[#f3f4f6]">
      <AboutUsTopHeading />
      <AboutUsCarousel />
      <AboutUsPropertiesSection />
      <AboutUsPerksSection />
      <AboutUsJourneySection />
    </main>
  );
}
