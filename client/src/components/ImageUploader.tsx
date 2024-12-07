import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import type { ImageFile } from "../lib/types";

interface Props {
  onFilesAdded: (files: ImageFile[]) => void;
}

export function ImageUploader({ onFilesAdded }: Props) {
  const { toast } = useToast();

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;

    const validFiles: ImageFile[] = [];
    const invalidFiles: string[] = [];

    Array.from(fileList).forEach(file => {
      if (file.type.startsWith('image/')) {
        validFiles.push({
          file,
          preview: URL.createObjectURL(file),
          name: file.name
        });
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid files",
        description: `Some files were not images: ${invalidFiles.join(', ')}`,
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      onFilesAdded(validFiles);
    }
  }, [onFilesAdded, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div>
      <Card
        className="border-dashed border-2 p-8 text-center cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-4">
            <Upload className="h-12 w-12 text-gray-400" />
            <div className="text-lg font-medium">
              Drag and drop images here or click to browse
            </div>
            <Button variant="outline">Select Files</Button>
          </div>
        </label>
      </Card>
    </div>
  );
}
