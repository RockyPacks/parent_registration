import React, { useEffect, useMemo, useState } from 'react';
import {
  ApplicantScreeningResults,
  ScreeningCheckResult,
  ScreeningCheckStatus,
  ScreeningOverallStatus,
  apiService,
} from '../services/api';
import { isStAndrewsSchool } from '../utils/schoolConsent';

interface ApplicantProfileScreeningCardProps {
  applicationId: string;
  schoolName?: string | null;
  schoolKey?: string | null;
  initialData?: ApplicantScreeningResults | null;
}

const orderedChecks = [
  { checkKey: 'dha_id', checkName: 'DHA ID' },
  { checkKey: 'person_verification', checkName: 'Person Verification' },
  { checkKey: 'affordability', checkName: 'Affordability' },
  { checkKey: 'credit_bureau', checkName: 'Credit Bureau' },
  { checkKey: 'risk_score', checkName: 'Risk Score' },
  { checkKey: 'safps_fraud', checkName: 'SAFPS Fraud' },
  { checkKey: 'compliance', checkName: 'Compliance' },
  { checkKey: 'address_kyc', checkName: 'Address KYC' },
];

const statusLabels: Record<ScreeningCheckStatus, string> = {
  pending: 'Pending',
  not_run: 'Not run',
  pass: 'Pass',
  refer: 'Refer',
  flagged: 'Flagged',
  error: 'Error',
};

const statusCopy: Record<ScreeningCheckStatus, string> = {
  pending: 'Result requested and waiting for a response.',
  not_run: 'This check has not been initiated yet.',
  pass: 'No issue requiring review was found.',
  refer: 'Needs admissions review before a decision is made.',
  flagged: 'Urgent review required before progressing.',
  error: 'The check could not return a result.',
};

const ApplicantProfileScreeningCard: React.FC<ApplicantProfileScreeningCardProps> = ({
  applicationId,
  schoolName,
  schoolKey,
  initialData = null,
}) => {
  const [data, setData] = useState<ApplicantScreeningResults | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const isStAndrews =
    schoolKey === 'ST_ANDREWS' ||
    data?.schoolKey === 'ST_ANDREWS' ||
    isStAndrewsSchool(schoolName || data?.schoolName);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!applicationId || initialData) return;
      setLoading(true);
      setError('');
      try {
        const response = await apiService.getApplicantScreeningResults(applicationId);
        if (!cancelled) setData(response);
      } catch (err: any) {
        if (!cancelled) setError(cleanApiError(err.message || 'Could not load screening results.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [applicationId, initialData]);

  const checks = useMemo(() => normalizeChecks(data?.checks || []), [data]);
  const overallStatus = data?.overallStatus || calculateOverallStatus(checks);
  const statusCounts = useMemo(() => countStatuses(checks), [checks]);

  if (!loading && !isStAndrews) return null;

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gray-50 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Admissions Screening</div>
            <h2 className="mt-1 text-xl font-semibold text-gray-950">St Andrews applicant risk review</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
              {data?.overallSummary || overallSummaryCopy(overallStatus)}
            </p>
            <p className="mt-1 text-xs text-gray-500">Plain-language outcomes only. Raw bureau data is not shown here.</p>
          </div>
          <OverallBadge status={overallStatus} />
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <div className="m-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:m-6">
          {error}
        </div>
      ) : (
        <>
          <div className="grid gap-3 border-b border-gray-200 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
            <SummaryTile label="Checks clear" value={statusCounts.pass} tone="green" />
            <SummaryTile label="Needs review" value={statusCounts.refer + statusCounts.error} tone="amber" />
            <SummaryTile label="Flagged urgent" value={statusCounts.flagged} tone="red" />
            <SummaryTile label="Awaiting result" value={statusCounts.pending + statusCounts.not_run} tone="gray" />
          </div>

          <div className="px-5 py-4 sm:px-6">
            <div className="rounded-md border border-gray-200 bg-white">
              {checks.map((check, index) => {
                const expanded = Boolean(expandedRows[check.checkKey]);
                return (
                  <div
                    key={check.checkKey}
                    className={`${index > 0 ? 'border-t border-gray-200' : ''} ${
                      check.status === 'flagged' ? 'bg-red-50/70' : check.status === 'refer' ? 'bg-amber-50/60' : ''
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedRows((prev) => ({ ...prev, [check.checkKey]: !expanded }))}
                      className="flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-gray-50"
                      aria-expanded={expanded}
                    >
                      <StatusIcon status={check.status} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-950">{check.checkName}</h3>
                            <p className="mt-1 text-sm leading-5 text-gray-600">{check.summary || statusCopy[check.status]}</p>
                          </div>
                          <div className="flex flex-shrink-0 items-center gap-3">
                            <StatusBadge status={check.status} />
                            <span className="text-lg leading-none text-gray-400">{expanded ? '−' : '+'}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {check.timestamp ? `Updated ${formatDateTime(check.timestamp)}` : 'No result timestamp yet'}
                        </div>
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t border-gray-200 bg-white px-4 py-4 sm:pl-16">
                        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Review detail</div>
                            <p className="mt-2 text-sm leading-6 text-gray-700">
                              {check.details || check.summary || statusCopy[check.status]}
                            </p>
                          </div>
                          {check.actionLabel && (
                            <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                              {check.actionLabel}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
};

function normalizeChecks(results: ScreeningCheckResult[]): ScreeningCheckResult[] {
  const byKey = new Map(results.map((check) => [check.checkKey, check]));
  return orderedChecks.map((check) => {
    const result = byKey.get(check.checkKey);
    return {
      checkKey: check.checkKey,
      checkName: result?.checkName || check.checkName,
      status: result?.status || 'not_run',
      summary: result?.summary || statusCopy.not_run,
      timestamp: result?.timestamp || null,
      details: result?.details || null,
      actionLabel: result?.actionLabel || null,
    };
  });
}

function calculateOverallStatus(checks: ScreeningCheckResult[]): ScreeningOverallStatus {
  if (checks.some((check) => check.status === 'flagged')) return 'red';
  if (checks.every((check) => check.status === 'pass')) return 'green';
  return 'amber';
}

function countStatuses(checks: ScreeningCheckResult[]) {
  return checks.reduce<Record<ScreeningCheckStatus, number>>(
    (counts, check) => {
      counts[check.status] += 1;
      return counts;
    },
    { pending: 0, not_run: 0, pass: 0, refer: 0, flagged: 0, error: 0 }
  );
}

const OverallBadge: React.FC<{ status: ScreeningOverallStatus }> = ({ status }) => {
  const content = {
    green: {
      label: 'GREEN',
      summary: 'All checks clear',
      className: 'border-green-200 bg-green-50 text-green-900',
    },
    amber: {
      label: 'AMBER',
      summary: 'Review needed',
      className: 'border-amber-200 bg-amber-50 text-amber-950',
    },
    red: {
      label: 'RED',
      summary: 'Urgent flag',
      className: 'border-red-200 bg-red-50 text-red-900',
    },
  }[status];

  return (
    <div className={`w-fit rounded-lg border px-4 py-3 ${content.className}`}>
      <div className="text-xs font-semibold uppercase tracking-wide">Overall status</div>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-lg font-bold">{content.label}</span>
        <span className="text-sm font-medium">{content.summary}</span>
      </div>
    </div>
  );
};

const SummaryTile: React.FC<{ label: string; value: number; tone: 'green' | 'amber' | 'red' | 'gray' }> = ({ label, value, tone }) => {
  const colors = {
    green: 'border-green-200 bg-green-50 text-green-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-950',
    red: 'border-red-200 bg-red-50 text-red-900',
    gray: 'border-gray-200 bg-gray-50 text-gray-800',
  };

  return (
    <div className={`rounded-md border p-4 ${colors[tone]}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wide">{label}</div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: ScreeningCheckStatus }> = ({ status }) => {
  const colors: Record<ScreeningCheckStatus, string> = {
    pending: 'bg-blue-100 text-blue-800',
    not_run: 'bg-gray-100 text-gray-700',
    pass: 'bg-green-100 text-green-800',
    refer: 'bg-amber-100 text-amber-900',
    flagged: 'bg-red-100 text-red-800',
    error: 'bg-rose-100 text-rose-800',
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${colors[status]}`}>
      {statusLabels[status]}
    </span>
  );
};

const StatusIcon: React.FC<{ status: ScreeningCheckStatus }> = ({ status }) => {
  const styles: Record<ScreeningCheckStatus, string> = {
    pending: 'border-blue-200 bg-blue-50 text-blue-700',
    not_run: 'border-gray-200 bg-gray-50 text-gray-500',
    pass: 'border-green-200 bg-green-50 text-green-700',
    refer: 'border-amber-200 bg-amber-50 text-amber-800',
    flagged: 'border-red-200 bg-red-50 text-red-700',
    error: 'border-rose-200 bg-rose-50 text-rose-700',
  };
  const icons: Record<ScreeningCheckStatus, string> = {
    pending: '…',
    not_run: '○',
    pass: '✓',
    refer: '!',
    flagged: '!',
    error: '×',
  };

  return (
    <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border text-sm font-bold ${styles[status]}`}>
      {icons[status]}
    </span>
  );
};

const LoadingState: React.FC = () => (
  <div className="p-5 sm:p-6">
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-20 animate-pulse rounded-md bg-gray-100" />
      ))}
    </div>
    <div className="rounded-md border border-gray-200">
      {orderedChecks.map((check) => (
        <div key={check.checkKey} className="flex items-center gap-4 border-b border-gray-200 px-4 py-4 last:border-b-0">
          <div className="h-9 w-9 animate-pulse rounded-full bg-gray-100" />
          <div className="flex-1">
            <div className="h-4 w-44 animate-pulse rounded bg-gray-100" />
            <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
        </div>
      ))}
    </div>
  </div>
);

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function overallSummaryCopy(status: ScreeningOverallStatus): string {
  if (status === 'green') return 'All screening checks are clear for this applicant family.';
  if (status === 'red') return 'One or more checks have a hard flag and need urgent admissions review.';
  return 'One or more checks need review or are still waiting for a result.';
}

function cleanApiError(message: string): string {
  const detailMatch = message.match(/"detail":"([^"]+)"/);
  return detailMatch?.[1] || message;
}

export default ApplicantProfileScreeningCard;
