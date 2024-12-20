import fs from "fs/promises";
import path from "path";
import archiver from "archiver";
import type { DatasetEntry, DatasetMetadata } from "../types";

export async function processImages(
  datasetEntries: DatasetEntry[],
  metadata: DatasetMetadata,
  tempDir: string,
): Promise<Buffer> {
  // Create JSONL file
  const jsonlPath = path.join(tempDir, "dataset.jsonl");
  const jsonlContent = datasetEntries
    .map((entry) => JSON.stringify(entry))
    .join("\n");
  await fs.writeFile(jsonlPath, jsonlContent);

  // Create metadata file
  const metadataPath = path.join(tempDir, "metadata.jsonl");
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 4));

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
    archive.file(metadataPath, { name: "metadata.jsonl" });
    archive.directory(tempDir, "images", (data) => {
      return !["dataset.jsonl", "metadata.jsonl"].includes(data.name)
        ? data
        : false;
    });

    archive.finalize();
  });
}
