import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImageFile } from "../lib/types";

interface Props {
  files: ImageFile[];
  onRemove: (index: number) => void;
}

export function ImageGrid({ files, onRemove }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {files.map((file, index) => (
        <div key={file.name} className="relative group">
          <img
            src={file.preview}
            alt={file.name}
            className="w-full h-48 object-cover rounded-lg"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onRemove(index)}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm truncate rounded-b-lg">
            {file.name}
          </div>
        </div>
      ))}
    </div>
  );
}
