import { useState } from "react";
import { ImageUploader } from "../components/ImageUploader";
import { ImageGrid } from "../components/ImageGrid";
import { ProcessingQueue } from "../components/ProcessingQueue";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import type { ImageFile } from "../lib/types";

export function App() {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file.file));
      formData.append('description', description);

      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Processing failed');
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Dataset has been processed successfully",
      });
      setIsProcessing(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process images",
        variant: "destructive",
      });
    },
  });

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
    processMutation.mutate();
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-4xl font-bold mb-8">Dataset Creator for OmniGen</h1>
      
      {!isProcessing ? (
        <>
          <Card className="p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Upload Images</h2>
            <ImageUploader 
              onFilesAdded={(newFiles) => setFiles(prev => [...prev, ...newFiles])}
            />
          </Card>

          {files.length > 0 && (
            <>
              <Card className="p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-4">Dataset Description</h2>
                <Textarea
                  placeholder="Enter a description for your dataset..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mb-4"
                />
              </Card>

              <Card className="p-6 mb-8">
                <h2 className="text-2xl font-semibold mb-4">Preview</h2>
                <ImageGrid files={files} onRemove={(index) => {
                  setFiles(files.filter((_, i) => i !== index));
                }} />
              </Card>

              <div className="flex justify-end">
                <Button
                  size="lg"
                  onClick={handleProcess}
                  disabled={processMutation.isPending}
                >
                  {processMutation.isPending ? "Processing..." : "Process Dataset"}
                </Button>
              </div>
            </>
          )}
        </>
      ) : (
        <ProcessingQueue
          files={files}
          onComplete={() => processMutation.mutate()}
          processMutation={processMutation}
        />
      )}
    </div>
  );
}
