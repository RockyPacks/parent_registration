import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import type { SummaryData } from '../types';
import knitIcon from 'assets/knit-icon.png';

interface ApplicationFormProps {
  summaryData: SummaryData;
  applicationId?: string | null; // Add applicationId prop
}

const InfoItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div style={{ marginBottom: '0.5rem' }}>
    <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: 0 }}>{label}</p>
    <p style={{
      fontSize: '0.95rem',
      fontWeight: 500,
      color: '#111827',
      borderBottom: '1px solid #d1d5db',
      paddingBottom: '0.15rem',
      marginTop: '0.15rem'
    }}>
      {value || 'Not provided'}
    </p>
  </div>
);

const ApplicationForm: React.FC<ApplicationFormProps> = ({ summaryData, applicationId }) => {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: 'Enrollment_Application',
    pageStyle: `
      @page { size: A4; margin: 2cm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
        div { page-break-inside: avoid; }
        /* Mobile-friendly adjustments for print */
        @media (max-width: 768px) {
          @page { margin: 1cm; }
          .page-content {
            padding: 1cm;
          }
          .header-title {
            font-size: 1.2rem;
          }
          .header-subtitle {
            font-size: 0.7rem;
          }
          .section-title {
            font-size: 1rem;
          }
          .info-item p {
            font-size: 0.8rem;
          }
        }
      }
    `
  });

  if (!summaryData) return <div>Loading...</div>;

  const { 
    student, 
    guardian, 
    documents = [], // Provide default empty array
    academicHistory = [], // Provide default empty array
    subjects = { core: [], electives: [] }, // Provide default object with empty arrays
    financing = { plan: 'Not provided' }, // Provide default for financing to ensure it's never undefined
    fee = {}, // Provide default for fee to ensure it's never undefined
    declaration = { signed: false } // Provide default for declaration
  } = summaryData;

  const sectionStyle: React.CSSProperties = {
    marginTop: '1.5rem',
    marginBottom: '1.5rem',
    pageBreakInside: 'avoid'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #3b82f6',
    paddingBottom: '0.75rem',
    marginBottom: '1rem'
  };

  const pageStyle: React.CSSProperties = {
    width: '210mm',
    minHeight: '297mm',
    padding: '2cm',
    margin: 'auto',
    fontFamily: 'Arial, sans-serif',
    color: '#111827',
    backgroundColor: '#ffffff'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    color: '#1e40af',
    margin: 0
  };

  const subtitleStyle: React.CSSProperties = {
    color: '#6b7280',
    fontSize: '0.85rem',
    margin: 0
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#1e3a8a',
    borderBottom: '1px solid #93c5fd',
    paddingBottom: '0.25rem',
    marginBottom: '0.75rem'
  };

  return (
    <div>
      <button
        onClick={handlePrint}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '1rem'
        }}
      >
        Print / Export PDF
      </button>

      <div ref={componentRef} style={pageStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <img src={knitIcon} alt="School Logo" style={{ height: '60px' }} />
          <div style={{ textAlign: 'right' }}>
            <h1 style={titleStyle} className="header-title">Enrollment Application</h1>
            <p style={subtitleStyle} className="header-subtitle">Private & Confidential</p>
            {applicationId && (
              <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>
                Application ID: <span style={{ fontWeight: 'bold', color: '#111827' }}>{applicationId}</span>
              </p>
            )}
          </div>
        </header>

        {/* Student Information */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Student Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem 2rem' }}>
            <InfoItem label="Full Name" value={student.name} />
            <InfoItem label="Email Address" value={student.email} />
            <InfoItem label="Phone Number" value={student.phone} />
            <InfoItem label="Date of Birth" value={student.dob} />
            <InfoItem label="Gender" value={student.gender} />
          </div>
        </section>

        {/* Guardian Information */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Guardian Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem 2rem' }}>
            {guardian.fatherName && (
              <div style={{gridColumn: '1 / -1'}}>
                <h3 style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Father Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem 2rem' }}>
                  <InfoItem label="Full Name" value={guardian.fatherName} />
                  <InfoItem label="Relationship" value={guardian.fatherRelationship || 'Father'} />
                  <InfoItem label="Email Address" value={guardian.fatherEmail} />
                  <InfoItem label="Phone Number" value={guardian.fatherPhone} />
                  <InfoItem label="ID Number" value={guardian.fatherIdNumber} />
                </div>
              </div>
            )}
            {guardian.motherName && (
              <div style={{gridColumn: '1 / -1'}}>
                <h3 style={{ fontWeight: 500, marginBottom: '0.25rem', marginTop: '1rem' }}>Mother Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem 2rem' }}>
                  <InfoItem label="Full Name" value={guardian.motherName} />
                  <InfoItem label="Relationship" value={guardian.motherRelationship || 'Mother'} />
                  <InfoItem label="Email Address" value={guardian.motherEmail} />
                  <InfoItem label="Phone Number" value={guardian.motherPhone} />
                  <InfoItem label="ID Number" value={guardian.motherIdNumber} />
                </div>
              </div>
            )}
            {guardian.nextOfKinName && (
              <div style={{gridColumn: '1 / -1'}}>
                <h3 style={{ fontWeight: 500, marginBottom: '0.25rem', marginTop: '1rem' }}>Next of Kin Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem 2rem' }}>
                  <InfoItem label="Full Name" value={guardian.nextOfKinName} />
                  <InfoItem label="Relationship" value={guardian.nextOfKinRelationship} />
                  <InfoItem label="Email Address" value={guardian.nextOfKinEmail} />
                  <InfoItem label="Phone Number" value={guardian.nextOfKinPhone} />
                  <InfoItem label="ID Number" value={guardian.nextOfKinIdNumber} />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Academic History */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Academic History</h2>
          {academicHistory && academicHistory.length > 0 ? (
          academicHistory.map((history, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem 2rem', marginBottom: '1rem' }}>
              <InfoItem label="Previous School" value={history.schoolName} />
              <InfoItem label="School Type" value={history.schoolType} />
              <InfoItem label="Last Grade Completed" value={history.lastGradeCompleted} />
              <InfoItem label="Academic Year Completed" value={history.academicYearCompleted} />
              <InfoItem label="Reason for Leaving" value={history.reasonForLeaving} />
              <InfoItem label="Principal's Name" value={history.principalName} />
              <InfoItem label="School Phone Number" value={history.schoolPhoneNumber} />
              <InfoItem label="School Email" value={history.schoolEmail} />
            </div>
          ))
        ) : (
          <p style={{ fontStyle: 'italic', color: '#6b7280' }}>No academic history provided</p>
        )}
        </section>

        {/* Subjects */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Subject Selection</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem 2rem' }}>
            <div>
              <h3 style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Core Subjects</h3>
              <ul style={{ listStyleType: 'disc', listStylePosition: 'inside', margin: 0 }}>
                {subjects.core && subjects.core.map(sub => <li key={sub}>{sub}</li>)}
              </ul>
            </div>
            <div>
              <h3 style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Elective Subjects</h3>
              <ul style={{ listStyleType: 'disc', listStylePosition: 'inside', margin: 0 }}>
                {subjects.electives && subjects.electives.map(sub => <li key={sub}>{sub}</li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* Financing */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Financing</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem 2rem' }}>
            <InfoItem label="Selected Plan" value={financing.plan || 'Not provided'} />
            <InfoItem label="Fee Responsible Person" value={fee?.feePerson || 'Not specified'} />
            <InfoItem label="Relationship to Student" value={fee?.relationship || 'Not specified'} />
            <InfoItem label="Terms Accepted" value={fee?.feeTermsAccepted ? 'Yes' : 'No'} />
          </div>
        </section>

        {/* Uploaded Documents */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Uploaded Documents</h2>
          {documents.length ? (
            <ul style={{ listStyleType: 'disc', listStylePosition: 'inside' }}>
              {documents.map(doc => <li key={doc.id}>{doc.title} - {doc.status}</li>)}
            </ul>
          ) : (
            <p style={{ fontStyle: 'italic', color: '#6b7280' }}>No documents uploaded</p>
          )}
        </section>

        {/* Declaration */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Declaration</h2>
          <p>{declaration.signed ? 'I confirm that all information is accurate and complete.' : 'Declaration not signed (error in form progression).'}</p>
        </section>

        {/* Footer */}
        <footer style={{ textAlign: 'center', fontSize: '0.75rem', color: '#6b7280', marginTop: '2rem', borderTop: '1px solid #d1d5db', paddingTop: '0.5rem' }}>
          This form is confidential and intended for the use of KNIT admissions only.
        </footer>
      </div>
    </div>
  );
};

export default ApplicationForm;
