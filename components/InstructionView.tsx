import React from 'react';

const InstructionView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-12">
      <div className="text-center space-y-4 pt-4">
        <h1 className="text-3xl font-bold text-slate-900">AI-OCRアプリ 取扱説明書</h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          Gemini 3.0 を活用して、帳票をデジタル化・構造化する手順をご案内します。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Step 1 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xl flex items-center justify-center mb-4">1</div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">帳票のアップロード</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
            「ダッシュボード」画面のアップロードエリアに、PDFまたは画像ファイル（JPEG/PNG）をドラッグ＆ドロップします。複数ファイルの同時処理も可能です。
          </p>
          <div className="bg-slate-50 rounded border border-slate-100 p-4 flex justify-center items-center h-32">
            <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xl flex items-center justify-center mb-4">2</div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">データの確認・修正</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
            AI解析が完了したら「確認・修正」ボタンを押します。原本と抽出データを見比べ、必要に応じて修正してください。明細行の追加・削除も可能です。
          </p>
          <div className="bg-slate-50 rounded border border-slate-100 p-4 flex justify-center items-center h-32">
            <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xl flex items-center justify-center mb-4">3</div>
          <h3 className="text-xl font-bold text-slate-800 mb-3">統合CSV出力</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
            ダッシュボードで完了した帳票にチェックを入れ、「統合CSV出力」ボタンを押すと、すべてのデータが1つのCSVファイルにマージされて出力されます。
          </p>
          <div className="bg-slate-50 rounded border border-slate-100 p-4 flex justify-center items-center h-32">
             <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionView;