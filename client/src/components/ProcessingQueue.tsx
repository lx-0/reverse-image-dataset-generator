import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ImageFile } from "../lib/types";

interface Props {
  files: ImageFile[];
  processMutation?: {
    isPending: boolean;
    data?: {
      datasetId: string;
    };
  };
}

type ProcessingStage = "analyzing" | "generating" | "complete";

interface ProcessedImage {
  name: string;
  preview: string;
  description: string;
}

interface ProcessingStatus {
  stage: ProcessingStage;
  progress: number;
  currentFile: string;
  description?: string;
  processedImages: ProcessedImage[];
}

export function ProcessingQueue({ files, onComplete, processMutation }: Props) {
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: "analyzing",
    progress: 0,
    currentFile: "",
    processedImages: [],
  });

  useEffect(() => {
    let isMounted = true;
    const processedImages: ProcessedImage[] = [];

    const processFile = async (index: number) => {
      if (!isMounted || index >= files.length) {
        if (isMounted) {
          setStatus(prev => ({
            ...prev,
            stage: "complete",
            processedImages: processedImages
          }));
        }
        return;
      }

      const file = files[index];

      // Update status for analysis phase
      setStatus(prev => ({
        ...prev,
        stage: "analyzing",
        progress: (index / files.length) * 100,
        currentFile: file.name,
      }));

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            image: file.preview,
            filename: file.name 
          }),
        });

        if (!response.ok) throw new Error('Failed to analyze image');
        
        const data = await response.json();
        
        const processedImage = {
          name: file.name,
          preview: file.preview,
          description: data.description
        };
        
        processedImages.push(processedImage);
        
        setStatus(prev => ({
          ...prev,
          stage: "generating",
          progress: ((index + 1) / files.length) * 100,
          currentFile: file.name,
          processedImages: [...processedImages]
        }));

        // Process next file
        await processFile(index + 1);
      } catch (error) {
        console.error('Error processing image:', error);
        if (isMounted) {
          setStatus(prev => ({ 
            ...prev, 
            stage: "complete",
            processedImages: processedImages
          }));
        }
      }
    };

    processFile(0);

    return () => {
      isMounted = false;
    };
  }, [files]);

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
    <div className="space-y-8">
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Processing Images</h2>
        <div className="space-y-6">
          {status.stage !== "complete" && (
            <>
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
            </>
          )}
        </div>
      </Card>

      {status.stage === "complete" && (
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Processing Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {status.processedImages.map((image, index) => (
              <Card key={index} className="p-4">
                <div className="aspect-video mb-4">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
                <h3 className="font-semibold mb-2">{image.name}</h3>
                <p className="text-sm text-gray-600">{image.description}</p>
              </Card>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <Button 
              onClick={() => {
                if (processMutation?.data?.datasetId) {
                  window.open(`/api/datasets/${processMutation.data.datasetId}`, '_blank');
                }
              }}
              size="lg"
              disabled={!processMutation?.data?.datasetId}
            >
              Download Dataset
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
