import React from 'react';

const InstructionView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-12">
      <div className="text-center space-y-4 pt-4">
        <h1 className="text-3xl font-bold text-slate-900">General AI-OCR 取扱説明書</h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          Gemini 3.0 を活用して、あらゆる帳票をデジタル化・構造化する手順をご案内します。
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
          <h3 className="text-xl font-bold text-slate-800 mb-3">CSVダウンロード</h3>
          <p className="text-slate-600 text-sm leading-relaxed mb-4 flex-1">
            確認画面右上の「CSVダウンロード」を押すと、明細行を含むフラットなCSVが出力されます。Excel等でそのまま集計・管理に利用できます。
          </p>
          <div className="bg-slate-50 rounded border border-slate-100 p-4 flex justify-center items-center h-32">
             <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
        </div>
      </div>

      {/* Advanced Info */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-8">
        <h2 className="text-xl font-bold text-indigo-900 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          テンプレート管理について
        </h2>
        <div className="text-indigo-800 space-y-3">
          <p>
            「テンプレート管理」タブでは、AIが認識する帳票のルールを定義できます。
          </p>
          <ul className="list-disc list-inside ml-4 space-y-2">
            <li>
              <strong>AI識別のコツ:</strong> 「説明」欄には、その帳票固有のタイトルやキーワード（例：「発注書」「株式会社〇〇」）を含めると、AIの自動識別精度が向上します。
            </li>
            <li>
              <strong>明細行の抽出:</strong> データ型に <code>TABLE</code> を指定することで、複数行の明細データを抽出できます（※現在はプリセットテンプレートでの定義参照を推奨）。
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InstructionView;