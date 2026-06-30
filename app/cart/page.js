import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartContent from "@/components/cart/CartContent";

export const metadata = {
  title: "Cart | Heer Ranjha",
  description: "Review your selected pieces and proceed to checkout.",
};

export default function CartPage() {
  return (
    <>
      <Navbar />
      <main>
        <CartContent />
      </main>
      <Footer />
    </>
  );
}
