import { redirect } from "next/navigation";

export default function LegacyDashboardResponsesPage() {
  redirect("/dashboard/rsvp-responses");
}
