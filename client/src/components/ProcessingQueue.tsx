import { useEffect, useState, useRef, useCallback } from "react";
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

// Define the possible states and transitions
type ProcessingStage = "idle" | "analyzing" | "generating" | "archiving" | "complete" | "error";

interface ProcessedImage {
  name: string;
  preview: string;
  description: string;
}

interface ProcessingState {
  stage: ProcessingStage;
  progress: number;
  currentFile: string;
  processedImages: ProcessedImage[];
  error?: string;
  retryCount: number;
}

interface ProcessingRef {
  isActive: boolean;
  controller: AbortController | null;
}

// Type guard for checking if processing is aborted
function isAbortError(error: unknown): error is Error {
  return error instanceof Error && error.name === 'AbortError';
}

// Components
const LoadingSpinner = () => (
  <div className="flex justify-center items-center space-x-2">
    <div className="w-3 h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite]" />
    <div className="w-3 h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite_0.2s]" />
    <div className="w-3 h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite_0.4s]" />
  </div>
);

const ProcessingView = ({ state, totalFiles }: { state: ProcessingState; totalFiles: number }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>Processing: {state.currentFile}</span>
      <span>{Math.round(state.progress)}%</span>
    </div>
    <Progress value={state.progress} className="w-full" />
    <div className="space-y-2">
      <div className="text-sm font-medium">
        {state.stage === "analyzing" && "Analyzing images with AI vision model"}
        {state.stage === "generating" && "Generating detailed descriptions"}
        {state.stage === "archiving" && "Creating dataset archive"}
      </div>
      <div className="text-sm text-muted-foreground">
        {Math.floor(state.progress / (100 / totalFiles))} of {totalFiles} images processed
      </div>
    </div>
  </div>
);

const ErrorView = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="p-8 text-center space-y-4">
    <div className="text-destructive text-lg font-medium">Processing Error</div>
    <p className="text-sm text-muted-foreground max-w-md mx-auto">{error}</p>
    <Button onClick={onRetry} variant="outline">Retry Processing</Button>
  </div>
);

const ResultsView = ({ 
  processedImages, 
  datasetId, 
  onComplete 
}: { 
  processedImages: ProcessedImage[]; 
  datasetId: string; 
  onComplete?: () => void;
}) => (
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
);

// Main Component
export function ProcessingQueue({ files, description, onComplete }: Props) {
  const [state, setState] = useState<ProcessingState>({
    stage: "idle",
    progress: 0,
    currentFile: "",
    processedImages: [],
    retryCount: 0,
  });
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const processingRef = useRef<ProcessingRef>({
    isActive: false,
    controller: null
  });
  const { toast } = useToast();

  const cleanup = useCallback(() => {
    // Safely get the current ref and check if it exists
    const ref = processingRef.current;
    if (!ref) return;

    // Mark as inactive first to prevent new operations
    ref.isActive = false;

    // Safely handle the controller
    if (ref.controller) {
      // Store controller locally to avoid any race conditions
      const controller = ref.controller;
      ref.controller = null; // Clear reference first

      try {
        // Check if we can safely abort
        if (controller && !controller.signal.aborted) {
          controller.abort();
        }
      } catch (e) {
        // Silently handle abort errors as they're expected during cleanup
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          console.error('Error during cleanup:', e);
        }
      }
    }
  }, []);

  // Safe state update that checks if component is still mounted
  const safeSetState = useCallback((
    updater: (prev: ProcessingState) => ProcessingState
  ) => {
    if (processingRef.current.isActive) {
      setState(updater);
    }
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('Processing error:', error);
    // Only handle non-abort errors when we're still processing
    if (error.name !== 'AbortError' && processingRef.current) {
      setState(prev => ({
        ...prev,
        stage: "error",
        error: error.message || "An unexpected error occurred",
        retryCount: prev.retryCount + 1,
      }));
      toast({
        title: "Processing Error",
        description: error.message || "Failed to process images. Please try again.",
        variant: "destructive",
      });
    }
    cleanup();
  }, [toast, cleanup]);

  const analyzeImage = useCallback(async (file: ImageFile, signal: AbortSignal) => {
    const MAX_RETRIES = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            image: file.preview,
            filename: file.name 
          }),
          signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to analyze image');
        }

        const data = await response.json();
        return data.description;
      } catch (error) {
        lastError = error as Error;
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
          continue;
        }
      }
    }

    throw lastError || new Error('Failed to analyze image after multiple attempts');
  }, []);

  const createDataset = useCallback(async (signal: AbortSignal) => {
    safeSetState(prev => ({
      ...prev,
      stage: "archiving",
      progress: 0,
      currentFile: "Creating dataset archive...",
    }));

    try {
      // Validate files first
      const validFiles = files.filter(file => {
        if (!file.file || !(file.file instanceof File)) {
          console.error(`Invalid file object for ${file.name}`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        throw new Error('No valid files to process');
      }

      // Create FormData with validated files
      const formData = new FormData();
      validFiles.forEach(file => {
        try {
          formData.append('images', file.file);
        } catch (error) {
          console.error(`Error appending file ${file.name}:`, error);
        }
      });
      
      // Add description and analyses
      formData.append('description', description || '');
      
      const analyses = state.processedImages
        .filter(img => validFiles.some(f => f.name === img.name))
        .map(img => ({
          filename: img.name,
          description: img.description
        }));
        
      if (analyses.length === 0) {
        throw new Error('No valid image analyses to process');
      }
      
      formData.append('analyses', JSON.stringify(analyses));

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
        signal,
      });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to create dataset';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.details || errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
    }
      
    let result;
    try {
      result = await response.json();
    } catch (error) {
      throw new Error('Invalid response format from server');
    }

    if (!result?.datasetId) {
      throw new Error('Server response missing dataset ID');
    }

    if (processingRef.current.isActive) {
      setDatasetId(result.datasetId);
      safeSetState(prev => ({ 
        ...prev, 
        stage: "complete",
        progress: 100,
      }));

      toast({
        title: "Success",
        description: "Dataset created successfully!",
      });
    }
  } catch (error) {
    console.error('Error creating dataset:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create dataset');
  }
}, [files, description, state.processedImages, toast, safeSetState]);

  const processImages = useCallback(async () => {
    // Don't start if already processing
    if (processingRef.current.isActive) {
      return;
    }

    cleanup();
    const controller = new AbortController();
    processingRef.current = {
      isActive: true,
      controller
    };

    try {
      safeSetState(() => ({
        stage: "analyzing",
        progress: 0,
        currentFile: "",
        processedImages: [],
        retryCount: 0
      }));

      const processedResults: ProcessedImage[] = [];
      for (let i = 0; i < files.length; i++) {
        // Check if processing was aborted
        if (!processingRef.current.isActive) {
          throw new Error('Processing was aborted');
        }

        const file = files[i];
        safeSetState(prev => ({
          ...prev,
          progress: (i / files.length) * 100,
          currentFile: file.name
        }));

        try {
          const description = await analyzeImage(file, controller.signal);
          
          // Skip if processing was aborted during API call
          if (!processingRef.current.isActive) {
            throw new Error('Processing was aborted');
          }

          processedResults.push({
            name: file.name,
            preview: file.preview,
            description
          });

          safeSetState(prev => ({
            ...prev,
            stage: "generating",
            progress: ((i + 1) / files.length) * 100,
            currentFile: file.name,
            processedImages: [...processedResults]
          }));
        } catch (error) {
          if (isAbortError(error) || !processingRef.current.isActive) {
            throw error;
          }
          console.error(`Error processing ${file.name}:`, error);
          continue;
        }
      }

      if (processingRef.current.isActive && processedResults.length > 0) {
        safeSetState(prev => ({ ...prev, stage: "archiving" }));
        await createDataset(controller.signal);
      }
    } catch (error) {
      if (error instanceof Error && !isAbortError(error)) {
        handleError(error);
      }
    } finally {
      cleanup();
    }
  }, [files, analyzeImage, createDataset, handleError, cleanup, safeSetState]);

  useEffect(() => {
    let mounted = true;

    // Only start processing if we have files and we're in idle state
    if (files.length > 0 && state.stage === "idle" && mounted) {
      processImages().catch(error => {
        if (mounted && !isAbortError(error)) {
          console.error('Processing error:', error);
        }
      });
    }

    // Cleanup function
    return () => {
      mounted = false;
      cleanup();
    };
  }, [files, state.stage, processImages, cleanup]);

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Processing Images</h2>
        {state.stage === "error" ? (
          <ErrorView 
            error={state.error || "An unknown error occurred"} 
            onRetry={() => processImages()}
          />
        ) : state.stage !== "complete" && state.stage !== "idle" && (
          <>
            {state.stage === "analyzing" || state.stage === "generating" ? (
              <ProcessingView state={state} totalFiles={files.length} />
            ) : state.stage === "archiving" && (
              <div className="p-12 flex flex-col items-center justify-center space-y-8">
                <LoadingSpinner />
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-semibold">Creating Dataset Archive</h3>
                  <p className="text-sm text-muted-foreground">
                    Packaging your dataset into a ZIP file...
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {state.stage === "complete" && datasetId && state.processedImages.length > 0 && (
        <ResultsView 
          processedImages={state.processedImages}
          datasetId={datasetId}
          onComplete={onComplete}
        />
      )}
    </div>
  );
}