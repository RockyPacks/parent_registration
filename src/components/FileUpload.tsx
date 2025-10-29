
import React, { useState, useCallback } from 'react';
import { UploadCloudIcon } from './icons';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  title?: string;
  variant?: 'default' | 'button';
  small?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, title, variant = 'default', small = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, [onFileUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  };

  if (variant === 'button') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-center">
        <UploadCloudIcon className="mx-auto h-6 w-6 text-blue-400 mb-1" />
        <p className="text-sm font-medium text-gray-700 mb-1">{title || 'Upload Document'}</p>
        <label className="cursor-pointer bg-blue-600 text-white text-sm font-medium py-1 px-3 rounded hover:bg-blue-700 transition-colors inline-block">
          Choose Files
          <input type="file" multiple className="hidden" onChange={handleFileChange} />
        </label>
        <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG - max 5MB</p>
      </div>
    );
  }

  if (small) {
    return (
        <div className="relative border border-gray-300 rounded-md p-2 flex items-center justify-between hover:bg-gray-50">
            <p className="text-sm font-medium text-gray-700">{title}</p>
            <UploadCloudIcon className="w-4 h-4 text-gray-500"/>
            <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
        </div>
    )
  }

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative bg-gray-50 border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors ${
        isDragging ? 'border-blue-500 bg-blue-100' : 'border-gray-300'
      }`}
    >
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileChange}
      />
      <div className="flex flex-col items-center">
        <UploadCloudIcon className="h-10 w-10 text-gray-400 mb-3" />
        <p className="text-gray-700 font-semibold">Drop your file here</p>
        <p className="text-sm text-gray-500">or <span className="text-blue-600 font-medium">click to browse</span></p>
        <p className="text-xs text-gray-500 mt-4">PDF, JPG, PNG up to 5MB</p>
      </div>
    </div>
  );
};
