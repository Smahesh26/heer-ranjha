import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AboutContent from "@/components/about/AboutContent";

export const metadata = {
  title: "About Us | Heer Ranjha",
  description:
    "The story of Heer Ranjha, a luxury Indian fashion boutique born from a love of craft, embroidery, and India's rich textile heritage. Boutiques in Delhi and Bareilly.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        <AboutContent />
      </main>
      <Footer />
    </>
  );
}
