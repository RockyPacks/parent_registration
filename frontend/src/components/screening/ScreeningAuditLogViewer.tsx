import React, { useCallback, useEffect, useState } from 'react';
import { ScreeningAuditLogEntry, ScreeningCheckStatus, apiService } from '../../services/api';

interface ScreeningAuditLogViewerProps {
  schoolKey?: string;
  applicationId?: string;
  initialEntries?: ScreeningAuditLogEntry[];
}

const statusLabels: Record<ScreeningCheckStatus, string> = {
  pending: 'Pending',
  not_run: 'Not run',
  pass: 'Pass',
  refer: 'Refer',
  flagged: 'Flagged',
  error: 'Error',
};

const ScreeningAuditLogViewer: React.FC<ScreeningAuditLogViewerProps> = ({
  schoolKey = 'ST_ANDREWS',
  applicationId,
  initialEntries,
}) => {
  const [entries, setEntries] = useState<ScreeningAuditLogEntry[]>(initialEntries || []);
  const [loading, setLoading] = useState(!initialEntries);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiService.getScreeningAuditLog({ schoolKey, applicationId });
      setEntries(data || []);
    } catch (err: any) {
      setError(cleanApiError(err.message || 'Could not load screening audit log.'));
    } finally {
      setLoading(false);
    }
  }, [applicationId, schoolKey]);

  useEffect(() => {
    if (!initialEntries) load();
  }, [initialEntries, load]);

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-950">Screening audit log</h2>
          <p className="mt-1 text-sm text-gray-600">
            Read-only record of screening calls, references, and plain-language outcomes.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="w-fit rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="m-5 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3 p-5">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-20 animate-pulse rounded-md bg-gray-100" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="p-5 text-sm text-gray-600">No screening audit events have been recorded yet.</div>
      ) : (
        <div className="divide-y divide-gray-200">
          {entries.map((entry) => (
            <article key={entry.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(180px,220px)_1fr_auto] lg:items-start">
              <div>
                <div className="text-sm font-semibold text-gray-950">{entry.checkName}</div>
                <div className="mt-1 text-xs text-gray-500">{formatDateTime(entry.timestamp)}</div>
              </div>
              <div>
                <p className="text-sm leading-6 text-gray-700">{entry.resultSummary}</p>
                <div className="mt-2 text-xs text-gray-500">
                  Experian reference: <span className="font-mono text-gray-700">{entry.experianReference || 'Not available'}</span>
                </div>
              </div>
              {entry.status && <StatusBadge status={entry.status} />}
            </article>
          ))}
        </div>
      )}
    </section>
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
    <span className={`inline-flex h-fit w-fit rounded-full px-3 py-1 text-xs font-semibold ${colors[status]}`}>
      {statusLabels[status]}
    </span>
  );
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function cleanApiError(message: string): string {
  const detailMatch = message.match(/"detail":"([^"]+)"/);
  return detailMatch?.[1] || message;
}

export default ScreeningAuditLogViewer;
