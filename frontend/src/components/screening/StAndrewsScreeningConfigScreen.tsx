import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScreeningAdminConfig,
  ScreeningCheckConfig,
  ScreeningCheckMode,
  ScreeningConfigChangeLogEntry,
  ScreeningThresholdConfig,
  apiService,
} from '../../services/api';
import ScreeningAuditLogViewer from './ScreeningAuditLogViewer';

interface StAndrewsScreeningConfigScreenProps {
  schoolKey?: string;
  canManageScreening?: boolean;
}

const defaultChecks: ScreeningCheckConfig[] = [
  { checkKey: 'dha_id', checkName: 'DHA ID', mode: 'mandatory' },
  { checkKey: 'person_verification', checkName: 'Person Verification', mode: 'mandatory' },
  { checkKey: 'affordability', checkName: 'Affordability', mode: 'mandatory' },
  { checkKey: 'credit_bureau', checkName: 'Credit Bureau', mode: 'mandatory' },
  { checkKey: 'risk_score', checkName: 'Risk Score', mode: 'mandatory' },
  { checkKey: 'safps_fraud', checkName: 'SAFPS Fraud', mode: 'mandatory' },
  { checkKey: 'compliance', checkName: 'Compliance', mode: 'mandatory' },
  { checkKey: 'address_kyc', checkName: 'Address KYC', mode: 'mandatory' },
];

const defaultThresholds: ScreeningThresholdConfig = {
  affordabilityMonthlyFeeBand: 'school_default',
  affordabilityMonthlyFeeLabel: 'Use school fees config',
  creditDefaultSensitivity: 'single_default_refers',
  riskLowMax: 35,
  riskMediumMax: 65,
};

const StAndrewsScreeningConfigScreen: React.FC<StAndrewsScreeningConfigScreenProps> = ({
  schoolKey = 'ST_ANDREWS',
  canManageScreening,
}) => {
  const [config, setConfig] = useState<ScreeningAdminConfig | null>(null);
  const [draftChecks, setDraftChecks] = useState<ScreeningCheckConfig[]>(defaultChecks);
  const [draftThresholds, setDraftThresholds] = useState<ScreeningThresholdConfig>(defaultThresholds);
  const [draftDisclosure, setDraftDisclosure] = useState({ title: '', body: '' });
  const [changeLog, setChangeLog] = useState<ScreeningConfigChangeLogEntry[]>([]);
  const [applicationFilter, setApplicationFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDisclosure, setSavingDisclosure] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sessionCanManage, setSessionCanManage] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(canManageScreening === undefined);

  const userCanManage = canManageScreening ?? sessionCanManage;

  useEffect(() => {
    if (canManageScreening !== undefined) return;

    let cancelled = false;
    const checkAccess = async () => {
      setCheckingAccess(true);
      try {
        const { supabase } = await import('../../services/supabase');
        const { data } = await supabase.auth.getSession();
        const user = data.session?.user as any;
        const appMetadata = user?.app_metadata || {};
        const userMetadata = user?.user_metadata || {};
        const permissions = [
          ...(appMetadata.permissions || []),
          ...(userMetadata.permissions || []),
        ];
        const hasAccess =
          appMetadata.role === 'admin' ||
          userMetadata.role === 'admin' ||
          permissions.includes('screeningconfig') ||
          permissions.includes('screeningaudit');
        if (!cancelled) setSessionCanManage(hasAccess);
      } finally {
        if (!cancelled) setCheckingAccess(false);
      }
    };

    checkAccess();
    return () => {
      cancelled = true;
    };
  }, [canManageScreening]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextConfig, nextChangeLog] = await Promise.all([
        apiService.getScreeningAdminConfig(schoolKey),
        apiService.getScreeningConfigChangeLog(schoolKey),
      ]);
      setConfig(nextConfig);
      setDraftChecks(mergeChecks(nextConfig.checks));
      setDraftThresholds({ ...defaultThresholds, ...(nextConfig.thresholds || {}) });
      setDraftDisclosure({
        title: nextConfig.disclosure?.title || '',
        body: nextConfig.disclosure?.body || '',
      });
      setChangeLog(nextChangeLog || []);
    } catch (err: any) {
      setError(cleanApiError(err.message || 'Could not load screening configuration.'));
    } finally {
      setLoading(false);
    }
  }, [schoolKey]);

  useEffect(() => {
    if (userCanManage) load();
  }, [load, userCanManage]);

  const changed = useMemo(() => {
    if (!config) return false;
    return JSON.stringify(draftChecks) !== JSON.stringify(mergeChecks(config.checks)) ||
      JSON.stringify(draftThresholds) !== JSON.stringify({ ...defaultThresholds, ...(config.thresholds || {}) });
  }, [config, draftChecks, draftThresholds]);

  const handleModeChange = (checkKey: string, mode: ScreeningCheckMode) => {
    setDraftChecks((prev) => prev.map((check) => check.checkKey === checkKey ? { ...check, mode } : check));
  };

  const saveConfig = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const nextConfig = await apiService.updateScreeningAdminConfig(schoolKey, {
        checks: draftChecks,
        thresholds: draftThresholds,
      });
      setConfig(nextConfig);
      setDraftChecks(mergeChecks(nextConfig.checks));
      setDraftThresholds({ ...defaultThresholds, ...(nextConfig.thresholds || {}) });
      setSuccess('Screening configuration saved.');
      const nextChangeLog = await apiService.getScreeningConfigChangeLog(schoolKey);
      setChangeLog(nextChangeLog || []);
    } catch (err: any) {
      setError(cleanApiError(err.message || 'Could not save screening configuration.'));
    } finally {
      setSaving(false);
    }
  };

  const saveDisclosure = async () => {
    if (!draftDisclosure.title.trim() || !draftDisclosure.body.trim()) {
      setError('Disclosure title and body are required.');
      return;
    }

    setSavingDisclosure(true);
    setError('');
    setSuccess('');
    try {
      const disclosure = await apiService.updateScreeningDisclosure(schoolKey, draftDisclosure);
      setConfig((prev) => prev ? { ...prev, disclosure } : prev);
      setSuccess('Disclosure text updated. New applicants will be asked to consent to the updated version.');
      const nextChangeLog = await apiService.getScreeningConfigChangeLog(schoolKey);
      setChangeLog(nextChangeLog || []);
    } catch (err: any) {
      setError(cleanApiError(err.message || 'Could not update disclosure text.'));
    } finally {
      setSavingDisclosure(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
          Checking admin access...
        </div>
      </div>
    );
  }

  if (!userCanManage) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-900">
          Admin access is required to manage St Andrews screening configuration.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">St Andrews Admin</div>
            <h1 className="mt-1 text-2xl font-semibold text-gray-950">Screening configuration</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
              Configure check behaviour, thresholds, disclosure text, and audit visibility without a code deployment.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            disabled={loading || saving || savingDisclosure}
            className="w-fit rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {error && <Alert tone="red" message={error} />}
      {success && <Alert tone="green" message={success} />}

      {loading ? (
        <LoadingConfig />
      ) : (
        <>
          <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <SectionHeader
              title="Check toggle panel"
              description="Mandatory checks always run. Advisory checks run but do not block. Disabled checks are skipped."
            />
            <div className="divide-y divide-gray-200">
              {draftChecks.map((check) => (
                <div key={check.checkKey} className="grid gap-3 px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="text-sm font-semibold text-gray-950">{check.checkName}</div>
                    <div className="mt-1 text-xs text-gray-500">{modeHelp(check.mode)}</div>
                  </div>
                  <ModeSelector value={check.mode} onChange={(mode) => handleModeChange(check.checkKey, mode)} />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <SectionHeader
              title="Threshold configuration"
              description="Adjust the policy bands used by backend screening decisions. Values shown here are labels and bands, not bureau data."
            />
            <div className="grid gap-5 p-5 lg:grid-cols-3">
              <ThresholdPanel title="Affordability">
                <label className="block text-sm font-medium text-gray-700" htmlFor="fee-band">Monthly fee source</label>
                <select
                  id="fee-band"
                  value={draftThresholds.affordabilityMonthlyFeeBand || 'school_default'}
                  onChange={(event) => setDraftThresholds((prev) => ({ ...prev, affordabilityMonthlyFeeBand: event.target.value as ScreeningThresholdConfig['affordabilityMonthlyFeeBand'] }))}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="school_default">Use school fees config</option>
                  <option value="custom">Use custom admin override</option>
                </select>
                <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="fee-label">Display label</label>
                <input
                  id="fee-label"
                  value={draftThresholds.affordabilityMonthlyFeeLabel || ''}
                  onChange={(event) => setDraftThresholds((prev) => ({ ...prev, affordabilityMonthlyFeeLabel: event.target.value }))}
                  placeholder="Use school fees config"
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </ThresholdPanel>

              <ThresholdPanel title="Credit">
                <label className="block text-sm font-medium text-gray-700" htmlFor="credit-sensitivity">Default sensitivity</label>
                <select
                  id="credit-sensitivity"
                  value={draftThresholds.creditDefaultSensitivity || 'single_default_refers'}
                  onChange={(event) => setDraftThresholds((prev) => ({ ...prev, creditDefaultSensitivity: event.target.value as ScreeningThresholdConfig['creditDefaultSensitivity'] }))}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="single_default_refers">Single default triggers Refer</option>
                  <option value="multiple_defaults_refer">Only multiple defaults trigger Refer</option>
                </select>
              </ThresholdPanel>

              <ThresholdPanel title="Risk score bands">
                <label className="block text-sm font-medium text-gray-700" htmlFor="risk-low">Low max</label>
                <input
                  id="risk-low"
                  type="number"
                  min={0}
                  max={100}
                  value={draftThresholds.riskLowMax ?? 35}
                  onChange={(event) => setDraftThresholds((prev) => ({ ...prev, riskLowMax: Number(event.target.value) }))}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="risk-medium">Medium max</label>
                <input
                  id="risk-medium"
                  type="number"
                  min={0}
                  max={100}
                  value={draftThresholds.riskMediumMax ?? 65}
                  onChange={(event) => setDraftThresholds((prev) => ({ ...prev, riskMediumMax: Number(event.target.value) }))}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </ThresholdPanel>
            </div>
            <div className="flex justify-end border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={saveConfig}
                disabled={!changed || saving}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save configuration'}
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <SectionHeader
              title="Disclosure text management"
              description="Updating the active disclosure creates a new version for future applicants and triggers re-consent for new applications."
            />
            <div className="space-y-4 p-5">
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
                Current active version: <span className="font-semibold">{config?.disclosure?.version || 'Not available'}</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="disclosure-title">Disclosure title</label>
                <input
                  id="disclosure-title"
                  value={draftDisclosure.title}
                  onChange={(event) => setDraftDisclosure((prev) => ({ ...prev, title: event.target.value }))}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="disclosure-body">Disclosure text</label>
                <textarea
                  id="disclosure-body"
                  value={draftDisclosure.body}
                  onChange={(event) => setDraftDisclosure((prev) => ({ ...prev, body: event.target.value }))}
                  rows={7}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm leading-6 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="flex justify-end border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={saveDisclosure}
                disabled={savingDisclosure}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingDisclosure ? 'Updating...' : 'Update disclosure version'}
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <SectionHeader
              title="Configuration change log"
              description="Read-only log of who changed screening configuration and when."
            />
            {changeLog.length === 0 ? (
              <div className="p-5 text-sm text-gray-600">No configuration changes have been logged yet.</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {changeLog.map((entry) => (
                  <div key={entry.id} className="grid gap-2 px-5 py-4 md:grid-cols-[220px_1fr]">
                    <div>
                      <div className="text-sm font-semibold text-gray-950">{entry.changedBy}</div>
                      <div className="mt-1 text-xs text-gray-500">{formatDateTime(entry.changedAt)}</div>
                    </div>
                    <div className="text-sm leading-6 text-gray-700">{entry.changeSummary}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <label className="block text-sm font-medium text-gray-700" htmlFor="audit-application-id">Applicant audit log filter</label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="audit-application-id"
                value={applicationFilter}
                onChange={(event) => setApplicationFilter(event.target.value)}
                placeholder="Paste application ID to filter, or leave blank for all St Andrews events"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
          <ScreeningAuditLogViewer schoolKey={schoolKey} applicationId={applicationFilter.trim() || undefined} />
        </>
      )}
    </div>
  );
};

const SectionHeader: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
    <h2 className="text-base font-semibold text-gray-950">{title}</h2>
    <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>
  </div>
);

const ThresholdPanel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
    <h3 className="text-sm font-semibold text-gray-950">{title}</h3>
    <div className="mt-4">{children}</div>
  </div>
);

const ModeSelector: React.FC<{ value: ScreeningCheckMode; onChange: (mode: ScreeningCheckMode) => void }> = ({ value, onChange }) => (
  <div className="inline-grid w-full grid-cols-3 rounded-md border border-gray-300 bg-gray-100 p-1 sm:w-[360px]">
    {(['mandatory', 'advisory', 'disabled'] as ScreeningCheckMode[]).map((mode) => (
      <button
        key={mode}
        type="button"
        onClick={() => onChange(mode)}
        className={`rounded px-3 py-2 text-xs font-semibold capitalize transition-colors ${
          value === mode ? modeActiveClass(mode) : 'text-gray-600 hover:bg-white/70'
        }`}
      >
        {mode}
      </button>
    ))}
  </div>
);

const Alert: React.FC<{ tone: 'red' | 'green'; message: string }> = ({ tone, message }) => (
  <div className={`rounded-md border p-4 text-sm ${tone === 'red' ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>
    {message}
  </div>
);

const LoadingConfig: React.FC = () => (
  <div className="space-y-6">
    {[0, 1, 2].map((item) => (
      <div key={item} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="h-5 w-52 animate-pulse rounded bg-gray-100" />
        <div className="mt-5 space-y-3">
          {[0, 1, 2].map((row) => (
            <div key={row} className="h-14 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

function mergeChecks(checks?: ScreeningCheckConfig[]): ScreeningCheckConfig[] {
  const byKey = new Map((checks || []).map((check) => [check.checkKey, check]));
  return defaultChecks.map((check) => ({ ...check, ...(byKey.get(check.checkKey) || {}) }));
}

function modeHelp(mode: ScreeningCheckMode): string {
  if (mode === 'mandatory') return 'Always runs and can affect the final screening decision.';
  if (mode === 'advisory') return 'Runs for context, but the result is informational only.';
  return 'Does not run for this school until enabled again.';
}

function modeActiveClass(mode: ScreeningCheckMode): string {
  if (mode === 'mandatory') return 'bg-blue-600 text-white shadow-sm';
  if (mode === 'advisory') return 'bg-amber-500 text-white shadow-sm';
  return 'bg-gray-700 text-white shadow-sm';
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function cleanApiError(message: string): string {
  const detailMatch = message.match(/"detail":"([^"]+)"/);
  return detailMatch?.[1] || message;
}

export default StAndrewsScreeningConfigScreen;
