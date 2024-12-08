import type { Model } from "../client/src/lib/models";
import type { DatasetEntry } from "../client/src/lib/types";

export type { DatasetEntry, Model };

export interface Analysis {
  filename: string;
  description: string;
  generatedTags: string[];
}

export type DatasetMetadata = {
  model: Model["name"];
  context: string;
  analyses: Analysis[];
};
