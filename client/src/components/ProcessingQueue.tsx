import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import type { ImageFile } from "../lib/types";

interface Props {
  files: ImageFile[];
  onComplete: () => void;
}

type ProcessingStage = "analyzing" | "generating" | "complete";

interface ProcessingStatus {
  stage: ProcessingStage;
  progress: number;
  currentFile: string;
  description?: string;
}

export function ProcessingQueue({ files, onComplete }: Props) {
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: "analyzing",
    progress: 0,
    currentFile: "",
  });

  useEffect(() => {
    let isMounted = true;

    const processFile = async (index: number) => {
      if (!isMounted || index >= files.length) {
        if (isMounted) onComplete();
        return;
      }

      const file = files[index];

      // Update status for analysis phase
      setStatus({
        stage: "analyzing",
        progress: (index / files.length) * 100,
        currentFile: file.name,
      });

      // Simulate processing time for now (this will be real in production)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update status for description generation
      setStatus(prev => ({
        stage: "generating",
        progress: ((index + 0.5) / files.length) * 100,
        currentFile: file.name,
      }));

      // Another phase of processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Move to next file
      processFile(index + 1);
    };

    processFile(0);

    return () => {
      isMounted = false;
    };
  }, [files, onComplete]);

  const getStageText = () => {
    switch (status.stage) {
      case "analyzing":
        return "Analyzing image with AI vision model";
      case "generating":
        return "Generating detailed description";
      case "complete":
        return "Processing complete";
      default:
        return "Processing";
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Processing Images</h2>
      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Current File: {status.currentFile}</span>
          <span>{Math.round(status.progress)}%</span>
        </div>
        <Progress value={status.progress} className="w-full" />
        <div className="space-y-2">
          <div className="text-sm font-medium">
            Current Stage: {getStageText()}
          </div>
          <div className="text-sm text-gray-600">
            {Math.floor(status.progress / (100 / files.length))} of {files.length} images processed
          </div>
        </div>
      </div>
    </Card>
  );
}
