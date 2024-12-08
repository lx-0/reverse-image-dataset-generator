import { useEffect, useState, useCallback, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ImageFile } from "../lib/types";
import type {
  GenerateDescriptionResponse,
  ReverseImageGenerationResponse,
} from "../../../server/services/imageAnalysis";

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
  tags: string[];
}

interface GeneratedDescription {
  filename: string;
  description: string;
  tags: string[];
  timestamp: number;
  preview: string;
}

interface State {
  stage: Stage;
  progress: number;
  currentFile: string;
  processedImages: ProcessedImage[];
  generatedDescriptions: GeneratedDescription[];
  error?: string;
}

export function ProcessingQueue({ files, description, onComplete }: Props) {
  const [state, setState] = useState<State>({
    stage: "idle",
    progress: 0,
    currentFile: "",
    processedImages: [],
    generatedDescriptions: [],
  });
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const { toast } = useToast();

  const updateState = (update: Partial<State>) => {
    setState((curr) => ({ ...curr, ...update }));
  };

  const processImage = async (
    file: ImageFile,
  ): Promise<ReverseImageGenerationResponse> => {
    try {
      // Convert File to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to convert image to base64"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(file.file);
      });

      console.log("ProcessingQueue: making analyze API call for", file.name);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Data,
          filename: file.name,
          context: description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.details || errorData?.error || response.statusText,
        );
      }

      const apiResponse: GenerateDescriptionResponse = await response.json();

      if (!apiResponse.ok) {
        throw new Error(apiResponse.message);
      }
      return apiResponse.data;
    } catch (error) {
      throw new Error(
        `Failed to process image ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const createDataset = async (
    processedImages: ProcessedImage[],
  ): Promise<string> => {
    try {
      const formData = new FormData();

      files.forEach((file) => {
        if (file.file instanceof File) {
          formData.append("images", file.file);
        }
      });

      formData.append("description", description);
      formData.append(
        "analyses",
        JSON.stringify(
          processedImages.map((img) => ({
            filename: img.name,
            description: img.description,
          })),
        ),
      );

      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.details || errorData?.error || response.statusText,
        );
      }

      const result = await response.json();
      if (!result?.datasetId) {
        throw new Error("Server response missing dataset ID");
      }

      return result.datasetId;
    } catch (error) {
      throw new Error(
        `Failed to create dataset: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const abortControllerRef = useRef<AbortController | null>(null);
  const processingRef = useRef(false);

  const processImages = useCallback(async () => {
    console.log("ProcessingQueue: processImages called", {
      stage: state.stage,
      filesCount: files.length,
      isProcessing: processingRef.current,
    });

    if (state.stage !== "idle" || processingRef.current) {
      console.log("ProcessingQueue: processing skipped - busy or not idle");
      return;
    }

    try {
      processingRef.current = true;
      console.log("ProcessingQueue: starting processing");
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      updateState({
        stage: "processing",
        progress: 0,
        currentFile: "",
        processedImages: [],
        generatedDescriptions: [],
        error: undefined,
      });

      const processedImages: ProcessedImage[] = [];

      for (let i = 0; i < files.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Processing was aborted");
        }

        const file = files[i];
        const progress = (i / files.length) * 100;

        updateState({
          currentFile: file.name,
          progress,
        });

        const description = await processImage(file);
        console.log(`Generated description for ${file.name}:`, description);

        // Update state with new description
        setState((prevState) => ({
          ...prevState,
          generatedDescriptions: [
            {
              filename: file.name,
              description: description.imageGenerationPrompt,
              tags: description.imageTags,
              timestamp: Date.now(),
              preview: file.preview,
            },
            ...prevState.generatedDescriptions,
          ],
        }));

        processedImages.push({
          name: file.name,
          preview: file.preview,
          description: description.imageGenerationPrompt,
          tags: description.imageTags,
        });
      }

      if (abortControllerRef.current?.signal.aborted) {
        throw new Error("Processing was aborted");
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
        duration: 1500,
      });
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      updateState({
        stage: "error",
        error: errorMessage,
      });

      toast({
        title: "Processing Error",
        description: errorMessage,
        variant: "destructive",
        duration: 1500,
      });
    } finally {
      processingRef.current = false;
    }
  }, [files, state.stage, toast]);

  useEffect(() => {
    if (files.length > 0 && state.stage === "idle") {
      console.log(
        "ProcessingQueue: initiating processing for",
        files.length,
        "files",
      );
      processImages();
    }

    return () => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
    };
  }, [files, processImages, state.stage]);

  return (
    <div className="space-y-8">
      {(state.stage === "processing" || state.stage === "error") && (
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Processing Images</h2>

          {state.stage === "error" ? (
          <div className="p-8 text-center space-y-4">
            <div className="text-destructive text-lg font-medium">
              Processing Error
            </div>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {state.error || "An unknown error occurred"}
            </p>
            <Button onClick={() => processImages()} variant="outline">
              Retry Processing
            </Button>
          </div>
        ) : state.stage === "processing" ? (
          <div className="space-y-6">
            {description && description.trim() !== "" && (
              <div className="p-3 bg-muted rounded-md border">
                <div className="font-medium text-sm text-primary mb-1">
                  Context for Image Analysis:
                </div>
                <div className="text-sm text-muted-foreground">
                  {description}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full border-2 border-primary border-r-transparent animate-spin" />
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {state.progress < 100 ? "Analyzing images with AI vision model" : "Creating dataset archive"}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>{state.currentFile}</span>
                    <span className="text-xs">•</span>
                    <span className={state.progress < 100 ? "animate-pulse" : ""}>
                      {state.progress < 100
                        ? `${state.generatedDescriptions.length} of ${files.length} images processed`
                        : "Finalizing dataset archive..."}
                    </span>
                  </div>
                </div>
                <div className="text-sm font-medium">{Math.round(state.progress)}%</div>
              </div>
              
              <Progress value={state.progress} className="w-full relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/25 after:to-transparent after:animate-shimmer" />
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <span className={state.progress < 100 ? "animate-pulse" : ""}>
                    {state.progress < 100
                      ? `${state.generatedDescriptions.length} of ${files.length} images processed`
                      : "Finalizing dataset archive"}
                  </span>
                </div>

                {description && description.trim() !== "" && (
                  <div className="mt-4 p-3 bg-muted rounded-md border">
                    <div className="font-medium text-sm text-primary mb-1">
                      Context for Image Analysis:
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {description}
                    </div>
                  </div>
                )}
                {state.generatedDescriptions.length > 0 && (
                  <div className="mt-4 space-y-3 border rounded-lg p-4 bg-background/50 backdrop-blur-sm">
                    <div className="font-medium text-base">
                      Generated Descriptions:
                    </div>
                    <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                      {state.generatedDescriptions.map((desc, index) => (
                        <div
                          key={index}
                          className="p-4 bg-muted rounded-lg border shadow-sm"
                        >
                          <div className="flex gap-4">
                            <div className="w-32 h-32 flex-shrink-0">
                              <img
                                src={desc.preview}
                                alt={desc.filename}
                                className="w-full h-full object-cover rounded-md"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-sm mb-2 text-primary">
                                {desc.filename}
                              </div>
                              <div className="text-sm text-muted-foreground mb-2">
                                {desc.description}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {desc.tags.map((tag, tagIndex) => (
                                  <span
                                    key={tagIndex}
                                    className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
        </Card>
      )}

      {state.stage === "complete" && datasetId && state.processedImages.length > 0 && (
        <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Processing Results</h2>
            {description && description.trim() !== "" && (
              <div className="mb-6 p-3 bg-muted rounded-md border">
                <div className="font-medium text-sm text-primary mb-1">
                  Context for Image Analysis:
                </div>
                <div className="text-sm text-muted-foreground">
                  {description}
                </div>
              </div>
            )}
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
                  <p className="text-sm text-muted-foreground mb-2">
                    {image.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {image.tags.map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <Button variant="outline" onClick={onComplete}>
                Back to Upload
              </Button>
              <Button
                onClick={() =>
                  window.open(`/api/datasets/${datasetId}`, "_blank")
                }
              >
                Download Dataset
              </Button>
            </div>
          </Card>
        )}
    </div>
  );
}
