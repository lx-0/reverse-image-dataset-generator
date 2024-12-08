import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

export async function generateDescription(
  context: string,
  base64Image: string,
): Promise<string> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const ReverseImageGenerationResponse = z.object({
      imageRecognitionDescription: z.string(),
      imageGenerationPrompt: z.string(),
    });

    const hasContext = context.trim() !== "";

    const prompt = `You are a image generation prompt engineer. Please describe the provided image in detail, focusing on visual elements that would be important for regenerating a similar image. ${hasContext ? ` Integrate the provided additional context while describing the image, as this is important for the image generation: ${context}.\n\n` : ""}Then generate an optimized short prompt which would be used to generate the image${hasContext ? `, but also integrate the additional context in the generated prompt as well` : ""}.\n\nBe specific but concise.`;

    console.log("Prompt:", prompt);

    const response = await openai.beta.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: zodResponseFormat(
        ReverseImageGenerationResponse,
        "reverse_image_generation",
      ),
      // max_tokens: 200,
      temperature: 0.7,
    });

    const reverse_image_generation_response = response.choices[0].message;

    if (reverse_image_generation_response.parsed) {
      // console.log("Raw resonse:", reverse_image_generation_response.parsed);
      return reverse_image_generation_response.parsed.imageGenerationPrompt;
    } else if (reverse_image_generation_response.refusal) {
      // handle refusal
      console.error(
        "Error generating description:",
        reverse_image_generation_response.refusal,
      );
    }

    return "Failed to analyze image with AI.";
  } catch (error) {
    console.error("Error generating description:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    // Return a more specific fallback message
    return "Failed to analyze image with AI.";
  }
}
