import Image from "next/image";
import { cn } from "@/lib/utils";

type MessengerLogoProps = {
  className?: string;
};

export function MessengerLogo({ className }: MessengerLogoProps) {
  return (
    <Image
      src="/images/brand/messenger.svg"
      alt="Messenger"
      width={18}
      height={18}
      className={cn("h-[18px] w-[18px]", className)}
    />
  );
}
