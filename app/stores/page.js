import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StoresContent from "@/components/stores/StoresContent";

export const metadata = {
  title: "Our Stores | Heer Ranjha",
  description:
    "Visit Heer Ranjha boutiques in New Delhi and Bareilly. Experience our hand-embroidered collections in person at our luxury stores.",
};

export default function StoresPage() {
  return (
    <>
      <Navbar />
      <main>
        <StoresContent />
      </main>
      <Footer />
    </>
  );
}
