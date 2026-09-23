import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CheckoutContent from "@/components/checkout/CheckoutContent";

export const metadata = {
  title: "Checkout | Heer Ranjha",
  description: "Secure checkout for your selected Heer Ranjha pieces.",
};

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <main>
        <CheckoutContent />
      </main>
      <Footer />
    </>
  );
}
