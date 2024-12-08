import { useEffect, useState, useCallback, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ImageFile } from "../lib/types";

interface Props {
  files: ImageFile[];
  description: string;
  onComplete?: () => void;
}

type Stage = "idle" | "processing" | "complete" | "error";

interface ProcessedImage {
  name: string;
  preview: string;
  description: string;
}

interface State {
  stage: Stage;
  progress: number;
  currentFile: string;
  processedImages: ProcessedImage[];
  error?: string;
}

export function ProcessingQueue({ files, description, onComplete }: Props) {
  const [state, setState] = useState<State>({
    stage: "idle",
    progress: 0,
    currentFile: "",
    processedImages: [],
  });
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const { toast } = useToast();

  const updateState = (update: Partial<State>) => {
    setState(curr => ({ ...curr, ...update }));
  };

  const processImage = async (file: ImageFile): Promise<string> => {
    try {
      // Convert File to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to convert image to base64'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file.file);
      });

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          image: base64Data,
          filename: file.name 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.details || errorData?.error || response.statusText);
      }

      const data = await response.json();
      return data.description;
    } catch (error) {
      throw new Error(`Failed to process image ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const createDataset = async (processedImages: ProcessedImage[]): Promise<string> => {
    try {
      const formData = new FormData();
      
      files.forEach(file => {
        if (file.file instanceof File) {
          formData.append('images', file.file);
        }
      });
      
      formData.append('description', description);
      formData.append('analyses', JSON.stringify(
        processedImages.map(img => ({
          filename: img.name,
          description: img.description
        }))
      ));

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.details || errorData?.error || response.statusText);
      }

      const result = await response.json();
      if (!result?.datasetId) {
        throw new Error('Server response missing dataset ID');
      }

      return result.datasetId;
    } catch (error) {
      throw new Error(`Failed to create dataset: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Track processing state with a ref to prevent duplicate processing
  const processingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Track mounted state to handle strict mode double mount
  const isMountedRef = useRef(false);

  const processImages = useCallback(async () => {
    // Guard against duplicate processing and ensure we only process on the second mount in strict mode
    if (processingRef.current || !isMountedRef.current || state.stage !== "idle") {
      return;
    }

    try {
      processingRef.current = true;
      abortControllerRef.current?.abort(); // Abort any existing process
      abortControllerRef.current = new AbortController();

      updateState({ 
        stage: "processing", 
        progress: 0, 
        currentFile: "", 
        processedImages: [],
        error: undefined
      });
      
      const processedImages: ProcessedImage[] = [];
      
      for (let i = 0; i < files.length; i++) {
        // Check if processing was aborted
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Processing was aborted');
        }

        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        
        updateState({ 
          currentFile: file.name,
          progress,
        });

        const description = await processImage(file);
        processedImages.push({
          name: file.name,
          preview: file.preview,
          description,
        });
      }

      // Check if processing was aborted before creating dataset
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Processing was aborted');
      }

      updateState({ progress: 100 });
      const newDatasetId = await createDataset(processedImages);
      
      setDatasetId(newDatasetId);
      updateState({ 
        stage: "complete",
        processedImages,
      });

      toast({
        title: "Success",
        description: `Dataset created successfully with ${processedImages.length} images!`,
        duration: 1500
      });
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        return; // Don't show error for aborted operations
      }
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      updateState({ 
        stage: "error",
        error: errorMessage,
      });
      
      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive",
        duration: 1500
      });
    } finally {
      processingRef.current = false;
    }
  }, [files, state.stage, toast]);

  useEffect(() => {
    // Set mounted ref to true after initial mount
    isMountedRef.current = true;

    // Only start processing if we have files and we're in idle state
    if (files.length > 0 && state.stage === "idle" && isMountedRef.current) {
      processImages();
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      processingRef.current = false;
      isMountedRef.current = false;
    };
  }, [files, processImages]); // Include processImages in dependencies

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Processing Images</h2>
        
        {state.stage === "error" ? (
          <div className="p-8 text-center space-y-4">
            <div className="text-destructive text-lg font-medium">Processing Error</div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {state.error || "An unknown error occurred"}
            </p>
            <Button onClick={() => processImages()} variant="outline">
              Retry Processing
            </Button>
          </div>
        ) : state.stage === "processing" ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Processing: {state.currentFile}</span>
              <span>{Math.round(state.progress)}%</span>
            </div>
            <Progress value={state.progress} className="w-full" />
            <div className="space-y-2">
              <div className="text-sm font-medium">
                {state.progress < 100 ? (
                  "Analyzing images with AI vision model"
                ) : (
                  <div className="space-y-1">
                    <div>Creating dataset archive</div>
                    <div className="text-xs text-muted-foreground">
                      This might take a moment while we package your dataset...
                    </div>
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {state.progress < 100 ? (
                  `${Math.min(Math.floor((state.progress / 100) * files.length), files.length)} of ${files.length} images processed`
                ) : (
                  "Finalizing dataset archive"
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      {state.stage === "complete" && datasetId && state.processedImages.length > 0 && (
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Processing Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {state.processedImages.map((image, index) => (
              <Card key={index} className="p-4">
                <div className="aspect-video mb-4">
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
                <h3 className="font-semibold mb-2 text-sm">{image.name}</h3>
                <p className="text-sm text-muted-foreground">{image.description}</p>
              </Card>
            ))}
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <Button variant="outline" onClick={onComplete}>
              Back to Upload
            </Button>
            <Button onClick={() => window.open(`/api/datasets/${datasetId}`, '_blank')}>
              Download Dataset
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}