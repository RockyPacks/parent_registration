
import React from 'react';
import { DocumentCategory, CategoryStatus } from '../types/index';
import { CheckIcon, AlertTriangleIcon, CircleIcon } from './Icons';

interface UploadSummaryProps {
  categories: DocumentCategory[];
  uploadedFiles?: any[];
}

const StatusCard: React.FC<{ category: DocumentCategory; uploadedFiles?: any[] }> = ({ category, uploadedFiles = [] }) => {
  let bgColor = 'bg-white';
  let borderColor = 'border-gray-300';
  let textColor = 'text-gray-700';
  let icon: React.ReactNode;
  let filesText = "";

  // Count actual uploaded files for this category
  const getCategoryFileCount = (categoryId: string) => {
    const mapping: Record<string, string[]> = {
      'proofOfAddress': ['proof_of_address'],
      'idDocuments': ['id_document'],
      'payslips': ['payslip'],
      'bankStatements': ['bank_statement'],
      'academicHistory': ['academic_history']
    };

    const types = mapping[categoryId] || [];
    return uploadedFiles.filter(file => types.includes(file.document_type)).length;
  };

  const actualFileCount = getCategoryFileCount(category.id);

  // Get requirements for this category
  const getCategoryRequirements = (categoryId: string) => {
    const requirements: Record<string, number> = {
      'proofOfAddress': 1,
      'idDocuments': 2,
      'payslips': 3,
      'bankStatements': 1,
      'academicHistory': 1
    };
    return requirements[categoryId] || 1;
  };

  const requiredCount = getCategoryRequirements(category.id);
  const remainingCount = Math.max(0, requiredCount - actualFileCount);

  switch (category.status) {
    case CategoryStatus.Completed:
      bgColor = 'bg-green-50';
      borderColor = 'border-green-300';
      textColor = 'text-green-800';
      icon = <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"><CheckIcon className="w-3 h-3 text-white" /></div>;
      filesText = `${actualFileCount}/${requiredCount} uploaded`;
      break;
    case CategoryStatus.InProgress:
      bgColor = 'bg-yellow-50';
      borderColor = 'border-yellow-400';
      textColor = 'text-yellow-800';
      icon = <AlertTriangleIcon className="w-5 h-5 text-yellow-500" />;
      filesText = `${actualFileCount}/${requiredCount} uploaded (${remainingCount} remaining)`;
      break;
    case CategoryStatus.NotStarted:
      textColor = 'text-gray-500';
      icon = <CircleIcon className="w-5 h-5 text-gray-400" />;
      filesText = `0/${requiredCount} uploaded (${requiredCount} remaining)`;
      break;
  }

  return (
    <div className={`p-4 border rounded-lg flex-1 ${bgColor} ${borderColor}`}>
      <div className="flex items-center">
        {icon}
        <span className="ml-2 font-semibold">{category.title}</span>
      </div>
      <p className={`text-sm mt-1 ml-7 ${textColor}`}>{filesText}</p>
    </div>
  );
};

export const UploadSummary: React.FC<UploadSummaryProps> = ({ categories, uploadedFiles = [] }) => {
  const completedCount = categories.filter(c => c.status === CategoryStatus.Completed).length;
  const totalCount = categories.length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h3 className="text-lg font-semibold text-gray-800">Upload Summary</h3>
        <span className="text-sm font-medium text-gray-600">{completedCount} of {totalCount} required categories completed</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map(cat => (
          <StatusCard key={cat.id} category={cat} uploadedFiles={uploadedFiles} />
        ))}
      </div>
    </div>
  );
};
