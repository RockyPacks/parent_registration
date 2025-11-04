
import React, { useState, useCallback, useEffect } from 'react';
import { CategoryStatus, DocumentCategory, UploadedFile } from '../types';
import { Checklist } from './Checklist';
import { UploadCard } from './UploadCard';
import { FileUpload } from './FileUpload';
import { FileItem } from './FileItem';
import { UploadSummary } from './UploadSummary';
import { SecurityInfo } from './SecurityInfo';
import { ActionButtons } from './ActionButtons';
import { UploadCloudIcon } from './icons';
import { useUpload } from '../hooks/useUpload';
import { apiService } from '../services/api';
import Footer from '../../components/Footer';

// Bucket mapping for document types to specific buckets
const DOCUMENT_TYPE_TO_BUCKET: Record<string, string> = {
  // Category buckets
  "proof_of_address": "proof_of_address",
  "id_documents": "id_documents",
  "payslips": "payslips",
  "bank_statements": "bank_statements",

  // Specific document type buckets
  "proof-of-address": "proof_of_address",
  "parent-guardian-id": "id_documents",
  "learner-birth-certificate": "id_documents",
  "spouse-id": "id_documents",
  "optional-document": "id_documents",
  "latest-payslip": "payslips",
  "previous-payslip": "payslips",
  "third-payslip": "payslips",
  "bank-statements": "bank_statements",
  "academic_history": "id_documents",
};

const getBucketName = (documentType: string): string => {
  return DOCUMENT_TYPE_TO_BUCKET[documentType] || "documents";
};

const initialCategories: Record<string, DocumentCategory> = {
  proofOfAddress: {
    id: 'proofOfAddress',
    title: 'Proof of Address',
    status: CategoryStatus.NotStarted,
    files: [],
    required: true,
    description: 'Upload a recent utility bill, municipal account, or bank statement showing your residential address (not older than 3 months)'
  },
  idDocuments: {
    id: 'idDocuments',
    title: 'Identity Documents',
    status: CategoryStatus.NotStarted,
    files: [],
    required: true,
  },
  payslips: {
    id: 'payslips',
    title: 'Payslip Documents',
    status: CategoryStatus.NotStarted,
    files: [],
    required: true,
    description: 'Upload your most recent payslips for income verification. Self-employed applicants can upload proof of income.'
  },
  bankStatements: {
    id: 'bankStatements',
    title: 'Bank Statements',
    status: CategoryStatus.NotStarted,
    files: [],
    required: true,
    description: 'Upload 3 months of recent bank statements for affordability assessment and verification purposes.'
  },

};


interface DocumentUploadCenterProps {
  userId?: string;
  applicationId?: string;
  onDocumentUploadComplete?: () => void;
  onBack?: () => void;
}

export const DocumentUploadCenter: React.FC<DocumentUploadCenterProps> = ({
  userId = 'anonymous',
  applicationId,
  onDocumentUploadComplete,
  onBack
}) => {
  const [categories, setCategories] = useState<Record<string, DocumentCategory>>(initialCategories);
  const [activeCategory, setActiveCategory] = useState<string>('proofOfAddress');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const { uploadState, uploadFile, resetUploadState } = useUpload();

  // Add user tracking
  const [currentUserId, setCurrentUserId] = useState<string>(userId);


  // Modify the useEffect for loading files to clear data on user change
  useEffect(() => {
    // Clear all documents when user changes
    if (currentUserId !== userId) {
      setUploadedFiles([]);
      setCategories(initialCategories);
      setCurrentUserId(userId);
    }

    // Only load files if we have both userId and applicationId
    if (applicationId && userId) {
      loadUploadedFiles();
    } else {
      // Clear any cached uploaded files
      setUploadedFiles([]);
      setCategories(initialCategories);
    }
  }, [applicationId, userId]);
  

  // Update category statuses and files based on uploaded files
  useEffect(() => {
    const mapToUploadedFile = (apiFile: any): UploadedFile => ({
      id: apiFile.id,
      name: apiFile.filename,
      size: apiFile.size,
      progress: 100, // uploaded files are complete
      timestamp: new Date(apiFile.created_at),
    });

    setCategories(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(categoryId => {
        const category = updated[categoryId];
        const requirements = {
          proofOfAddress: 1,
          idDocuments: 2,
          payslips: 3,
          bankStatements: 1
        };
        const required = requirements[categoryId as keyof typeof requirements] || 1;

        const mapping: Record<string, string[]> = {
          'proofOfAddress': ['proof_of_address', 'proof-of-address'],
          'idDocuments': ['id_documents', 'parent-guardian-id', 'learner-birth-certificate', 'spouse-id', 'optional-document'],
          'payslips': ['payslips', 'latest-payslip', 'previous-payslip', 'third-payslip'],
          'bankStatements': ['bank_statements', 'bank-statements']
        };
        const types = mapping[categoryId] || [];
        const categoryApiFiles = uploadedFiles.filter(file => types.includes(file.document_type));
        const categoryFiles = categoryApiFiles.map(mapToUploadedFile);

        updated[categoryId].files = categoryFiles;
        updated[categoryId].status = categoryFiles.length >= required ? CategoryStatus.Completed : categoryFiles.length > 0 ? CategoryStatus.InProgress : CategoryStatus.NotStarted;
      });
      return updated;
    });

    // Check completion status
    checkCompletionStatus();
  }, [uploadedFiles]);

  const checkCompletionStatus = async () => {
    try {
      const complete = await isAllRequiredComplete();
      setIsComplete(complete);
    } catch (error) {
      console.error('Error checking completion:', error);
      setIsComplete(false);
    }
  };

  const loadDocumentStatus = async () => {
    try {
      const data = await apiService.getDocumentStatus(applicationId);
      updateCategoriesFromStatus(data.summary);
    } catch (error) {
      console.error('Failed to load document status:', error);
    }
  };

  // Modify loadUploadedFiles to include user verification
  const loadUploadedFiles = async () => {
    if (!applicationId || !userId) {
      setUploadedFiles([]);
      return;
    }

    try {
      const data = await apiService.getUploadedFiles(applicationId);

      setUploadedFiles(data.files || []);
    } catch (error: any) {
      console.error('Failed to load uploaded files:', error);
      setUploadedFiles([]);
      const errorMsg = 'Failed to load uploaded files: ' + (error.message || 'Network error');
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const updateCategoriesFromStatus = (summary: any[]) => {
    setCategories(prev => {
      const updated = { ...prev };
      summary.forEach((item: any) => {
        const categoryId = getCategoryIdFromType(item.document_type);
        if (categoryId && updated[categoryId]) {
          if (item.completed) {
            updated[categoryId].status = CategoryStatus.Completed;
          } else if (item.file_count > 0) {
            updated[categoryId].status = CategoryStatus.InProgress;
          } else {
            updated[categoryId].status = CategoryStatus.NotStarted;
          }
          // TODO: Fetch and display actual file details from backend
        }
      });
      return updated;
    });
  };

  const getCategoryIdFromType = (docType: string): string | null => {
    const mapping: Record<string, string> = {
      'proof_of_address': 'proofOfAddress',
      'proof-of-address': 'proofOfAddress',
      'id_document': 'idDocuments',
      'id_documents': 'idDocuments',
      'payslip': 'payslips',
      'payslips': 'payslips',
      'bank_statement': 'bankStatements',
      'bank-statements': 'bankStatements'
    };
    return mapping[docType] || null;
  };

  const getApiCategoryFromId = (categoryId: string): string => {
    const mapping: Record<string, string> = {
      'proofOfAddress': 'proof_of_address',
      'idDocuments': 'id_documents',
      'payslips': 'payslips',
      'bankStatements': 'bank_statements'
    };
    return mapping[categoryId] || categoryId;
  };

  const validateFile = (file: File): string | null => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Only PDF, JPG, and PNG files are allowed.';
    }

    if (file.size > maxSize) {
      return 'File size exceeds 5MB limit.';
    }

    return null;
  };

  // Modify handleFileUpload to include user ID
  const handleFileUpload = useCallback(async (categoryId: string, file: File, documentType?: string) => {
    if (!applicationId || !userId) {
      const errorMsg = 'No application ID or user ID available. Please log in first.';
      console.error(errorMsg);
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      console.error('Validation error:', validationError);
      setErrorMessage(validationError);
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    resetUploadState();
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const apiCategory = documentType || getApiCategoryFromId(categoryId);
      const bucketName = getBucketName(apiCategory);

      console.log(`Uploading file: ${file.name}, type: ${apiCategory}, bucket: ${bucketName}`);

      const result = await uploadFile(file, applicationId, apiCategory, bucketName);

      if (result && result.success) {
        console.log('Upload successful:', result.file);

        // Show success message
        setSuccessMessage(`${file.name} uploaded successfully!`);

        // Reload uploaded files from backend to get fresh data
        await loadUploadedFiles();

        console.log('Files reloaded after upload');

        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } else {
        const errorMsg = 'Upload failed: Unknown error occurred';
        console.error(errorMsg);
        setErrorMessage(errorMsg);
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMsg = error.message || 'Upload failed due to network error';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  }, [applicationId, uploadFile, resetUploadState, loadUploadedFiles]);

  const getUpdatedStatus = (categoryId: string, fileCount: number): CategoryStatus => {
    const requirements = {
      proofOfAddress: 1,
      idDocuments: 2,
      payslips: 3,
      bankStatements: 1
    };

    const required = requirements[categoryId as keyof typeof requirements] || 1;
    return fileCount >= required ? CategoryStatus.Completed : CategoryStatus.InProgress;
  };

  const isAllRequiredComplete = async (): Promise<boolean> => {
    try {
      // Use the new upload summary API for completion tracking
      const summary = await apiService.getUploadSummary(applicationId || '');
      return summary.completed_categories >= 4; // All 4 categories completed
    } catch (error) {
      console.error('Error checking completion status:', error);
      // Fallback to local category checking
      return categoryList.every((category: DocumentCategory) => category.status === CategoryStatus.Completed);
    }
  };

  const handleFileDelete = useCallback(async (fileId: string) => {
    if (!applicationId || !userId) {
      const errorMsg = 'No application ID or user ID available for deletion';
      console.error(errorMsg);
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    try {
      console.log(`Deleting file: ${fileId}`);

      // Delete from backend
      await apiService.deleteFile(applicationId, fileId);

      // Reload uploaded files to update summary
      await loadUploadedFiles();

      console.log('File deleted and list reloaded');
      setSuccessMessage('File deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Failed to delete file:', error);
      const errorMsg = 'Failed to delete file: ' + (error.message || 'Network error');
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  }, [applicationId, loadUploadedFiles]);

  const categoryList: DocumentCategory[] = Object.values(categories);

  return (
    <div className="flex-1 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Document Upload Center</h1>
              <p className="text-gray-700 font-medium">Please upload all required documents to proceed with your school application. All files are securely encrypted and stored.</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-500">Step 2 of 7</div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-gradient-to-r from-green-500 to-teal-600 h-2 rounded-full transition-all duration-500" style={{width: '29%'}}></div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-full p-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 pt-24 pb-32">
        {/* Progress Overview */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-white/40 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Upload Progress</h2>
            <span className="text-sm text-gray-500">{categoryList.filter(cat => cat.status === CategoryStatus.Completed).length} of {categoryList.length} categories completed</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categoryList.map((category) => (
              <div key={category.id} className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${
                  category.status === CategoryStatus.Completed
                    ? 'bg-green-100'
                    : category.status === CategoryStatus.InProgress
                    ? 'bg-yellow-100'
                    : 'bg-gray-100'
                }`}>
                  {category.status === CategoryStatus.Completed ? (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : category.status === CategoryStatus.InProgress ? (
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  )}
                </div>
                <div className="text-xs font-medium text-gray-600">{category.title}</div>
                <div className={`text-xs font-medium ${
                  category.status === CategoryStatus.Completed
                    ? 'text-green-600'
                    : category.status === CategoryStatus.InProgress
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}>
                  {category.status === CategoryStatus.Completed
                    ? 'Completed'
                    : category.status === CategoryStatus.InProgress
                    ? 'In Progress'
                    : 'Required'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Form Sections */}
        <div className="space-y-6">
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-4 sm:mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm font-medium">{successMessage}</p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4 sm:mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
            </div>
          )}

            <UploadCard
              title="Proof of Address"
              required
              icon={<UploadCloudIcon />}
              collapsible={true}
              defaultOpen={false}
            >
              <p className="text-sm text-gray-600 mb-4">{categories.proofOfAddress.description}</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Utility Bill/Municipal Account</label>
                  <FileUpload onFileUpload={(file) => handleFileUpload('proofOfAddress', file, 'proof-of-address')} variant="button" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Statement</label>
                  <FileUpload onFileUpload={(file) => handleFileUpload('proofOfAddress', file, 'proof-of-address')} variant="button" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease Agreement</label>
                  <FileUpload onFileUpload={(file) => handleFileUpload('proofOfAddress', file, 'proof-of-address')} variant="button" />
                </div>
              </div>
              {categories.proofOfAddress.files.map(file => (
                <FileItem key={file.id} file={file} onDelete={() => handleFileDelete(file.id)} />
              ))}
            </UploadCard>

            <UploadCard
              title="Identity Documents"
              required
              icon={<UploadCloudIcon />}
              collapsible={true}
              defaultOpen={false}
              status={categories.idDocuments.status === CategoryStatus.Completed ? 'completed' :
                      categories.idDocuments.status === CategoryStatus.InProgress ? 'in-progress' : 'not-started'}
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian ID Copy</label>
                  <FileUpload onFileUpload={(file) => handleFileUpload('idDocuments', file, 'parent-guardian-id')} variant="button" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Learner Birth Certificate</label>
                  <FileUpload onFileUpload={(file) => handleFileUpload('idDocuments', file, 'learner-birth-certificate')} variant="button" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Spouse ID (if applicable)</label>
                  <FileUpload onFileUpload={(file) => handleFileUpload('idDocuments', file, 'spouse-id')} variant="button" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Optional document</label>
                  <FileUpload onFileUpload={(file) => handleFileUpload('idDocuments', file, 'optional-document')} variant="button" />
                </div>
              </div>
              {categories.idDocuments.files.map(file => (
                <FileItem key={file.id} file={file} onDelete={() => handleFileDelete(file.id)} />
              ))}
            </UploadCard>

            <UploadCard
              title="Payslip Documents"
              required
              icon={<UploadCloudIcon />}
              collapsible={true}
              defaultOpen={false}
              status={categories.payslips.status === CategoryStatus.Completed ? 'completed' :
                      categories.payslips.status === CategoryStatus.InProgress ? 'in-progress' : 'not-started'}
            >
              <p className="text-sm text-gray-600 mb-4">{categories.payslips.description}</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latest Payslip (Current Month)</label>
                  <FileUpload onFileUpload={(file) => handleFileUpload('payslips', file, 'latest-payslip')} variant="button" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous Month Payslip</label>
                  <FileUpload onFileUpload={(file) => handleFileUpload('payslips', file, 'previous-payslip')} variant="button" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Third Month Payslip</label>
                  <FileUpload onFileUpload={(file) => handleFileUpload('payslips', file, 'third-payslip')} variant="button" />
                </div>
              </div>
              {categories.payslips.files.map(file => (
                <FileItem key={file.id} file={file} onDelete={() => handleFileDelete(file.id)} />
              ))}
            </UploadCard>

            <UploadCard
              title="Bank Statements"
              required
              icon={<UploadCloudIcon />}
              collapsible={true}
              defaultOpen={false}
              status={categories.bankStatements.status === CategoryStatus.Completed ? 'completed' :
                      categories.bankStatements.status === CategoryStatus.InProgress ? 'in-progress' : 'not-started'}
            >
              <p className="text-sm text-gray-600 mb-4">{categories.bankStatements.description}</p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">3 Months Bank Statements</label>
                  <FileUpload onFileUpload={(file) => handleFileUpload('bankStatements', file, 'bank-statements')} variant="button" />
                </div>
              </div>
              <div className="mt-4 bg-blue-50 text-blue-800 text-sm p-3 rounded-md border border-blue-200">
                Bank statements help us assess your financial stability and determine appropriate payment plans.
              </div>
              {categories.bankStatements.files.map(file => (
                <FileItem key={file.id} file={file} onDelete={() => handleFileDelete(file.id)} />
              ))}
            </UploadCard>

            {uploadState.error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-4 sm:mb-6">
                <p className="text-sm">{uploadState.error}</p>
              </div>
            )}

            <UploadSummary categories={categoryList} uploadedFiles={uploadedFiles} />

            {/* Uploaded Files Section */}
            {uploadedFiles.length > 0 && (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Uploaded Documents</h2>
                <div className="space-y-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white/50 rounded-xl border border-white/30 gap-2">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-full p-2">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="text-sm">
                          <p className="font-medium text-gray-800">{file.filename}</p>
                          <p className="text-gray-600">{file.document_type} • {(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <a
                          href={file.download_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex-1 sm:flex-none text-center shadow-sm"
                        >
                          Download
                        </a>
                        <button
                          onClick={() => handleFileDelete(file.id)}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 flex-1 sm:flex-none text-center shadow-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <SecurityInfo />

            <div className="mt-8">
              <div className="mb-6">
                <button
                  onClick={async () => {
                    if (!applicationId) {
                      setErrorMessage('No application ID available. Please complete the enrollment form first.');
                      setTimeout(() => setErrorMessage(null), 5000);
                      return;
                    }

                    try {
                      await apiService.completeDocumentUpload(applicationId);
                      setSuccessMessage('Document upload completed successfully!');
                      setTimeout(() => setSuccessMessage(null), 3000);
                      // Proceed to next section after successful completion
                      onDocumentUploadComplete && onDocumentUploadComplete();
                    } catch (error: any) {
                      console.error('Failed to complete document upload:', error);
                      const errorMsg = 'Failed to complete document upload: ' + (error.message || 'Network error');
                      setErrorMessage(errorMsg);
                      setTimeout(() => setErrorMessage(null), 5000);
                    }
                  }}
                  disabled={!isComplete}
                  className={`w-full py-3 px-6 rounded-lg font-medium shadow-sm transition-all duration-200 ${
                    isComplete
                      ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Complete Document Upload
                </button>
                {!isComplete && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Please upload all required documents before completing this section.
                  </p>
                )}
              </div>
              <ActionButtons
                disabled={!isComplete}
                onContinue={async () => {
                  if (!applicationId) {
                    setErrorMessage('No application ID available. Please complete the enrollment form first.');
                    setTimeout(() => setErrorMessage(null), 5000);
                    return;
                  }

                  try {
                    await apiService.completeDocumentUpload(applicationId);
                    setSuccessMessage('Document upload completed successfully!');
                    setTimeout(() => setSuccessMessage(null), 3000);
                    onDocumentUploadComplete && onDocumentUploadComplete();
                  } catch (error: any) {
                    console.error('Failed to complete document upload:', error);
                    const errorMsg = 'Failed to complete document upload: ' + (error.message || 'Network error');
                    setErrorMessage(errorMsg);
                    setTimeout(() => setErrorMessage(null), 5000);
                    // Still proceed to next step even if backend fails
                    onDocumentUploadComplete && onDocumentUploadComplete();
                  }
                }}
              />
              <Footer
                onBack={onBack}
                onSave={() => {}}
                onNext={onDocumentUploadComplete}
                showBack={true}
                showSave={true}
                showNext={true}
                nextLabel="Next: Academic History"
              />
            </div>
          </div>
      </div>
    </div>
  );
};
