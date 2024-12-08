export type Model = {
  name: "gpt-4o-mini" | "gpt-4o" | "gpt-4o-2024-11-20"; // | "o1-preview" | "o1-mini"
  title: string;
};

export const MODELS: Model[] = [
  // { name: "o1-preview", title: "o1 preview" }, // 'image_url' is not supported by this model
  // { name: "o1-mini", title: "o1 mini" }, // 'image_url' is not supported by this model
  { name: "gpt-4o-mini", title: "GPT-4o mini" },
  { name: "gpt-4o", title: "GPT-4o" },
  { name: "gpt-4o-2024-11-20", title: "GPT-4o (2024-11-20)" },
];
