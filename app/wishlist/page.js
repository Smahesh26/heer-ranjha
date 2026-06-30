import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WishlistContent from "@/components/wishlist/WishlistContent";

export const metadata = {
  title: "Wishlist | Heer Ranjha",
  description: "Your saved pieces from Heer Ranjha.",
};

export default function WishlistPage() {
  return (
    <>
      <Navbar />
      <main>
        <WishlistContent />
      </main>
      <Footer />
    </>
  );
}
