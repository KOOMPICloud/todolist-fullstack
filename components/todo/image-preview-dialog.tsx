'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface ImagePreviewDialogProps {
  src: string | null;
  onClose: () => void;
}

export function ImagePreviewDialog({ src, onClose }: ImagePreviewDialogProps) {
  return (
    <Dialog open={!!src} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-2">
        <DialogTitle className="sr-only">Image preview</DialogTitle>
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Preview"
            className="max-h-[80vh] w-full rounded-md object-contain"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
