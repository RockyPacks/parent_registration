# PVS-E Data Flow

Reference:
- Case Number: CAS-3097527
- API Version: v1.6 REST (JSON)
- Subscriber Account: 35052-REA
- Provider: Experian South Africa PVS-E

Status: signed off by Rea; implementation may proceed.

## Integration Position In Parent Application

The identity verification step should run after the parent responsible for fees has been captured and before the parent can submit the final application. In the current UI, the source fields are captured in Step 1 / Fee Responsibility and stored under `fee_responsibility`:

- `parent_id_number`
- `parent_first_name`
- `parent_surname`
- related parent/application ownership from the authenticated user and application record

No raw credit data should be shown to the parent. The UI should only show verification progress, pass/fail, lock state, or retry/support messages.

## Call 1: Get Questions

Trigger: parent reaches the identity verification step in the application form.

Endpoint:

```text
POST {EXPERIAN_BASE_URL}/RequestResult
Content-Type: application/json
Accept: application/json
```

Request payload:

```json
{
  "Username": "{{EXPERIAN_USERNAME}}",
  "Password": "{{EXPERIAN_PASSWORD}}",
  "SubscriberCode": "35052-REA",
  "ClientConsent": true,
  "IDNumber": "{{parent_id_number}}",
  "FirstName": "{{parent_first_name}}",
  "Surname": "{{parent_surname}}"
}
```

Validation before sending:

- `ClientConsent` must always be `true`.
- `IDNumber` must be a valid 13-digit South African ID number.
- `FirstName` and `Surname` must be present.
- Use HTTPS only.
- Do not log `IDNumber`.
- If ID number is persisted anywhere, encrypt it at rest.

Expected response:

```json
{
  "TransactionID": "{{experian_transaction_id}}",
  "Questions": [
    {
      "QuestionID": "Q1",
      "QuestionText": "Example question text",
      "Answers": [
        { "AnswerID": "A1", "AnswerText": "Example option 1" },
        { "AnswerID": "A2", "AnswerText": "Example option 2" }
      ]
    }
  ],
  "Status": "QuestionsGenerated"
}
```

Response handling:

- Store `TransactionID` immediately.
- Display the 3-5 multiple choice questions for this transaction only.
- Do not store questions.
- Do not store answer options.
- Do not expose provider/raw credit fields in the UI.

## Call 2: Submit Answers

Trigger: parent submits answers in the identity verification UI.

Endpoint:

```text
POST {EXPERIAN_BASE_URL}/RequestResult
Content-Type: application/json
Accept: application/json
```

Request payload:

```json
{
  "Username": "{{EXPERIAN_USERNAME}}",
  "Password": "{{EXPERIAN_PASSWORD}}",
  "TransactionID": "{{transaction_id_from_call_1}}",
  "ClientConsent": true,
  "Answers": [
    { "QuestionID": "Q1", "AnswerID": "A2" },
    { "QuestionID": "Q2", "AnswerID": "A1" }
  ]
}
```

Validation before sending:

- `TransactionID` must be the stored transaction ID from Call 1.
- `ClientConsent` must always be `true`.
- All questions returned by Call 1 must have exactly one selected answer before submission.
- Do not store answers.
- Do not log answers.

Expected response:

```json
{
  "TransactionID": "{{experian_transaction_id}}",
  "Score": 72,
  "ResultStatus": "Pass"
}
```

Business rule:

- Verification passes when score is greater than or equal to `EXPERIAN_ACCURACY_THRESHOLD`.
- Current proposed threshold: `65`.
- Rea sign-off received for implementation.

## Response State To UI Mapping

| Provider / Internal State | Backend Decision | Parent UI Message | Parent Action | Stored Result |
| --- | --- | --- | --- | --- |
| Questions returned | Continue verification | "Please answer these identity verification questions to continue." | Answer all questions and submit | `questions_generated` with `TransactionID` |
| Score >= 65 | Pass | "Identity verification successful. You can continue with your application." | Continue to next step | `passed` with score |
| Score < 65 | Fail | "We could not verify your identity from the answers provided. Please check your details or contact support." | Retry only if Experian allows a new transaction; otherwise support review | `failed` with score |
| Soft Lock | Locked for 12 hours | "Identity verification is temporarily locked due to too many failed attempts. Please try again after 12 hours." | Wait 12 hours or contact support | `soft_locked`, `locked_until` |
| Hard Lock | Indefinite lock | "Identity verification is locked. Please contact support so we can assist you." | Contact support; admin must call `pvseublock` | `hard_locked`, no `locked_until` |
| Invalid / missing parent details before Call 1 | Do not call Experian | "Please complete the parent ID number, first name, and surname before verification." | Return to parent details fields | `not_started` or no transaction row |
| Invalid TransactionID before Call 2 | Do not call Experian | "Your verification session could not be found. Please restart identity verification." | Restart verification | `abandoned` if prior transaction exists |
| Timeout after 60 seconds | Unknown result | "Identity verification is taking longer than expected. Please try again." | Retry; backend must avoid duplicate result writes for same `TransactionID` | `timeout` |
| Experian 4xx validation error | Failed request | "We could not start identity verification. Please check your details and try again." | Correct details and retry | `provider_validation_error` |
| Experian 401 / auth error | Configuration fault | "Identity verification is temporarily unavailable. Please try again later." | Try later or contact support | `provider_auth_error` |
| Experian 5xx / unavailable | Provider unavailable | "Identity verification is temporarily unavailable. Please try again later." | Retry later | `provider_unavailable` |
| Network error | Connectivity fault | "Identity verification could not be reached. Please try again." | Retry | `network_error` |
| Malformed / missing TransactionID in response | Provider contract error | "Identity verification is temporarily unavailable. Please try again later." | Retry later or support | `provider_contract_error` |
| Duplicate submit by browser refresh | Idempotent replay | Show last known pass/fail/lock result | Continue if passed; otherwise follow stored state | existing stored result |

UI copy signed off by Rea for implementation.

## Database Storage Contract

Create a dedicated table for PVS-E transaction audit results. Do not store questions, answer options, or submitted answers.

Proposed table: `public.pvse_identity_verifications`

```sql
CREATE TABLE public.pvse_identity_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  parent_id UUID NULL,
  user_id UUID NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  result TEXT NOT NULL,
  score NUMERIC(5,2),
  threshold NUMERIC(5,2) NOT NULL DEFAULT 65,
  locked_until TIMESTAMPTZ,
  provider_status TEXT,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Required fields per transaction:

- `transaction_id`: Experian `TransactionID`, stored immediately after Call 1.
- `result`: one of `questions_generated`, `passed`, `failed`, `soft_locked`, `hard_locked`, `timeout`, `provider_validation_error`, `provider_auth_error`, `provider_unavailable`, `network_error`, `provider_contract_error`, `abandoned`.
- `score`: correctness percentage from Call 2, nullable until final response.
- `threshold`: threshold used for the decision, default `65`.
- `timestamp`: represented by `created_at` and `updated_at`.
- `parentId`: store as `parent_id` if parent rows are normalized for this app instance; otherwise derive from `application_id` + fee payer. Keep `application_id` and `user_id` regardless.

Security and POPIA:

- Store only transaction/result metadata.
- Do not store questions.
- Do not store answers.
- Do not store raw credit data.
- Do not log raw ID numbers.
- Encrypt any persisted ID number fields at rest before this feature goes live.
- Restrict rows with RLS so parents can only read their own verification status, not provider internals.

## Fallback Behaviour

Before Call 1:

- Missing consent: block verification and ask parent to accept verification consent.
- Missing parent details: block verification and deep-link back to parent/fee-responsibility fields.
- Invalid SA ID format: block verification and show local validation error.

During Call 1:

- Timeout: show retry message; record `timeout` only if no transaction ID was received.
- Provider auth/config error: show temporary unavailable message; alert admin/ops.
- Provider validation error: show correct-details message; do not expose provider internals.
- Missing `TransactionID`: treat as provider contract error and do not show questions.

Between calls:

- Browser refresh: fetch latest transaction by `application_id` and show either active questions if still available in memory/session, or ask parent to restart verification. Do not persist questions to recover them.
- Parent abandons flow: mark transaction `abandoned` only when a newer verification transaction is started or when the application is submitted without successful verification.

During Call 2:

- Incomplete answers: block submit locally.
- Timeout: keep transaction in an unknown/retryable state; if Experian supports status lookup, use it before allowing another submit.
- Duplicate submit: return stored result for the `TransactionID`.
- Score below threshold: store `failed`; do not show score by default unless Rea approves showing it.
- Soft lock: store `soft_locked` and set `locked_until = now() + interval '12 hours'`.
- Hard lock: store `hard_locked`; admin support must unblock through `pvseublock`.

After final result:

- Passed: allow parent to continue.
- Failed: prevent final submission unless Rea approves manual review override.
- Soft locked: prevent retry until `locked_until`.
- Hard locked: prevent retry until admin confirms unblock.

## Signed-Off Decisions

- Threshold is `65`.
- Parent-facing UI messages in the response-state table are approved.
- Failed verification blocks progression unless a later manual-review override is approved separately.
- Score is hidden from parents; the UI shows pass/fail/lock state only.
- `parent_id` remains nullable for this implementation; verification rows are linked by `application_id` and `user_id`, with the fee payer derived from `fee_responsibility`.
