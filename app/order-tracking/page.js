import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OrderTrackingContent from "@/components/order-tracking/OrderTrackingContent";

export const metadata = {
  title: "Order Tracking | Heer Ranjha",
  description: "Track your Heer Ranjha order by entering your Order ID and billing email.",
};

export default function OrderTrackingPage() {
  return (
    <>
      <Navbar />
      <main>
        <OrderTrackingContent />
      </main>
      <Footer />
    </>
  );
}
