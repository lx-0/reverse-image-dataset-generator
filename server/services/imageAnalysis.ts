import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import type { Model } from "../types";

export const ReverseImageGenerationResponseSchema = z.object({
  imageRecognitionDescription: z.string(),
  imageGenerationPrompt: z.string(),
  imageTags: z.array(z.string()),
});

export type ReverseImageGenerationResponse = z.infer<
  typeof ReverseImageGenerationResponseSchema
>;

export type GenerateDescriptionResponse =
  | {
      ok: true;
      data: ReverseImageGenerationResponse;
    }
  | {
      ok: false;
      message: string;
      error: unknown;
    };

export async function generateDescription(
  model: Model["name"],
  context: string,
  base64Image: string,
): Promise<GenerateDescriptionResponse> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const hasContext = context.trim() !== "";

    const prompt = `You are a image generation prompt engineer. Your task is to generate datasets to train a diffusion model to generate certain images when referring to the user-provided context in the input prompt.\n\nPlease describe the provided image in detail, focusing on visual elements that would be important for regenerating a similar image. If people are involved, also describe their visible emotions and feelings. Also generate tags matching the description. ${hasContext ? `Integrate the user-provided context in the description and the tags while describing the image, as this is important for the image generation. If characters, places or things are mentioned in the user-provided context, ensure to include them in the tags list as well. ` : ""}Then generate an optimized short prompt which would be used to generate the image${hasContext ? `, but also integrate the user-provided context in the generated prompt as well` : ""}. Be specific but concise!${hasContext ? `\n\nThe user-provided context is:\n\n\`\`\`context\n${context}\n\`\`\`\n\nIMPORTANT: Ensure to integrate the user-provided context in the image description, the tags and the image generation prompt. The generated image generation prompt is later used to train the image generation model to produce similar images using the user-provided context. Therefore, while generating the image description, the tags and the image generation prompt, refer to all entities mentioned in the user-provided context EXPLICITLY BY THEIR GIVEN NAMES, AVOIDING GENERIC PHRASES like "a person named [name]."!!` : ""}`;

    console.log("Prompt:", prompt);

    const response = await openai.beta.chat.completions.parse({
      model,
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
        ReverseImageGenerationResponseSchema,
        "reverse_image_generation",
      ),
      // max_tokens: 200,
      temperature: 0.7,
    });

    const reverse_image_generation_response = response.choices[0].message;

    if (reverse_image_generation_response.parsed) {
      // console.log("Raw resonse:", reverse_image_generation_response.parsed);
      return { ok: true, data: reverse_image_generation_response.parsed };
    } else if (reverse_image_generation_response.refusal) {
      // handle refusal
      console.error(
        "Error generating description:",
        reverse_image_generation_response.refusal,
      );

      return {
        ok: false,
        message: "Failed to analyze image with AI.",
        error: new Error(
          `Error generating description: ${reverse_image_generation_response.refusal}`,
        ),
      };
    }

    return {
      ok: false,
      message: "Failed to analyze image with AI.",
      error: new Error("Unknown"),
    };
  } catch (error) {
    console.error("Error generating description:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    // Return a more specific fallback message
    return {
      ok: false,
      message: "Failed to analyze image with AI.",
      error,
    };
  }
}
