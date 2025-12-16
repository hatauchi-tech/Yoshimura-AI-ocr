import React, { useState } from 'react';
import { Template, FieldType, TemplateField } from '../types';

interface TemplateManagerProps {
  templates: Template[];
  onSave: (template: Template) => void;
  onDelete: (id: string) => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ templates, onSave, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Template | null>(null);

  const handleCreate = () => {
    const newTemplate: Template = {
      id: `tpl_${Date.now()}`,
      name: '新規テンプレート',
      description: '帳票の構造や特徴を入力してください...',
      fields: []
    };
    setEditForm(newTemplate);
    setEditingId(newTemplate.id);
  };

  const handleEdit = (tpl: Template) => {
    setEditForm(JSON.parse(JSON.stringify(tpl))); // Deep copy
    setEditingId(tpl.id);
  };

  const handleAddField = () => {
    if (!editForm) return;
    const newField: TemplateField = {
      key: `field_${Date.now()}`,
      label: '新規項目',
      type: FieldType.STRING,
      required: false,
      description: '項目の説明'
    };
    setEditForm({
      ...editForm,
      fields: [...editForm.fields, newField]
    });
  };

  const handleFieldChange = (index: number, changes: Partial<TemplateField>) => {
    if (!editForm) return;
    const newFields = [...editForm.fields];
    newFields[index] = { ...newFields[index], ...changes };
    setEditForm({ ...editForm, fields: newFields });
  };

  const handleRemoveField = (index: number) => {
    if (!editForm) return;
    const newFields = [...editForm.fields];
    newFields.splice(index, 1);
    setEditForm({ ...editForm, fields: newFields });
  };

  const handleSave = () => {
    if (editForm) {
      onSave(editForm);
      setEditingId(null);
      setEditForm(null);
    }
  };

  if (editingId && editForm) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">テンプレート編集</h2>
          <div className="space-x-2">
            <button onClick={() => { setEditingId(null); setEditForm(null); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">キャンセル</button>
            <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">保存する</button>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">テンプレート名</label>
            <input 
              value={editForm.name}
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">説明 (AI識別用)</label>
            <textarea 
              value={editForm.description}
              onChange={(e) => setEditForm({...editForm, description: e.target.value})}
              className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              rows={2}
            />
          </div>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800">抽出項目設定</h3>
          <button onClick={handleAddField} className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded-lg flex items-center">
            <span className="mr-1">+</span> 項目追加
          </button>
        </div>

        <div className="space-y-3">
          {editForm.fields.map((field, idx) => (
            <div key={idx} className="flex gap-4 items-start p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 uppercase">項目キー (内部ID)</label>
                    <input 
                      value={field.key} 
                      onChange={(e) => handleFieldChange(idx, { key: e.target.value })}
                      className="w-full bg-white text-slate-900 border border-slate-300 rounded px-2 py-1 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase">表示ラベル</label>
                    <input 
                      value={field.label} 
                      onChange={(e) => handleFieldChange(idx, { label: e.target.value })}
                      className="w-full bg-white text-slate-900 border border-slate-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-4">
                   <div className="col-span-3">
                    <label className="text-xs text-slate-500 uppercase">データ型</label>
                    <select 
                      value={field.type} 
                      onChange={(e) => handleFieldChange(idx, { type: e.target.value as FieldType })}
                      className="w-full bg-white text-slate-900 border border-slate-300 rounded px-2 py-1 text-sm"
                    >
                      {Object.values(FieldType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-span-8">
                    <label className="text-xs text-slate-500 uppercase">AIへの指示 / 説明</label>
                    <input 
                      value={field.description} 
                      onChange={(e) => handleFieldChange(idx, { description: e.target.value })}
                      className="w-full bg-white text-slate-900 border border-slate-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="col-span-1 flex items-end justify-center">
                     <button onClick={() => handleRemoveField(idx)} className="text-red-500 hover:text-red-700 p-1">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                     </button>
                  </div>
                </div>
                
                {/* Visual indicator for TABLE type columns (Read-only for now to keep UI simple) */}
                {field.type === FieldType.TABLE && (
                  <div className="mt-2 pl-4 border-l-2 border-indigo-200">
                    <p className="text-xs font-semibold text-indigo-600 mb-1">テーブル列定義 (自動抽出設定済み):</p>
                    {field.columns ? (
                      <div className="flex flex-wrap gap-2">
                        {field.columns.map(col => (
                          <span key={col.key} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100">
                            {col.label} ({col.type})
                          </span>
                        ))}
                      </div>
                    ) : (
                       <p className="text-xs text-slate-400">列定義なし (またはGUIでの編集未対応)</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">テンプレート管理</h2>
        <button onClick={handleCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          新規作成
        </button>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {templates.map(tpl => (
          <div key={tpl.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow relative">
             <div className="absolute top-4 right-4 flex space-x-2">
               <button onClick={() => handleEdit(tpl)} className="text-slate-400 hover:text-indigo-600">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
               </button>
               <button onClick={() => onDelete(tpl.id)} className="text-slate-400 hover:text-red-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
               </button>
             </div>
             <h3 className="font-bold text-lg text-slate-800 pr-16">{tpl.name}</h3>
             <p className="text-sm text-slate-500 mt-2 mb-4 h-10 overflow-hidden text-ellipsis">{tpl.description}</p>
             <div className="flex flex-wrap gap-2">
               {tpl.fields.slice(0, 3).map(f => (
                 <span key={f.key} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full border border-slate-200">{f.label}</span>
               ))}
               {tpl.fields.length > 3 && <span className="text-xs text-slate-400 py-1">他 {tpl.fields.length - 3} 項目</span>}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateManager;