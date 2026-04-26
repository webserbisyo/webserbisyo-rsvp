type AdminLayoutProps = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <div className="bg-muted/30 min-h-screen">{children}</div>;
}
