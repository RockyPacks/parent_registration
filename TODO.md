# School Enrollment System - Validation Implementation

## Overview
Implement validation checks for steps 3-6 to ensure required information is completed before allowing navigation to the next sections via the Footer. Add validation buttons and error summaries similar to Step 1.

## Tasks

### Step 3: Academic History Form
- [ ] Add `isNextEnabled` state based on `validateForm()` result
- [ ] Add error summary display when validation fails
- [ ] Add "Validate and Continue" button that checks requirements and proceeds if valid
- [ ] Disable Footer Next button when `!isNextEnabled`
- [ ] Update Footer to use `isLoading={!isNextEnabled}`

### Step 4: Subject Selection
- [ ] Add validation to require at least one elective subject
- [ ] Add `isNextEnabled` state based on validation
- [ ] Add error summary display when validation fails
- [ ] Add "Validate and Continue" button that checks requirements and proceeds if valid
- [ ] Disable Footer Next button when `!isNextEnabled`

### Step 5: Fee Agreement
- [ ] Add `isNextEnabled` state based on `selectedPlan` being set
- [ ] Add error summary display when no plan is selected
- [ ] Add "Validate and Continue" button that checks requirements and proceeds if valid
- [ ] Disable Footer Next button when `!isNextEnabled`

### Step 6: Declaration Step
- [ ] Use existing `isContinueDisabled` logic for `isNextEnabled`
- [ ] Add error summary display when confirmations or name are missing
- [ ] Add "Validate and Continue" button that checks requirements and proceeds if valid
- [ ] Disable Footer Next button when `!isNextEnabled`

## Testing
- [ ] Test each step to ensure Next is disabled when required info is missing
- [ ] Verify error summaries appear correctly
- [ ] Ensure navigation works when all required info is filled
- [ ] Test validation buttons trigger correct behavior

## Files to Edit
- components/AcademicHistoryForm.tsx
- src/components/SubjectSelection.tsx
- components/form/FeeAgreement.tsx
- components/form/DeclarationStep.tsx
