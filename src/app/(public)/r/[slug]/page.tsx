type PublicRsvpPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PublicRsvpPage({ params }: PublicRsvpPageProps) {
  const { slug } = await params;

  return <main className="p-6">Public RSVP placeholder for {slug}.</main>;
}
