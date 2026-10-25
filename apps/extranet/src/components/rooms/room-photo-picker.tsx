"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { MAX_ROOM_IMAGES, ROOM_IMAGE_SELECTION_LIMIT_MESSAGE } from "@revoar/shared";
import { roomImageError } from "@/lib/room-image";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";

type RoomPhotoPickerProps = {
  files: File[];
  onChange: (files: File[]) => void;
};

function FilePreview({ file }: { file: File }) {
  const [url] = useState(() => URL.createObjectURL(file));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={file.name} className="aspect-square w-full object-cover" />
  );
}

export function RoomPhotoPicker({ files, onChange }: RoomPhotoPickerProps) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const incoming = Array.from(list);
    const invalid = incoming.map(roomImageError).find(Boolean);
    if (invalid) {
      toast.error("Foto não enviada", invalid);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (files.length + incoming.length > MAX_ROOM_IMAGES) {
      toast.error(ROOM_IMAGE_SELECTION_LIMIT_MESSAGE);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    onChange([...files, ...incoming]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <p className="text-sm font-medium">Fotos do quarto</p>
      <p className="mt-1 text-xs text-muted-foreground">
        JPG, PNG ou WebP · até 5 MB · no máximo {MAX_ROOM_IMAGES} fotos. A primeira vira a capa.
      </p>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => addFiles(event.target.files)}
      />
      <Button type="button" variant="outline" className="mt-3" onClick={() => inputRef.current?.click()}>
        <Upload className="mr-2 h-4 w-4" />
        Escolher fotos
      </Button>
      {files.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className="relative overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <FilePreview file={file} />
              {index === 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  Capa
                </span>
              )}
              <button
                type="button"
                className="absolute right-1 top-1 rounded-full bg-surface p-1 text-foreground shadow-soft"
                aria-label={`Remover ${file.name}`}
                onClick={() => onChange(files.filter((_, item) => item !== index))}
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
