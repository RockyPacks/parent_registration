import React, { useState, useCallback } from 'react';
import { FileUpload } from '../FileUpload';
import { apiService } from '../../services/api';

type DocKey =
  | 'birth_certificate'
  | 'parent1_id'
  | 'parent2_id'
  | 'school_report'
  | 'proof_of_address'
  | 'immunization_record';

interface FieldState {
  uploadedId: string | null;
  filename: string | null;
  isUploading: boolean;
  progress: number;
  error: string | null;
}

interface DocFieldDef {
  key: DocKey;
  label: string;
  optional: boolean;
  acceptMimes: string[];
  acceptAttr: string;
  acceptLabel: string;
}

const IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png'];
const MIXED_MIMES = [
  ...IMAGE_MIMES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const DOCUMENT_FIELDS: DocFieldDef[] = [
  {
    key: 'birth_certificate',
    label: "Student's Unabridged Birth Certificate",
    optional: true,
    acceptMimes: IMAGE_MIMES,
    acceptAttr: '.jpg,.jpeg,.png',
    acceptLabel: 'JPG, JPEG, PNG',
  },
  {
    key: 'parent1_id',
    label: 'Parent / Guardian 1 ID or Passport',
    optional: true,
    acceptMimes: IMAGE_MIMES,
    acceptAttr: '.jpg,.jpeg,.png',
    acceptLabel: 'JPG, JPEG, PNG',
  },
  {
    key: 'parent2_id',
    label: 'Parent / Guardian 2 ID or Passport',
    optional: true,
    acceptMimes: IMAGE_MIMES,
    acceptAttr: '.jpg,.jpeg,.png',
    acceptLabel: 'JPG, JPEG, PNG',
  },
  {
    key: 'school_report',
    label: 'School Report',
    optional: true,
    acceptMimes: MIXED_MIMES,
    acceptAttr: '.jpg,.jpeg,.png,.pdf,.doc,.docx',
    acceptLabel: 'JPG, JPEG, PNG, PDF, DOC, DOCX',
  },
  {
    key: 'proof_of_address',
    label: 'Proof of Address',
    optional: true,
    acceptMimes: MIXED_MIMES,
    acceptAttr: '.jpg,.jpeg,.png,.pdf,.doc,.docx',
    acceptLabel: 'JPG, JPEG, PNG, PDF, DOC, DOCX',
  },
  {
    key: 'immunization_record',
    label: 'Student Immunization Record',
    optional: true,
    acceptMimes: MIXED_MIMES,
    acceptAttr: '.jpg,.jpeg,.png,.pdf,.doc,.docx',
    acceptLabel: 'JPG, JPEG, PNG, PDF, DOC, DOCX',
  },
];

const INITIAL_FIELD: FieldState = {
  uploadedId: null,
  filename: null,
  isUploading: false,
  progress: 0,
  error: null,
};

interface SupportingDocumentsProps {
  applicationId?: string | null;
  onUploadedCountChange?: (count: number) => void;
}

const SupportingDocuments: React.FC<SupportingDocumentsProps> = ({
  applicationId,
  onUploadedCountChange,
}) => {
  const [fields, setFields] = useState<Record<DocKey, FieldState>>(
    () =>
      Object.fromEntries(
        DOCUMENT_FIELDS.map((f) => [f.key, { ...INITIAL_FIELD }])
      ) as Record<DocKey, FieldState>
  );

  const patchField = useCallback(
    (key: DocKey, patch: Partial<FieldState>) => {
      setFields((prev) => {
        const next = { ...prev, [key]: { ...prev[key], ...patch } };
        const uploadedCount = Object.values(next).filter((s) => s.uploadedId !== null).length;
        onUploadedCountChange?.(uploadedCount);
        return next;
      });
    },
    [onUploadedCountChange]
  );

  const handleFileSelect = useCallback(
    async (docField: DocFieldDef, file: File) => {
      const { key, acceptMimes, acceptLabel } = docField;

      if (!acceptMimes.includes(file.type)) {
        patchField(key, {
          error: `Invalid file type. Accepted formats: ${acceptLabel}`,
          uploadedId: null,
          filename: null,
        });
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        patchField(key, {
          error: 'File size exceeds the 5MB limit.',
          uploadedId: null,
          filename: null,
        });
        return;
      }

      if (!applicationId) {
        patchField(key, {
          error: 'Please save your details first before uploading documents.',
        });
        return;
      }

      patchField(key, { isUploading: true, error: null, progress: 0, uploadedId: null, filename: null });

      try {
        const response = await apiService.uploadFile(
          file,
          applicationId,
          key,
          (progress) => patchField(key, { progress })
        );

        patchField(key, {
          isUploading: false,
          progress: 100,
          uploadedId: response.file.id,
          filename: response.file.filename,
          error: null,
        });
      } catch (err: any) {
        patchField(key, {
          isUploading: false,
          progress: 0,
          error: err?.message || 'Upload failed. Please try again.',
        });
      }
    },
    [applicationId, patchField]
  );

  return (
    <div className="pt-4 space-y-8">
      {DOCUMENT_FIELDS.map((docField) => {
        const state = fields[docField.key];
        return (
          <div key={docField.key} className="space-y-2">
            {/* Label */}
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700">
                {docField.label}
              </label>
              {docField.optional && (
                <span className="text-xs text-gray-400">(Optional)</span>
              )}
            </div>

            {/* Upload / progress / success state */}
            {state.isUploading ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">Uploading…</span>
                  <span className="text-xs text-blue-600">{state.progress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${state.progress}%` }}
                  />
                </div>
              </div>
            ) : state.filename ? (
              <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-3.5 h-3.5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-gray-700 truncate">{state.filename}</span>
                </div>
                <label className="cursor-pointer text-xs font-medium text-blue-600 hover:text-blue-700 flex-shrink-0 ml-3">
                  Replace
                  <input
                    type="file"
                    className="hidden"
                    accept={docField.acceptAttr}
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileSelect(docField, e.target.files[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            ) : (
              <FileUpload
                onFileUpload={(file) => handleFileSelect(docField, file)}
                accept={docField.acceptAttr}
                helperText={`Accepted: ${docField.acceptLabel} · Max 5MB`}
              />
            )}

            {/* Validation error */}
            {state.error && (
              <div className="flex items-center gap-1.5">
                <svg
                  className="w-4 h-4 text-red-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SupportingDocuments;
