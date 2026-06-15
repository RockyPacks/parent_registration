import React, { useEffect, useMemo, useState } from 'react';
import Footer from '../Footer';
import { apiService, ConsentConfigResponse, PvseQuestion, PvseStatusResponse } from '../../services/api';

interface Step6PopiaConsentStepProps {
  applicationId?: string | null;
  feeData: any;
  onStepChange?: (step: number) => void;
  onStepComplete?: (stepNumber: number) => void;
  onConsentComplete?: (data: any) => void;
}

const completeKbaResults = new Set(['passed', 'failed', 'soft_locked', 'hard_locked']);

const Step6PopiaConsentStep: React.FC<Step6PopiaConsentStepProps> = ({
  applicationId,
  feeData,
  onStepChange,
  onStepComplete,
  onConsentComplete,
}) => {
  const [config, setConfig] = useState<ConsentConfigResponse | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [consent, setConsent] = useState<any>(null);
  const [questions, setQuestions] = useState<PvseQuestion[]>([]);
  const [transactionId, setTransactionId] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [kbaStatus, setKbaStatus] = useState<PvseStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const hasFeePayerDetails = useMemo(() => Boolean(
    feeData?.parentIdNumber &&
    /^\d{13}$/.test(String(feeData.parentIdNumber)) &&
    feeData?.parentFirstName &&
    feeData?.parentSurname
  ), [feeData]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!applicationId) return;
      setLoading(true);
      setError('');
      try {
        const nextConfig = await apiService.getConsentConfig(applicationId);
        const nextKbaStatus = nextConfig.kbaEnabled
          ? await apiService.getPvseStatus(applicationId)
          : null;

        if (cancelled) return;
        setConfig(nextConfig);
        setConsent(nextConfig.consent);
        setAccepted(Boolean(nextConfig.consent));
        setKbaStatus(nextKbaStatus);
        if (nextConfig.consent) {
          onConsentComplete?.({
            ...nextConfig.consent,
            kbaEnabled: nextConfig.kbaEnabled,
            kbaResult: nextKbaStatus?.result || null,
          });
        }
      } catch (err: any) {
        if (!cancelled) setError(cleanApiError(err.message || 'Could not load consent details.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [applicationId, onConsentComplete]);

  const consentRecorded = Boolean(consent?.consentToken);
  const kbaPassed = !config?.kbaEnabled || kbaStatus?.result === 'passed';
  const canContinue = config?.screeningEnabled === false || (consentRecorded && kbaPassed);
  const hasConfigError = Boolean(error && !config);

  const recordConsent = async () => {
    if (!applicationId || !config?.disclosure || !accepted) return;
    setSaving(true);
    setError('');
    try {
      const nextConsent = await apiService.recordConsent(applicationId, config.disclosure.version, true);
      setConsent(nextConsent);
      onConsentComplete?.({ ...nextConsent, kbaEnabled: config.kbaEnabled, kbaResult: kbaStatus?.result || null });
    } catch (err: any) {
      setError(cleanApiError(err.message || 'Could not record consent. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const startKba = async () => {
    if (!applicationId || !consentRecorded) return;
    setSaving(true);
    setError('');
    setQuestions([]);
    setAnswers({});
    try {
      await apiService.autoSaveEnrollment({ application_id: applicationId, fee: feeData });
      const response = await apiService.startPvseVerification(applicationId);
      setTransactionId(response.transactionId);
      setQuestions(response.questions || []);
      setKbaStatus({
        transactionId: response.transactionId,
        result: response.result,
        verified: false,
        message: response.message,
      });
    } catch (err: any) {
      setError(cleanApiError(err.message || 'Could not start identity verification.'));
    } finally {
      setSaving(false);
    }
  };

  const submitKbaAnswers = async () => {
    if (!transactionId || questions.length === 0) return;
    if (questions.some((question) => !answers[question.questionId])) {
      setError('Please answer all identity verification questions before submitting.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await apiService.submitPvseAnswers(
        transactionId,
        questions.map((question) => ({
          questionId: question.questionId,
          answerId: answers[question.questionId],
        }))
      );
      setKbaStatus(response);
      setQuestions([]);
      setAnswers({});
      if (consent) {
        onConsentComplete?.({ ...consent, kbaEnabled: true, kbaResult: response.result });
      }
    } catch (err: any) {
      setError(cleanApiError(err.message || 'Could not submit identity verification answers.'));
    } finally {
      setSaving(false);
    }
  };

  const continueToReview = () => {
    if (!canContinue) return;
    onStepComplete?.(6);
    onStepChange?.(7);
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 mt-24">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 mb-2">POPIA Consent</h1>
              <p className="text-gray-700 font-medium">Review screening consent before the admissions checks run</p>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                  <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600">6</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Step 6 of 7</div>
                <div className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Required gate
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-16 md:pt-20 pb-32">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading ? (
            <div className="p-6">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                Loading consent details...
              </div>
            </div>
          ) : hasConfigError ? (
            <div className="m-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error}
            </div>
          ) : config && !config.screeningEnabled ? (
            <div className="p-6">
              <p className="text-sm text-gray-700">Screening consent is not required for this application.</p>
            </div>
          ) : config ? (
            <>
              <div className="border-b border-gray-200 bg-gray-50 px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{config.disclosure?.title || 'Consent for screening checks'}</h2>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                      Version {config.disclosure?.version}
                    </p>
                  </div>
                  <StatusPill label={consentRecorded ? 'Consented' : 'Waiting for consent'} tone={consentRecorded ? 'green' : 'amber'} />
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="rounded-md border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm leading-6 text-blue-950">{config.disclosure?.body}</p>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <InfoList title="Checks that may run" items={config.disclosure?.checks || []} />
                  <InfoList title="Your rights" items={config.disclosure?.rights || []} />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <FactCard label="Responsible Party" value={config.disclosure?.responsibleParty || 'St Andrews'} />
                  <FactCard label="Screening operator" value={config.disclosure?.operatorName || 'Experian via Knit'} />
                </div>

                {consentRecorded ? (
                  <div className="mt-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green-600 text-white">
                        <span className="text-sm font-bold">✓</span>
                      </div>
                      <div>
                        <div className="font-semibold">Consent confirmed</div>
                        <div className="mt-1 text-green-800">
                          Recorded on {new Date(consent.consentedAt).toLocaleString()}.
                        </div>
                        <div className="mt-1 text-xs text-green-700">
                          A secure consent record has been saved for this application.
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className={`mt-6 flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors ${
                    accepted ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}>
                    <input
                      type="checkbox"
                      checked={accepted}
                      onChange={(event) => setAccepted(event.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm leading-6 text-gray-800">
                      I consent to St Andrews requesting these admissions screening checks through Knit and Experian.
                    </span>
                  </label>
                )}

                {!consentRecorded && (
                  <button
                    type="button"
                    onClick={recordConsent}
                    disabled={!accepted || saving}
                    className="mt-5 inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? 'Recording consent...' : 'Record Consent'}
                  </button>
                )}

                {config.kbaEnabled && consentRecorded && (
                  <KbaPanel
                    hasFeePayerDetails={hasFeePayerDetails}
                    enforceFeePayerDetails={true}
                    status={kbaStatus}
                    questions={questions}
                    answers={answers}
                    saving={saving}
                    onStart={startKba}
                    onAnswerChange={(questionId, answerId) => setAnswers((prev) => ({ ...prev, [questionId]: answerId }))}
                    onSubmit={submitKbaAnswers}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="p-6">
              <p className="text-sm text-gray-700">Consent configuration is unavailable.</p>
            </div>
          )}

          {error && config && (
            <div className="mx-5 mb-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:mx-6">
              {error}
            </div>
          )}
        </div>
      </div>

      <Footer
        onBack={() => onStepChange?.(5)}
        onSave={() => {}}
        onNext={continueToReview}
        showBack={true}
        showSave={false}
        showNext={true}
        nextLabel="Next: Review and Submit"
        disabled={!canContinue}
      />
    </div>
  );
};

const InfoList: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div className="rounded-md border border-gray-200 bg-white p-4">
    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    <ul className="mt-3 space-y-2 text-sm leading-5 text-gray-700">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

const FactCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
    <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
    <div className="mt-1 text-sm font-semibold text-gray-900">{value}</div>
  </div>
);

const StatusPill: React.FC<{ label: string; tone: 'green' | 'amber' | 'blue' | 'red' }> = ({ label, tone }) => {
  const colors = {
    green: 'bg-green-100 text-green-800',
    amber: 'bg-amber-100 text-amber-900',
    blue: 'bg-blue-100 text-blue-800',
    red: 'bg-red-100 text-red-800',
  };
  return <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${colors[tone]}`}>{label}</span>;
};

const KbaPanel: React.FC<{
  hasFeePayerDetails: boolean;
  enforceFeePayerDetails?: boolean;
  status: PvseStatusResponse | null;
  questions: PvseQuestion[];
  answers: Record<string, string>;
  saving: boolean;
  onStart: () => void;
  onAnswerChange: (questionId: string, answerId: string) => void;
  onSubmit: () => void;
}> = ({ hasFeePayerDetails, enforceFeePayerDetails = false, status, questions, answers, saving, onStart, onAnswerChange, onSubmit }) => {
  const result = status?.result || 'not_started';
  const isPassed = result === 'passed';
  const isBlocked = result === 'soft_locked' || result === 'hard_locked';
  const canSubmit = questions.length > 0 && questions.every((question) => answers[question.questionId]) && !saving;

  return (
    <section className="mt-8 rounded-lg border border-blue-200 bg-blue-50/40 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Identity Questions</h3>
          <p className="mt-1 text-sm text-gray-600">Answer the Experian-generated questions before continuing.</p>
        </div>
        <StatusPill label={kbaLabel(result)} tone={isPassed ? 'green' : isBlocked ? 'red' : 'blue'} />
      </div>

      {enforceFeePayerDetails && !hasFeePayerDetails && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Please complete the fee payer ID number, first name, and surname in Fee Responsibility before identity questions can start.
        </div>
      )}

      {status?.message && (
        <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          {status.message}
        </div>
      )}

      {questions.length === 0 && !isPassed && !isBlocked && (
        <button
          type="button"
          onClick={onStart}
          disabled={(enforceFeePayerDetails && !hasFeePayerDetails) || saving}
          className="mt-5 inline-flex rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Starting...' : completeKbaResults.has(result) ? 'Restart Questions' : 'Start Questions'}
        </button>
      )}

      {questions.length > 0 && (
        <div className="mt-6 space-y-5">
          {questions.map((question, index) => (
            <fieldset key={question.questionId} className="rounded-md border border-gray-200 bg-white p-4">
              <legend className="px-1 text-sm font-semibold text-gray-900">Question {index + 1}: {question.questionText}</legend>
              <div className="mt-3 space-y-2">
                {question.answers.map((answer) => (
                  <label
                    key={answer.answerId}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                      answers[question.questionId] === answer.answerId
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.questionId}
                      value={answer.answerId}
                      checked={answers[question.questionId] === answer.answerId}
                      onChange={() => onAnswerChange(question.questionId, answer.answerId)}
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
            onClick={onSubmit}
            disabled={!canSubmit}
            className="inline-flex rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Submitting...' : 'Submit Answers'}
          </button>
        </div>
      )}
    </section>
  );
};

function kbaLabel(result: string): string {
  if (result === 'passed') return 'Passed';
  if (result === 'failed') return 'Refer';
  if (result === 'questions_generated') return 'In progress';
  if (result === 'soft_locked' || result === 'hard_locked') return 'Locked';
  return 'Waiting';
}

function cleanApiError(message: string): string {
  const detailMatch = message.match(/"detail":"([^"]+)"/);
  return detailMatch?.[1] || message;
}

export default Step6PopiaConsentStep;
