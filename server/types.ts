import type { Model } from "../client/src/lib/models";
import type { DatasetEntry } from "../client/src/lib/types";
import type { ReverseImageGenerationMetadata } from "./services/imageAnalysis";

export type { DatasetEntry, Model };

export interface Analysis {
  filename: string;
  description: string;
  generatedTags: string[];
  metadata: ReverseImageGenerationMetadata;
}

export type DatasetMetadata = {
  model: Model["name"];
  context: string;
  analyses: Analysis[];
};
