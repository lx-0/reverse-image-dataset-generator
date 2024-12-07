import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import fs from "fs/promises";

const SYSTEM_PROMPT = `You are an expert at describing images for text-to-image generation. 
Given an image, provide a detailed description that could be used to regenerate a similar image.
Focus on visual details, composition, and style. Be specific but concise.
Your response should be a single paragraph without any prefixes or explanations.`;

export async function analyzeImage(context: string, imagePath: string): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is required for image analysis");
    }

    const model = new ChatOpenAI({
      modelName: "gpt-4-vision-preview",
      maxTokens: 200,
      temperature: 0.7,
    });

    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const messages = [
      new SystemMessage(SYSTEM_PROMPT),
      new HumanMessage({
        content: [
          {
            type: "text",
            text: `Additional context: ${context || "This is an image from a dataset"}`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: "high"
            }
          }
        ],
      }),
    ];

    const result = await model.invoke(messages);
    return result.content as string;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : String(error)}`);
  }
}
