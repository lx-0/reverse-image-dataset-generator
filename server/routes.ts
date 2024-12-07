import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { processImages } from "./services/fileProcessing";
import { generateDescription } from "./services/imageAnalysis";

// Configure multer for handling file uploads
const upload = multer({ dest: "uploads/" });

export function registerRoutes(app: express.Express) {
  // Endpoint to analyze a single image
  app.post("/api/analyze", async (req, res) => {
    try {
      const { image, filename } = req.body;
      
      // Convert base64 to buffer and save temporarily
      const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const tempPath = path.join("uploads", filename);
      
      await fs.writeFile(tempPath, buffer);
      
      const description = await generateDescription("", tempPath);
      
      // Clean up temp file
      await fs.unlink(tempPath).catch(console.error);
      
      res.json({ description });
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ 
        error: "Failed to analyze image",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint to process multiple images and create dataset
  app.post("/api/process", upload.array("images"), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const description = req.body.description || "";

      if (!files || files.length === 0) {
        throw new Error("No files uploaded");
      }

      // Create temporary directory for processing
      const tempDir = path.join("uploads", `temp_${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });

      // Use the provided analyses
      const analyses = JSON.parse(req.body.analyses);
      const entries = files.map((file) => {
        const analysis = analyses.find(a => a.filename === file.originalname);
        return {
          task_type: "text_to_image" as const,
          instruction: analysis?.description || "An image from the dataset",
          input_images: [file.originalname],
          output_image: file.originalname,
        };
      });

      // Create ZIP file with JSONL and images
      const zipBuffer = await processImages(files, entries, tempDir);

      // Generate unique dataset ID
      const datasetId = Date.now().toString();
      const datasetsDir = path.join("uploads", "datasets");
      await fs.mkdir(datasetsDir, { recursive: true });
      
      // Store the ZIP file
      const datasetPath = path.join(datasetsDir, `${datasetId}.zip`);
      await fs.writeFile(datasetPath, zipBuffer);

      // Clean up temporary files
      await Promise.all([
        ...files.map(file => fs.unlink(file.path).catch(console.error)),
        fs.rm(tempDir, { recursive: true }).catch(console.error),
      ]).catch(console.error);

      res.json({ 
        success: true,
        message: "Dataset processed successfully",
        datasetId 
      });
    } catch (error) {
      console.error("Failed to process images:", error);
      res.status(500).json({ 
        error: "Failed to process images",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint to download a processed dataset
  app.get("/api/datasets/:id", async (req, res) => {
    try {
      const datasetId = req.params.id;
      const datasetPath = path.join("uploads", "datasets", `${datasetId}.zip`);
      
      if (!await fs.access(datasetPath).then(() => true).catch(() => false)) {
        return res.status(404).json({ error: "Dataset not found" });
      }

      res.download(datasetPath);
    } catch (error) {
      console.error("Error downloading dataset:", error);
      res.status(500).json({ 
        error: "Failed to download dataset",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
}