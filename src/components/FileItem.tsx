
import React from 'react';
import { UploadedFile } from '../types';
import { FileIcon, CheckIcon, TrashIcon } from './icons';

interface FileItemProps {
  file: UploadedFile;
  onDelete: () => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const timeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " min ago";
  return Math.floor(seconds) + " seconds ago";
};

export const FileItem: React.FC<FileItemProps> = ({ file, onDelete }) => {
  const isCompleted = file.progress === 100;
  
  return (
    <div className="mt-4 p-3 border border-gray-200 rounded-lg flex items-center space-x-4">
      <div className="flex-shrink-0 bg-gray-100 p-2 rounded-md">
        <FileIcon className="w-6 h-6 text-gray-600" />
      </div>
      <div className="flex-grow">
        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
        <div className="flex items-center text-xs text-gray-500 space-x-2">
          <span>{formatBytes(file.size)}</span>
          <span className="text-gray-300">•</span>
          <span>Uploaded {timeAgo(file.timestamp)}</span>
        </div>
        {!isCompleted && (
          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
            <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${file.progress}%` }}></div>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {isCompleted ? (
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckIcon className="w-4 h-4 text-green-600" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-blue-500 animate-spin"></div>
        )}
        <button onClick={onDelete} className="text-gray-500 hover:text-red-600">
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
