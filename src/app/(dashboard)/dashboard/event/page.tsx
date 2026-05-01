import { redirect } from "next/navigation";

export default function LegacyDashboardEventPage() {
  redirect("/dashboard/event-details");
}
