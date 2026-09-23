import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Collections from "@/components/Collections";
import NewArrivals from "@/components/NewArrivals";
import CraftStory from "@/components/CraftStory";
import LookbookCTA from "@/components/LookbookCTA";
import Newsletter from "@/components/Newsletter";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Collections />
        <NewArrivals />
        <CraftStory />
        <LookbookCTA />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
