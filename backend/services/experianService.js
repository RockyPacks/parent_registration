const DEFAULT_UAT_BASE_URL = 'https://apis-uat.experian.co.za:9443/PvseService';
const DEFAULT_PROD_BASE_URL = 'https://apis.experian.co.za:9443/PvseService';
const DEFAULT_TIMEOUT_MS = 60000;
const DEFAULT_ACCURACY_THRESHOLD = 65;
const SOFT_LOCK_MS = 12 * 60 * 60 * 1000;

const ID_NUMBER_KEYS = new Set([
  'idnumber',
  'id_number',
  'identitynumber',
  'identity_number',
  'nationalid',
  'national_id',
  'said',
  'sa_id',
]);

function getConfig(env = process.env) {
  return {
    uatBaseUrl: env.EXPERIAN_UAT_BASE_URL || DEFAULT_UAT_BASE_URL,
    prodBaseUrl: env.EXPERIAN_PROD_BASE_URL || DEFAULT_PROD_BASE_URL,
    username: env.EXPERIAN_USERNAME,
    password: env.EXPERIAN_PASSWORD,
    subscriberCode: env.EXPERIAN_SUBSCRIBER_CODE,
    accuracyThreshold: Number(env.EXPERIAN_ACCURACY_THRESHOLD || DEFAULT_ACCURACY_THRESHOLD),
    timeoutMs: Number(env.EXPERIAN_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
    environment: env.EXPERIAN_ENV || 'uat',
  };
}

function requireConfig(config) {
  const missing = [];

  if (!config.username) missing.push('EXPERIAN_USERNAME');
  if (!config.password) missing.push('EXPERIAN_PASSWORD');
  if (!config.subscriberCode) missing.push('EXPERIAN_SUBSCRIBER_CODE');

  if (missing.length > 0) {
    throw new Error(`Missing Experian environment variables: ${missing.join(', ')}`);
  }
}

function getBaseUrl(config) {
  return config.environment === 'production' ? config.prodBaseUrl : config.uatBaseUrl;
}

function buildAuthHeaders(config) {
  return {
    Username: config.username,
    Password: config.password,
  };
}

function withClientConsent(payload, config) {
  return {
    ...payload,
    SubscriberCode: payload.SubscriberCode || config.subscriberCode,
    ClientConsent: true,
  };
}

function redactSensitiveFields(value) {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveFields);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  return Object.entries(value).reduce((safe, [key, entryValue]) => {
    if (ID_NUMBER_KEYS.has(key.toLowerCase())) {
      safe[key] = '[REDACTED]';
      return safe;
    }

    safe[key] = redactSensitiveFields(entryValue);
    return safe;
  }, {});
}

function extractTransactionId(responseBody, responseHeaders) {
  const headerTransactionId =
    responseHeaders?.get?.('Transaction-ID') ||
    responseHeaders?.get?.('TransactionId') ||
    responseHeaders?.get?.('X-Transaction-ID');

  return (
    responseBody?.TransactionID ||
    responseBody?.TransactionId ||
    responseBody?.transactionId ||
    responseBody?.transactionID ||
    headerTransactionId ||
    null
  );
}

function extractAccuracyScore(responseBody) {
  const value =
    responseBody?.AccuracyScore ??
    responseBody?.Accuracy ??
    responseBody?.Score ??
    responseBody?.score ??
    responseBody?.Result?.AccuracyScore;

  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

function getLockStatus(responseBody) {
  const rawStatus =
    responseBody?.LockStatus ||
    responseBody?.lockStatus ||
    responseBody?.Status ||
    responseBody?.status ||
    '';
  const status = String(rawStatus).toLowerCase();

  if (status.includes('hard')) return 'hard_lock';
  if (status.includes('soft')) return 'soft_lock';
  return null;
}

function getLockHandling(lockStatus, now = new Date()) {
  if (lockStatus === 'soft_lock') {
    return {
      locked: true,
      lockStatus,
      lockUntil: new Date(now.getTime() + SOFT_LOCK_MS).toISOString(),
      adminAction: null,
    };
  }

  if (lockStatus === 'hard_lock') {
    return {
      locked: true,
      lockStatus,
      lockUntil: null,
      adminAction: 'pvseublock',
    };
  }

  return {
    locked: false,
    lockStatus: null,
    lockUntil: null,
    adminAction: null,
  };
}

async function requestResult(payload, options = {}) {
  const config = { ...getConfig(), ...(options.config || {}) };
  requireConfig(config);

  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (!fetchImpl) {
    throw new Error('No fetch implementation available for Experian service');
  }

  const logger = options.logger || console;
  const transactionStore = options.transactionStore;
  const requestPayload = withClientConsent(payload, config);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const response = await fetchImpl(`${getBaseUrl(config)}/RequestResult`, {
      method: 'POST',
      headers: {
        ...buildAuthHeaders(config),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestPayload),
      signal: controller.signal,
    });

    const responseBody = await response.json();
    const transactionId = extractTransactionId(responseBody, response.headers);
    const accuracyScore = extractAccuracyScore(responseBody);
    const lockStatus = getLockStatus(responseBody);
    const lockHandling = getLockHandling(lockStatus, options.now || new Date());

    if (transactionId) {
      logger.info?.('Experian transaction completed', {
        transactionId,
        lockStatus,
        accuracyScore,
      });

      await transactionStore?.record?.({
        transactionId,
        lockStatus,
        accuracyScore,
        rawResponse: redactSensitiveFields(responseBody),
      });
    }

    if (!response.ok) {
      throw new Error(`Experian RequestResult failed with HTTP ${response.status}`);
    }

    return {
      transactionId,
      accuracyScore,
      passed: accuracyScore == null ? null : accuracyScore >= config.accuracyThreshold,
      lockStatus,
      lockHandling,
      questions: responseBody?.Questions || responseBody?.questions || [],
      rawResponse: responseBody,
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  DEFAULT_UAT_BASE_URL,
  DEFAULT_PROD_BASE_URL,
  DEFAULT_TIMEOUT_MS,
  buildAuthHeaders,
  extractTransactionId,
  getLockHandling,
  getConfig,
  redactSensitiveFields,
  requestResult,
  withClientConsent,
};
