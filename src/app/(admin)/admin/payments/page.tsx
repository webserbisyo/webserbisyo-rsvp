import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Payments",
};

export default function AdminPaymentsPage() {
  redirect("/admin/sales");
}
