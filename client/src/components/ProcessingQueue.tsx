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

type ProcessingStage = "analyzing" | "generating" | "archiving" | "complete";

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

export function ProcessingQueue({ files, processMutation }: Props) {
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: "analyzing",
    progress: 0,
    currentFile: "",
    processedImages: [],
  });

  useEffect(() => {
    let isMounted = true;
    const processedImages: ProcessedImage[] = [];
    let currentIndex = 0;

    const processImages = async () => {
      if (!isMounted) return;

      try {
        // Process all images sequentially
        for (let i = 0; i < files.length; i++) {
          if (!isMounted) return;
          currentIndex = i;
          
          const file = files[i];
          setStatus(prev => ({
            ...prev,
            stage: "analyzing",
            progress: (i / files.length) * 100,
            currentFile: file.name,
          }));

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
          
          // Update status after each image is processed
          setStatus(prev => ({
            ...prev,
            stage: "generating",
            progress: ((i + 1) / files.length) * 100,
            currentFile: file.name,
            processedImages: [...processedImages]
          }));

          // Small delay to ensure UI updates are visible
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // All images processed, move to archiving stage
        if (isMounted) {
          setStatus(prev => ({
            ...prev,
            stage: "archiving",
            progress: 100,
            processedImages
          }));
          // Only trigger ZIP creation once all images are processed
          processMutation.mutate();
        }
      } catch (error) {
        console.error('Error processing image:', error);
        if (isMounted) {
          setStatus(prev => ({
            ...prev,
            stage: "complete",
            processedImages
          }));
        }
      }
    };

    processImages();

    return () => {
      isMounted = false;
    };
  }, [files]);

  // Update status when ZIP creation is complete
  useEffect(() => {
    if (processMutation.data?.datasetId) {
      setStatus(prev => ({
        ...prev,
        stage: "complete"
      }));
    }
  }, [processMutation.data?.datasetId]);

  const getStageText = () => {
    switch (status.stage) {
      case "analyzing":
        return "Analyzing images with AI vision model";
      case "generating":
        return "Generating detailed descriptions";
      case "archiving":
        return "Creating dataset archive";
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
                {status.stage !== "archiving" && (
                  <div className="text-sm text-gray-600">
                    {Math.floor(status.progress / (100 / files.length))} of {files.length} images processed
                  </div>
                )}
                {status.stage === "archiving" && processMutation.isPending && (
                  <div className="text-sm text-gray-600 animate-pulse">
                    Creating dataset archive...
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </Card>

      {status.stage === "complete" && processMutation.data?.datasetId && (
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
              onClick={() => window.open(`/api/datasets/${processMutation.data.datasetId}`, '_blank')}
              size="lg"
            >
              Download Dataset
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
