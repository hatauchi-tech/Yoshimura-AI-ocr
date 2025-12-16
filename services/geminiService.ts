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

    return `ID: ${t.id}\nテンプレート名: ${t.name}\n特徴・説明: ${t.description}\nフィールド定義:\n${fieldDescs}`;
  }).join('\n---\n');

  const systemInstruction = `
    あなたは帳票処理の専門AIです。
    提供された画像を分析し、以下のステップで処理を実行してください。

    ステップ1: テンプレート識別
    画像の「タイトル」や「レイアウト」を注意深く分析し、提供されたテンプレート定義の中で最も適切なものを1つ選んでください。
    特に「注文書」「発注書」「出荷依頼書」「直送仕入商品発注票」などのタイトル文字を優先して識別してください。
    最も一致するテンプレートのIDを "templateId" として出力してください。
    もしどれも一致しない場合は "unknown" としてください。

    ステップ2: データ抽出
    選択したテンプレートのフィールド定義に基づいて、データを抽出してください。
    
    【重要：日付形式 (STRING型として抽出)】
    フィールドの説明に「yyyyMMdd形式」とある場合は、画像内の日付（例：「R5.10.1」「2023/10/01」「10月1日」など）を必ず "yyyyMMdd" 形式の半角数字文字列（例: "20231001"）に変換して抽出してください。
    
    【重要：データ出力形式】
    すべての抽出フィールドについて、以下のJSON形式で出力してください。
    位置情報（box_2d）も含めてください。
    
    {
      "templateId": "選択したテンプレートID",
      "data": {
        "key_name": {
          "value": (抽出された値),
          "box_2d": [ymin, xmin, ymax, xmax] (正規化座標 0-1000)
        },
        ...
        "table_key": [
           { 
             "col_key": { "value": "...", "box_2d": [...] },
             ...
           }
        ]
      }
    }

    テンプレート定義一覧:
    ${templateDescriptions}
  `;

  const response = await ai.models.generateContent({
    model: MODEL_OCR,
    contents: {
      parts: [
        { inlineData: { mimeType: file.type, data: base64Data } },
        { text: "この帳票を解析し、指定されたJSON形式で結果を出力してください。" }
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
  if (typeof window !== 'undefined' && (window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      throw new Error("API_KEY_REQUIRED");
    }
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        imageSize: size,
        aspectRatio: '1:1'
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