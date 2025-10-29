
import React, { useState, useRef, useCallback } from 'react';
import { UploadCloudIcon } from './Icons';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileChange,
  isUploading = false,
  uploadProgress = 0
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File | null) => {
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf' || file.type.includes('document')) && file.size <= 10 * 1024 * 1024) {
      setFileName(file.name);
      onFileChange(file);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setFileName(null);
      setPreviewUrl(null);
      onFileChange(null);
      // Optional: Add user feedback for invalid file
      alert('Please upload a PDF, image, or document file under 10MB.');
    }
  }, [onFileChange]);

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

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleClick = () => {
    fileInputRef.current?.click();
  };
  
  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFileName(null);
    setPreviewUrl(null);
    onFileChange(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200
          ${isDragging ? 'border-blue-500 bg-blue-50 scale-105' : isUploading ? 'border-gray-300 bg-gray-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
          ${isUploading ? 'pointer-events-none' : ''}
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileSelected}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx"
          disabled={isUploading}
        />
        {isUploading ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="w-full max-w-xs">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 mt-1 text-center">
                Uploading... {uploadProgress}%
              </p>
            </div>
          </div>
        ) : (
          <>
            <UploadCloudIcon className="w-10 h-10 text-gray-400 mb-3"/>
            <p className="text-center text-gray-600">
              {fileName ? (
                  <span className="font-semibold text-blue-600">{fileName}</span>
              ) : (
                  <>
                      <span className="font-semibold text-blue-600">Drag & drop your report card here</span>
                      <br /> or click to browse files
                  </>
              )}
            </p>
            <p className="mt-2 text-xs text-gray-500">PDF, Image, or Document files, maximum 10 MB</p>
          </>
        )}
      </div>

      {fileName && !isUploading && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-start space-x-4">
            {previewUrl ? (
              <div className="flex-shrink-0">
                <img
                  src={previewUrl}
                  alt="File preview"
                  className="w-16 h-16 object-cover rounded-lg border"
                />
              </div>
            ) : (
              <div className="flex-shrink-0">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
              <p className="text-xs text-gray-500">Ready to upload</p>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="flex-shrink-0 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
              title="Remove file"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
