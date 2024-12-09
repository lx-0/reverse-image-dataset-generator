import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import type { Model } from "../types";
import { extractMessageFromUnknownError } from "../utils";

export const ReverseImageGenerationResponseSchema = z.object({
  imageRecognitionDescription: z.string(),
  imageGenerationPrompt: z.string(),
  imageTags: z.array(z.string()),
});

export type ReverseImageGenerationResponse = z.infer<
  typeof ReverseImageGenerationResponseSchema
>;

export type ReverseImageGenerationMetadata = {
  model: Model["name"];
  prompt: string;
  temperature: number;
  seed: number;
  /**
   * This fingerprint represents the backend configuration that the model runs with.
   *
   * Can be used in conjunction with the seed request parameter to understand when
   * backend changes have been made that might impact determinism.
   */
  systemFingerprint?: string;
  /**
   * Usage statistics for the completion request.
   */
  usage?: OpenAI.Completions.CompletionUsage;
};

export type GenerateDescriptionResponse =
  | {
      ok: true;
      data: ReverseImageGenerationResponse;
      metadata: ReverseImageGenerationMetadata;
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
    const temperature = 0.7;
    const seed = 42;

    console.log("Prompt:", { prompt, temperature });

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
        "reverse_image_dataset_generation",
      ),
      // max_tokens: 200,
      temperature,
      seed,
      // ...(model !== "o1-mini" && { temperature }), // 'o1-mini' only supports default temperature 1.0
    });

    const reverse_image_dataset_generation = response.choices[0].message;

    if (reverse_image_dataset_generation.parsed) {
      // console.log("Raw resonse:", reverse_image_dataset_generation.parsed);
      return {
        ok: true,
        data: reverse_image_dataset_generation.parsed,
        metadata: {
          model,
          prompt,
          temperature,
          seed,
          usage: response.usage,
          systemFingerprint: response.system_fingerprint,
        },
      };
    } else if (reverse_image_dataset_generation.refusal) {
      // handle refusal
      console.error(
        "Error generating description:",
        reverse_image_dataset_generation.refusal,
      );

      return {
        ok: false,
        message: "Failed to analyze image.",
        error: new Error(
          `Error generating description: ${reverse_image_dataset_generation.refusal}`,
        ),
      };
    }

    return {
      ok: false,
      message: "Failed to analyze image.",
      error: new Error("Unknown"),
    };
  } catch (error) {
    console.error(
      `Failed to analyze image: ${extractMessageFromUnknownError(error)}`,
      error,
    );
    return {
      ok: false,
      message: `Failed to analyze image: ${extractMessageFromUnknownError(error)}`,
      error,
    };
  }
}
