import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import type { ImageFile } from "../lib/types";

interface Props {
  files: ImageFile[];
  onComplete: () => void;
}

export function ProcessingQueue({ files, onComplete }: Props) {
  const [processed, setProcessed] = useState(0);
  const [currentFile, setCurrentFile] = useState<string>("");

  useEffect(() => {
    const processFile = async (index: number) => {
      if (index >= files.length) {
        onComplete();
        return;
      }

      setCurrentFile(files[index].name);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProcessed(prev => prev + 1);
      processFile(index + 1);
    };

    processFile(0);
  }, [files, onComplete]);

  const progress = (processed / files.length) * 100;

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Processing Images</h2>
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          Processing: {currentFile}
        </div>
        <Progress value={progress} className="w-full" />
        <div className="text-sm text-gray-600">
          {processed} of {files.length} images processed
        </div>
      </div>
    </Card>
  );
}
