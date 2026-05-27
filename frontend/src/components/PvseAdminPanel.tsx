import React, { useCallback, useEffect, useState } from 'react';
import { apiService } from '../services/api';

interface LockedEntry {
  parentId: string;
  userId: string;
  transactionId: string;
  createdAt: string;
  updatedAt: string;
}

const PvseAdminPanel: React.FC = () => {
  const [locked, setLocked] = useState<LockedEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const [reasonInputs, setReasonInputs] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiService.adminPvseListLocked();
      setLocked(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load hard-locked verifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleUnblock = async (parentId: string) => {
    const reason = (reasonInputs[parentId] || '').trim();
    if (!reason) {
      setError(`Please provide a reason before unblocking parent ${parentId}.`);
      return;
    }
    setUnblocking(parentId);
    setError('');
    setSuccessMessage('');
    try {
      const result = await apiService.adminPvseUnblock(parentId, reason);
      setSuccessMessage(result.message || 'Parent successfully unblocked.');
      setReasonInputs((prev) => {
        const next = { ...prev };
        delete next[parentId];
        return next;
      });
      await load();
    } catch (err: any) {
      setError(err.message || 'Failed to unblock parent.');
    } finally {
      setUnblocking(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Identity Verification — Hard-Locked Parents
        </h2>
        <button
          onClick={load}
          disabled={loading}
          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {!loading && locked.length === 0 && (
        <p className="text-sm text-gray-500">No hard-locked parents found.</p>
      )}

      {locked.length > 0 && (
        <div className="space-y-4">
          {locked.map((entry) => (
            <div
              key={entry.parentId}
              className="rounded-lg border border-red-200 bg-red-50 p-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <span className="font-medium text-gray-700">Parent ID: </span>
                  <span className="font-mono text-gray-900">{entry.parentId}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">User ID: </span>
                  <span className="font-mono text-gray-900">{entry.userId}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Transaction: </span>
                  <span className="font-mono text-gray-900 break-all">{entry.transactionId}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Locked at: </span>
                  <span className="text-gray-900">
                    {new Date(entry.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Reason for unblocking (required)"
                  value={reasonInputs[entry.parentId] || ''}
                  onChange={(e) =>
                    setReasonInputs((prev) => ({
                      ...prev,
                      [entry.parentId]: e.target.value,
                    }))
                  }
                  className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleUnblock(entry.parentId)}
                  disabled={unblocking === entry.parentId}
                  className="whitespace-nowrap rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {unblocking === entry.parentId ? 'Unblocking…' : 'Unblock Parent'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PvseAdminPanel;
