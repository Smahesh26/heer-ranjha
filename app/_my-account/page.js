import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MyAccountContent from "@/components/my-account/MyAccountContent";

export const metadata = {
  title: "My Account | Heer Ranjha",
  description: "Sign in to your Heer Ranjha account to manage orders, addresses and account details.",
};

export default function MyAccountPage() {
  return (
    <>
      <Navbar />
      <main>
        <MyAccountContent />
      </main>
      <Footer />
    </>
  );
}
