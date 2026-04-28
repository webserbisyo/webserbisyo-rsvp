"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    function syncNetworkState() {
      setIsOffline(!navigator.onLine);
    }

    syncNetworkState();
    window.addEventListener("online", syncNetworkState);
    window.addEventListener("offline", syncNetworkState);

    return () => {
      window.removeEventListener("online", syncNetworkState);
      window.removeEventListener("offline", syncNetworkState);
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <div className="bg-rsvp-warning/18 text-rsvp-accent-foreground flex items-center gap-2 border-b px-4 py-2 text-sm">
      <WifiOff className="size-4" />
      <span>Offline. Admin data and actions are unavailable until your connection returns.</span>
    </div>
  );
}
