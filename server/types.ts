import type { Model } from "../client/src/lib/models";
import type { DatasetEntry } from "../client/src/lib/types";
import type {
  ReverseImageGenerationResponse,
  ReverseImageGenerationMetadata,
} from "./services/imageAnalysis";

export type { DatasetEntry, Model };

export type AnalyzeRequest = {
  /**
   * base64 encoded image
   */
  image: string;
  filename: string;
  context: string;
  model: Model["name"];
};

export type ProcessRequest = {
  files: Express.Multer.File[];
  body: {
    context: string;
    model: Model["name"];
    analyses: { analyses: Analysis[] };
  };
};

export interface Analysis {
  filename: string;
  processedImage: ReverseImageGenerationResponse;
  metadata: ReverseImageGenerationMetadata;
}

export type DatasetMetadata = {
  model: Model["name"];
  context: string;
  analyses: Analysis[];
};
