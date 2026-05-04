# Application Details - Visual Guide & Architecture

## 📐 Form Layout Visual

### Desktop View (md+)
```
┌──────────────────────────────────────────────────────────────┐
│                 Student & Guardian Information                 │
└──────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 📝 Student Information                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Surname                │ First Name                             │
│  [_______________]      │ [_______________]                      │
│                                                                   │
│  Email                  │ Phone                                  │
│  [_______________]      │ [_______________]                      │
│                                                                   │
│  ... (more fields)                                              │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 📋 Application Details                                          │ ← NEW SECTION
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Proposed Start Term    │ Year                                   │
│  [Please choose...▼]    │ [Please choose...▼]                    │
│                                                                   │
│  Grade/Class Applying   │ Proposed Start Date                    │
│  [Please choose...▼]    │ [Choose date]       📅                │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ 💊 Medical Information                                          │
├─────────────────────────────────────────────────────────────────┤
│ ... (medical fields)                                            │
└─────────────────────────────────────────────────────────────────┘

[More sections below...]
```

### Mobile View (< md)
```
┌────────────────────────────────┐
│  Student & Guardian Info       │
└────────────────────────────────┘

┌────────────────────────────────┐
│ 📝 Student Information         │
├────────────────────────────────┤
│ Surname                         │
│ [_____________________]         │
│                                 │
│ First Name                      │
│ [_____________________]         │
│ ... (more fields stacked)       │
└────────────────────────────────┘

┌────────────────────────────────┐
│ 📋 Application Details         │ ← NEW
├────────────────────────────────┤
│ Proposed Start Term             │
│ [Please choose...▼]             │
│                                 │
│ Year                            │
│ [Please choose...▼]             │
│                                 │
│ Grade/Class Applying For        │
│ [Please choose...▼]             │
│                                 │
│ Proposed Start Date             │
│ [Choose date]          📅       │
└────────────────────────────────┘

┌────────────────────────────────┐
│ 💊 Medical Information         │
├────────────────────────────────┤
│ ... (medical fields)            │
└────────────────────────────────┘
```

---

## 🔄 Component Hierarchy

```
MainContent
│
├── Step1StudentGuardian
│   │
│   ├── UploadCard (Student Information)
│   │   └── StudentInformation
│   │
│   ├── UploadCard (Application Details) ← NEW
│   │   └── ApplicationDetails
│   │       ├── SelectField (Proposed Start Term)
│   │       ├── SelectField (Year)
│   │       ├── SelectField (Grade/Class Applying For)
│   │       └── DatePickerField (Proposed Start Date)
│   │
│   ├── UploadCard (Medical Information)
│   │   └── MedicalInformation
│   │
│   ├── UploadCard (Family Information)
│   │   └── FamilyInformation
│   │
│   └── UploadCard (Fee Responsibility)
│       └── FeeResponsibility
│
├── Step2DocumentUploadCenter
├── Step3AcademicHistoryForm
├── Step4FeeAgreement
├── Step5DeclarationStep
└── Step6ReviewSubmitStep
```

---

## 📊 State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interaction                         │
│                  (Form Field Change)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────────┐
         │  ApplicationDetails.tsx    │
         │ handleFieldChange()        │
         │ validateField()            │
         │ setFormData() [local]      │
         └────────────┬────────────────┘
                      │
                      ▼
        ┌──────────────────────────────┐
        │ onDataChange callback         │
        │ Pass updated data to parent   │
        └────────────┬─────────────────┘
                     │
                     ▼
    ┌────────────────────────────────────┐
    │ MainContent.tsx                    │
    │ handleApplicationDetailsDataChange │
    │ setApplicationDetailsData()        │
    └────────────┬──────────────────────┘
                 │
        ┌────────┴─────────┐
        │                  │
        ▼                  ▼
   ┌─────────┐    ┌──────────────┐
   │localStorage   │ Auto-save    │
   │storage.set()  │ queue trigger│
   │  persist      │ (debounced)  │
   └─────────┘    └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ API Request  │
                  │ POST /auto   │
                  │ -save        │
                  └──────────────┘
```

---

## 🗂️ File Structure

```
frontend/
│
├── src/
│   │
│   ├── components/
│   │   │
│   │   ├── form/
│   │   │   ├── Step1StudentGuardian.tsx      (MODIFIED)
│   │   │   ├── ApplicationDetails.tsx         (NEW) ✨
│   │   │   ├── StudentInformation.tsx
│   │   │   ├── MedicalInformation.tsx
│   │   │   ├── FamilyInformation.tsx
│   │   │   └── FeeResponsibility.tsx
│   │   │
│   │   ├── ui/
│   │   │   ├── SelectField.tsx               (USED)
│   │   │   ├── DatePickerField.tsx           (USED)
│   │   │   └── InputField.tsx
│   │   │
│   │   ├── MainContent.tsx                   (MODIFIED)
│   │   └── ... (other components)
│   │
│   ├── hooks/
│   │   └── useToast.ts                       (USED)
│   │
│   ├── services/
│   │   ├── api.ts                            (USES)
│   │   └── auth.ts
│   │
│   └── utils/
│       └── storage.ts                        (USES)
│
└── root/
    ├── APPLICATION_DETAILS_SECTION.md        (NEW) 📚
    ├── APPLICATION_DETAILS_QUICKSTART.md     (NEW) 📚
    ├── IMPLEMENTATION_GUIDE_APPLICATION_DETAILS.md (NEW) 📚
    ├── TESTING_APPLICATION_DETAILS.md        (NEW) 📚
    ├── APPLICATION_DETAILS_SUMMARY.md        (NEW) 📚
    └── APPLICATION_DETAILS_VISUAL_GUIDE.md   (THIS FILE) 📚
```

---

## 🔌 Props Flow Diagram

```
┌─────────────────────────────────────────┐
│         MainContent.tsx                 │
│  applicationDetailsData={...}           │
│  onApplicationDetailsDataChange={...}   │
└───────────────┬───────────────────────────┘
                │ props
                ▼
┌─────────────────────────────────────────┐
│      Step1StudentGuardian.tsx           │
│  applicationDetailsData={...}           │
│  onApplicationDetailsDataChange={...}   │
└───────────────┬───────────────────────────┘
                │ props
                ▼
┌─────────────────────────────────────────┐
│     ApplicationDetails.tsx              │
│  initialData={applicationDetailsData}   │
│  onDataChange={onDataChange callback}   │
└───────────────┬───────────────────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
    SelectField    DatePickerField
    (4x usage)     (1x usage)
```

---

## 📋 Data Transformation Pipeline

```
Component State (Date object)
┌─────────────────────────┐
│ {                       │
│   proposedStartDate:    │
│     Date(2026-06-01)    │
│ }                       │
└────────┬────────────────┘
         │ onDataChange()
         ▼
onDataChange callback (ApplicationDetails.tsx)
┌─────────────────────────┐
│ Date → ISO string       │
│ "2026-06-01"            │
└────────┬────────────────┘
         │ storage.set()
         ▼
localStorage
┌──────────────────────────────────┐
│ {                                │
│   proposedStartDate: "2026-06-01"│
│ }                                │
└────────┬─────────────────────────┘
         │ API payload
         ▼
API Request Body
┌──────────────────────────────────┐
│ {                                │
│   application_id: "...",         │
│   applicationDetails: {          │
│     proposedStartDate:           │
│       "2026-06-01"               │
│   }                              │
│ }                                │
└──────────────────────────────────┘
```

---

## 🎬 Interaction Sequence Diagram

```
User              ApplicationDetails        MainContent        localStorage
 │                     │                        │                  │
 │─ Fill Term ────────>│                        │                  │
 │                     │─ handleFieldChange()──>│                  │
 │                     │                        │─ setState()      │
 │                     │                        │                  │
 │                     │ <─ onDataChange()──────│─ storage.set()──>│
 │                     │                        │                  │
 │─ Fill Year ───────>│                        │                  │
 │                     │─ handleFieldChange()──>│                  │
 │                     │                        │─ setState()      │
 │                     │                        │─ trigger auto───>│ save
 │                     │                        │                  │
 │─ Fill Grade ──────>│                        │                  │
 │                     │─ handleFieldChange()──>│                  │
 │                     │                        │─ setState()      │
 │                     │                        │─ storage.set()──>│
 │                     │                        │                  │
 │─ Pick Date ───────>│                        │                  │
 │                     │─ handleFieldChange()──>│                  │
 │                     │                        │─ setState()      │
 │                     │  <─ onDataChange()────│─ storage.set()──>│
 │                     │                        │─ API POST ──────>│ Server
 │                     │                        │  /auto-save      │
 │                     │                        │                  │
 │─ Reload Page ─────>│                        │                  │
 │                     │                        │─ Load storage────│
 │                     │ <─ initialData preload │<──────────────────│
 │                     │─ Display saved values──>│                  │
 │                     │                        │                  │
```

---

## 🎨 Design System Integration

### Color Palette
```
Icons & Sections:
├── Student Info:    Blue (#3b82f6)
├── Application:     Indigo (#6366f1)  ← NEW
├── Medical:         Green (#16a34a)
├── Family:          Green (#16a34a)
└── Fees:            Amber (#fbbf24)

Text:
├── Labels:          Gray (#374151)
├── Values:          Black (#000000)
└── Errors:          Red (#dc2626)

Backgrounds:
├── Cards:           White (#ffffff)
├── Hover:           Gray (#f9fafb)
└── Focus:           Blue (#eff6ff)
```

### Typography
```
Headings
├── Section Title:   24px bold (#000000)
├── Field Label:     14px medium (#374151)
└── Error Message:   12px regular (#dc2626)

Inputs
├── Font Size:       14px
├── Line Height:     1.5
└── Font Family:     System (Tailwind default)
```

### Spacing
```
Section Layout:
├── Padding:         32px (p-8) / 40px (p-10)
├── Border Radius:   16px (rounded-2xl)
└── Gap Between:     24px (space-y-6)

Grid Layout:
├── Desktop:         2 columns (md:grid-cols-2)
├── Mobile:          1 column (grid-cols-1)
└── Gap:             24px (gap-6)

Field Spacing:
├── Margin Bottom:   24px (mb-6)
├── Input Height:    44px (py-3 + borders)
└── Label Gap:       8px (mb-2)
```

---

## 🧪 Test Coverage Map

```
ApplicationDetails Component
├── Rendering
│   ├── All 4 fields render
│   ├── Icons display correctly
│   └── Section is collapsible
│
├── User Input
│   ├── Term selection (4 options)
│   ├── Year selection (5 options)
│   ├── Grade selection (13 options)
│   └── Date picker interaction
│
├── Validation
│   ├── Required field errors
│   ├── Past date prevention
│   ├── Error message display
│   └── Error styling (red)
│
├── Data Persistence
│   ├── Save to localStorage
│   ├── Load from localStorage
│   ├── Pre-fill on page reload
│   └── Date format conversion
│
└── Integration
    ├── Auto-save trigger
    ├── API payload inclusion
    ├── Parent component updates
    └── Responsive layout
```

---

## 📈 Feature Completeness Checklist

```
✅ Component Created
├── ✅ Render JSX
├── ✅ State management
├── ✅ Props handling
├── ✅ Validation logic
└── ✅ Error display

✅ Integration
├── ✅ MainContent state
├── ✅ Handler function
├── ✅ localStorage setup
├── ✅ Auto-save included
├── ✅ Props drilling
└── ✅ Component import

✅ UI/UX
├── ✅ Design consistency
├── ✅ Responsive layout
├── ✅ Error styling
├── ✅ Field labels
└── ✅ Icon display

✅ Documentation
├── ✅ Overview guide
├── ✅ Implementation guide
├── ✅ Testing guide
├── ✅ This visual guide
└── ✅ Quick start guide

✅ Quality
├── ✅ No compilation errors
├── ✅ TypeScript support
├── ✅ No breaking changes
└── ✅ Backward compatible
```

---

## 🚀 Deployment Timeline

```
Day 1: Review & Testing
├── Review code changes
├── Run test checklist
├── Manual testing
└── Code review approval

Day 2: Staging
├── Merge to staging
├── Deploy to staging
├── Verify in staging
└── Final QA sign-off

Day 3: Production
├── Merge to main
├── Deploy to production
├── Monitor for errors
└── Document go-live

Future: Backend Integration
├── Update API endpoint
├── Update database schema
├── Test end-to-end
└── Monitor production data
```

---

## 📞 Quick Reference

### To Access Data
```javascript
// In MainContent
const term = applicationDetailsData.proposedStartTerm;
const year = applicationDetailsData.year;
const grade = applicationDetailsData.gradeApplyingFor;
const date = applicationDetailsData.proposedStartDate;
```

### To Test
```bash
# See TESTING_APPLICATION_DETAILS.md for full checklist
# Quick smoke test:
1. Expand Application Details section
2. Fill all fields
3. Refresh page
4. Verify data persists
```

### To Modify
```typescript
// In ApplicationDetails.tsx
const termOptions = ['Term 1', 'Term 2', 'Term 3', 'Term 4'];
const gradeOptions = ['Grade R', 'Grade 1', ...]; // Edit here
```

---

**Visual Guide Created**: April 30, 2026  
**Status**: 🟢 Production Ready
