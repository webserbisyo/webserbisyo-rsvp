import { redirect } from "next/navigation";

export default function LegacyDashboardGuestbookPage() {
  redirect("/dashboard/activity");
}
