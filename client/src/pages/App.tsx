import { useState } from "react";
import { ImageUploader } from "../components/ImageUploader";
import { ImageGrid } from "../components/ImageGrid";
import { ProcessingQueue } from "../components/ProcessingQueue";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ImageFile } from "../lib/types";
import { MODELS, type Model } from "../lib/models";

export function App() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] =
    useState<Model["name"]>("gpt-4o-mini");
  const { toast } = useToast();

  const handleProcess = () => {
    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one image",
        variant: "destructive",
      });
      return;
    }
    setIsProcessing(true);
  };

  const handleComplete = () => {
    setIsProcessing(false);
    setFiles([]);
    setDescription("");
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">
          Reverse Image Dataset Generator
        </h1>
        <p className="text-lg text-muted-foreground mb-4">
          Upload images and provide context to automatically generate high-quality training datasets for fine-tuning image generation models. A language model will analyze your images and create optimized prompts, descriptions, and tags for each one. The tool generates a downloadable dataset in JSONL format with all images included, ready for model fine-tuning.
        </p>
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            Generated Dataset Format (JSONL)
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="bg-muted/50 border rounded-lg p-3">
              <pre className="text-sm bg-background/80 p-2 rounded overflow-x-auto">
{`{
  "task_type": "text_to_image",
  "instruction": "A serene mountain landscape with snow-capped peaks...",
  "input_images": [],
  "output_image": "landscape_001.jpg"
}
{
  "task_type": "text_to_image",
  "instruction": "A vibrant sunset over the ocean with waves...",
  "input_images": [],
  "output_image": "sunset_002.jpg"
}`}
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
            Generated Dataset Format (JSONL)
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="bg-muted/50 border rounded-lg p-3">
              <pre className="text-sm bg-background/80 p-2 rounded overflow-x-auto">
{`{
  "task_type": "text_to_image",
  "instruction": "A serene mountain landscape with snow-capped peaks...",
  "input_images": [],
  "output_image": "landscape_001.jpg"
}
{
  "task_type": "text_to_image",
  "instruction": "A vibrant sunset over the ocean with waves...",
  "input_images": [],
  "output_image": "sunset_002.jpg"
}`}
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {!isProcessing ? (
        <>
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Upload Images</h2>
            <ImageUploader
              onFilesAdded={(newFiles) =>
                setFiles((prev) => [...prev, ...newFiles])
              }
            />
          </Card>

          {files.length > 0 && (
            <>
              <Card className="p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-6">
                  Dataset Settings
                </h2>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <label
                          htmlFor="model-select"
                          className="text-sm font-medium"
                        >
                          AI Model
                        </label>
                        <p className="text-sm text-muted-foreground">
                          Select which AI model to use for image analysis
                        </p>
                      </div>
                      <div className="w-64">
                        <Select
                          value={selectedModel}
                          onValueChange={(v: Model["name"]) =>
                            setSelectedModel(v)
                          }
                        >
                          <SelectTrigger id="model-select">
                            <SelectValue placeholder="Select AI Model" />
                          </SelectTrigger>
                          <SelectContent>
                            {MODELS.map((model) => (
                              <SelectItem key={model.name} value={model.name}>
                                {model.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label
                        htmlFor="description"
                        className="text-sm font-medium"
                      >
                        Context Description
                      </label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Add context to help the AI understand your images better
                      </p>
                    </div>
                    <Textarea
                      id="description"
                      placeholder="Enter a description for your dataset..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="bg-muted/50 border rounded-lg p-3">
                      <p className="text-sm font-medium mb-1">Example</p>
                      <p className="text-sm text-muted-foreground italic">
                        The man on the images is named Alex. Those were taken
                        during a multi-day hiking trip in Iceland.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">Preview</h2>
                  <Button onClick={handleProcess}>Process Dataset</Button>
                </div>
                <ImageGrid
                  files={files}
                  onRemove={(index) => {
                    setFiles(files.filter((_, i) => i !== index));
                  }}
                />
              </Card>

              <div className="flex justify-end">
                <Button size="lg" onClick={handleProcess}>
                  Process Dataset
                </Button>
              </div>
            </>
          )}
        </>
      ) : (
        <ProcessingQueue
          files={files}
          description={description}
          model={selectedModel}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
