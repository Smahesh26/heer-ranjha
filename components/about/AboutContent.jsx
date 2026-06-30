import AboutHero from "./AboutHero";
import BrandIntro from "./BrandIntro";
import StorySection from "./StorySection";
import MissionQuote from "./MissionQuote";
import AtelierTeam from "./AtelierTeam";
import ValuesGrid from "./ValuesGrid";
import Testimonials from "./Testimonials";
import GalleryStrip from "./GalleryStrip";
import AboutCTA from "./AboutCTA";

export default function AboutContent() {
  return (
    <>
      <AboutHero />
      <BrandIntro />
      <MissionQuote />
      <StorySection />
      <AtelierTeam />
      <ValuesGrid />
      <Testimonials />
      <GalleryStrip />
      <AboutCTA />
    </>
  );
}
