import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShopContent from "@/components/shop/ShopContent";

export const metadata = {
  title: "Shop | Heer Ranjha",
  description:
    "Shop hand-embroidered Indian ethnic and Indo-Western wear for men and women. Kurtas, Sherwanis, Lehengas, Co-ord Sets and more from Heer Ranjha.",
};

export default function ShopPage() {
  return (
    <>
      <Navbar />
      <main>
        <ShopContent />
      </main>
      <Footer />
    </>
  );
}
