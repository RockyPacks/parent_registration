import React, { useEffect, useMemo, useState } from 'react';
import { apiService, PvseQuestion, PvseStatusResponse } from '../../services/api';

interface IdentityVerificationProps {
  applicationId?: string | null;
  feeData: any;
  onStatusChange?: (status: PvseStatusResponse) => void;
}

const terminalResults = new Set(['passed', 'failed', 'soft_locked', 'hard_locked']);

const IdentityVerification: React.FC<IdentityVerificationProps> = ({
  applicationId,
  feeData,
  onStatusChange,
}) => {
  const [status, setStatus] = useState<PvseStatusResponse | null>(null);
  const [questions, setQuestions] = useState<PvseQuestion[]>([]);
  const [transactionId, setTransactionId] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const hasRequiredParentDetails = useMemo(() => (
    Boolean(
      feeData?.parentIdNumber &&
      /^\d{13}$/.test(String(feeData.parentIdNumber)) &&
      feeData?.parentFirstName &&
      feeData?.parentSurname
    )
  ), [feeData]);

  useEffect(() => {
    let cancelled = false;

    const loadStatus = async () => {
      if (!applicationId) return;
      try {
        const nextStatus = await apiService.getPvseStatus(applicationId);
        if (!cancelled) {
          setStatus(nextStatus);
          onStatusChange?.(nextStatus);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Could not load identity verification status.');
        }
      }
    };

    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [applicationId, onStatusChange]);

  const startVerification = async () => {
    if (!applicationId || !hasRequiredParentDetails) return;
    setLoading(true);
    setError('');
    setQuestions([]);
    setAnswers({});

    try {
      await apiService.autoSaveEnrollment({
        application_id: applicationId,
        fee: feeData,
      });
      const response = await apiService.startPvseVerification(applicationId);
      setTransactionId(response.transactionId);
      setQuestions(response.questions || []);
      const nextStatus: PvseStatusResponse = {
        transactionId: response.transactionId,
        result: response.result,
        verified: false,
        message: response.message,
      };
      setStatus(nextStatus);
      onStatusChange?.(nextStatus);
    } catch (err: any) {
      setError(cleanApiError(err.message || 'We could not start identity verification. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const submitAnswers = async () => {
    if (!transactionId || questions.length === 0) return;
    const missingAnswer = questions.some((question) => !answers[question.questionId]);
    if (missingAnswer) {
      setError('Please answer all identity verification questions before submitting.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await apiService.submitPvseAnswers(
        transactionId,
        questions.map((question) => ({
          questionId: question.questionId,
          answerId: answers[question.questionId],
        }))
      );
      setStatus(response);
      setQuestions([]);
      setAnswers({});
      onStatusChange?.(response);
    } catch (err: any) {
      setError(cleanApiError(err.message || 'We could not submit identity verification answers. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const result = status?.result || 'not_started';
  const isPassed = result === 'passed';
  const isLocked = result === 'soft_locked' || result === 'hard_locked';
  const canStart = Boolean(applicationId && hasRequiredParentDetails && !loading && !isPassed && !isLocked);
  const canSubmit = questions.length > 0 && !loading && questions.every((question) => answers[question.questionId]);

  return (
    <section id="identity-verification" className="mt-8 rounded-lg border border-blue-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Identity Verification</h3>
          <p className="mt-1 text-sm text-gray-600">
            Verify the parent responsible for fees before submitting the application.
          </p>
        </div>
        <span className={statusBadgeClass(result)}>
          {statusBadgeLabel(result)}
        </span>
      </div>

      {!hasRequiredParentDetails && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Please complete the parent ID number, first name, and surname in Fee Responsibility before verification.
        </div>
      )}

      {status?.message && (
        <div className={messageClass(result)}>
          {status.message}
          {status.lockedUntil && (
            <span className="block mt-1 text-xs">
              Retry after: {new Date(status.lockedUntil).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {questions.length === 0 && !isPassed && !isLocked && (
        <button
          type="button"
          onClick={startVerification}
          disabled={!canStart}
          className="mt-5 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Starting verification...' : terminalResults.has(result) ? 'Restart Verification' : 'Start Identity Verification'}
        </button>
      )}

      {questions.length > 0 && (
        <div className="mt-6 space-y-5">
          {questions.map((question, index) => (
            <fieldset key={question.questionId} className="rounded-md border border-gray-200 p-4">
              <legend className="px-1 text-sm font-semibold text-gray-900">
                {index + 1}. {question.questionText}
              </legend>
              <div className="mt-3 space-y-2">
                {question.answers.map((answer) => (
                  <label key={answer.answerId} className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 p-3 hover:bg-gray-50">
                    <input
                      type="radio"
                      name={question.questionId}
                      value={answer.answerId}
                      checked={answers[question.questionId] === answer.answerId}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.questionId]: answer.answerId }))}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-800">{answer.answerText}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <button
            type="button"
            onClick={submitAnswers}
            disabled={!canSubmit}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Submitting answers...' : 'Submit Answers'}
          </button>
        </div>
      )}
    </section>
  );
};

function cleanApiError(message: string): string {
  const detailMatch = message.match(/"detail":"([^"]+)"/);
  return detailMatch?.[1] || message;
}

function statusBadgeLabel(result: string): string {
  switch (result) {
    case 'passed':
      return 'Verified';
    case 'failed':
      return 'Failed';
    case 'soft_locked':
    case 'hard_locked':
      return 'Locked';
    case 'questions_generated':
      return 'In progress';
    default:
      return 'Required';
  }
}

function statusBadgeClass(result: string): string {
  const base = 'inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold';
  if (result === 'passed') return `${base} bg-green-100 text-green-800`;
  if (result === 'failed' || result === 'hard_locked') return `${base} bg-red-100 text-red-800`;
  if (result === 'soft_locked') return `${base} bg-amber-100 text-amber-800`;
  if (result === 'questions_generated') return `${base} bg-blue-100 text-blue-800`;
  return `${base} bg-gray-100 text-gray-700`;
}

function messageClass(result: string): string {
  const base = 'mt-4 rounded-md border p-4 text-sm';
  if (result === 'passed') return `${base} border-green-200 bg-green-50 text-green-800`;
  if (result === 'failed' || result === 'hard_locked') return `${base} border-red-200 bg-red-50 text-red-800`;
  if (result === 'soft_locked') return `${base} border-amber-200 bg-amber-50 text-amber-900`;
  return `${base} border-blue-200 bg-blue-50 text-blue-900`;
}

export default IdentityVerification;
