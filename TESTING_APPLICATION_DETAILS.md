# Application Details Section - Testing & Examples

## 🧪 Testing Guide

### Manual Testing Checklist

#### 1. Component Renders Correctly
- [ ] Navigate to Step 1 enrollment form
- [ ] Scroll down to see "Application Details" section (should appear between "Student Information" and "Medical Information")
- [ ] Click on section header to expand it
- [ ] All 4 fields should be visible:
  - [ ] Proposed Start Term (dropdown)
  - [ ] Year (dropdown)
  - [ ] Grade/Class Applying For (dropdown)
  - [ ] Proposed Start Date (date picker)

#### 2. Proposed Start Term Field
- [ ] Click on dropdown, verify 4 options appear: Term 1, Term 2, Term 3, Term 4
- [ ] Select "Term 2"
- [ ] Value should display in field
- [ ] Check localStorage: should have `proposedStartTerm: "Term 2"`

#### 3. Year Field
- [ ] Click on dropdown
- [ ] Should show current year + 4 future years
- [ ] Example: 2026, 2027, 2028, 2029, 2030
- [ ] Select "2027"
- [ ] Check localStorage: should have `year: "2027"`

#### 4. Grade/Class Applying For Field
- [ ] Click on dropdown
- [ ] Verify Grade R through Grade 12 options appear
- [ ] Should see:
  - [ ] Grade R (Reception)
  - [ ] Grade 1
  - [ ] Grade 2
  - [ ] ... through Grade 12
- [ ] Select "Grade 7"
- [ ] Check localStorage: should have `gradeApplyingFor: "Grade 7"`

#### 5. Proposed Start Date Field
- [ ] Click on date field
- [ ] Calendar picker should open
- [ ] Try selecting today's date
- [ ] Try selecting a future date (e.g., June 1, 2026)
- [ ] Verify it saves: localStorage should have `proposedStartDate: "2026-06-01"`

#### 6. Validation - Required Fields
- [ ] Collapse and re-expand the section
- [ ] Leave all dropdowns as "Please choose..."
- [ ] Try submitting form (should show error)
- [ ] Notice red error text appears below each required field

#### 7. Validation - Past Date
- [ ] Click on date picker
- [ ] Try to select yesterday's date
- [ ] Should not allow selection (calendar should prevent it)
- [ ] Or if allowed, should show error: "Start date cannot be in the past"

#### 8. Data Persistence
- [ ] Fill in all 4 fields
- [ ] Close the browser tab
- [ ] Re-open the enrollment form
- [ ] Navigate to Step 1 again
- [ ] Expand Application Details section
- [ ] All values should be pre-filled from previous session

#### 9. Auto-Save Integration
- [ ] Open DevTools → Network tab
- [ ] Fill in Application Details fields
- [ ] Look for POST requests to `/enrollment/auto-save`
- [ ] Click on the request
- [ ] In Payload tab, verify `applicationDetails` object is present:
  ```json
  {
    "application_id": "...",
    "student": {...},
    "medical": {...},
    "family": {...},
    "fee": {...},
    "applicationDetails": {
      "proposedStartTerm": "Term 1",
      "year": "2026",
      "gradeApplyingFor": "Grade 7",
      "proposedStartDate": "2026-06-01"
    }
  }
  ```

#### 10. UI Consistency
- [ ] Compare with StudentInformation section above
- [ ] Verify same input height and styling
- [ ] Verify same label positioning (above inputs)
- [ ] Verify same error message styling
- [ ] Verify responsive layout (test on mobile view)

#### 11. Edit Workflow (if implemented)
- [ ] If form has an edit mode, fill in fields
- [ ] Navigate away and back
- [ ] Values should persist and display

#### 12. Empty/Null Handling
- [ ] Leave all fields empty
- [ ] Try to proceed to next step
- [ ] Should show validation errors for required fields
- [ ] Optional date field should be okay to leave blank

---

## 📋 Test Cases

### Test Case 1: Happy Path - All Fields Valid
**Precondition**: User at Step 1, Application Details section visible

**Steps**:
1. Click dropdown "Proposed Start Term" → Select "Term 1"
2. Click dropdown "Year" → Select "2027"
3. Click dropdown "Grade/Class Applying For" → Select "Grade 9"
4. Click date picker "Proposed Start Date" → Select "2027-01-15"

**Expected**:
- All fields show selected values
- No error messages appear
- Data saved to localStorage
- Auto-save API request includes the data

**Actual**: _____________

---

### Test Case 2: Validation - Required Field Missing
**Precondition**: User filled in Year, Grade, Date but NOT Term

**Steps**:
1. Leave "Proposed Start Term" as "Please choose..."
2. Click form submit button

**Expected**:
- Error message appears under "Proposed Start Term": "Proposed Start Term is required"
- Field border turns red
- Form cannot be submitted
- Focus scrolls to the error field

**Actual**: _____________

---

### Test Case 3: Validation - Past Date
**Precondition**: User attempts to select a past date

**Steps**:
1. Click date picker
2. Attempt to select a date from the past (e.g., yesterday)

**Expected**:
- Past date selection is prevented
- OR error message shows: "Start date cannot be in the past"
- Current date is highlighted/available
- Future dates are available for selection

**Actual**: _____________

---

### Test Case 4: Data Persistence Across Sessions
**Precondition**: User completes Application Details form

**Steps**:
1. Fill in all 4 fields with specific values
2. Close the entire browser/tab
3. Re-open enrollment form
4. Expand Application Details section

**Expected**:
- All 4 fields are pre-filled with the exact same values
- No data loss occurred
- localStorage shows the saved data

**Actual**: _____________

---

### Test Case 5: Responsive Design - Mobile
**Precondition**: Form displayed on mobile device (or mobile viewport)

**Steps**:
1. Open form on iPhone/Android (or resize to mobile)
2. Navigate to Application Details section
3. Observe layout

**Expected**:
- Fields are stacked vertically (single column)
- Full width on mobile screen
- Inputs are touch-friendly (proper size)
- No horizontal scrolling
- Labels appear above inputs (not inline)
- Same padding and margins as StudentInformation

**Actual**: _____________

---

### Test Case 6: Responsive Design - Desktop
**Precondition**: Form displayed on desktop/laptop

**Steps**:
1. Open form on desktop (or resize to 1200px+)
2. Navigate to Application Details section
3. Observe layout

**Expected**:
- First row: "Proposed Start Term" | "Year"
- Second row: "Grade/Class Applying For" | "Proposed Start Date"
- 2-column grid layout
- Consistent spacing between fields
- All fields same height

**Actual**: _____________

---

### Test Case 7: Dropdown Options
**Precondition**: User clicks on "Year" dropdown

**Steps**:
1. Click the "Year" dropdown
2. Count the number of options

**Expected**:
- Exactly 5 options visible
- Options are: [current_year, +1, +2, +3, +4]
- For April 2026: [2026, 2027, 2028, 2029, 2030]
- First option is "Please choose..."

**Actual**: _____________

---

### Test Case 8: Grade Options
**Precondition**: User clicks on "Grade/Class Applying For" dropdown

**Steps**:
1. Click the "Grade/Class Applying For" dropdown
2. Verify all options present

**Expected**:
- Grade R (Reception)
- Grade 1 through Grade 12 (12 options)
- First option is "Please choose..."
- Total: 14 options

**Actual**: _____________

---

### Test Case 9: Optional Date Field
**Precondition**: User submits form without selecting date

**Steps**:
1. Fill in Term, Year, Grade (required fields)
2. Leave "Proposed Start Date" empty
3. Try to submit form

**Expected**:
- Form allows submission (no error for date field)
- Date field is truly optional
- No validation error for empty optional date

**Actual**: _____________

---

### Test Case 10: Error Display Styling
**Precondition**: Form validation fails

**Steps**:
1. Leave all required fields empty
2. Attempt to submit
3. Observe error display

**Expected**:
- Error text appears below field in red color (#dc2626)
- Input field border turns red
- Error icon appears next to text
- Error message is clear: "Field is required"
- Same styling as other form fields' errors

**Actual**: _____________

---

## 🔍 Component Details

### ApplicationDetails Component Structure

```tsx
ApplicationDetails
├── useEffect (initialize data)
├── useEffect (propagate data changes)
├── validateField (function)
├── handleFieldChange (function)
├── render
    ├── First Row (2 columns)
    │   ├── SelectField "Proposed Start Term"
    │   └── SelectField "Year"
    └── Second Row (2 columns)
        ├── SelectField "Grade/Class Applying For"
        └── DatePickerField "Proposed Start Date"
```

### Props Flow

```
MainContent
├── applicationDetailsData={applicationDetailsData}
├── onApplicationDetailsDataChange={handleApplicationDetailsDataChange}
└─→ Step1StudentGuardian
    └─→ ApplicationDetails
        ├── initialData={applicationDetailsData}
        └── onDataChange={onApplicationDetailsDataChange}
```

---

## 🐛 Common Issues & Troubleshooting

### Issue: Fields Not Saving to localStorage
**Solution**:
1. Check DevTools → Application → LocalStorage
2. Search for the user email key
3. Look for `applicationDetailsData` key
4. If not present, check browser console for errors
5. Verify `handleApplicationDetailsDataChange` is being called

### Issue: Past Dates Selectable
**Solution**:
1. Check DatePickerField has `minDate={new Date()}`
2. Verify date validation in ApplicationDetails.validateField()
3. Test that error message appears if past date submitted

### Issue: Data Not Pre-filling on Page Reload
**Solution**:
1. Verify localStorage contains the data
2. Check useEffect that initializes data is running
3. Look for `toCamelCase` conversion issues
4. Check if user email key is correct

### Issue: Form Submission Blocked
**Solution**:
1. Verify all required fields have values
2. Check for validation errors in console
3. Ensure date (if provided) is not in past
4. Look at parent component's validation logic

### Issue: Styling Doesn't Match Other Fields
**Solution**:
1. Compare SelectField component with others in form
2. Verify no inline styles (should use Tailwind classes)
3. Check grid layout classes: `grid-cols-1 md:grid-cols-2 gap-6`
4. Compare padding, margins, border radius

---

## 📊 Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 90+ | ✅ | Full support |
| Firefox 88+ | ✅ | Full support |
| Safari 14+ | ✅ | Full support |
| Edge 90+ | ✅ | Full support |
| IE 11 | ⚠️ | Date picker may have issues |
| Mobile (iOS) | ✅ | Touch-friendly |
| Mobile (Android) | ✅ | Touch-friendly |

---

## 📈 Performance Testing

### Metrics to Monitor
- Component load time: Should be <100ms
- Form input response time: Should be <50ms
- localStorage write: Should be <10ms
- Auto-save trigger: Should debounce for 2 seconds

### Load Testing
- [ ] Test with 100+ enrollments data in localStorage
- [ ] Verify no performance degradation
- [ ] Check memory usage doesn't spike

---

## 🎯 Acceptance Criteria Verification

- [x] Component created: ApplicationDetails.tsx
- [x] 4 fields implemented: Term, Year, Grade, Date
- [x] Required field validation: Term, Year, Grade
- [x] Optional field: Date
- [x] Past date prevention: Date field
- [x] Data persistence: localStorage
- [x] Auto-save integration: Included in payload
- [x] UI consistency: Matches StudentInformation
- [x] No custom styling: Only Tailwind classes
- [x] 2-column desktop layout: Responsive
- [x] Single column mobile: Responsive
- [x] Error display: Matches form style
- [x] TypeScript support: Full type safety
- [x] No breaking changes: Backward compatible
- [x] Documentation: Complete
- [x] Ready for backend: API payload prepared

---

## 📞 Support

### Questions During Testing?
- Check IMPLEMENTATION_GUIDE_APPLICATION_DETAILS.md
- Review ApplicationDetails.tsx source code
- Compare with StudentInformation.tsx for patterns

### Issues Found?
1. Document the issue with step-by-step reproduction
2. Include browser/OS information
3. Provide screenshot if UI-related
4. Check browser console for JavaScript errors

---

**Testing Completed**: ___________
**Tested By**: ___________
**Date**: ___________
**Overall Status**: ☐ PASS ☐ FAIL ☐ PARTIAL
