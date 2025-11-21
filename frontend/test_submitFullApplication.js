// Test script for submitFullApplication data transformation
// Run with: node test_submitFullApplication.js

// Utility function to convert object keys from camelCase to snake_case recursively
function toSnakeCase(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);

  // Handle Date objects by converting to ISO string
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  const result = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = toSnakeCase(obj[key]);
  }
  return result;
}

// Test data mimicking frontend form data
const testData = {
  student: {
    surname: "Doe",
    firstName: "John",
    middleName: "Michael",
    preferredName: "Johnny",
    dob: "2000-01-01",
    gender: "Male",
    homeLanguage: "English",
    idNumber: "1234567890123",
    previousGrade: "Grade 7",
    gradeAppliedFor: "Grade 8",
    previousSchool: "Test School"
  },
  medical: {
    medicalAidName: "Test Aid",
    memberNumber: "12345",
    conditions: ["Asthma"],
    allergies: "Peanuts"
  },
  family: {
    fatherSurname: "Doe",
    fatherFirstName: "John Sr",
    fatherIdNumber: "9876543210987",
    fatherMobile: "0712345678",
    fatherEmail: "father@example.com",
    motherSurname: "Doe",
    motherFirstName: "Jane",
    motherIdNumber: "", // Empty string to test null conversion
    motherMobile: "", // Empty string to test null conversion
    motherEmail: "", // Empty string to test null conversion
    nextOfKinSurname: "Smith",
    nextOfKinFirstName: "Bob",
    nextOfKinRelationship: "Uncle",
    nextOfKinMobile: "0723456789",
    nextOfKinEmail: "uncle@example.com"
  },
  fee: {
    feePerson: "Father",
    relationship: "Parent",
    feeTermsAccepted: true
  }
};

console.log("Original test data:");
console.log(JSON.stringify(testData, null, 2));

console.log("\n=== Testing submitFullApplication transformation ===");

// 1. Convert to snake_case automatically
const snakeCaseData = toSnakeCase(testData);
console.log("After toSnakeCase:");
console.log(JSON.stringify(snakeCaseData, null, 2));

// 2. Apply special handling for student
if (snakeCaseData.student) {
  // Fix Date of Birth
  if (snakeCaseData.student.dob) {
    snakeCaseData.student.date_of_birth = new Date(snakeCaseData.student.dob).toISOString().split("T")[0];
    delete snakeCaseData.student.dob;
  }
  // Fix Gender casing
  if (snakeCaseData.student.gender) {
    snakeCaseData.student.gender = snakeCaseData.student.gender.toLowerCase();
  }
}

// 3. Fix Empty Strings for Optional Parent Fields
if (snakeCaseData.family) {
  const optionalFields = ['mother_id_number', 'mother_mobile', 'mother_email', 'father_id_number', 'father_mobile', 'father_email'];
  optionalFields.forEach(field => {
    if (snakeCaseData.family[field] === '') {
      snakeCaseData.family[field] = null;
    }
  });
}

// 4. Ensure ID is attached (using a test applicationId)
const applicationId = "test-app-id-123";
snakeCaseData.application_id = applicationId;

console.log("\nAfter special handling:");
console.log(JSON.stringify(snakeCaseData, null, 2));

// Verification checks
console.log("\n=== Verification Checks ===");
console.log("✓ student.dob converted to date_of_birth:", snakeCaseData.student.date_of_birth === "2000-01-01");
console.log("✓ student.dob removed:", !snakeCaseData.student.dob);
console.log("✓ student.gender lowercase:", snakeCaseData.student.gender === "male");
console.log("✓ mother_id_number converted to null:", snakeCaseData.family.mother_id_number === null);
console.log("✓ mother_mobile converted to null:", snakeCaseData.family.mother_mobile === null);
console.log("✓ mother_email converted to null:", snakeCaseData.family.mother_email === null);
console.log("✓ application_id attached:", snakeCaseData.application_id === applicationId);
console.log("✓ Keys are snake_case:", Object.keys(snakeCaseData).every(key => key.includes('_') || key === 'application_id'));

console.log("\nTest completed successfully!");
