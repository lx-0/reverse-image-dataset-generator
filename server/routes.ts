import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { processImages } from "./services/fileProcessing.js";
import { generateDescription } from "./services/imageAnalysis.js";
import type { Analysis, Model, ProcessRequest } from "./types";
import { extractMessageFromUnknownError } from "./utils";

// Configure multer for handling file uploads

const upload = multer({ dest: "uploads/" });

export function registerRoutes(app: express.Express) {
  // Endpoint to analyze a single image
  app.post("/api/analyze", async (req, res) => {
    try {
      const { image, filename, context, model } = req.body;

      // Input validation
      if (!image || !filename) {
        return res.status(400).json({
          error: "Missing required fields",
          details: "Both image and filename are required",
        });
      }

      // Extract base64 data and validate format
      let base64Data: string;
      try {
        if (image.startsWith("data:image/")) {
          const matches = image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
          if (!matches) {
            throw new Error("Invalid data URL format");
          }
          base64Data = matches[2];
        } else if (image.match(/^[A-Za-z0-9+/]+={0,2}$/)) {
          base64Data = image;
        } else {
          throw new Error("Invalid base64 format");
        }
      } catch (error) {
        return res.status(400).json({
          error: "Invalid image format",
          details:
            "Image must be either a valid data URL or base64 encoded image",
        });
      }

      // Decode and validate base64
      let buffer: Buffer;
      try {
        buffer = Buffer.from(base64Data, "base64");
        if (buffer.length === 0) {
          throw new Error("Empty image data");
        }
      } catch (error) {
        return res.status(400).json({
          error: "Invalid image data",
          details: "Failed to decode image data",
        });
      }

      try {
        console.log(`Generating description for image: ${filename}`);
        return generateDescription(model, context, base64Data).then((r) =>
          res.json(r),
        );
      } catch (error) {
        console.error("Error analyzing image:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({
        error: "Failed to analyze image",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Endpoint to process multiple images and create dataset
  app.post("/api/process", upload.array("images"), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const { context, model } = req.body as ProcessRequest["body"];
      const { analyses }: ProcessRequest["body"]["analyses"] = JSON.parse(
        req.body.analyses,
      );

      if (!files || files.length === 0) {
        throw new Error("No files uploaded");
      }

      if (!analyses || analyses.length === 0) {
        throw new Error("No analyses provided");
      }

      if (!model || typeof model !== "string") {
        throw new Error("No model selected");
      }

      // Use the provided analyses
      const entries = files.map((file) => {
        const analysis = analyses.find(
          (a: Analysis) => a.filename === file.originalname,
        );
        return {
          task_type: "text_to_image" as const,
          instruction:
            analysis?.processedImage.imageGenerationPrompt ||
            "An image from the dataset",
          input_images: [],
          output_image: file.originalname,
        };
      });

      // Create temporary directory for processing
      const tempDir = path.join("uploads", `temp_${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });

      // Copy images to temp directory
      await Promise.all(
        files.map(async (file, index) => {
          const destPath = path.join(tempDir, file.originalname);
          await fs.copyFile(file.path, destPath);
        }),
      );

      // Create ZIP file with JSONL and images
      const zipBuffer = await processImages(
        entries,
        { model: model as Model["name"], context, analyses },
        tempDir,
      );

      // Generate unique dataset ID
      const datasetId = Date.now().toString();
      const datasetsDir = path.join("uploads", "datasets");
      await fs.mkdir(datasetsDir, { recursive: true });

      // Store the ZIP file
      const datasetPath = path.join(datasetsDir, `dataset_${datasetId}.zip`);
      await fs.writeFile(datasetPath, zipBuffer);

      // Clean up temporary files
      await Promise.all([
        ...files.map((file) => fs.unlink(file.path).catch(console.error)),
        fs.rm(tempDir, { recursive: true }).catch(console.error),
      ]).catch(console.error);

      res.json({
        success: true,
        message: "Dataset processed successfully",
        datasetId,
      });
    } catch (error) {
      console.error("Failed to process images:", error);
      res.status(500).json({
        error: `Failed to process images: ${extractMessageFromUnknownError(error)}`,
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Endpoint to download a processed dataset
  app.get("/api/datasets/:id", async (req, res) => {
    try {
      const datasetId = req.params.id;
      const datasetPath = path.join(
        "uploads",
        "datasets",
        `dataset_${datasetId}.zip`,
      );

      if (
        !(await fs
          .access(datasetPath)
          .then(() => true)
          .catch(() => false))
      ) {
        return res.status(404).json({ error: "Dataset not found" });
      }

      res.download(datasetPath);
    } catch (error) {
      console.error("Error downloading dataset:", error);
      res.status(500).json({
        error: "Failed to download dataset",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });
}
