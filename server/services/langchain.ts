import { OpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

const model = new OpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  temperature: 0.7,
});

const template = `Context: {context}

You are analyzing an image that would be generated based on the above context.
Describe the image in a way that would be suitable as a text-to-image generation prompt.
Be specific but concise. Focus on visual details that would be important for image generation.

Your description should be a single paragraph without any prefixes or explanations.`;

const prompt = new PromptTemplate({
  template,
  inputVariables: ["context"],
});

export async function generateDescription(context: string, imagePath: string): Promise<string> {
  try {
    const formattedPrompt = await prompt.format({
      context: context || "This is an image from a dataset",
    });

    const result = await model.call(formattedPrompt);
    return result.trim();
  } catch (error) {
    console.error("Error generating description:", error);
    return "An image from the dataset";
  }
}
