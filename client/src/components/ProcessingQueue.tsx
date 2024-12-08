import { useEffect, useReducer, useRef, useState } from "react";
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

// Processing stages
type Stage = "idle" | "analyzing" | "generating" | "archiving" | "complete" | "error";

interface ProcessedImage {
  name: string;
  preview: string;
  description: string;
}

// State management
interface State {
  stage: Stage;
  progress: number;
  currentFile: string;
  processedImages: ProcessedImage[];
  error?: string;
}

type Action =
  | { type: "START_PROCESSING" }
  | { type: "SET_PROGRESS"; file: string; progress: number }
  | { type: "ADD_PROCESSED_IMAGE"; image: ProcessedImage }
  | { type: "START_ARCHIVING" }
  | { type: "COMPLETE"; datasetId: string }
  | { type: "ERROR"; message: string }
  | { type: "RESET" };

const initialState: State = {
  stage: "idle",
  progress: 0,
  currentFile: "",
  processedImages: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_PROCESSING":
      return {
        ...initialState,
        stage: "analyzing",
      };
    case "SET_PROGRESS":
      return {
        ...state,
        currentFile: action.file,
        progress: action.progress,
      };
    case "ADD_PROCESSED_IMAGE":
      return {
        ...state,
        stage: "generating",
        processedImages: [...state.processedImages, action.image],
      };
    case "START_ARCHIVING":
      return {
        ...state,
        stage: "archiving",
        progress: 100,
      };
    case "COMPLETE":
      return {
        ...state,
        stage: "complete",
      };
    case "ERROR":
      return {
        ...state,
        stage: "error",
        error: action.message,
      };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

// Components
const LoadingSpinner = () => (
  <div className="flex justify-center items-center space-x-2">
    <div className="w-3 h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite]" />
    <div className="w-3 h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite_0.2s]" />
    <div className="w-3 h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite_0.4s]" />
  </div>
);

const ProcessingView = ({ state, totalFiles }: { state: State; totalFiles: number }) => (
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
        {state.processedImages.length} of {totalFiles} images processed
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
  const [state, dispatch] = useReducer(reducer, initialState);
  const { toast } = useToast();
  const abortController = useRef<AbortController | null>(null);
  const [datasetId, setDatasetId] = useState<string | null>(null);

  const cleanup = () => {
    if (abortController.current?.signal && !abortController.current.signal.aborted) {
      try {
        abortController.current.abort();
      } catch (error) {
        // Ignore abort errors
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Cleanup error:", error);
        }
      }
    }
    abortController.current = null;
  };

  const analyzeImage = async (file: ImageFile): Promise<string> => {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        image: file.preview,
        filename: file.name 
      }),
      signal: abortController.current?.signal,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.details || 'Failed to analyze image');
    }

    const data = await response.json();
    return data.description;
  };

  const createDataset = async (): Promise<string> => {
    const formData = new FormData();
    
    // Add files to FormData
    for (const file of files) {
      if (file.file instanceof File) {
        formData.append('images', file.file);
      }
    }
    
    // Add metadata
    formData.append('description', description);
    formData.append('analyses', JSON.stringify(
      state.processedImages.map(img => ({
        filename: img.name,
        description: img.description
      }))
    ));

    const response = await fetch('/api/process', {
      method: 'POST',
      body: formData,
      signal: abortController.current?.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.details || errorData.error || 'Failed to create dataset');
      } catch {
        throw new Error(errorText || 'Failed to create dataset');
      }
    }

    const result = await response.json();
    if (!result?.datasetId) {
      throw new Error('Server response missing dataset ID');
    }

    return result.datasetId;
  };

  const processImages = async () => {
    cleanup();
    abortController.current = new AbortController();
    
    try {
      dispatch({ type: "START_PROCESSING" });

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = ((i + 1) / files.length) * 100;
        
        dispatch({ 
          type: "SET_PROGRESS",
          file: file.name,
          progress
        });

        const description = await analyzeImage(file);
        
        dispatch({
          type: "ADD_PROCESSED_IMAGE",
          image: {
            name: file.name,
            preview: file.preview,
            description
          }
        });
      }

      dispatch({ type: "START_ARCHIVING" });
      const newDatasetId = await createDataset();
      
      setDatasetId(newDatasetId);
      dispatch({ type: "COMPLETE", datasetId: newDatasetId });
      
      toast({
        title: "Success",
        description: "Dataset created successfully!"
      });
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        dispatch({ 
          type: "ERROR",
          message: error.message || "An unexpected error occurred"
        });
        toast({
          title: "Processing Error",
          description: error.message || "Failed to process images",
          variant: "destructive"
        });
      }
    }
  };

  useEffect(() => {
    if (files.length > 0 && state.stage === "idle") {
      processImages();
    }

    return cleanup;
  }, [files]);

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