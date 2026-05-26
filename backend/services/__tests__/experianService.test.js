const {
  DEFAULT_UAT_BASE_URL,
  getLockHandling,
  redactSensitiveFields,
  requestResult,
  withClientConsent,
} = require('../experianService');

describe('experianService', () => {
  const config = {
    uatBaseUrl: DEFAULT_UAT_BASE_URL,
    prodBaseUrl: 'https://apis.experian.co.za:9443/PvseService',
    username: 'uat-user',
    password: 'uat-password',
    subscriberCode: '35052-REA',
    accuracyThreshold: 65,
    timeoutMs: 60000,
    environment: 'uat',
  };

  it('sends RequestResult to UAT with auth headers and ClientConsent', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map(),
      json: async () => ({
        TransactionID: 'txn-123',
        AccuracyScore: 72,
        Questions: [
          {
            QuestionId: 'q1',
            Text: 'Which value matches your profile?',
            Options: ['A', 'B', 'C'],
          },
        ],
      }),
    });
    const logger = { info: jest.fn() };
    const transactionStore = { record: jest.fn().mockResolvedValue(undefined) };

    const result = await requestResult(
      {
        IDNumber: '8001015009087',
        FirstName: 'Test',
      },
      {
        config,
        fetchImpl: mockFetch,
        logger,
        transactionStore,
      }
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, request] = mockFetch.mock.calls[0];
    expect(url).toBe(`${DEFAULT_UAT_BASE_URL}/RequestResult`);
    expect(request.method).toBe('POST');
    expect(request.headers).toMatchObject({
      Username: 'uat-user',
      Password: 'uat-password',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    expect(JSON.parse(request.body)).toMatchObject({
      IDNumber: '8001015009087',
      FirstName: 'Test',
      SubscriberCode: '35052-REA',
      ClientConsent: true,
    });

    expect(logger.info).toHaveBeenCalledWith('Experian transaction completed', {
      transactionId: 'txn-123',
      lockStatus: null,
      accuracyScore: 72,
    });
    expect(transactionStore.record).toHaveBeenCalledWith({
      transactionId: 'txn-123',
      lockStatus: null,
      accuracyScore: 72,
      rawResponse: expect.objectContaining({
        TransactionID: 'txn-123',
        AccuracyScore: 72,
      }),
    });
    expect(result).toMatchObject({
      transactionId: 'txn-123',
      accuracyScore: 72,
      passed: true,
      lockStatus: null,
      lockHandling: {
        locked: false,
        lockStatus: null,
        lockUntil: null,
        adminAction: null,
      },
    });
  });

  it('redacts raw ID numbers before storage/log-safe payloads', () => {
    expect(
      redactSensitiveFields({
        IDNumber: '8001015009087',
        nested: { national_id: '9001015009088' },
      })
    ).toEqual({
      IDNumber: '[REDACTED]',
      nested: { national_id: '[REDACTED]' },
    });
  });

  it('always adds ClientConsent true', () => {
    expect(withClientConsent({ ClientConsent: false }, config)).toMatchObject({
      ClientConsent: true,
      SubscriberCode: '35052-REA',
    });
  });

  it('maps lock responses to the required handling rules', () => {
    const now = new Date('2026-05-26T09:00:00.000Z');

    expect(getLockHandling('soft_lock', now)).toEqual({
      locked: true,
      lockStatus: 'soft_lock',
      lockUntil: '2026-05-26T21:00:00.000Z',
      adminAction: null,
    });
    expect(getLockHandling('hard_lock', now)).toEqual({
      locked: true,
      lockStatus: 'hard_lock',
      lockUntil: null,
      adminAction: 'pvseublock',
    });
  });
});
