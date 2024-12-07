import { useEffect, useState, useRef, useCallback } from "react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ImageFile } from "../lib/types";

interface Props {
  files: ImageFile[];
  description: string;
  onComplete?: () => void;
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
  processedImages: ProcessedImage[];
}

export function ProcessingQueue({ files, description, onComplete }: Props) {
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: "analyzing",
    progress: 0,
    currentFile: "",
    processedImages: [],
  });
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const processingRef = useRef({
    isProcessing: false,
    isCreatingDataset: false,
    isMounted: true
  });

  const createDataset = useCallback(async () => {
    if (processingRef.current.isCreatingDataset || !processingRef.current.isMounted) {
      console.log('Dataset creation already in progress or component unmounted');
      return;
    }
    
    console.log('Starting dataset creation');
    processingRef.current.isCreatingDataset = true;
    
    try {
      // Ensure we clear any previous progress and set archiving state
      setStatus(prev => ({
        ...prev,
        stage: "archiving",
        progress: 0,
        currentFile: "",
        processedImages: processedImages
      }));

      const formData = new FormData();
      files.forEach(file => formData.append('images', file.file));
      formData.append('description', description);
      
      const analyses = processedImages.map(img => ({
        filename: img.name,
        description: img.description
      }));
      console.log('Preparing analyses for dataset:', analyses.length, 'images');
      formData.append('analyses', JSON.stringify(analyses));

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to create dataset');
      
      const result = await response.json();
      if (processingRef.current.isMounted) {
        console.log('Dataset created successfully:', result.datasetId);
        setDatasetId(result.datasetId);
        setStatus(prev => ({ ...prev, stage: "complete" }));
        // Don't call onComplete here, let user view results first
      }
    } catch (error) {
      console.error('Error creating dataset:', error);
      if (processingRef.current.isMounted) {
        setStatus(prev => ({ ...prev, stage: "complete" }));
      }
    } finally {
      if (processingRef.current.isMounted) {
        processingRef.current.isCreatingDataset = false;
      }
    }
  }, [files, description, onComplete]);

  useEffect(() => {
    // Initialize state
    processingRef.current = {
      isProcessing: false,
      isCreatingDataset: false,
      isMounted: true
    };
    setProcessedImages([]);
    
    const processImages = async () => {
      // Prevent multiple processing cycles
      if (processingRef.current.isProcessing || !processingRef.current.isMounted) {
        console.log('Processing already in progress or component unmounted');
        return;
      }
      
      console.log('Starting image processing');
      processingRef.current.isProcessing = true;

      try {
        // Process all images sequentially
        for (let i = 0; i < files.length; i++) {
          if (!processingRef.current.isMounted) {
            console.log('Component unmounted during processing');
            return;
          }
          
          const file = files[i];
          console.log(`Processing image ${i + 1}/${files.length}:`, file.name);
          
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
          console.log('Analysis complete for:', file.name);
          
          if (!processingRef.current.isMounted) return;

          const processedImage = {
            name: file.name,
            preview: file.preview,
            description: data.description
          };
          
          setProcessedImages(prev => {
            const newProcessedImages = [...prev, processedImage];
            setStatus(prevStatus => ({
              ...prevStatus,
              stage: "generating",
              progress: ((i + 1) / files.length) * 100,
              currentFile: file.name,
              processedImages: newProcessedImages
            }));
            return newProcessedImages;
          });
        }

        // Only create dataset if all images are processed and component is still mounted
        if (processingRef.current.isMounted && !processingRef.current.isCreatingDataset) {
          console.log('All images processed, creating dataset');
          await createDataset();
        }
      } catch (error) {
        console.error('Error processing images:', error);
        if (processingRef.current.isMounted) {
          setStatus(prev => ({
            ...prev,
            stage: "complete",
            processedImages: processedImages
          }));
        }
      } finally {
        if (processingRef.current.isMounted) {
          processingRef.current.isProcessing = false;
        }
      }
    };

    // Start processing immediately
    processImages();

    // Cleanup function
    return () => {
      processingRef.current.isMounted = false;
      processingRef.current.isProcessing = false;
      processingRef.current.isCreatingDataset = false;
    };
  }, [files, createDataset]);

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
            <div className="space-y-6">
              {status.stage === "analyzing" || status.stage === "generating" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Processing: {status.currentFile}</span>
                    <span>{Math.round(status.progress)}%</span>
                  </div>
                  <Progress value={status.progress} className="w-full" />
                  <div className="space-y-2">
                    <div className="text-sm font-medium">
                      {getStageText()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {Math.floor(status.progress / (100 / files.length))} of {files.length} images processed
                    </div>
                  </div>
                </div>
              ) : status.stage === "archiving" && (
                <div className="p-12 flex flex-col items-center justify-center space-y-8 border rounded-lg bg-gradient-to-b from-background to-muted/20">
                  <div className="relative w-full max-w-md">
                    <div className="absolute -inset-3">
                      <div className="w-full h-full rotate-180 bg-gradient-to-r from-primary/30 to-primary blur-lg opacity-50 animate-pulse" />
                    </div>
                    <div className="relative flex justify-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite]" />
                      <div className="w-3 h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite_0.2s]" />
                      <div className="w-3 h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite_0.4s]" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-semibold bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
                      Creating Dataset Archive
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Packaging your dataset into a ZIP file... This may take a moment
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {status.stage === "complete" && datasetId && processedImages.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Processing Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {processedImages.map((image, index) => (
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
            <div className="flex gap-4">
              <Button 
                variant="outline"
                onClick={onComplete}
                size="lg"
              >
                Back to Upload
              </Button>
              <Button 
                onClick={() => window.open(`/api/datasets/${datasetId}`, '_blank')}
                size="lg"
              >
                Download Dataset
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
