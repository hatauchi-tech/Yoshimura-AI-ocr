import React, { useState } from 'react';
import { DEFAULT_TEMPLATES } from './constants';
import { Template, ProcessedDocument, AppTab, ExtractedData } from './types';
import { analyzeDocument } from './services/geminiService';
import TemplateManager from './components/TemplateManager';
import UploadZone from './components/UploadZone';
import VerificationView from './components/VerificationView';
import InstructionView from './components/InstructionView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [templates, setTemplates] = useState<Template[]>(DEFAULT_TEMPLATES);
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Template Handlers
  const handleSaveTemplate = (tpl: Template) => {
    setTemplates(prev => {
      const idx = prev.findIndex(t => t.id === tpl.id);
      if (idx >= 0) {
        const newArr = [...prev];
        newArr[idx] = tpl;
        return newArr;
      }
      return [...prev, tpl];
    });
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

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
      // Step 1: Identify and Extract using Gemini 3.0
      const result = await analyzeDocument(doc.file, templates);
      
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
             <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-indigo-500">汎用 AI-OCR</span>
          </div>
          
          <nav className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab(AppTab.DASHBOARD)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === AppTab.DASHBOARD ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ダッシュボード
            </button>
            <button 
              onClick={() => setActiveTab(AppTab.TEMPLATES)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === AppTab.TEMPLATES ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              テンプレート管理
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
              <h2 className="text-xl font-bold text-slate-800 mb-4">最近の処理</h2>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                 {documents.length === 0 ? (
                   <div className="p-12 text-center text-slate-400">
                     処理された書類はまだありません。ファイルをアップロードしてください。
                   </div>
                 ) : (
                   <table className="min-w-full divide-y divide-slate-200">
                     <thead className="bg-slate-50">
                       <tr>
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
                             <td className="px-6 py-4 whitespace-nowrap">
                               <div className="flex items-center">
                                 <div className="h-10 w-10 flex-shrink-0">
                                   <img className="h-10 w-10 rounded object-cover border" src={doc.previewUrl} alt="" />
                                 </div>
                                 <div className="ml-4">
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

        {activeTab === AppTab.TEMPLATES && (
          <div className="animate-fade-in">
            <TemplateManager 
              templates={templates} 
              onSave={handleSaveTemplate}
              onDelete={handleDeleteTemplate}
            />
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