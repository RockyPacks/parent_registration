import React from 'react';

type YesNo = boolean | null | undefined;

export interface IdentitySummaryResult {
  idValid?: YesNo;
  fullNameMatch?: 'match' | 'partial' | 'no_match' | 'unknown';
  deceased?: YesNo;
  photoUrl?: string | null;
  kbaResult?: 'pass' | 'refer' | 'pending' | 'not_run' | 'unknown';
  summary?: string | null;
}

export interface AffordabilitySummaryResult {
  sustainabilityBand?: 'sustainable' | 'marginal' | 'at_risk' | 'unknown';
  disposableIncomeIndicator?: 'strong' | 'adequate' | 'limited' | 'strained' | 'unknown';
  debtToIncomeBand?: 'low' | 'moderate' | 'high' | 'very_high' | 'unknown';
  summary?: string | null;
}

export interface CreditSummaryResult {
  paymentHistoryRating?: 'consistent' | 'mostly_consistent' | 'mixed' | 'poor' | 'unknown';
  activeJudgements?: boolean;
  judgementCount?: number | null;
  defaults?: boolean;
  debtReview?: boolean;
  riskScoreBand?: 'low' | 'moderate' | 'high' | 'very_high' | 'unknown';
  summary?: string | null;
}

export interface FraudSummaryResult {
  safpsStatus?: 'clean' | 'flagged' | 'unknown';
  fraudTypeLabel?: string | null;
  summary?: string | null;
}

export interface ComplianceSummaryResult {
  pepStatus?: 'clear' | 'matched' | 'unknown';
  sanctionsStatus?: 'clear' | 'matched' | 'unknown';
  sanctionsSource?: 'OFAC' | 'UN' | 'EU' | string | null;
  adverseMedia?: boolean;
  publicRecords?: boolean;
  summary?: string | null;
}

export interface AddressSummaryResult {
  addressConfirmed?: boolean;
  matchedAddress?: string | null;
  porValidationStatus?: 'confirmed' | 'not_confirmed' | 'not_enabled' | 'pending' | 'unknown';
  summary?: string | null;
}

export const IdentitySummary: React.FC<{ result?: IdentitySummaryResult | null }> = ({ result }) => {
  const deceased = Boolean(result?.deceased);

  return (
    <SummaryShell
      title="Identity summary"
      summary={result?.summary || 'Identity checks compare the applicant details against trusted identity sources.'}
      alert={deceased ? { tone: 'red', title: 'Deceased ID flag', message: 'This ID is marked as deceased. Refer immediately before progressing.' } : undefined}
    >
      <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
        {result?.photoUrl && (
          <img
            src={result.photoUrl}
            alt="DHA identity thumbnail"
            className="h-20 w-20 rounded-md border border-gray-200 object-cover"
          />
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="ID status" value={result?.idValid === true ? 'Valid' : result?.idValid === false ? 'Invalid' : 'Not confirmed'} tone={result?.idValid === false ? 'red' : result?.idValid ? 'green' : 'gray'} />
          <Metric label="Full name match" value={nameMatchLabel(result?.fullNameMatch)} tone={result?.fullNameMatch === 'no_match' ? 'red' : result?.fullNameMatch === 'partial' ? 'amber' : result?.fullNameMatch === 'match' ? 'green' : 'gray'} />
          <Metric label="Deceased flag" value={deceased ? 'Flagged' : result?.deceased === false ? 'Clear' : 'Not confirmed'} tone={deceased ? 'red' : result?.deceased === false ? 'green' : 'gray'} />
          <Metric label="KBA result" value={kbaLabel(result?.kbaResult)} tone={result?.kbaResult === 'refer' ? 'amber' : result?.kbaResult === 'pass' ? 'green' : 'gray'} />
        </div>
      </div>
    </SummaryShell>
  );
};

export const AffordabilitySummary: React.FC<{ result?: AffordabilitySummaryResult | null }> = ({ result }) => (
  <SummaryShell
    title="Affordability summary"
    summary={result?.summary || affordabilityCopy(result?.sustainabilityBand)}
  >
    <div className="grid gap-3 sm:grid-cols-3">
      <Metric label="Sustainability" value={sustainabilityLabel(result?.sustainabilityBand)} tone={bandTone(result?.sustainabilityBand)} />
      <Metric label="Disposable income" value={indicatorLabel(result?.disposableIncomeIndicator)} tone={indicatorTone(result?.disposableIncomeIndicator)} />
      <Metric label="Debt-to-income" value={debtBandLabel(result?.debtToIncomeBand)} tone={debtBandTone(result?.debtToIncomeBand)} />
    </div>
  </SummaryShell>
);

export const CreditSummary: React.FC<{ result?: CreditSummaryResult | null }> = ({ result }) => (
  <SummaryShell
    title="Credit summary"
    summary={result?.summary || creditCopy(result)}
  >
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Metric label="Payment history" value={paymentHistoryLabel(result?.paymentHistoryRating)} tone={paymentHistoryTone(result?.paymentHistoryRating)} />
      <Metric label="Active judgements" value={result?.activeJudgements ? `Yes (${safeCount(result.judgementCount)})` : result?.activeJudgements === false ? 'No' : 'Not confirmed'} tone={result?.activeJudgements ? 'red' : result?.activeJudgements === false ? 'green' : 'gray'} />
      <Metric label="Defaults" value={yesNoLabel(result?.defaults)} tone={result?.defaults ? 'red' : result?.defaults === false ? 'green' : 'gray'} />
      <Metric label="Debt review" value={yesNoLabel(result?.debtReview)} tone={result?.debtReview ? 'amber' : result?.debtReview === false ? 'green' : 'gray'} />
      <Metric label="Risk band" value={riskBandLabel(result?.riskScoreBand)} tone={riskBandTone(result?.riskScoreBand)} />
    </div>
  </SummaryShell>
);

export const FraudSummary: React.FC<{ result?: FraudSummaryResult | null }> = ({ result }) => {
  const flagged = result?.safpsStatus === 'flagged';

  return (
    <SummaryShell
      title="Fraud summary"
      summary={result?.summary || (flagged ? 'A fraud indicator was returned and needs committee review.' : 'No SAFPS fraud indicator was returned.')}
      alert={flagged ? { tone: 'red', title: 'SAFPS fraud flag', message: 'Refer to admissions committee before progressing.' } : undefined}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Metric label="SAFPS status" value={flagged ? 'Flagged' : result?.safpsStatus === 'clean' ? 'Clean' : 'Not confirmed'} tone={flagged ? 'red' : result?.safpsStatus === 'clean' ? 'green' : 'gray'} />
        <Metric label="Fraud type" value={result?.fraudTypeLabel || 'None reported'} tone={flagged ? 'red' : 'gray'} />
      </div>
    </SummaryShell>
  );
};

export const ComplianceSummary: React.FC<{ result?: ComplianceSummaryResult | null }> = ({ result }) => {
  const sanctionsMatched = result?.sanctionsStatus === 'matched';

  return (
    <SummaryShell
      title="Compliance summary"
      summary={result?.summary || complianceCopy(result)}
      alert={sanctionsMatched ? { tone: 'red', title: 'Sanctions match', message: `Urgent review required${result?.sanctionsSource ? `: ${result.sanctionsSource}` : ''}.` } : undefined}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="PEP status" value={pepLabel(result?.pepStatus)} tone={result?.pepStatus === 'matched' ? 'amber' : result?.pepStatus === 'clear' ? 'green' : 'gray'} />
        <Metric label="Sanctions" value={sanctionsMatched ? `Matched${result?.sanctionsSource ? ` (${result.sanctionsSource})` : ''}` : result?.sanctionsStatus === 'clear' ? 'Clear' : 'Not confirmed'} tone={sanctionsMatched ? 'red' : result?.sanctionsStatus === 'clear' ? 'green' : 'gray'} />
        <Metric label="Adverse media" value={yesNoLabel(result?.adverseMedia)} tone={result?.adverseMedia ? 'amber' : result?.adverseMedia === false ? 'green' : 'gray'} />
        <Metric label="Public records" value={yesNoLabel(result?.publicRecords)} tone={result?.publicRecords ? 'amber' : result?.publicRecords === false ? 'green' : 'gray'} />
      </div>
    </SummaryShell>
  );
};

export const AddressSummary: React.FC<{ result?: AddressSummaryResult | null }> = ({ result }) => (
  <SummaryShell
    title="Address summary"
    summary={result?.summary || (result?.addressConfirmed ? 'The provided address was confirmed against available sources.' : 'The provided address has not been confirmed yet.')}
  >
    <div className="grid gap-3 sm:grid-cols-2">
      <Metric label="Address match" value={result?.addressConfirmed ? 'Confirmed' : result?.addressConfirmed === false ? 'Not confirmed' : 'Unknown'} tone={result?.addressConfirmed ? 'green' : result?.addressConfirmed === false ? 'amber' : 'gray'} />
      <Metric label="Proof of residence" value={porLabel(result?.porValidationStatus)} tone={porTone(result?.porValidationStatus)} />
    </div>
    {result?.matchedAddress && (
      <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Matched address</div>
        <div className="mt-1 text-sm leading-5 text-gray-800">{result.matchedAddress}</div>
      </div>
    )}
  </SummaryShell>
);

export const ScreeningResultSummary: React.FC<{ checkKey: string; result?: Record<string, any> | null; fallback?: string }> = ({
  checkKey,
  result,
  fallback,
}) => {
  if (checkKey === 'dha_id' || checkKey === 'person_verification') {
    return <IdentitySummary result={result as IdentitySummaryResult} />;
  }
  if (checkKey === 'affordability') {
    return <AffordabilitySummary result={result as AffordabilitySummaryResult} />;
  }
  if (checkKey === 'credit_bureau' || checkKey === 'risk_score') {
    return <CreditSummary result={result as CreditSummaryResult} />;
  }
  if (checkKey === 'safps_fraud') {
    return <FraudSummary result={result as FraudSummaryResult} />;
  }
  if (checkKey === 'compliance') {
    return <ComplianceSummary result={result as ComplianceSummaryResult} />;
  }
  if (checkKey === 'address_kyc') {
    return <AddressSummary result={result as AddressSummaryResult} />;
  }

  return (
    <SummaryShell title="Review detail" summary={fallback || 'No plain-language result has been returned for this check yet.'} />
  );
};

export const mockScreeningSummaryResults = {
  identity: {
    idValid: true,
    fullNameMatch: 'match',
    deceased: false,
    kbaResult: 'pass',
    summary: 'The identity details match and the KBA step was completed successfully.',
  } satisfies IdentitySummaryResult,
  affordability: {
    sustainabilityBand: 'sustainable',
    disposableIncomeIndicator: 'strong',
    debtToIncomeBand: 'low',
    summary: 'Based on verified income, this family appears able to sustain fees over a full academic career.',
  } satisfies AffordabilitySummaryResult,
  credit: {
    paymentHistoryRating: 'consistent',
    activeJudgements: false,
    judgementCount: 0,
    defaults: false,
    debtReview: false,
    riskScoreBand: 'low',
    summary: 'No judgements or defaults. Payment history is consistent.',
  } satisfies CreditSummaryResult,
  fraud: {
    safpsStatus: 'flagged',
    fraudTypeLabel: 'Identity misuse indicator',
    summary: 'A SAFPS indicator was returned and needs admissions committee review.',
  } satisfies FraudSummaryResult,
  compliance: {
    pepStatus: 'clear',
    sanctionsStatus: 'matched',
    sanctionsSource: 'UN',
    adverseMedia: false,
    publicRecords: true,
    summary: 'A sanctions match was returned and must be reviewed urgently.',
  } satisfies ComplianceSummaryResult,
  address: {
    addressConfirmed: true,
    matchedAddress: '12 Oak Avenue, Johannesburg, Gauteng',
    porValidationStatus: 'confirmed',
    summary: 'The address was confirmed and proof of residence validation passed.',
  } satisfies AddressSummaryResult,
};

const SummaryShell: React.FC<{
  title: string;
  summary?: string | null;
  alert?: { tone: 'red' | 'amber'; title: string; message: string };
  children?: React.ReactNode;
}> = ({ title, summary, alert, children }) => (
  <div className="space-y-4">
    {alert && (
      <div className={`rounded-md border p-4 ${alert.tone === 'red' ? 'border-red-300 bg-red-50 text-red-900' : 'border-amber-300 bg-amber-50 text-amber-950'}`}>
        <div className="flex items-start gap-3">
          <span className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${alert.tone === 'red' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
            !
          </span>
          <div>
            <div className="font-semibold">{alert.title}</div>
            <div className="mt-1 text-sm leading-5">{alert.message}</div>
          </div>
        </div>
      </div>
    )}

    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</div>
      {summary && <p className="mt-2 text-sm leading-6 text-gray-700">{summary}</p>}
    </div>

    {children}
  </div>
);

const Metric: React.FC<{ label: string; value: string; tone?: 'green' | 'amber' | 'red' | 'gray' }> = ({ label, value, tone = 'gray' }) => {
  const colors = {
    green: 'border-green-200 bg-green-50 text-green-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-950',
    red: 'border-red-200 bg-red-50 text-red-900',
    gray: 'border-gray-200 bg-gray-50 text-gray-800',
  };

  return (
    <div className={`rounded-md border p-3 ${colors[tone]}`}>
      <div className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
};

function nameMatchLabel(value?: IdentitySummaryResult['fullNameMatch']): string {
  if (value === 'match') return 'Matches';
  if (value === 'partial') return 'Partial match';
  if (value === 'no_match') return 'Does not match';
  return 'Not confirmed';
}

function kbaLabel(value?: IdentitySummaryResult['kbaResult']): string {
  if (value === 'pass') return 'Passed';
  if (value === 'refer') return 'Refer';
  if (value === 'pending') return 'Pending';
  if (value === 'not_run') return 'Not run';
  return 'Not confirmed';
}

function sustainabilityLabel(value?: AffordabilitySummaryResult['sustainabilityBand']): string {
  if (value === 'sustainable') return 'Sustainable';
  if (value === 'marginal') return 'Marginal';
  if (value === 'at_risk') return 'At-Risk';
  return 'Not confirmed';
}

function bandTone(value?: AffordabilitySummaryResult['sustainabilityBand']): 'green' | 'amber' | 'red' | 'gray' {
  if (value === 'sustainable') return 'green';
  if (value === 'marginal') return 'amber';
  if (value === 'at_risk') return 'red';
  return 'gray';
}

function indicatorLabel(value?: AffordabilitySummaryResult['disposableIncomeIndicator']): string {
  if (value === 'strong') return 'Strong';
  if (value === 'adequate') return 'Adequate';
  if (value === 'limited') return 'Limited';
  if (value === 'strained') return 'Strained';
  return 'Not confirmed';
}

function indicatorTone(value?: AffordabilitySummaryResult['disposableIncomeIndicator']): 'green' | 'amber' | 'red' | 'gray' {
  if (value === 'strong' || value === 'adequate') return 'green';
  if (value === 'limited') return 'amber';
  if (value === 'strained') return 'red';
  return 'gray';
}

function debtBandLabel(value?: AffordabilitySummaryResult['debtToIncomeBand'] | CreditSummaryResult['riskScoreBand']): string {
  if (value === 'low') return 'Low';
  if (value === 'moderate') return 'Moderate';
  if (value === 'high') return 'High';
  if (value === 'very_high') return 'Very high';
  return 'Not confirmed';
}

function debtBandTone(value?: AffordabilitySummaryResult['debtToIncomeBand']): 'green' | 'amber' | 'red' | 'gray' {
  if (value === 'low') return 'green';
  if (value === 'moderate') return 'amber';
  if (value === 'high' || value === 'very_high') return 'red';
  return 'gray';
}

function affordabilityCopy(value?: AffordabilitySummaryResult['sustainabilityBand']): string {
  if (value === 'sustainable') return 'Based on verified income, this family appears able to sustain fees over a full academic career.';
  if (value === 'marginal') return 'The fee commitment may be manageable, but admissions should review the affordability indicators.';
  if (value === 'at_risk') return 'The affordability indicators suggest the fee commitment may place pressure on the family.';
  return 'Affordability indicators have not been confirmed yet.';
}

function paymentHistoryLabel(value?: CreditSummaryResult['paymentHistoryRating']): string {
  if (value === 'consistent') return 'Consistent';
  if (value === 'mostly_consistent') return 'Mostly consistent';
  if (value === 'mixed') return 'Mixed';
  if (value === 'poor') return 'Poor';
  return 'Not confirmed';
}

function paymentHistoryTone(value?: CreditSummaryResult['paymentHistoryRating']): 'green' | 'amber' | 'red' | 'gray' {
  if (value === 'consistent' || value === 'mostly_consistent') return 'green';
  if (value === 'mixed') return 'amber';
  if (value === 'poor') return 'red';
  return 'gray';
}

function riskBandLabel(value?: CreditSummaryResult['riskScoreBand']): string {
  return debtBandLabel(value);
}

function riskBandTone(value?: CreditSummaryResult['riskScoreBand']): 'green' | 'amber' | 'red' | 'gray' {
  if (value === 'low') return 'green';
  if (value === 'moderate') return 'amber';
  if (value === 'high' || value === 'very_high') return 'red';
  return 'gray';
}

function creditCopy(result?: CreditSummaryResult | null): string {
  if (!result) return 'Credit indicators have not been confirmed yet.';
  if (!result.activeJudgements && !result.defaults && result.paymentHistoryRating === 'consistent') {
    return 'No judgements or defaults. Payment history is consistent.';
  }
  return 'Credit indicators need admissions review before a final decision is made.';
}

function complianceCopy(result?: ComplianceSummaryResult | null): string {
  if (!result) return 'Compliance indicators have not been confirmed yet.';
  if (result.sanctionsStatus === 'matched') return 'A sanctions match was returned and must be reviewed urgently.';
  if (result.pepStatus === 'matched' || result.adverseMedia || result.publicRecords) {
    return 'One or more compliance indicators need admissions review.';
  }
  return 'No PEP, sanctions, adverse media, or public record concern was returned.';
}

function pepLabel(value?: ComplianceSummaryResult['pepStatus']): string {
  if (value === 'clear') return 'Clear';
  if (value === 'matched') return 'Matched';
  return 'Not confirmed';
}

function porLabel(value?: AddressSummaryResult['porValidationStatus']): string {
  if (value === 'confirmed') return 'Confirmed';
  if (value === 'not_confirmed') return 'Not confirmed';
  if (value === 'not_enabled') return 'Not enabled';
  if (value === 'pending') return 'Pending';
  return 'Unknown';
}

function porTone(value?: AddressSummaryResult['porValidationStatus']): 'green' | 'amber' | 'red' | 'gray' {
  if (value === 'confirmed') return 'green';
  if (value === 'not_confirmed') return 'amber';
  if (value === 'pending') return 'gray';
  return 'gray';
}

function yesNoLabel(value: YesNo): string {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return 'Not confirmed';
}

function safeCount(value?: number | null): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
