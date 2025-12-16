import React, { useState } from 'react';
import { ImageToolType, ImageSize } from '../types';
import { editImageWithPrompt, generateImageWithPrompt, fileToBase64 } from '../services/geminiService';

const ImageTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ImageToolType>(ImageToolType.EDITOR);
  const [prompt, setPrompt] = useState('');
  
  // Editor State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Generator State
  const [genSize, setGenSize] = useState<ImageSize>('1K');

  // Common State
  const [isLoading, setIsLoading] = useState(false);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultImageUrl(null); // Reset result
    }
  };

  const handleExecute = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setResultImageUrl(null);

    try {
      if (activeTab === ImageToolType.EDITOR) {
        if (!selectedFile) {
          throw new Error("編集する画像を選択してください。");
        }
        const result = await editImageWithPrompt(selectedFile, prompt);
        setResultImageUrl(result);
      } else {
        // Generator
        try {
            const result = await generateImageWithPrompt(prompt, genSize);
            setResultImageUrl(result);
        } catch (e: any) {
            if (e.message === "API_KEY_REQUIRED") {
                if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
                    await (window as any).aistudio.openSelectKey();
                    // Retry once after selection
                     const result = await generateImageWithPrompt(prompt, genSize);
                     setResultImageUrl(result);
                } else {
                    throw new Error("APIキーの選択が必要ですが、window.aistudioが見つかりません。");
                }
            } else {
                throw e;
            }
        }
      }
    } catch (err: any) {
      setError(err.message || "予期せぬエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => { setActiveTab(ImageToolType.EDITOR); setError(null); }}
            className={`flex-1 py-4 text-center font-semibold text-sm transition-colors ${
              activeTab === ImageToolType.EDITOR 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            ✨ マジックエディタ (Nano Banana)
          </button>
          <button
            onClick={() => { setActiveTab(ImageToolType.GENERATOR); setError(null); }}
            className={`flex-1 py-4 text-center font-semibold text-sm transition-colors ${
              activeTab === ImageToolType.GENERATOR
                ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-600' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            🎨 画像生成 (Nano Banana Pro)
          </button>
        </div>

        <div className="p-8 flex-1 flex flex-col">
          {activeTab === ImageToolType.EDITOR ? (
            <div className="space-y-6">
               <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
                 画像をアップロードし、変更内容を指示してください。（例：「スケッチ風にする」「赤い帽子を追加する」）
               </div>
               
               <div className="flex flex-col md:flex-row gap-8 items-start">
                 {/* Input Side */}
                 <div className="w-full md:w-1/2 space-y-4">
                    <div className="border-2 border-dashed border-slate-300 rounded-xl h-64 flex items-center justify-center relative bg-slate-50 overflow-hidden group">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-slate-400">画像未選択</span>
                      )}
                      <input type="file" onChange={handleFileSelect} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                      {!previewUrl && (
                          <div className="absolute pointer-events-none flex flex-col items-center">
                              <svg className="w-8 h-8 text-slate-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                              <span className="text-sm text-slate-500">クリックしてアップロード</span>
                          </div>
                      )}
                    </div>
                 </div>

                 {/* Controls */}
                 <div className="w-full md:w-1/2 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">編集指示 (プロンプト)</label>
                      <textarea 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="例：背景を雪の森に変えて..."
                        className="w-full border border-slate-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                      />
                    </div>
                    <button 
                      onClick={handleExecute}
                      disabled={isLoading || !selectedFile || !prompt}
                      className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                        isLoading || !selectedFile || !prompt 
                        ? 'bg-slate-300 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isLoading ? '処理中...' : '編集を実行'}
                    </button>
                 </div>
               </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg text-sm text-purple-800 flex justify-between items-center">
                 <span>高品質な画像をゼロから生成します。有料APIキーの選択が必要です。</span>
                 <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline font-semibold">料金情報</a>
               </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">プロンプト (生成指示)</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="夕暮れ時に空飛ぶ車が行き交う未来都市、サイバーパンクスタイル..."
                  className="w-full border border-slate-300 rounded-lg p-4 h-32 focus:ring-2 focus:ring-purple-500 focus:outline-none text-lg"
                />
                
                <div className="flex items-center space-x-4">
                   <span className="text-sm font-medium text-slate-700">サイズ:</span>
                   {(['1K', '2K', '4K'] as ImageSize[]).map(size => (
                     <button
                       key={size}
                       onClick={() => setGenSize(size)}
                       className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                         genSize === size 
                         ? 'bg-purple-600 text-white border-purple-600' 
                         : 'bg-white text-slate-600 border-slate-300 hover:border-purple-300'
                       }`}
                     >
                       {size}
                     </button>
                   ))}
                </div>

                <button 
                  onClick={handleExecute}
                  disabled={isLoading || !prompt}
                  className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                    isLoading || !prompt 
                    ? 'bg-slate-300 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isLoading ? '生成中...' : '画像を生成'}
                </button>
              </div>
            </div>
          )}

          {/* Result Section */}
          {(resultImageUrl || error) && (
            <div className="mt-8 pt-8 border-t border-slate-100 animate-fade-in">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-100">
                  <strong>エラー:</strong> {error}
                </div>
              )}
              {resultImageUrl && (
                <div className="flex flex-col items-center space-y-4">
                  <h3 className="text-lg font-bold text-slate-800">生成結果</h3>
                  <img src={resultImageUrl} alt="Generated result" className="rounded-lg shadow-xl max-h-[500px] border border-slate-200" />
                  <a 
                    href={resultImageUrl} 
                    download={`generated_${Date.now()}.png`}
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    画像をダウンロード
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageTools;
