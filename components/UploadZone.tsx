import React, { useCallback } from 'react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected }) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files).filter((f: File) => 
        f.type.startsWith('image/') || f.type === 'application/pdf'
      );
      onFilesSelected(filesArray);
    }
  }, [onFilesSelected]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
    }
  };

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer group"
    >
      <input 
        type="file" 
        multiple 
        accept="image/*,application/pdf" 
        className="hidden" 
        id="file-upload"
        onChange={handleChange}
      />
      <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="bg-blue-100 p-4 rounded-full group-hover:bg-blue-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="text-lg font-medium text-slate-700">ここにファイルをドロップ</p>
            <p className="text-sm text-slate-500 mt-1">またはクリックして選択 (PDF, JPEG, PNG)</p>
          </div>
        </div>
      </label>
    </div>
  );
};

export default UploadZone;
