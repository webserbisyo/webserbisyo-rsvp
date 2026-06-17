"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type PrivateLinkRegenerateDialogProps = {
  open: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
};

export function PrivateLinkRegenerateDialog({
  open,
  pending = false,
  onConfirm,
  onOpenChange,
}: PrivateLinkRegenerateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[30rem]">
        <DialogHeader className="gap-2 text-left">
          <DialogTitle>Regenerate private link?</DialogTitle>
          <DialogDescription>
            This will create a new private link for this event. Anyone with the old private link
            will no longer be able to access the website.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending}
            className="bg-[#c96f4c] text-white hover:bg-[#b96143]"
            onClick={onConfirm}
          >
            {pending ? "Regenerating..." : "Regenerate link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
