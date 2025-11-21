// Test script for ReviewSubmitStep data population
// Run with: node test_review_data_population.js

// Mock localStorage
const mockLocalStorage = {
  data: {},
  getItem: function(key) { return this.data[key] || null; },
  setItem: function(key, value) { this.data[key] = value; },
  removeItem: function(key) { delete this.data[key]; }
};

// Mock storage utility
const storage = {
  get: (key, defaultValue) => {
    try {
      const item = mockLocalStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  getString: (key, defaultValue = '') => {
    return mockLocalStorage.getItem(key) || defaultValue;
  }
};

// Test data structures
const testStudentData = {
  firstName: 'John',
  surname: 'Doe',
  email: 'john.doe@example.com',
  phone: '+27123456789',
  dob: '2005-05-15',
  gender: 'Male'
};

const testFamilyData = {
  fatherFirstName: 'Jane',
  fatherSurname: 'Doe',
  fatherEmail: 'jane.doe@example.com',
  fatherMobile: '+27987654321',
  motherFirstName: '',
  motherSurname: '',
  motherEmail: '',
  motherMobile: ''
};

const testAcademicData = {
  schoolName: 'Test High School',
  schoolType: 'Public',
  lastGradeCompleted: 'Grade 11',
  academicYearCompleted: '2023',
  reasonForLeaving: 'Moving to new area',
  principalName: 'Mr. Smith',
  schoolPhoneNumber: '+27111222333',
  schoolEmail: 'info@testschool.edu'
};

const testFinancingData = {
  plan: 'Pay Monthly Debit'
};

const testFeeData = {
  feePerson: 'Father',
  relationship: 'Parent',
  feeTermsAccepted: true
};

const testDeclarationData = {
  status: 'completed'
};

// Set up mock localStorage data
mockLocalStorage.setItem('studentInformation', JSON.stringify(testStudentData));
mockLocalStorage.setItem('familyInformation', JSON.stringify(testFamilyData));
mockLocalStorage.setItem('academicHistoryFormData', JSON.stringify(testAcademicData));
mockLocalStorage.setItem('financingPlan', JSON.stringify(testFinancingData));
mockLocalStorage.setItem('feeResponsibility', JSON.stringify(testFeeData));
mockLocalStorage.setItem('declarationData', JSON.stringify(testDeclarationData));
mockLocalStorage.setItem('uploadedFiles', JSON.stringify([
  { filename: 'birth_certificate.pdf', name: 'Birth Certificate' },
  { filename: 'id_document.pdf', name: 'ID Document' }
]));

// Test the getLocalStorageData function logic
function getLocalStorageData() {
  try {
    const studentData = storage.get('studentInformation', {});
    const familyData = storage.get('familyInformation', {});
    const academicData = storage.get('academicHistoryFormData', {
      schoolName: '',
      schoolType: 'public',
      lastGradeCompleted: '',
      academicYearCompleted: '',
      reasonForLeaving: '',
      principalName: '',
      schoolPhoneNumber: '',
      schoolEmail: '',
      schoolAddress: '',
      reportCard: null,
      additionalNotes: '',
    });
    const subjectData = storage.get('selectedSubjects', { core: [], electives: [] });
    const financingData = storage.get('financingPlan', {});
    const feeData = storage.get('feeResponsibility', {});
    const declarationData = storage.get('declarationData', {});

    const uploadedFiles = storage.get('uploadedFiles', []);
    const documents = uploadedFiles.map((file, index) => ({
      id: index.toString(),
      title: file.filename || file.name || 'Document',
      status: 'Completed',
      files: [],
      required: true,
    }));

    return {
      personalInfo: {
        firstName: studentData.firstName || '',
        lastName: studentData.surname || '',
        email: studentData.email || ''
      },
      student: {
        name: studentData.firstName && studentData.surname ? `${studentData.firstName} ${studentData.surname}` : '',
        email: studentData.email || '',
        phone: studentData.phone || '',
        dob: studentData.dob ? (typeof studentData.dob === 'string' ? studentData.dob : (studentData.dob).toISOString().split('T')[0]) : '',
        gender: studentData.gender || ''
      },
      guardian: {
        name: familyData.fatherFirstName && familyData.fatherSurname
          ? `${familyData.fatherFirstName} ${familyData.fatherSurname}`
          : familyData.motherFirstName && familyData.motherSurname
          ? `${familyData.motherFirstName} ${familyData.motherSurname}`
          : familyData.guardianFullName || '',
        relationship: familyData.fatherFirstName
          ? 'Father'
          : familyData.motherFirstName
          ? 'Mother'
          : 'Guardian',
        email: familyData.fatherEmail || familyData.motherEmail || familyData.guardianEmail || '',
        phone: familyData.fatherMobile || familyData.motherMobile || familyData.guardianMobile || ''
      },
      documents,
      academicHistory: [academicData],
      subjects: {
        core: subjectData.core || [],
        electives: subjectData.electives || []
      },
      fee: feeData,
      financing: financingData,
      declaration: { signed: declarationData.status === 'completed' }
    };
  } catch (error) {
    console.error('Error in getLocalStorageData:', error);
    return {
      personalInfo: { firstName: '', lastName: '', email: '' },
      student: { name: '', email: '', phone: '', dob: '', gender: '' },
      guardian: { name: '', relationship: 'Father', email: '', phone: '' },
      documents: [],
      academicHistory: [{
        schoolName: '',
        schoolType: 'public',
        lastGradeCompleted: '',
        academicYearCompleted: '',
        reasonForLeaving: '',
        principalName: '',
        schoolPhoneNumber: '',
        schoolEmail: '',
        schoolAddress: '',
        reportCard: null,
        additionalNotes: '',
      }],
      subjects: { core: [], electives: [] },
      financing: { plan: '' },
      declaration: { signed: false }
    };
  }
}

// Test the transformCurrentDataToSummary function logic
function transformCurrentDataToSummary(data) {
  return {
    personalInfo: {
      firstName: data.student?.firstName || '',
      lastName: data.student?.surname || '',
      email: data.student?.email || ''
    },
    student: {
      name: data.student?.firstName && data.student?.surname
        ? `${data.student.firstName} ${data.student.surname}`
        : '',
      email: data.student?.email || '',
      phone: data.student?.phone || ''
    },
    guardian: {
      name: data.family?.fatherFirstName && data.family?.fatherSurname
        ? `${data.family.fatherFirstName} ${data.family.fatherSurname}`
        : data.family?.motherFirstName && data.family?.motherSurname
        ? `${data.family.motherFirstName} ${data.family.motherSurname}`
        : '',
      relationship: data.family?.fatherFirstName ? 'Father' : data.family?.motherFirstName ? 'Mother' : 'Guardian',
      email: data.family?.fatherEmail || data.family?.motherEmail || '',
      phone: data.family?.fatherMobile || data.family?.motherMobile || ''
    },
    documents: data.documents?.map((doc) => ({
      id: doc.id || '1',
      title: doc.filename || doc.name || 'Document',
      status: 'Completed',
      files: [],
      required: true
    })) || [],
    academicHistory: data.academicHistory ? [data.academicHistory] : [{
      schoolName: '',
      schoolType: 'public',
      lastGradeCompleted: '',
      academicYearCompleted: '',
    }],
    subjects: {
      core: data.subjects?.core || [],
      electives: data.subjects?.electives || []
    },
    financing: { plan: data.financing?.plan || data.financing?.selected_plan || '' },
    fee: data.fee || {},
    declaration: { signed: data.declaration?.status === 'completed' }
  };
}

// Run tests
console.log('=== Testing ReviewSubmitStep Data Population ===\n');

// Test 1: getLocalStorageData function
console.log('Test 1: getLocalStorageData function');
const localStorageResult = getLocalStorageData();
console.log('Result:', JSON.stringify(localStorageResult, null, 2));

// Test 2: transformCurrentDataToSummary function
console.log('\nTest 2: transformCurrentDataToSummary function');
const currentData = {
  student: testStudentData,
  family: testFamilyData,
  academicHistory: testAcademicData,
  subjects: { core: ['Math', 'English'], electives: ['Art'] },
  financing: testFinancingData,
  fee: testFeeData,
  declaration: testDeclarationData,
  documents: [
    { id: '1', filename: 'birth_cert.pdf', name: 'Birth Certificate' },
    { id: '2', filename: 'id_doc.pdf', name: 'ID Document' }
  ]
};
const transformResult = transformCurrentDataToSummary(currentData);
console.log('Result:', JSON.stringify(transformResult, null, 2));

// Test 3: Verify data consistency
console.log('\nTest 3: Data Consistency Checks');

// Check student information
console.log('✓ Student name:', localStorageResult.student.name === 'John Doe');
console.log('✓ Student email:', localStorageResult.student.email === 'john.doe@example.com');
console.log('✓ Student phone:', localStorageResult.student.phone === '+27123456789');
console.log('✓ Student DOB:', localStorageResult.student.dob === '2005-05-15');
console.log('✓ Student gender:', localStorageResult.student.gender === 'Male');

// Check guardian information
console.log('✓ Guardian name:', localStorageResult.guardian.name === 'Jane Doe');
console.log('✓ Guardian relationship:', localStorageResult.guardian.relationship === 'Father');
console.log('✓ Guardian email:', localStorageResult.guardian.email === 'jane.doe@example.com');
console.log('✓ Guardian phone:', localStorageResult.guardian.phone === '+27987654321');

// Check academic history
console.log('✓ School name:', localStorageResult.academicHistory[0].schoolName === 'Test High School');
console.log('✓ School type:', localStorageResult.academicHistory[0].schoolType === 'Public');
console.log('✓ Last grade:', localStorageResult.academicHistory[0].lastGradeCompleted === 'Grade 11');
console.log('✓ Academic year:', localStorageResult.academicHistory[0].academicYearCompleted === '2023');
console.log('✓ Reason for leaving:', localStorageResult.academicHistory[0].reasonForLeaving === 'Moving to new area');
console.log('✓ Principal name:', localStorageResult.academicHistory[0].principalName === 'Mr. Smith');
console.log('✓ School phone:', localStorageResult.academicHistory[0].schoolPhoneNumber === '+27111222333');
console.log('✓ School email:', localStorageResult.academicHistory[0].schoolEmail === 'info@testschool.edu');

// Check financing
console.log('✓ Financing plan:', localStorageResult.financing.plan === 'Pay Monthly Debit');

// Check fee data
console.log('✓ Fee person:', localStorageResult.fee.feePerson === 'Father');
console.log('✓ Fee relationship:', localStorageResult.fee.relationship === 'Parent');
console.log('✓ Fee terms accepted:', localStorageResult.fee.feeTermsAccepted === true);

// Check declaration
console.log('✓ Declaration signed:', localStorageResult.declaration.signed === true);

// Check documents
console.log('✓ Documents count:', localStorageResult.documents.length === 2);
console.log('✓ First document title:', localStorageResult.documents[0].title === 'birth_certificate.pdf');
console.log('✓ Second document title:', localStorageResult.documents[1].title === 'id_document.pdf');

console.log('\n=== Test completed ===');
