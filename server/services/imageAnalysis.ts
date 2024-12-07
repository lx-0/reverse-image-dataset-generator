import OpenAI from 'openai';
import fs from "fs/promises";

const SYSTEM_PROMPT = `You are an expert at describing images for text-to-image generation. 
Given an image, provide a detailed description that could be used to regenerate a similar image.
Focus on visual details, composition, and style. Be specific but concise.
Your response should be a single paragraph without any prefixes or explanations.`;

export async function generateDescription(context: string, imagePath: string): Promise<string> {
  console.log(`Generating description for image: ${imagePath}`);
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const imageBuffer = await fs.readFile(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Additional context: ${context || "This is an image from a dataset"}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "auto"
              }
            }
          ]
        }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || "An image from the dataset";
  } catch (error) {
    console.error("Error generating description:", error);
    return "An image from the dataset";
  }
}