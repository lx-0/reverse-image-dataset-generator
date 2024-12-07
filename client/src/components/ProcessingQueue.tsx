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

type ProcessingStage = "analyzing" | "generating" | "archiving" | "complete" | "error";

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
  error?: string;
}

const LoadingSpinner = () => (
  <div className="flex justify-center items-center space-x-2">
    <div className="w-3 h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite]" />
    <div className="w-3 h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite_0.2s]" />
    <div className="w-3 h-3 rounded-full bg-primary animate-[bounce_1s_ease-in-out_infinite_0.4s]" />
  </div>
);

const ProcessingView = ({ status, files }: { status: ProcessingStatus; files: ImageFile[] }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>Processing: {status.currentFile}</span>
      <span>{Math.round(status.progress)}%</span>
    </div>
    <Progress value={status.progress} className="w-full" />
    <div className="space-y-2">
      <div className="text-sm font-medium">
        {status.stage === "analyzing" && "Analyzing images with AI vision model"}
        {status.stage === "generating" && "Generating detailed descriptions"}
        {status.stage === "archiving" && "Creating dataset archive"}
      </div>
      <div className="text-sm text-muted-foreground">
        {Math.floor(status.progress / (100 / files.length))} of {files.length} images processed
      </div>
    </div>
  </div>
);

const ArchivingView = () => (
  <div className="p-12 flex flex-col items-center justify-center space-y-8 border rounded-lg bg-gradient-to-b from-background to-muted/20">
    <div className="relative w-full max-w-md">
      <div className="absolute -inset-3">
        <div className="w-full h-full rotate-180 bg-gradient-to-r from-primary/30 to-primary blur-lg opacity-50 animate-pulse" />
      </div>
      <LoadingSpinner />
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
      <Button 
        variant="outline"
        onClick={onComplete}
      >
        Back to Upload
      </Button>
      <Button 
        onClick={() => window.open(`/api/datasets/${datasetId}`, '_blank')}
      >
        Download Dataset
      </Button>
    </div>
  </Card>
);

export function ProcessingQueue({ files, description, onComplete }: Props) {
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: "analyzing",
    progress: 0,
    currentFile: "",
    processedImages: [],
  });
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const processingRef = useRef({
    isProcessing: false,
    isCreatingDataset: false,
    isMounted: true,
    abortController: new AbortController()
  });
  const { toast } = useToast();

  const handleError = useCallback((error: Error) => {
    console.error('Processing error:', error);
    if (processingRef.current.isMounted) {
      setStatus(prev => ({
        ...prev,
        stage: "error",
        error: error.message
      }));
      toast({
        title: "Processing Error",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  const createDataset = useCallback(async () => {
    if (processingRef.current.isCreatingDataset || !processingRef.current.isMounted) {
      return;
    }
    
    processingRef.current.isCreatingDataset = true;
    
    try {
      setStatus(prev => ({
        ...prev,
        stage: "archiving",
        progress: 0,
        currentFile: "Creating dataset archive...",
      }));

      const formData = new FormData();
      files.forEach(file => formData.append('images', file.file));
      formData.append('description', description);
      
      const analyses = status.processedImages.map(img => ({
        filename: img.name,
        description: img.description
      }));
      formData.append('analyses', JSON.stringify(analyses));

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
        signal: processingRef.current.abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to create dataset');
      }
      
      const result = await response.json();
      if (processingRef.current.isMounted) {
        setDatasetId(result.datasetId);
        setStatus(prev => ({ ...prev, stage: "complete" }));
        toast({
          title: "Success",
          description: "Dataset created successfully!",
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        handleError(error);
      }
    } finally {
      if (processingRef.current.isMounted) {
        processingRef.current.isCreatingDataset = false;
      }
    }
  }, [files, description, status.processedImages, handleError, toast]);

  const processImages = useCallback(async () => {
    if (processingRef.current.isProcessing || !processingRef.current.isMounted) {
      return;
    }
    
    processingRef.current.isProcessing = true;
    processingRef.current.abortController = new AbortController();
    
    setStatus({
      stage: "analyzing",
      progress: 0,
      currentFile: "",
      processedImages: []
    });

    const processedImages: ProcessedImage[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        if (!processingRef.current.isMounted) return;
        
        const file = files[i];
        setStatus(prev => ({
          ...prev,
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
          signal: processingRef.current.abortController.signal
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || 'Failed to analyze image');
        }
        
        const data = await response.json();
        
        if (!processingRef.current.isMounted) return;

        const processedImage: ProcessedImage = {
          name: file.name,
          preview: file.preview,
          description: data.description
        };
        
        processedImages.push(processedImage);
        
        if (processingRef.current.isMounted) {
          setStatus(prev => ({
            ...prev,
            stage: "generating",
            progress: ((i + 1) / files.length) * 100,
            currentFile: file.name,
            processedImages: [...processedImages]
          }));
        }
      }

      if (processingRef.current.isMounted && !processingRef.current.isCreatingDataset) {
        await createDataset();
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        handleError(error);
      }
    } finally {
      if (processingRef.current.isMounted) {
        processingRef.current.isProcessing = false;
      }
    }
  }, [files, createDataset, handleError]);

  useEffect(() => {
    processingRef.current = {
      isProcessing: false,
      isCreatingDataset: false,
      isMounted: true,
      abortController: new AbortController()
    };
    
    processImages();

    return () => {
      processingRef.current.isMounted = false;
      processingRef.current.abortController.abort();
    };
  }, [processImages]);

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Processing Images</h2>
        {status.stage === "error" ? (
          <ErrorView 
            error={status.error || "An unknown error occurred"} 
            onRetry={() => processImages()}
          />
        ) : status.stage !== "complete" && (
          <>
            {status.stage === "analyzing" || status.stage === "generating" ? (
              <ProcessingView status={status} files={files} />
            ) : status.stage === "archiving" && (
              <ArchivingView />
            )}
          </>
        )}
      </Card>

      {status.stage === "complete" && datasetId && status.processedImages.length > 0 && (
        <ResultsView 
          processedImages={status.processedImages}
          datasetId={datasetId}
          onComplete={onComplete}
        />
      )}
    </div>
  );
}
