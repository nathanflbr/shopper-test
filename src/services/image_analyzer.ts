import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { removeMimeBase64 } from "../utils/validade.js";

export class ImageAnalyzer {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async extractValueFromImage(imageBase64: string): Promise<number> {
    const model: GenerativeModel = this.genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
    const prompt =
      "Extract the numeric value of the measurement shown in this image. and return only the number";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: await removeMimeBase64(imageBase64),
          mimeType: "image/jpeg",
        },
      },
    ]);
    const response = await result.response;
    const value = parseFloat(response.text());

    return isNaN(value) ? 0 : value;
  }
}
