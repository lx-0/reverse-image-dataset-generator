export interface ImageFile {
  file: File;
  preview: string;
  name: string;
}

export interface DatasetEntry {
  task_type: "text_to_image";
  instruction: string;
  input_images: string[];
  output_image: string;
}
