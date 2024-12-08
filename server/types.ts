export interface Analysis {
  filename: string;
  description: string;
  generatedTags: string[];
}

export type DatasetMetadata = { context: string; analyses: Analysis[] };
