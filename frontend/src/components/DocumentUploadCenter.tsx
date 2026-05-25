
import React, { useState, useCallback, useEffect } from 'react';
import { CategoryStatus, DocumentCategory, UploadedFile } from '../types/index';
import { Checklist } from './Checklist';
import { UploadCard } from './UploadCard';
import { FileUpload } from './FileUpload';
import { FileItem } from './FileItem';
import { UploadSummary } from './UploadSummary';
import { SecurityInfo } from './SecurityInfo';
import { ActionButtons } from './ActionButtons';
import { UploadCloudIcon } from './Icons';
import { useUpload } from '../hooks/useUpload';
import { apiService } from '../services/api';
import Footer from './Footer';

// Bucket mapping for document types to specific buckets
const DOCUMENT_TYPE_TO_BUCKET: Record<string, string> = {
  // Category buckets
  "proof_of_address": "proof_of_address",
  "id_documents": "id_documents",
  "id_document": "id_documents",
  "payslips": "payslips",
  "payslip": "payslips",
  "bank_statements": "bank_statements",
  "bank_statement": "bank_statements",

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

const REQUIRED_DOCUMENT_CONFIG = {
  proofOfAddress: {
    requiredCount: 1,
    types: ['proof_of_address', 'proof_of_addresses'],
    missingMessage: 'Proof of Address is required. Please upload a utility bill, lease agreement, or official document showing your residential address.'
  },
  idDocuments: {
    requiredCount: 1,
    types: ['id_document', 'id_documents', 'parent-guardian-id'],
    missingMessage: 'Parent ID is required. Please upload a government-issued identity document for the parent/guardian.'
  },
  bankStatements: {
    requiredCount: 1,
    types: ['bank_statement', 'bank_statements'],
    missingMessage: 'Bank Statement is required. Please upload a recent bank statement so the document analyser can run financial and gambling/risk checks.'
  }
} as const;

const DEFAULT_REQUIRED_DOCUMENT_CONFIG = {
  proofOfAddress: {
    requiredCount: 1,
    types: ['proof_of_address', 'proof_of_addresses'],
    missingMessage: 'Proof of Address is required. Please upload a utility bill, lease agreement, or official document showing your residential address.'
  },
  idDocuments: {
    requiredCount: 2,
    types: ['id_document', 'id_documents', 'learner-birth-certificate', 'parent-guardian-id'],
    missingMessage: 'Identity Documents are required. Please upload the required ID documents.'
  },
  payslips: {
    requiredCount: 3,
    types: ['payslip', 'payslips', 'latest-payslip', 'previous-payslip', 'third-payslip'],
    missingMessage: 'Payslip Documents are required. Please upload the required payslips or proof of income.'
  },
  bankStatements: {
    requiredCount: 1,
    types: ['bank_statement', 'bank_statements'],
    missingMessage: 'Bank Statement is required. Please upload the required bank statement.'
  }
} as const;

const OPTIONAL_DOCUMENT_CONFIG = {
  payslips: {
    requiredCount: 0,
    types: ['payslip', 'payslips', 'latest-payslip', 'previous-payslip', 'third-payslip']
  }
} as const;

const DOCUMENT_CATEGORY_CONFIG = {
  ...REQUIRED_DOCUMENT_CONFIG,
  ...OPTIONAL_DOCUMENT_CONFIG
};

const moloInitialCategories: Record<string, DocumentCategory> = {
  proofOfAddress: {
    id: 'proofOfAddress',
    title: 'Proof of Address',
    status: CategoryStatus.NotStarted,
    files: [],
    required: true,
    description: 'Compulsory: Upload a utility bill, lease agreement, municipal account, or official document showing your residential address.'
  },
  idDocuments: {
    id: 'idDocuments',
    title: 'Parent ID',
    status: CategoryStatus.NotStarted,
    files: [],
    required: true,
    description: 'Compulsory: Upload a government-issued identity document for the parent/guardian.'
  },
  bankStatements: {
    id: 'bankStatements',
    title: 'Bank Statement',
    status: CategoryStatus.NotStarted,
    files: [],
    required: true,
    description: 'Compulsory: Upload a recent bank statement for financial verification and document analyser gambling/risk checks.'
  },
  payslips: {
    id: 'payslips',
    title: 'Payslip Documents',
    status: CategoryStatus.NotStarted,
    files: [],
    required: false,
    description: 'Optional: Upload payslips or proof of income if requested by the school.'
  }
};

const defaultInitialCategories: Record<string, DocumentCategory> = {
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
  }
};



interface DocumentUploadCenterProps {
  userId?: string;
  applicationId?: string;
  onDocumentUploadComplete?: () => void;
  onBack?: () => void;
  onDocumentsChange?: (data: any[]) => void; // Add this prop
}

export const DocumentUploadCenter: React.FC<DocumentUploadCenterProps> = ({
  userId = 'anonymous',
  applicationId,
  onDocumentUploadComplete,
  onBack,
  onDocumentsChange
}) => {
  const selectedSchoolName = typeof window !== 'undefined' ? (localStorage.getItem('selectedSchoolName') || '') : '';
  const useMoloDocumentRules = /molo|mhlaba|tennyson|shaba/i.test(selectedSchoolName);
  const selectedRequiredDocumentConfig = useMoloDocumentRules ? REQUIRED_DOCUMENT_CONFIG : DEFAULT_REQUIRED_DOCUMENT_CONFIG;
  const selectedDocumentCategoryConfig = useMoloDocumentRules
    ? DOCUMENT_CATEGORY_CONFIG
    : DEFAULT_REQUIRED_DOCUMENT_CONFIG;
  const getInitialCategoriesForSchool = () => useMoloDocumentRules ? moloInitialCategories : defaultInitialCategories;

  const [categories, setCategories] = useState<Record<string, DocumentCategory>>(() => getInitialCategoriesForSchool());
  const [activeCategory, setActiveCategory] = useState<string>('proofOfAddress');
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [deletingFileIds, setDeletingFileIds] = useState<Set<string>>(new Set());
  const { uploadState, uploadFile, resetUploadState } = useUpload();

  // Log application ID for debugging - should always use prop, not localStorage
  useEffect(() => {
    if (!applicationId) {
    }
  }, [applicationId]);

  // Add user tracking
  const [currentUserId, setCurrentUserId] = useState<string>(userId);


  // Modify the useEffect for loading files to clear data on user change
  useEffect(() => {
    // Clear all documents when user changes
    if (currentUserId !== userId) {
      setUploadedFiles([]);
      setCategories(getInitialCategoriesForSchool());
      setCurrentUserId(userId);
    }

    // Only load files if we have applicationId
    if (applicationId) {
      loadUploadedFiles();
    } else {
      // Clear any cached uploaded files
      setUploadedFiles([]);
      setCategories(getInitialCategoriesForSchool());
    }
  }, [applicationId, userId]);


  // Update category statuses and files based on uploaded files
  useEffect(() => {
    const mapToUploadedFile = (apiFile: any): UploadedFile => ({
      id: apiFile.id,
      name: apiFile.filename,
      size: apiFile.fileSize || apiFile.file_size || apiFile.size, // camelCase from toCamelCase, fallback to snake_case
      progress: 100, // uploaded files are complete
      timestamp: new Date(apiFile.createdAt || apiFile.created_at),
    });

    setCategories(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(categoryId => {
        const categoryConfig = selectedDocumentCategoryConfig[categoryId as keyof typeof selectedDocumentCategoryConfig];
        const required = categoryConfig?.requiredCount ?? 1;
        const types = categoryConfig?.types ? [...categoryConfig.types] : [];

        // Filter uploaded files for this category
        const categoryApiFiles = uploadedFiles.filter(file => {
          const docType = file.documentType?.toLowerCase() || file.document_type?.toLowerCase() || '';
          return types.includes(docType);
        });

        const categoryFiles = categoryApiFiles.map(mapToUploadedFile);

        updated[categoryId] = {
          ...updated[categoryId],
          files: categoryFiles,
          status: required === 0 ? (categoryFiles.length > 0 ? CategoryStatus.Completed : CategoryStatus.NotStarted) : categoryFiles.length >= required ? CategoryStatus.Completed : categoryFiles.length > 0 ? CategoryStatus.InProgress : CategoryStatus.NotStarted
        };
      });
      return updated;
    });

  }, [uploadedFiles]);

  // Check completion status whenever categories change
  useEffect(() => {
    checkCompletionStatus();
  }, [categories, applicationId]);

  const checkCompletionStatus = async () => {
    try {
      // Immediate UI feedback based on the compulsory documents only.
      // Molo Mhlaba requires: Parent ID, Proof of Address and Bank Statement.
      const isLocalComplete = getMissingRequiredDocumentMessages().length === 0;
      setIsComplete(isLocalComplete);
    } catch (error) {
      console.warn("checkCompletionStatus local check failed:", error);
    }
  };

  const loadDocumentStatus = async () => {
    const currentApplicationId = applicationId;
    if (!currentApplicationId) {
      return;
    }
    try {
      const data = await apiService.getDocumentStatus(currentApplicationId);
      updateCategoriesFromStatus(data.summary);
    } catch (error) {
      // Silently handle error - status will be determined from uploaded files
    }
  };

  // Modify loadUploadedFiles to include user verification
  const loadUploadedFiles = async () => {
    const currentApplicationId = applicationId;
    if (!currentApplicationId) {
      setUploadedFiles([]);
      localStorage.setItem('uploadedFiles', JSON.stringify([]));
      return;
    }

    try {
      const data = await apiService.getUploadedFiles(currentApplicationId);

      setUploadedFiles(data.files || []);
      // Save to localStorage so ReviewSubmitStep can access them
      localStorage.setItem('uploadedFiles', JSON.stringify(data.files || []));
      // Notify parent component of documents change
      onDocumentsChange && onDocumentsChange(data.files || []);
    } catch (error: any) {
      setUploadedFiles([]);
      localStorage.setItem('uploadedFiles', JSON.stringify([]));
      onDocumentsChange && onDocumentsChange([]);
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
      'id_document': 'idDocuments',
      'payslip': 'payslips',
      'bank_statement': 'bankStatements'
    };
    return mapping[docType] || null;
  };

  const getApiCategoryFromId = (categoryId: string): string => {
    const mapping: Record<string, string> = {
      'proofOfAddress': 'proof_of_address',
      'idDocuments': 'id_document',
      'payslips': 'payslip',
      'bankStatements': 'bank_statement'
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
    let currentApplicationId = applicationId;

    // If no application ID, try to create one
    if (!currentApplicationId) {
      try {
        const { apiService } = await import('../services/api');
        const response = await apiService.request('/enrollment/auto-save', {
          method: 'POST',
          body: JSON.stringify({ applicationId: null })
        });
        currentApplicationId = (response as any).applicationId;
      } catch (error) {
        const errorMsg = 'Failed to create application. Please complete step 1 first.';
        setErrorMessage(errorMsg);
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
    }

    const validationError = validateFile(file);
    if (validationError) {
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

      // Log upload details for debugging (can be removed in production)

      const result = await uploadFile(file, currentApplicationId, apiCategory, bucketName);

      if (result && result.success) {

        // Show success message
        setSuccessMessage(`${file.name} uploaded successfully!`);

        // Reload uploaded files from backend to get fresh data
        await loadUploadedFiles();

        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 5000);
      } else {
        const errorMsg = 'Upload failed: Unknown error occurred';
        setErrorMessage(errorMsg);
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Upload failed: Unknown error occurred';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  }, [applicationId, uploadFile, resetUploadState, loadUploadedFiles]);



  const getMissingRequiredDocumentMessages = (): string[] => {
    return Object.entries(selectedRequiredDocumentConfig).reduce<string[]>((messages, [categoryId, config]) => {
      const fileCount = getCategoryFileCount(categoryId);
      if (fileCount < config.requiredCount) {
        messages.push(config.missingMessage);
      }
      return messages;
    }, []);
  };

  const validateRequiredDocuments = (): boolean => {
    const missingMessages = getMissingRequiredDocumentMessages();

    if (missingMessages.length > 0) {
      setErrorMessage(`Please upload all compulsory documents before continuing: ${missingMessages.join(' ')}`);
      setTimeout(() => setErrorMessage(null), 8000);
      return false;
    }

    return true;
  };

  const completeDocumentsAndContinue = async () => {
    if (!applicationId) {
      setErrorMessage('No application ID available. Please complete the enrollment form first.');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    if (!validateRequiredDocuments()) {
      return;
    }

    try {
      await apiService.completeDocumentUpload(applicationId);
      setSuccessMessage('Document upload completed successfully. Bank statements will be processed by the document analyser for financial and gambling/risk checks.');
      setTimeout(() => setSuccessMessage(null), 3000);
      await checkCompletionStatus();
      onDocumentUploadComplete && onDocumentUploadComplete();
    } catch (error: any) {
      const errorMsg = 'Failed to complete document upload: ' + (error.message || 'Network error');
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const isAllRequiredComplete = async (): Promise<boolean> => {
    return getMissingRequiredDocumentMessages().length === 0;
  };

  const handleFileDelete = useCallback(async (fileId: string) => {
    // Prevent double-click by checking if already deleting
    if (deletingFileIds.has(fileId)) {
      return;
    }

    const currentApplicationId = applicationId;

    if (!currentApplicationId) {
      const errorMsg = 'No application ID available for deletion';
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    // Mark file as being deleted
    setDeletingFileIds(prev => new Set(prev).add(fileId));

    try {
      // Delete from backend
      await apiService.deleteFile(currentApplicationId, fileId);

      // Reload uploaded files to update summary
      await loadUploadedFiles();
      setSuccessMessage('File deleted successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      // Only show error if it's not a 404 (file already deleted)
      if (!error.message?.includes('404') && !error.message?.includes('not found')) {
        const errorMsg = 'Failed to delete file: ' + (error.message || 'Network error');
        setErrorMessage(errorMsg);
        setTimeout(() => setErrorMessage(null), 5000);
      }
    } finally {
      // Remove file from deleting set
      setDeletingFileIds(prev => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
    }
  }, [applicationId, loadUploadedFiles, deletingFileIds]);

  // Helper function to get actual file count for a category
  const getCategoryFileCount = (categoryId: string) => {
    const categoryConfig = selectedDocumentCategoryConfig[categoryId as keyof typeof selectedDocumentCategoryConfig];
    const types = categoryConfig?.types ? [...categoryConfig.types] : [];
    return uploadedFiles.filter(file => {
      const docType = file.documentType?.toLowerCase() || file.document_type?.toLowerCase() || '';
      return types.includes(docType);
    }).length;
  };

  const getUpdatedStatus = (categoryId: string, fileCount: number): CategoryStatus => {
    const categoryConfig = selectedDocumentCategoryConfig[categoryId as keyof typeof selectedDocumentCategoryConfig];
    const required = categoryConfig?.requiredCount ?? 1;
    if (required === 0) {
      return fileCount > 0 ? CategoryStatus.Completed : CategoryStatus.NotStarted;
    }
    return fileCount >= required ? CategoryStatus.Completed : CategoryStatus.InProgress;
  };

  const categoryList: DocumentCategory[] = Object.values(categories);

  return (
    <div className="flex-1 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 mt-24">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 mb-2">Document Upload Center</h1>
              <p className="text-gray-700 font-medium">Please upload all required documents to proceed with your school application. All files are securely encrypted and stored.</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {/* Modern Step Indicator */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 shadow-lg">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white">
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-teal-600 font-bold text-lg">2</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Step 2 of 6</div>
                  <div className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-600">
                    33% Complete
                  </div>
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
            <span className="text-sm text-gray-500">{Object.keys(selectedRequiredDocumentConfig).filter(categoryId => getCategoryFileCount(categoryId) >= selectedRequiredDocumentConfig[categoryId as keyof typeof selectedRequiredDocumentConfig].requiredCount).length} of {Object.keys(selectedRequiredDocumentConfig).length} compulsory documents uploaded</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categoryList.map((category) => (
              <div key={category.id} className="text-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${category.status === CategoryStatus.Completed
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
                <div className={`text-xs font-medium ${category.status === CategoryStatus.Completed
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
            status={categories.proofOfAddress.status === CategoryStatus.Completed ? 'completed' :
              categories.proofOfAddress.status === CategoryStatus.InProgress ? 'in-progress' : 'not-started'}
            currentCount={getCategoryFileCount('proofOfAddress')}
            requiredCount={1}
          >
            <p className="text-sm text-gray-600 mb-4">{categories.proofOfAddress.description}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Utility Bill/Municipal Account <span className="text-red-600">*</span></label>
                <FileUpload onFileUpload={(file) => handleFileUpload('proofOfAddress', file, 'proof_of_address')} variant="button" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Statement <span className="text-red-600">*</span></label>
                <FileUpload onFileUpload={(file) => handleFileUpload('proofOfAddress', file, 'proof_of_address')} variant="button" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lease Agreement</label>
                <FileUpload onFileUpload={(file) => handleFileUpload('proofOfAddress', file, 'proof_of_address')} variant="button" />
              </div>
            </div>
            {categories.proofOfAddress.files.map(file => (
              <FileItem key={file.id} file={file} onDelete={() => handleFileDelete(file.id)} />
            ))}
          </UploadCard>

          <UploadCard
            title={useMoloDocumentRules ? "Parent ID" : "Identity Documents"}
            required
            icon={<UploadCloudIcon />}
            collapsible={true}
            defaultOpen={false}
            status={categories.idDocuments.status === CategoryStatus.Completed ? 'completed' :
              categories.idDocuments.status === CategoryStatus.InProgress ? 'in-progress' : 'not-started'}
            currentCount={getCategoryFileCount('idDocuments')}
            requiredCount={useMoloDocumentRules ? 1 : 2}
          >
            <p className="text-sm text-gray-600 mb-4">{categories.idDocuments.description}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian ID Copy <span className="text-red-600">*</span></label>
                <FileUpload onFileUpload={(file) => handleFileUpload('idDocuments', file, 'id_document')} variant="button" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Learner Birth Certificate</label>
                <FileUpload onFileUpload={(file) => handleFileUpload('idDocuments', file, 'id_document')} variant="button" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Spouse ID (if applicable)</label>
                <FileUpload onFileUpload={(file) => handleFileUpload('idDocuments', file, 'id_document')} variant="button" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Optional document</label>
                <FileUpload onFileUpload={(file) => handleFileUpload('idDocuments', file, 'id_document')} variant="button" />
              </div>
            </div>
            {categories.idDocuments.files.map(file => (
              <FileItem key={file.id} file={file} onDelete={() => handleFileDelete(file.id)} />
            ))}
          </UploadCard>

          <UploadCard
            title="Payslip Documents"
            required={!useMoloDocumentRules}
            icon={<UploadCloudIcon />}
            collapsible={true}
            defaultOpen={false}
            status={categories.payslips.status === CategoryStatus.Completed ? 'completed' :
              categories.payslips.status === CategoryStatus.InProgress ? 'in-progress' : 'not-started'}
            currentCount={getCategoryFileCount('payslips')}
            requiredCount={useMoloDocumentRules ? 0 : 3}
          >
            <p className="text-sm text-gray-600 mb-4">{categories.payslips.description}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latest Payslip (Current Month)</label>
                <FileUpload onFileUpload={(file) => handleFileUpload('payslips', file, 'payslip')} variant="button" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Previous Month Payslip</label>
                <FileUpload onFileUpload={(file) => handleFileUpload('payslips', file, 'payslip')} variant="button" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Third Month Payslip</label>
                <FileUpload onFileUpload={(file) => handleFileUpload('payslips', file, 'payslip')} variant="button" />
              </div>
            </div>
            {categories.payslips.files.map(file => (
              <FileItem key={file.id} file={file} onDelete={() => handleFileDelete(file.id)} />
            ))}
          </UploadCard>

          <UploadCard
            title={useMoloDocumentRules ? "Bank Statement" : "Bank Statements"}
            required
            icon={<UploadCloudIcon />}
            collapsible={true}
            defaultOpen={false}
            status={categories.bankStatements.status === CategoryStatus.Completed ? 'completed' :
              categories.bankStatements.status === CategoryStatus.InProgress ? 'in-progress' : 'not-started'}
            currentCount={getCategoryFileCount('bankStatements')}
            requiredCount={1}
          >
            <p className="text-sm text-gray-600 mb-4">{categories.bankStatements.description}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Statement <span className="text-red-600">*</span></label>
                <FileUpload onFileUpload={(file) => handleFileUpload('bankStatements', file, 'bank_statement')} variant="button" />
              </div>
            </div>
            <div className="mt-4 bg-blue-50 text-blue-800 text-sm p-3 rounded-md border border-blue-200">
              Bank statements are compulsory and will be checked by the document analyser for financial verification, including gambling/risk checks.
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
                        <p className="text-gray-600">{file.documentType || file.document_type} • {(((file.fileSize || file.file_size || file.size) || 0) / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleFileDelete(file.id)}
                        disabled={deletingFileIds.has(file.id)}
                        className={`px-4 py-2 text-white text-sm rounded-lg transition-all duration-200 flex-1 sm:flex-none text-center shadow-sm ${deletingFileIds.has(file.id)
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
                          }`}
                      >
                        {deletingFileIds.has(file.id) ? 'Deleting...' : 'Delete'}
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
                onClick={completeDocumentsAndContinue}
                disabled={!isComplete}
                className={`w-full py-3 px-6 rounded-lg font-medium shadow-sm transition-all duration-200 ${isComplete
                  ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                Complete Document Upload
              </button>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Note: Only submitted applications are saved permanently. You can update this application anytime before submitting.
              </p>
              {!isComplete && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Please upload all required documents before completing this section.
                </p>
              )}
            </div>
            <ActionButtons
              disabled={!isComplete}
              onContinue={completeDocumentsAndContinue}
            />
            <Footer
              onBack={onBack}
              onSave={() => { }}
              onNext={completeDocumentsAndContinue}
              disabled={!isComplete}
              showBack={true}
              showSave={false}
              showNext={true}
              nextLabel="Next: Academic History"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
