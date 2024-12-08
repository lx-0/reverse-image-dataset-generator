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
          role: "user",
          content: [
            { 
              type: "text", 
              text: context || "Please describe this image in detail, focusing on visual elements that would be important for regenerating a similar image." 
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`
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
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    // Return a more specific fallback message
    return "Failed to analyze image with AI. Using default description.";
  }
}
