import React, { useState, useMemo } from 'react';
import { DEFAULT_TEMPLATES } from './constants';
import { Template, ProcessedDocument, AppTab, ExtractedData } from './types';
import { analyzeDocument } from './services/geminiService';
import { convertPdfToImage } from './services/pdfService';
import UploadZone from './components/UploadZone';
import VerificationView from './components/VerificationView';
import InstructionView from './components/InstructionView';

// Helper to extract value from data structure which might be raw value or { value, box_2d }
const getValue = (data: any): any => {
  if (data === null || data === undefined) return '';
  if (typeof data === 'object' && 'value' in data) {
    return data.value;
  }
  return data;
};

// Robust Date formatter
const formatDate = (val: any): string => {
  // First, extract the actual value using getValue in case a raw object was passed
  const raw = getValue(val);
  const str = String(raw || '');
  if (!str) return '';
  
  // Remove typical Japanese date characters and separators
  // Expected input from AI is yyyyMMdd, but we safeguard against other formats
  let cleaned = str.replace(/[\/\-\.年 月]/g, '').replace(/日/g, '');
  
  // If the AI returned "20231001", cleaned is "20231001"
  // If AI returned "R5.10.1", cleaned might be "R5101" which is hard to parse without complex logic,
  // but we instructed AI to return yyyyMMdd.
  
  return cleaned;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  // Fixed templates for specific use cases
  const [templates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set());

  // Document Processing Handlers
  const handleFilesSelected = async (files: File[]) => {
    const newDocs: ProcessedDocument[] = files.map(f => ({
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file: f,
      previewUrl: URL.createObjectURL(f),
      status: 'pending'
    }));

    setDocuments(prev => [...newDocs, ...prev]);

    // Process immediately (in real app, use a queue)
    for (const doc of newDocs) {
      await processDocument(doc);
    }
  };

  const processDocument = async (doc: ProcessedDocument) => {
    updateDocStatus(doc.id, 'processing');
    try {
      let fileToAnalyze = doc.file;
      let previewUrl = doc.previewUrl;

      // PDF Pre-processing: Convert to Image
      if (doc.file.type === 'application/pdf') {
         try {
           const imageFile = await convertPdfToImage(doc.file);
           fileToAnalyze = imageFile;
           // Update preview URL to the new image so VerificationView shows the image (allowing highlights)
           // and not the original PDF iframe.
           previewUrl = URL.createObjectURL(imageFile);
           
           // Update the document state with the new preview URL
           setDocuments(prev => prev.map(d => 
             d.id === doc.id ? { ...d, previewUrl: previewUrl } : d
           ));
         } catch (conversionError) {
           console.error("PDF Conversion failed", conversionError);
           throw new Error("PDFから画像への変換に失敗しました。");
         }
      }

      // Step 1 & 2: Identify and Extract using Gemini 3.0 (using the image file)
      // The templates defined in constants.ts act as the classification targets.
      const result = await analyzeDocument(fileToAnalyze, templates);
      
      setDocuments(prev => prev.map(d => {
        if (d.id === doc.id) {
          return {
            ...d,
            status: 'review',
            templateId: result.templateId === 'unknown' ? undefined : result.templateId || undefined,
            data: result.data
          };
        }
        return d;
      }));
    } catch (e: any) {
      console.error(e);
      updateDocStatus(doc.id, 'error', e.message);
    }
  };

  const updateDocStatus = (id: string, status: ProcessedDocument['status'], error?: string) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, status, error } : d));
  };

  const handleDocUpdate = (docId: string, data: ExtractedData) => {
    setDocuments(prev => prev.map(d => d.id === docId ? { ...d, data } : d));
  };

  const handleConfirmDoc = (docId: string) => {
    updateDocStatus(docId, 'completed');
    setSelectedDocId(null);
  };

  // Checkbox handlers
  const toggleSelectAll = () => {
    if (selectedForExport.size === documents.length && documents.length > 0) {
      setSelectedForExport(new Set());
    } else {
      // Only select documents that have data
      const ids = documents.filter(d => d.data).map(d => d.id);
      setSelectedForExport(new Set(ids));
    }
  };

  const toggleSelectDoc = (id: string) => {
    const newSet = new Set(selectedForExport);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedForExport(newSet);
  };

  // Unified CSV Export Logic (Step 4: Data Generation)
  const handleUnifiedDownload = () => {
    const targetDocs = documents.filter(d => selectedForExport.has(d.id) && d.data);
    
    if (targetDocs.length === 0) {
      alert("出力する帳票を選択してください。");
      return;
    }

    // Unified Header
    // 受注日,得意先,希望納品日,納品先,品名,ケース,発注番号
    const csvHeader = ["受注日", "得意先", "希望納品日", "納品先", "品名", "ケース", "発注番号"];
    const csvRows: string[][] = [csvHeader];

    targetDocs.forEach(doc => {
      const data = doc.data!;
      const tplId = doc.templateId;

      // Define extraction logic based on template
      let extractedRows: any[] = [];
      
      // Default extraction (if loops below don't run)
      const items = (data['items'] as any[]) || [];
      const loopItems = items.length > 0 ? items : [{}];

      if (tplId === 'tpl_general_po') {
        // 発注書 Mapping
        // 発注日 -> 受注日
        // 発注元 -> 得意先
        // 希望納品日 -> 希望納品日
        // 納品先 -> 納品先
        // 品名及び規格・仕様等(items) -> 品名
        // ケース(items) -> ケース
        // 発注管理番号 -> 発注番号
        loopItems.forEach(item => {
          extractedRows.push({
            order_date: getValue(data['issue_date']),
            customer: getValue(data['client_name']),
            delivery_date: getValue(data['delivery_date']),
            destination: getValue(data['delivery_place']),
            product_name: getValue(item['product_name']),
            cases: getValue(item['quantity']),
            order_number: getValue(data['po_no'])
          });
        });

      } else if (tplId === 'tpl_purchase_order') {
        // 直送仕入商品発注票 Mapping
        // 発注日 -> 受注日
        // 得意先 -> 得意先
        // 摘要 -> 希望納品日
        // 発送先 -> 納品先
        // 品目名称(items) -> 品名
        // 発注箱数(items) -> ケース
        // 発注No. -> 発注番号
        loopItems.forEach(item => {
          extractedRows.push({
            order_date: getValue(data['issue_date']),
            customer: getValue(data['supplier_name']),
            delivery_date: getValue(data['delivery_date']), // This key maps to '摘要' in constants
            destination: getValue(data['delivery_name']),
            product_name: getValue(item['item_name']),
            cases: getValue(item['box_count']),
            order_number: getValue(data['order_no'])
          });
        });

      } else if (tplId === 'tpl_order_form') {
        // 注文書 Mapping
        // 発注日 -> 受注日
        // 発注元 -> 得意先
        // 納期 -> 希望納品日
        // 納品先名 -> 納品先
        // 品名／規格(items) -> 品名
        // ケース数(items) -> ケース
        // 発注No. -> 発注番号
        loopItems.forEach(item => {
          extractedRows.push({
            order_date: getValue(data['order_date']),
            customer: getValue(data['buyer_name']),
            delivery_date: getValue(data['delivery_date']),
            destination: getValue(data['delivery_place']),
            product_name: getValue(item['product_name']),
            cases: getValue(item['case_quantity']),
            order_number: getValue(data['order_no'])
          });
        });

      } else if (tplId === 'tpl_shipping_request') {
        // 出荷依頼書 Mapping
        // 受注日 -> 受注日
        // 依頼元 -> 得意先
        // 納期 -> 希望納品日
        // 納品先 -> 納品先
        // 商品名称(items) -> 品名
        // 個数／入数の上段(items) -> ケース
        // 受注No. -> 発注番号
        loopItems.forEach(item => {
          extractedRows.push({
            order_date: getValue(data['order_date']),
            customer: getValue(data['sender_name']),
            delivery_date: getValue(data['delivery_date']),
            destination: getValue(data['recipient_name']),
            product_name: getValue(item['product_name']),
            cases: getValue(item['case_quantity']),
            order_number: getValue(data['request_no'])
          });
        });

      } else {
        // Fallback for unknown
         extractedRows.push({
             order_date: getValue(data['order_date'] || data['issue_date']),
             customer: getValue(data['customer'] || data['client_name'] || data['buyer_name']),
             delivery_date: getValue(data['delivery_date']),
             destination: getValue(data['destination'] || data['delivery_place']),
             product_name: '',
             cases: '',
             order_number: getValue(data['order_no'] || data['request_no'])
         });
      }

      // Convert extracted rows to CSV lines
      extractedRows.forEach(row => {
        csvRows.push([
          formatDate(row.order_date),
          String(row.customer || '').replace(/"/g, '""'),
          formatDate(row.delivery_date),
          String(row.destination || '').replace(/"/g, '""'),
          String(row.product_name || '').replace(/"/g, '""'),
          String(row.cases || '').replace(/"/g, '""'),
          String(row.order_number || '').replace(/"/g, '""'),
        ].map(v => `"${v}"`)); // Quote all fields
      });
    });

    const csvContent = "\uFEFF" + csvRows.map(r => r.join(',')).join("\n");
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `unified_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Status localization helper
  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending': return '待機中';
      case 'processing': return '処理中';
      case 'review': return '確認待ち';
      case 'completed': return '完了';
      case 'error': return 'エラー';
      default: return status;
    }
  };

  // Render Logic
  const selectedDoc = documents.find(d => d.id === selectedDocId);

  // If viewing a document, show full screen verification
  if (selectedDoc) {
    return (
      <div className="min-h-screen bg-slate-50">
        <VerificationView 
          document={selectedDoc}
          templates={templates}
          onUpdate={handleDocUpdate}
          onConfirm={handleConfirmDoc}
          onBack={() => setSelectedDocId(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab(AppTab.DASHBOARD)}>
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
               <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
             </div>
             <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500">AI-OCRアプリ</span>
          </div>
          
          <nav className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab(AppTab.DASHBOARD)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === AppTab.DASHBOARD ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ダッシュボード
            </button>
            <button 
              onClick={() => setActiveTab(AppTab.INSTRUCTIONS)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === AppTab.INSTRUCTIONS ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              使い方
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === AppTab.DASHBOARD && (
          <div className="space-y-8 animate-fade-in">
            {/* Upload Area */}
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4">書類をインポート</h2>
              <UploadZone onFilesSelected={handleFilesSelected} />
            </section>

            {/* Recent Documents List */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-slate-800">最近の処理</h2>
                {documents.length > 0 && (
                  <button 
                    onClick={handleUnifiedDownload}
                    disabled={selectedForExport.size === 0}
                    className={`flex items-center px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-all
                      ${selectedForExport.size > 0 
                        ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    統合CSV出力 ({selectedForExport.size})
                  </button>
                )}
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 {documents.length === 0 ? (
                   <div className="p-12 text-center text-slate-400">
                     処理された書類はまだありません。ファイルをアップロードしてください。
                   </div>
                 ) : (
                   <table className="min-w-full divide-y divide-slate-200">
                     <thead className="bg-slate-50">
                       <tr>
                         <th className="px-6 py-3 w-4">
                           <input 
                              type="checkbox" 
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                              onChange={toggleSelectAll}
                              checked={documents.length > 0 && selectedForExport.size === documents.length}
                           />
                         </th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ファイル名</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ステータス</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">テンプレート</th>
                         <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">操作</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-slate-200">
                       {documents.map(doc => {
                         const tpl = templates.find(t => t.id === doc.templateId);
                         return (
                           <tr key={doc.id} className="hover:bg-slate-50">
                             <td className="px-6 py-4">
                               <input 
                                  type="checkbox" 
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                  checked={selectedForExport.has(doc.id)}
                                  onChange={() => toggleSelectDoc(doc.id)}
                                  disabled={!doc.data} // Can only export if data exists
                               />
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                               <div className="flex items-center">
                                 <div>
                                   <div className="text-sm font-medium text-slate-900">{doc.file.name}</div>
                                   <div className="text-sm text-slate-500">{(doc.file.size / 1024).toFixed(1)} KB</div>
                                 </div>
                               </div>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                  ${doc.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                    doc.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 
                                    doc.status === 'error' ? 'bg-red-100 text-red-800' :
                                    'bg-indigo-100 text-indigo-800'}`}>
                                  {getStatusLabel(doc.status)}
                                </span>
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                               {tpl ? tpl.name : doc.templateId === 'unknown' ? <span className="text-red-500">不明</span> : '-'}
                             </td>
                             <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                               {doc.status !== 'processing' && (
                                 <button onClick={() => setSelectedDocId(doc.id)} className="text-indigo-600 hover:text-indigo-900">
                                   {doc.status === 'completed' ? '詳細' : '確認・修正'}
                                 </button>
                               )}
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                 )}
              </div>
            </section>
          </div>
        )}

        {activeTab === AppTab.INSTRUCTIONS && (
          <InstructionView />
        )}

      </main>
    </div>
  );
};

export default App;