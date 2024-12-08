import { useState } from "react";
import { ImageUploader } from "../components/ImageUploader";
import { ImageGrid } from "../components/ImageGrid";
import { ProcessingQueue } from "../components/ProcessingQueue";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { ImageFile } from "../lib/types";

export function App() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("gpt-4o-mini");
  const { toast } = useToast();

  const models = [
    { id: "o1-preview", name: "O1 Preview" },
    { id: "o1-mini", name: "O1 Mini" },
    { id: "gpt-4o-mini", name: "GPT-4O Mini (Default)" },
    { id: "gpt-4o", name: "GPT-4O" },
    { id: "gpt-4o-2024-11-20", name: "GPT-4O (2024-11-20)" },
  ];

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
      <h1 className="text-4xl font-bold mb-8">
        Reverse Image Dataset Generator
      </h1>

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
                <h2 className="text-2xl font-semibold mb-4">
                  Dataset Description
                </h2>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Enter a description for your dataset..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <i>
                        Example: The man on the images is named Alex. Those were taken
                        during a multi-day hiking trip in Iceland.
                      </i>
                    </div>
                    <div className="w-64">
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select AI Model" />
                        </SelectTrigger>
                        <SelectContent>
                          {models.map((model) => (
                            <SelectItem key={model.id} value={model.id}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-semibold">Preview</h2>
                  <Button onClick={handleProcess}>
                    Process Dataset
                  </Button>
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
