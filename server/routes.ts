import type { Express } from "express";
import multer from "multer";
import { processImages } from "./services/fileProcessing";
import { generateDescription } from "./services/langchain";
import path from "path";
import fs from "fs/promises";

const upload = multer({ dest: "uploads/" });

export function registerRoutes(app: Express) {
  app.post("/api/process", upload.array("images"), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const description = req.body.description || "";

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      // Create temporary directory for processed files
      const tempDir = path.join("uploads", Date.now().toString());
      await fs.mkdir(tempDir, { recursive: true });

      // Process each image
      const entries = await Promise.all(
        files.map(async (file) => {
          const instruction = await generateDescription(description, file.path);
          return {
            task_type: "text_to_image",
            instruction,
            input_images: [],
            output_image: file.originalname,
          };
        })
      );

      // Create ZIP file with JSONL and images
      const zipBuffer = await processImages(files, entries, tempDir);

      // Clean up
      await Promise.all([
        ...files.map(file => fs.unlink(file.path)),
        fs.rm(tempDir, { recursive: true }),
      ]);

      res.set("Content-Type", "application/zip");
      res.set("Content-Disposition", "attachment; filename=dataset.zip");
      res.send(zipBuffer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to process images" });
    }
  });
}
