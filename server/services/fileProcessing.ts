import fs from "fs/promises";
import path from "path";
import { createWriteStream } from "fs";
import archiver from "archiver";
import type { DatasetEntry } from "../../client/src/lib/types";

export async function processImages(
  files: Express.Multer.File[],
  entries: DatasetEntry[],
  tempDir: string,
): Promise<Buffer> {
  // Create JSONL file
  const jsonlPath = path.join(tempDir, "dataset.jsonl");
  const jsonlContent = entries.map(entry => JSON.stringify(entry)).join("\n");
  await fs.writeFile(jsonlPath, jsonlContent);

  // Copy images to temp directory
  await Promise.all(
    files.map(async (file, index) => {
      const destPath = path.join(tempDir, file.originalname);
      await fs.copyFile(file.path, destPath);
    })
  );

  // Create ZIP file
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

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
