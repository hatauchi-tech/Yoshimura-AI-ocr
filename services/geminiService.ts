import { GoogleGenAI, Type } from "@google/genai";
import { Template, ExtractedData, FieldType, ImageSize } from "../types";
import { MODEL_OCR } from "../constants";

// Helper to convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/xxx;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

const getAiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// ------------------------------------
// OCR & Extraction (Gemini 3.0 Pro)
// ------------------------------------
export const analyzeDocument = async (
  file: File,
  templates: Template[]
): Promise<{ templateId: string | null; data: ExtractedData }> => {
  const ai = getAiClient();
  const base64Data = await fileToBase64(file);

  // Construct a prompt that includes template schemas, handling nested tables
  const templateDescriptions = templates.map(t => {
    const fieldDescs = t.fields.map(f => {
      if (f.type === FieldType.TABLE && f.columns) {
        const colDesc = f.columns.map(c => `  - ${c.key} (${c.type}): ${c.description}`).join('\n');
        return `- ${f.key} (TABLE - 配列として抽出):\n${colDesc}`;
      }
      return `- ${f.key} (${f.type}): ${f.description}`;
    }).join('\n');

    return `ID: ${t.id}\nテンプレート名: ${t.name}\n説明: ${t.description}\nフィールド定義:\n${fieldDescs}`;
  }).join('\n---\n');

  const systemInstruction = `
    あなたは高度な汎用AI-OCRです。
    提供された画像を分析し、最もマッチするテンプレートを選択して、構造化データを抽出してください。
    
    【重要：明細データの抽出について】
    フィールドタイプが "TABLE" の場合、そのフィールドは「オブジェクトの配列」として抽出してください。
    表の各行を配列の1要素とし、各列をオブジェクトのプロパティとしてマッピングしてください。
    明細行が複数ある場合は、漏れなくすべて抽出してください。
    
    テンプレート一覧:
    ${templateDescriptions}
    
    どのテンプレートも明確に一致しない場合は、templateIdを "unknown" としてください。
  `;

  const response = await ai.models.generateContent({
    model: MODEL_OCR,
    contents: {
      parts: [
        { inlineData: { mimeType: file.type, data: base64Data } },
        { text: "この帳票を解析し、JSONデータを出力してください。" }
      ]
    },
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json"
    }
  });

  const text = response.text;
  if (!text) throw new Error("AIからの応答がありません");

  try {
    const result = JSON.parse(text);
    return result;
  } catch (e) {
    console.error("Failed to parse JSON", text);
    throw new Error("AI応答の解析に失敗しました");
  }
};

// ------------------------------------
// Image Editing (Nano Banana / Gemini 2.5 Flash Image)
// ------------------------------------
export const editImageWithPrompt = async (file: File, prompt: string): Promise<string> => {
  const ai = getAiClient();
  const base64Data = await fileToBase64(file);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { 
          inlineData: { 
            mimeType: file.type, 
            data: base64Data 
          } 
        },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("画像編集結果が見つかりませんでした。");
};

// ------------------------------------
// Image Generation (Nano Banana Pro / Gemini 3.0 Pro Image Preview)
// ------------------------------------
export const generateImageWithPrompt = async (prompt: string, size: ImageSize): Promise<string> => {
  // Key selection check for paid model (Veo/Imagen/Pro Image)
  // Check global aistudio object for key selection status
  if (typeof window !== 'undefined' && (window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      throw new Error("API_KEY_REQUIRED");
    }
  }

  // Use a new instance to ensure the selected key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        imageSize: size,
        aspectRatio: '1:1' // Defaulting to 1:1 since UI doesn't provide ratio
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("画像生成結果が見つかりませんでした。");
};