import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { adminMoreNavItems } from "./nav-items";
import { SignOutButton } from "./sign-out-button";

export function AdminMoreMenu() {
  return (
    <div className="divide-border bg-card overflow-hidden rounded-lg border">
      {adminMoreNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="hover:bg-muted/60 flex items-center gap-3 px-4 py-3 text-sm transition-colors"
        >
          <item.icon className="text-muted-foreground size-4" />
          <span className="flex-1 font-medium">{item.title}</span>
          <ArrowRight className="text-muted-foreground size-4" />
        </Link>
      ))}
      <div className="border-t p-2">
        <SignOutButton className="w-full" />
      </div>
    </div>
  );
}
