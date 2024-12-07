import fs from "fs/promises";
import path from "path";
import archiver from "archiver";
import { analyzeImage } from "./langchain.js";

export interface DatasetEntry {
  task_type: "text_to_image";
  instruction: string;
  input_images: string[];
  output_image: string;
}

export async function processImages(
  files: Express.Multer.File[],
  context: string,
  tempDir: string,
): Promise<Buffer> {
  console.log(`Processing ${files.length} images with context: ${context}`);
  
  // Process each image with LangChain
  const entries: DatasetEntry[] = await Promise.all(
    files.map(async (file) => {
      // Generate description using LangChain
      const description = await analyzeImage(context, file.path);
      
      return {
        task_type: "text_to_image",
        instruction: description,
        input_images: [],
        output_image: file.originalname
      };
    })
  );

  // Create JSONL file
  const jsonlPath = path.join(tempDir, "dataset.jsonl");
  const jsonlContent = entries.map(entry => JSON.stringify(entry)).join("\n");
  await fs.writeFile(jsonlPath, jsonlContent);

  // Copy images to temp directory
  await Promise.all(
    files.map(async (file) => {
      const destPath = path.join(tempDir, file.originalname);
      await fs.copyFile(file.path, destPath);
    })
  );

  // Create ZIP file
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    
    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    archive.file(jsonlPath, { name: "dataset.jsonl" });
    archive.directory(tempDir, "images", (data) => {
      return data.name !== "dataset.jsonl" ? data : false;
    });

    archive.finalize();
  });
}
