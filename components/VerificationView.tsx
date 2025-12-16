import React, { useState, useEffect } from 'react';
import { ProcessedDocument, Template, ExtractedData, FieldType } from '../types';

interface VerificationViewProps {
  document: ProcessedDocument;
  templates: Template[];
  onUpdate: (docId: string, data: ExtractedData) => void;
  onConfirm: (docId: string) => void;
  onBack: () => void;
}

// Helper to extract value regardless of whether it's raw or { value, box_2d }
const getValue = (data: any): string | number => {
  if (data === null || data === undefined) return '';
  if (typeof data === 'object' && 'value' in data) {
    return data.value;
  }
  return data;
};

// Helper to extract box_2d
const getBox = (data: any): number[] | null => {
  if (data && typeof data === 'object' && Array.isArray(data.box_2d)) {
    return data.box_2d;
  }
  return null;
};

const VerificationView: React.FC<VerificationViewProps> = ({ document: doc, templates, onUpdate, onConfirm, onBack }) => {
  const [formData, setFormData] = useState<ExtractedData>(doc.data || {});
  const [zoom, setZoom] = useState(1);
  const [activeBox, setActiveBox] = useState<number[] | null>(null);
  
  const template = templates.find(t => t.id === doc.templateId);

  useEffect(() => {
    if (doc.data) {
      setFormData(doc.data);
    }
  }, [doc.data]);

  const handleChange = (key: string, newValue: any) => {
    // Preserve box_2d if it exists
    const current = formData[key];
    let updatePayload = newValue;
    
    if (current && typeof current === 'object' && 'value' in current) {
      updatePayload = { ...current, value: newValue };
    }

    const newData = { ...formData, [key]: updatePayload };
    setFormData(newData);
    onUpdate(doc.id, newData); 
  };

  const handleTableChange = (tableKey: string, rowIndex: number, colKey: string, newValue: any) => {
    const currentTable = (formData[tableKey] as any[]) || [];
    const newTable = [...currentTable];
    
    if (!newTable[rowIndex]) newTable[rowIndex] = {};
    
    const currentCell = newTable[rowIndex][colKey];
    let updatePayload = newValue;

    if (currentCell && typeof currentCell === 'object' && 'value' in currentCell) {
        updatePayload = { ...currentCell, value: newValue };
    }

    newTable[rowIndex] = { ...newTable[rowIndex], [colKey]: updatePayload };
    
    const newData = { ...formData, [tableKey]: newTable };
    setFormData(newData);
    onUpdate(doc.id, newData);
  };

  const handleAddRow = (tableKey: string) => {
    const currentTable = (formData[tableKey] as any[]) || [];
    const newData = { ...formData, [tableKey]: [...currentTable, {}] };
    setFormData(newData);
    onUpdate(doc.id, newData);
  };

  const handleRemoveRow = (tableKey: string, rowIndex: number) => {
    const currentTable = (formData[tableKey] as any[]) || [];
    const newTable = currentTable.filter((_, idx) => idx !== rowIndex);
    const newData = { ...formData, [tableKey]: newTable };
    setFormData(newData);
    onUpdate(doc.id, newData);
  };

  const handleFocus = (data: any) => {
    const box = getBox(data);
    setActiveBox(box);
  };

  const handleBlur = () => {
    setActiveBox(null);
  };

  const handleDownloadCSV = () => {
     if (!template) return;
     
     const tableFields = template.fields.filter(f => f.type === FieldType.TABLE);
     const scalarFields = template.fields.filter(f => f.type !== FieldType.TABLE);

     let csvRows: string[] = [];
     
     const headerLabels = scalarFields.map(f => f.label);
     let tableColumns: any[] = [];
     
     if (tableFields.length > 0) {
       const mainTable = tableFields[0];
       if (mainTable.columns) {
         tableColumns = mainTable.columns;
         headerLabels.push(...tableColumns.map(c => `${mainTable.label}:${c.label}`));
       }
     }
     
     csvRows.push(headerLabels.join(','));

     if (tableFields.length > 0) {
        const mainTableKey = tableFields[0].key;
        const rows = (formData[mainTableKey] as any[]) || [{}]; 
        
        rows.forEach(row => {
          const rowData: string[] = [];
          
          scalarFields.forEach(f => {
            let val = getValue(formData[f.key]);
            rowData.push(`"${String(val).replace(/"/g, '""')}"`);
          });
          
          tableColumns.forEach(c => {
             let val = getValue(row[c.key]);
             rowData.push(`"${String(val).replace(/"/g, '""')}"`);
          });
          
          csvRows.push(rowData.join(','));
        });
     } else {
        const rowData = scalarFields.map(f => {
          let val = getValue(formData[f.key]);
          return `"${val !== undefined && val !== null ? String(val).replace(/"/g, '""') : ''}"`;
        });
        csvRows.push(rowData.join(','));
     }
     
     const csvContent = "\uFEFF" + csvRows.join("\n");
     const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `export_${doc.file.name.split('.')[0]}_${Date.now()}.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  if (!template && doc.templateId) {
    return <div className="p-8 text-center">不明なテンプレートID: {doc.templateId}</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="text-slate-500 hover:text-slate-700">
            &larr; 戻る
          </button>
          <h2 className="font-bold text-slate-800 truncate max-w-xs">{doc.file.name}</h2>
          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
             {template ? template.name : '不明なテンプレート'}
          </span>
        </div>
        <div className="space-x-3">
          <button 
            onClick={handleDownloadCSV}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium"
          >
            CSVダウンロード (明細含)
          </button>
          <button 
            onClick={() => onConfirm(doc.id)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            確認・完了
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Document Viewer (50% Width) */}
        <div className="w-1/2 bg-slate-900 relative overflow-hidden flex flex-col border-r border-slate-700">
          {/* Zoom Controls */}
          <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur rounded-lg flex space-x-2 p-1">
            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-2 text-white hover:bg-white/20 rounded">-</button>
            <span className="p-2 text-white text-sm font-mono">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="p-2 text-white hover:bg-white/20 rounded">+</button>
          </div>
          
          <div className="flex-1 overflow-auto flex items-start justify-center p-8">
            <div 
              className="relative shadow-2xl transition-transform duration-200 max-w-none"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            >
              <img 
                src={doc.previewUrl} 
                alt="Document" 
                className="block"
              />
              {/* Highlight Overlay */}
              {activeBox && (
                <div 
                  className="absolute border-2 border-red-500 bg-red-500/20 pointer-events-none transition-all duration-200"
                  style={{
                    top: `${activeBox[0] / 10}%`,
                    left: `${activeBox[1] / 10}%`,
                    height: `${(activeBox[2] - activeBox[0]) / 10}%`,
                    width: `${(activeBox[3] - activeBox[1]) / 10}%`,
                    zIndex: 20
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right: Data Form (50% Width) */}
        <div className="w-1/2 bg-white border-l border-slate-200 overflow-y-auto custom-scrollbar p-6 shadow-xl z-10">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">抽出データ</h3>
          
          {!template ? (
             <div className="text-red-500 p-4 bg-red-50 rounded">
               テンプレートが認識されませんでした。手動でテンプレートを選択するか、データを直接編集してください。
             </div>
          ) : (
             <div className="space-y-6">
               {/* Render Scalar Fields First */}
               {template.fields.filter(f => f.type !== FieldType.TABLE).map((field) => {
                 const fieldData = formData[field.key];
                 return (
                   <div key={field.key} className="group">
                      <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                        {field.label}
                        <span className="text-xs text-slate-400 font-normal">{field.type}</span>
                      </label>
                      <input
                        type={field.type === 'NUMBER' ? 'number' : field.type === 'DATE' ? 'date' : 'text'}
                        value={getValue(fieldData).toString()}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        onFocus={() => handleFocus(fieldData)}
                        onBlur={handleBlur}
                        className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                        placeholder={field.description}
                      />
                   </div>
                 );
               })}

               {/* Render Table Fields */}
               {template.fields.filter(f => f.type === FieldType.TABLE).map((field) => {
                 const rows = (formData[field.key] as any[]) || [];
                 return (
                   <div key={field.key} className="mt-8">
                     <div className="flex justify-between items-end mb-2">
                       <label className="block text-base font-bold text-slate-800">
                         {field.label} <span className="text-xs font-normal text-slate-500">({rows.length} 件)</span>
                       </label>
                       <button onClick={() => handleAddRow(field.key)} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded hover:bg-indigo-100">
                         + 行を追加
                       </button>
                     </div>
                     <div className="overflow-x-auto border border-slate-200 rounded-lg">
                       <table className="min-w-full divide-y divide-slate-200">
                         <thead className="bg-slate-50">
                           <tr>
                             <th className="w-8 px-2 py-2"></th>
                             {field.columns?.map(col => (
                               <th key={col.key} className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider min-w-[100px]">
                                 {col.label}
                               </th>
                             ))}
                           </tr>
                         </thead>
                         <tbody className="bg-white divide-y divide-slate-200">
                           {rows.map((row, rowIndex) => (
                             <tr key={rowIndex}>
                               <td className="px-2 py-2 text-center">
                                 <button onClick={() => handleRemoveRow(field.key, rowIndex)} className="text-red-300 hover:text-red-500">×</button>
                               </td>
                               {field.columns?.map(col => {
                                 const cellData = row[col.key];
                                 return (
                                   <td key={col.key} className="px-2 py-2">
                                     <input 
                                       className="w-full text-sm border-0 border-b border-transparent focus:border-indigo-500 focus:ring-0 px-1 py-1 bg-transparent text-slate-900 hover:bg-slate-50"
                                       value={getValue(cellData).toString()}
                                       onChange={(e) => handleTableChange(field.key, rowIndex, col.key, e.target.value)}
                                       onFocus={() => handleFocus(cellData)}
                                       onBlur={handleBlur}
                                       type={col.type === 'NUMBER' ? 'number' : 'text'}
                                     />
                                   </td>
                                 );
                               })}
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>
                 );
               })}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationView;