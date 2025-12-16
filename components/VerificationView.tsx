import React, { useState, useEffect } from 'react';
import { ProcessedDocument, Template, ExtractedData, FieldType } from '../types';

interface VerificationViewProps {
  document: ProcessedDocument;
  templates: Template[];
  onUpdate: (docId: string, data: ExtractedData) => void;
  onConfirm: (docId: string) => void;
  onBack: () => void;
}

const VerificationView: React.FC<VerificationViewProps> = ({ document: doc, templates, onUpdate, onConfirm, onBack }) => {
  const [formData, setFormData] = useState<ExtractedData>(doc.data || {});
  const [zoom, setZoom] = useState(1);
  
  const template = templates.find(t => t.id === doc.templateId);

  useEffect(() => {
    if (doc.data) {
      setFormData(doc.data);
    }
  }, [doc.data]);

  const handleChange = (key: string, value: any) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);
    onUpdate(doc.id, newData); // Sync to parent state
  };

  const handleTableChange = (tableKey: string, rowIndex: number, colKey: string, value: any) => {
    const currentTable = (formData[tableKey] as any[]) || [];
    const newTable = [...currentTable];
    if (!newTable[rowIndex]) newTable[rowIndex] = {};
    newTable[rowIndex] = { ...newTable[rowIndex], [colKey]: value };
    
    handleChange(tableKey, newTable);
  };

  const handleAddRow = (tableKey: string) => {
    const currentTable = (formData[tableKey] as any[]) || [];
    handleChange(tableKey, [...currentTable, {}]);
  };

  const handleRemoveRow = (tableKey: string, rowIndex: number) => {
    const currentTable = (formData[tableKey] as any[]) || [];
    const newTable = currentTable.filter((_, idx) => idx !== rowIndex);
    handleChange(tableKey, newTable);
  };

  // Advanced CSV generation handling nested tables
  const handleDownloadCSV = () => {
     if (!template) return;
     
     // Detect if we have any table fields
     const tableFields = template.fields.filter(f => f.type === FieldType.TABLE);
     const scalarFields = template.fields.filter(f => f.type !== FieldType.TABLE);

     let csvRows: string[] = [];
     
     // Construct Header
     // Strategy: If there's a table, we flatten the CSV: Scalar Columns + Table Columns
     // If multiple tables, we might just take the first one or this gets complex. Assuming single main detail table for now.
     
     const headerLabels = scalarFields.map(f => f.label);
     let tableColumns: any[] = [];
     
     if (tableFields.length > 0) {
       // Use the first table for the main flattened structure
       const mainTable = tableFields[0];
       if (mainTable.columns) {
         tableColumns = mainTable.columns;
         headerLabels.push(...tableColumns.map(c => `${mainTable.label}:${c.label}`));
       }
     }
     
     csvRows.push(headerLabels.join(','));

     // Construct Body
     if (tableFields.length > 0) {
        const mainTableKey = tableFields[0].key;
        const rows = (formData[mainTableKey] as any[]) || [{}]; // At least one row if empty
        
        rows.forEach(row => {
          const rowData: string[] = [];
          
          // Add scalar data (repeated for each line item)
          scalarFields.forEach(f => {
            let val = formData[f.key];
            if (val === undefined || val === null) val = '';
            rowData.push(`"${String(val).replace(/"/g, '""')}"`);
          });
          
          // Add table column data
          tableColumns.forEach(c => {
             let val = row[c.key];
             if (val === undefined || val === null) val = '';
             rowData.push(`"${String(val).replace(/"/g, '""')}"`);
          });
          
          csvRows.push(rowData.join(','));
        });
     } else {
        // Simple scalar row
        const rowData = scalarFields.map(f => {
          let val = formData[f.key];
          return `"${val !== undefined && val !== null ? String(val).replace(/"/g, '""') : ''}"`;
        });
        csvRows.push(rowData.join(','));
     }
     
     const csvContent = "\uFEFF" + csvRows.join("\n"); // Add BOM for Excel compatibility
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
        {/* Left: Image Viewer */}
        <div className="flex-1 bg-slate-900 relative overflow-hidden flex flex-col">
          <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur rounded-lg flex space-x-2 p-1">
            <button onClick={() => setZoom(Math.max(0.5, zoom - 0.25))} className="p-2 text-white hover:bg-white/20 rounded">-</button>
            <span className="p-2 text-white text-sm font-mono">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(Math.min(3, zoom + 0.25))} className="p-2 text-white hover:bg-white/20 rounded">+</button>
          </div>
          <div className="flex-1 overflow-auto p-8 flex items-start justify-center">
            <img 
              src={doc.previewUrl} 
              alt="Document" 
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
              className="shadow-2xl transition-transform duration-200 max-w-none"
            />
          </div>
        </div>

        {/* Right: Data Form */}
        <div className="w-[600px] bg-white border-l border-slate-200 overflow-y-auto custom-scrollbar p-6 shadow-xl z-10">
          <h3 className="text-lg font-bold text-slate-800 mb-6 border-b pb-2">抽出データ</h3>
          
          {!template ? (
             <div className="text-red-500 p-4 bg-red-50 rounded">
               テンプレートが認識されませんでした。手動でテンプレートを選択するか、データを直接編集してください。
             </div>
          ) : (
             <div className="space-y-6">
               {/* Render Scalar Fields First */}
               {template.fields.filter(f => f.type !== FieldType.TABLE).map((field) => (
                 <div key={field.key} className="group">
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                      {field.label}
                      <span className="text-xs text-slate-400 font-normal">{field.type}</span>
                    </label>
                    <input
                      type={field.type === 'NUMBER' ? 'number' : field.type === 'DATE' ? 'date' : 'text'}
                      value={formData[field.key]?.toString() || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="w-full bg-white text-slate-900 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
                      placeholder={field.description}
                    />
                 </div>
               ))}

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
                               {field.columns?.map(col => (
                                 <td key={col.key} className="px-2 py-2">
                                   <input 
                                     className="w-full text-sm border-0 border-b border-transparent focus:border-indigo-500 focus:ring-0 px-1 py-1 bg-transparent text-slate-900 hover:bg-slate-50"
                                     value={row[col.key] || ''}
                                     onChange={(e) => handleTableChange(field.key, rowIndex, col.key, e.target.value)}
                                     type={col.type === 'NUMBER' ? 'number' : 'text'}
                                   />
                                 </td>
                               ))}
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