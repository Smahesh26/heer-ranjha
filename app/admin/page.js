import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin Dashboard | Heer Ranjha",
};

export default function AdminPage() {
  redirect("/admin/login");
}
