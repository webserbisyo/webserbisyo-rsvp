import type { Metadata } from "next";
import { redirect } from "next/navigation";

type AdminApplicationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
  title: "Application detail",
};

export default async function AdminApplicationDetailPage({
  params,
}: AdminApplicationDetailPageProps) {
  const { id } = await params;

  redirect(`/admin/applications?applicationId=${id}`);
}
