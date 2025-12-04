import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import type { SummaryData } from '../types';
import knitIcon from 'assets/knit-icon.png';

interface ApplicationFormProps {
  summaryData: SummaryData;
  applicationId?: string | null; // Add applicationId prop
}

const InfoItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div style={{ marginBottom: '0.75rem', pageBreakInside: 'avoid' }}>
    <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
    <p style={{
      fontSize: '0.9rem',
      fontWeight: 500,
      color: '#111827',
      borderBottom: '1px solid #e5e7eb',
      paddingBottom: '0.25rem',
      paddingTop: '0.25rem',
      marginTop: '0.15rem',
      minHeight: '1.5rem'
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
      @page { 
        size: A4; 
        margin: 1.5cm 2cm; 
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        * {
          box-sizing: border-box;
        }
        .page-break {
          page-break-before: always;
        }
        .avoid-break {
          page-break-inside: avoid;
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
    declaration = { signed: false } // Provide safe default for declaration
  } = summaryData;

  const sectionStyle: React.CSSProperties = {
    marginTop: '1.75rem',
    marginBottom: '1.25rem',
    pageBreakInside: 'avoid'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '3px solid #3b82f6',
    paddingBottom: '1rem',
    marginBottom: '2rem',
    pageBreakAfter: 'avoid'
  };

  const pageStyle: React.CSSProperties = {
    maxWidth: '210mm',
    margin: 'auto',
    fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    color: '#111827',
    backgroundColor: '#ffffff',
    fontSize: '10pt',
    lineHeight: '1.5'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#1e40af',
    margin: 0,
    lineHeight: '1.2'
  };

  const subtitleStyle: React.CSSProperties = {
    color: '#6b7280',
    fontSize: '0.75rem',
    margin: '0.25rem 0 0 0',
    fontWeight: 500
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '1rem',
    fontWeight: 700,
    color: '#1e40af',
    backgroundColor: '#eff6ff',
    padding: '0.5rem 0.75rem',
    marginBottom: '1rem',
    marginTop: '0',
    borderLeft: '4px solid #3b82f6',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
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
        <header style={headerStyle} className="avoid-break">
          <img src={knitIcon} alt="School Logo" style={{ height: '55px', objectFit: 'contain' }} />
          <div style={{ textAlign: 'right', flex: 1, marginLeft: '2rem' }}>
            <h1 style={titleStyle} className="header-title">Student Enrollment Application</h1>
            <p style={subtitleStyle} className="header-subtitle">Private & Confidential Document</p>
            {applicationId && (
              <p style={{ fontSize: '0.75rem', color: '#3b82f6', margin: '0.5rem 0 0 0', fontWeight: 600 }}>
                Application Reference: <span style={{ fontWeight: 'bold', color: '#111827', letterSpacing: '0.5px' }}>{applicationId}</span>
              </p>
            )}
            <p style={{ fontSize: '0.7rem', color: '#9ca3af', margin: '0.25rem 0 0 0' }}>
              Submitted: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </header>

        {/* Student Information */}
        <section style={sectionStyle} className="avoid-break">
          <h2 style={sectionTitleStyle}>Student Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem 2rem' }}>
            <InfoItem label="Full Name" value={student.name} />
            <InfoItem label="ID Number" value={student.idNumber} />
            <InfoItem label="Date of Birth" value={student.dob} />
            <InfoItem label="Gender" value={student.gender} />
            <InfoItem label="Home Language" value={student.homeLanguage} />
            <InfoItem label="Previous Grade" value={student.previousGrade} />
            <InfoItem label="Grade Applied For" value={student.gradeAppliedFor} />
            <InfoItem label="Previous School" value={student.previousSchool} />
            <InfoItem label="Email Address" value={student.email} />
            <InfoItem label="Phone Number" value={student.phone} />
          </div>
        </section>

        {/* Guardian Information */}
        <section style={sectionStyle} className="avoid-break">
          <h2 style={sectionTitleStyle}>Guardian Information</h2>
          {guardian.fatherName && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem' }}>Father / Guardian</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem 2rem' }}>
                <InfoItem label="Full Name" value={guardian.fatherName} />
                <InfoItem label="ID Number" value={guardian.fatherIdNumber} />
                <InfoItem label="Email Address" value={guardian.fatherEmail} />
                <InfoItem label="Phone Number" value={guardian.fatherPhone} />
              </div>
            </div>
          )}
          {guardian.motherName && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem' }}>Mother / Guardian</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem 2rem' }}>
                <InfoItem label="Full Name" value={guardian.motherName} />
                <InfoItem label="ID Number" value={guardian.motherIdNumber} />
                <InfoItem label="Email Address" value={guardian.motherEmail} />
                <InfoItem label="Phone Number" value={guardian.motherPhone} />
              </div>
            </div>
          )}
          {guardian.nextOfKinName && (
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.25rem' }}>Emergency Contact / Next of Kin</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem 2rem' }}>
                <InfoItem label="Full Name" value={guardian.nextOfKinName} />
                <InfoItem label="Relationship" value={guardian.nextOfKinRelationship} />
                <InfoItem label="Email Address" value={guardian.nextOfKinEmail} />
                <InfoItem label="Phone Number" value={guardian.nextOfKinPhone} />
                <InfoItem label="ID Number" value={guardian.nextOfKinIdNumber} />
              </div>
            </div>
          )}
        </section>

        {/* Page Break before Academic History */}
        <div className="page-break"></div>

        {/* Academic History */}
        <section style={sectionStyle} className="avoid-break">
          <h2 style={sectionTitleStyle}>Academic History</h2>
          {academicHistory && academicHistory.length > 0 ? (
          academicHistory.map((history, idx) => (
            <div key={idx} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem 2rem' }}>
                <InfoItem label="Previous School" value={history.schoolName} />
                <InfoItem label="School Type" value={history.schoolType} />
                <InfoItem label="Last Grade Completed" value={history.lastGradeCompleted} />
                <InfoItem label="Academic Year Completed" value={history.academicYearCompleted} />
                <InfoItem label="Principal's Name" value={history.principalName} />
                <InfoItem label="School Phone Number" value={history.schoolPhoneNumber} />
                <InfoItem label="School Email" value={history.schoolEmail} />
                <InfoItem label="School Address" value={history.schoolAddress} />
              </div>
              {history.reasonForLeaving && (
                <div style={{ marginTop: '0.75rem' }}>
                  <InfoItem label="Reason for Leaving" value={history.reasonForLeaving} />
                </div>
              )}
              {history.additionalNotes && (
                <div style={{ marginTop: '0.75rem' }}>
                  <InfoItem label="Additional Notes" value={history.additionalNotes} />
                </div>
              )}
            </div>
          ))
        ) : (
          <p style={{ fontStyle: 'italic', color: '#9ca3af', fontSize: '0.9rem' }}>No academic history provided</p>
        )}
        </section>

        {/* Subjects */}
        {(subjects?.core?.length > 0 || subjects?.electives?.length > 0) && (
          <section style={sectionStyle} className="avoid-break">
            <h2 style={sectionTitleStyle}>Subject Selection</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem 2rem' }}>
              {subjects.core && subjects.core.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Core Subjects</h3>
                  <ul style={{ listStyleType: 'disc', listStylePosition: 'inside', margin: 0, paddingLeft: '0.5rem', fontSize: '0.85rem', lineHeight: '1.8' }}>
                    {subjects.core.map(sub => <li key={sub}>{sub}</li>)}
                  </ul>
                </div>
              )}
              {subjects.electives && subjects.electives.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>Elective Subjects</h3>
                  <ul style={{ listStyleType: 'disc', listStylePosition: 'inside', margin: 0, paddingLeft: '0.5rem', fontSize: '0.85rem', lineHeight: '1.8' }}>
                    {subjects.electives.map(sub => <li key={sub}>{sub}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Financing */}
        <section style={sectionStyle} className="avoid-break">
          <h2 style={sectionTitleStyle}>Financing & Fee Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem 2rem' }}>
            <InfoItem label="Payment Plan" value={financing.plan || 'Not provided'} />
            <InfoItem label="Fee Responsible Person" value={fee?.feePerson || 'Not specified'} />
            <InfoItem label="Relationship to Student" value={fee?.relationship || 'Not specified'} />
            <InfoItem label="Terms & Conditions Accepted" value={fee?.feeTermsAccepted ? 'Yes' : 'No'} />
          </div>
        </section>

        {/* Uploaded Documents */}
        <section style={sectionStyle} className="avoid-break">
          <h2 style={sectionTitleStyle}>Uploaded Documents</h2>
          {documents.length ? (
            <>
              <div style={{
                padding: '0.75rem',
                marginBottom: '1rem',
                backgroundColor: '#f0fdf4',
                border: '2px solid #86efac',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.2rem' }}>✓</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#166534' }}>
                  All required documents have been submitted successfully
                </span>
              </div>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                {documents.map(doc => (
                  <li key={doc.id} style={{ 
                    padding: '0.5rem', 
                    marginBottom: '0.25rem', 
                    backgroundColor: '#f9fafb', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>{doc.title}</span>
                    <span style={{ fontWeight: 600, color: '#059669' }}>{doc.status}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p style={{ fontStyle: 'italic', color: '#9ca3af', fontSize: '0.9rem' }}>No documents uploaded</p>
          )}
        </section>

        {/* Declaration */}
        <section style={sectionStyle} className="avoid-break">
          <h2 style={sectionTitleStyle}>Declaration</h2>
          <div style={{ 
            padding: '1rem', 
            backgroundColor: declaration.signed ? '#f0fdf4' : '#fef2f2', 
            border: `2px solid ${declaration.signed ? '#86efac' : '#fca5a5'}`,
            borderRadius: '6px',
            fontSize: '0.85rem',
            lineHeight: '1.6'
          }}>
            <p style={{ margin: 0, fontWeight: 600, color: declaration.signed ? '#166534' : '#991b1b' }}>
              {declaration.signed 
                ? '✓ I confirm that all information provided in this application is true, accurate, and complete to the best of my knowledge.' 
                : '✗ Declaration not signed (error in form progression).'}
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ 
          textAlign: 'center', 
          fontSize: '0.7rem', 
          color: '#9ca3af', 
          marginTop: '2.5rem', 
          paddingTop: '1rem', 
          borderTop: '2px solid #e5e7eb'
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>This document is confidential and intended for the exclusive use of KNIT admissions office.</p>
          <p style={{ margin: '0.25rem 0 0 0' }}>© {new Date().getFullYear()} KNIT School. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
};

export default ApplicationForm;
