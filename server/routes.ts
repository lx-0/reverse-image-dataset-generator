import type { Express } from "express";
import multer from "multer";
import { processImages } from "./services/fileProcessing";
import { generateDescription } from "./services/langchain";
import path from "path";
import fs from "fs/promises";

// Configure multer to store files in uploads directory
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

export function registerRoutes(app: Express) {
  // Ensure uploads directory exists
  app.use(async (req, res, next) => {
    try {
      await fs.mkdir('uploads', { recursive: true });
      next();
    } catch (error) {
      console.error('Failed to create uploads directory:', error);
      next(error);
    }
  });

  app.post("/api/analyze", async (req, res) => {
    try {
      console.log("Received analyze request");
      const { image, filename } = req.body;
      
      if (!image || !filename) {
        return res.status(400).json({ error: "Missing image or filename" });
      }

      // Create a temporary file from the base64 image
      const tempFilePath = path.join('uploads', `temp_${Date.now()}_${filename}`);
      console.log(`Creating temporary file: ${tempFilePath}`);
      
      try {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        await fs.writeFile(tempFilePath, Buffer.from(base64Data, 'base64'));
        console.log("Successfully wrote temporary file");
        
        // Generate description using the temporary file
        const description = await generateDescription("", tempFilePath);
        console.log("Generated description:", description);
        
        // Clean up temporary file
        await fs.unlink(tempFilePath).catch(error => {
          console.error("Error cleaning up temp file:", error);
        });
        
        res.json({ description });
      } catch (error) {
        console.error("Error processing image:", error);
        // Clean up on error
        await fs.unlink(tempFilePath).catch(console.error);
        throw error;
      }
    } catch (error) {
      console.error("Failed to analyze image:", error);
      res.status(500).json({ 
        error: "Failed to analyze image",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

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
          try {
            const instruction = await generateDescription(description, file.path);
            return {
              task_type: "text_to_image",
              instruction,
              input_images: [],
              output_image: file.originalname,
            };
          } catch (error) {
            console.error(`Failed to process image ${file.originalname}:`, error);
            throw error;
          }
        })
      );

      // Create ZIP file with JSONL and images
      const zipBuffer = await processImages(files, entries, tempDir);

      // Clean up
      await Promise.all([
        ...files.map(file => fs.unlink(file.path).catch(console.error)),
        fs.rm(tempDir, { recursive: true }).catch(console.error),
      ]).catch(console.error);

      res.set("Content-Type", "application/zip");
      res.set("Content-Disposition", "attachment; filename=dataset.zip");
      res.send(zipBuffer);
    } catch (error) {
      console.error("Failed to process images:", error);
      res.status(500).json({ 
        error: "Failed to process images",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
}
