type ManageRsvpPageProps = {
  params: Promise<{ slug: string; token: string }>;
};

export default async function ManageRsvpPage({ params }: ManageRsvpPageProps) {
  const { slug, token } = await params;

  return (
    <main className="p-6">
      RSVP manage placeholder for {slug} / {token}.
    </main>
  );
}
