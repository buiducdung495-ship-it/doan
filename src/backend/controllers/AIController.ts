import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini SDK lazily to avoid startup crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getAIClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return aiClient;
}

export class AIController {
  static async summarizeDocument(req: Request, res: Response) {
    try {
      const { content } = req.body;
      const ai = getAIClient();
      
      if (!ai) {
        return res.json({ 
          summary: "Chưa cấu hình API Key. Đây là bản tóm tắt mẫu: Tài liệu đề cập đến các thay đổi nhân sự và ngân sách dự kiến."
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Tóm tắt nội dung tài liệu sau đây bằng tiếng Việt trong 1 đoạn văn ngắn (dưới 100 từ):\n\n${content}`
      });

      res.json({ summary: response.text });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async extractOCR(req: Request, res: Response) {
    try {
      const { text } = req.body;
      const ai = getAIClient();
      
      if (!ai) {
        return res.json({ 
          extractedData: {
            company: "CÔNG TY ABC (Mẫu)",
            amount: 1000000,
            date: "15/05/2026"
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Trích xuất thông tin từ đoạn văn bản OCR sau và trả về định dạng JSON (chỉ JSON) với các field: 'company', 'amount' (số), 'date'.\n\n${text}`
      });

      let jsonStr = response.text || "{}";
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/, '').replace(/```\n?$/, '');
      }

      res.json({ extractedData: JSON.parse(jsonStr) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async analyzeImage(req: Request, res: Response) {
    try {
      const { imageBase64, mimeType } = req.body;
      const ai = getAIClient();
      
      if (!ai) {
        return res.json({ 
          text: "Chưa cấu hình API Key. Đây là nội dung mẫu được quét từ hình ảnh." 
        });
      }

      // Remove the prefix "data:image/jpeg;base64," if present
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          "Vui lòng trích xuất toàn bộ văn bản có trong hình ảnh này. Chỉ trả về phần văn bản trích xuất được.",
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType || 'image/jpeg'
            }
          }
        ]
      });

      res.json({ text: response.text });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
