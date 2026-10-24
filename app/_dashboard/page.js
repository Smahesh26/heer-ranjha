import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard | Heer Ranjha",
};

export default function DashboardPage() {
  redirect("/my-account");
}
