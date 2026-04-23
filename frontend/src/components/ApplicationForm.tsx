import React, { useRef, useState } from 'react';
import type { SummaryData } from '../types';
import knitIcon from '../../assets/knit-icon.png';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface ApplicationFormProps {
  summaryData: SummaryData;
  applicationId?: string | null;
  showPrintButton?: boolean;
}

export interface ApplicationFormHandle {
  downloadPDF: () => void;
}

const OfficialHeader: React.FC<{ title: string }> = ({ title }) => (
  <div style={{
    border: '2px solid #000',
    backgroundColor: '#f1f5f9',
    padding: '4px 10px',
    marginBottom: '10px',
    marginTop: '20px',
    pageBreakInside: 'avoid'
  }}>
    <h2 style={{
      fontSize: '12px',
      fontWeight: 800,
      color: '#000',
      textTransform: 'uppercase',
      margin: 0,
      textAlign: 'center'
    }}>{title}</h2>
  </div>
);

const FieldRow: React.FC<{ label: string; value?: string | number; fullWidth?: boolean }> = ({ label, value, fullWidth = false }) => (
  <div style={{
    display: 'flex',
    borderBottom: '1px solid #000',
    fontSize: '11px',
    minHeight: '26px',
    alignItems: 'stretch',
    gridColumn: fullWidth ? 'span 2' : 'span 1'
  }}>
    <div style={{
      width: '140px',
      backgroundColor: '#f8fafc',
      padding: '4px 8px',
      fontWeight: 700,
      borderRight: '1px solid #000',
      color: '#334155',
      display: 'flex',
      alignItems: 'center'
    }}>
      {label}
    </div>
    <div style={{
      flex: 1,
      padding: '4px 10px',
      color: '#000',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center'
    }}>
      {value || '-'}
    </div>
  </div>
);

const ApplicationForm = React.forwardRef<ApplicationFormHandle, ApplicationFormProps>(({ summaryData, applicationId, showPrintButton = true }, ref) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  React.useImperativeHandle(ref, () => ({
    downloadPDF: handleDownloadPDF
  }));

  const handleDownloadPDF = async () => {
    if (!componentRef.current) return;
    
    setIsGenerating(true);

    try {
      const element = componentRef.current;
      
      // CREATE AN ISOLATED IFRAME
      // This is the most robust way to fix the "oklch" error. 
      // We render the form in a clean document that doesn't have Tailwind 4's problematic styles.
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '210mm'; // A4 width
      iframe.style.height = '1000px'; // Temporary height
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      document.body.appendChild(iframe);

      const frameDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!frameDoc) throw new Error('Could not create isolation frame');

      // Inject the form HTML into the iframe
      // We use inline styles which are already present in our components
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; }
              * { box-sizing: border-box; font-family: "Times New Roman", Times, serif; }
              /* This ensures we don't have any oklch fallout in the frame */
              * { color: black !important; border-color: black !important; }
            </style>
          </head>
          <body>
            <div id="capture-root">${element.innerHTML}</div>
          </body>
        </html>
      `);
      frameDoc.close();

      // Wait for images (like the logo) to load
      await new Promise(resolve => setTimeout(resolve, 500));

      const captureNode = frameDoc.getElementById('capture-root');
      if (!captureNode) throw new Error('Capture node not found in iframe');

      const canvas = await html2canvas(captureNode, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Clean up the iframe
      document.body.removeChild(iframe);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        pdf.addPage();
        position = heightLeft - pdfHeight;
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Official_Admission_Form_${applicationId?.replace(/\//g, '_') || 'New'}.pdf`);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      alert('PDF download failed. Please try again or use the browser print option.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!summaryData) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading application data...</div>;

  const { 
    student = { name: '', email: '', phone: '' }, 
    guardian = {}, 
    medical = {},
    documents = [], 
    academicHistory = [], 
    subjects = { core: [], electives: [] }, 
    financing = { plan: '' }, 
    fee = {}, 
    declaration = { signed: false } 
  } = summaryData;

  return (
    <div style={{ position: 'relative' }}>
      {showPrintButton && (
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            style={{
              padding: '12px 24px',
              backgroundColor: isGenerating ? '#94a3b8' : '#000',
              color: 'white',
              border: 'none',
              borderRadius: '2px',
              fontWeight: 700,
              fontSize: '14px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Official PDF Form
              </>
            )}
          </button>
        </div>
      )}

      {/* Hidden container for PDF capture to ensure consistent styling */}
      <div style={{ overflow: 'hidden', height: 0, position: 'absolute' }}>
           <div id="pdf-capture-node"></div>
      </div>

      <div ref={componentRef} style={{
        backgroundColor: 'white',
        color: '#000',
        fontFamily: "'Times New Roman', Times, serif",
        width: '210mm', // Fixed A4 width
        padding: '15mm',
        margin: '0 auto',
        border: '1px solid #e2e8f0',
        boxSizing: 'border-box'
      }}>
        {/* Official Header */}
        <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '15px' }}>
          <img src={knitIcon} alt="Logo" style={{ height: '50px', marginBottom: '10px' }} />
          <h1 style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 5px 0', textTransform: 'uppercase' }}>Department of Basic Education</h1>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 5px 0', textTransform: 'uppercase' }}>Knit Academy Admissions</h2>
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, textTransform: 'uppercase', fontStyle: 'italic', borderBottom: '1px solid #000', display: 'inline-block', paddingBottom: '2px' }}>
            Official School Admission Application Form
          </h3>
        </div>

        {/* Ref Info Table */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '12px' }}>
          <div style={{ border: '1px solid #000', padding: '8px 15px' }}>
            <strong>APPLICATION CYCLE:</strong> 2025/2026 Academic Year
          </div>
          <div style={{ border: '1px solid #000', padding: '8px 15px' }}>
            <strong>REFERENCE NO:</strong> {applicationId || 'NEW/ADM/2025'}
          </div>
        </div>

        {/* Part A: Personal Info */}
        <OfficialHeader title="Part A: Particulars of Student" />
        <div style={{ border: '1px solid #000', borderBottom: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <FieldRow label="Full Name(s)" value={student.name} fullWidth={true} />
          <FieldRow label="Identity Number" value={student.idNumber} />
          <FieldRow label="Date of Birth" value={student.dob} />
          <FieldRow label="Gender" value={student.gender} />
          <FieldRow label="Home Language" value={student.homeLanguage} />
          <FieldRow label="Grade Applying For" value={student.gradeAppliedFor} />
          <FieldRow label="Grade Last Comp." value={student.previousGrade} />
          <FieldRow label="Previous School" value={student.previousSchool} fullWidth={true} />
          <FieldRow label="Email Address" value={student.email} />
          <FieldRow label="Phone Number" value={student.phone} />
        </div>

        {/* Part B: Parents/Guardians */}
        <OfficialHeader title="Part B: Parents / Legal Guardians / Next of Kin" />
        <div style={{ border: '1px solid #000', borderBottom: 'none' }}>
           <div style={{ backgroundColor: '#f1f5f9', fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderBottom: '1px solid #000' }}>SECTION 1: FATHER / LEGAL GUARDIAN</div>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
             <FieldRow label="Full Name" value={guardian.fatherName} />
             <FieldRow label="Identity Number" value={guardian.fatherIdNumber} />
             <FieldRow label="Contact Number" value={guardian.fatherPhone} />
             <FieldRow label="Email Account" value={guardian.fatherEmail} />
           </div>

           <div style={{ backgroundColor: '#f1f5f9', fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderBottom: '1px solid #000', borderTop: '1px solid #000' }}>SECTION 2: MOTHER / LEGAL GUARDIAN</div>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
             <FieldRow label="Full Name" value={guardian.motherName} />
             <FieldRow label="Identity Number" value={guardian.motherIdNumber} />
             <FieldRow label="Contact Number" value={guardian.motherPhone} />
             <FieldRow label="Email Account" value={guardian.motherEmail} />
           </div>

           <div style={{ backgroundColor: '#f1f5f9', fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderBottom: '1px solid #000', borderTop: '1px solid #000' }}>SECTION 3: EMERGENCY CONTACT</div>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
             <FieldRow label="Full Name" value={guardian.nextOfKinName} />
             <FieldRow label="Relationship" value={guardian.nextOfKinRelationship} />
             <FieldRow label="Mobile Number" value={guardian.nextOfKinPhone} />
             <FieldRow label="E-mail" value={guardian.nextOfKinEmail} />
           </div>
        </div>

        {/* Part C: Medical */}
        <OfficialHeader title="Part C: Medical History and Allergies" />
        <div style={{ border: '1px solid #000', borderBottom: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <FieldRow label="Medical Aid" value={medical.medicalAidName} />
          <FieldRow label="Member No." value={medical.memberNumber} />
          <FieldRow label="Main Member" value={medical.mainMemberName} />
          <FieldRow label="Doctor Name" value={medical.doctorName} />
          <div style={{ gridColumn: 'span 2', padding: '10px', fontSize: '11px', borderBottom: '1px solid #000' }}>
            <strong>Chronic Conditions:</strong> {medical.conditions && medical.conditions.length > 0 ? medical.conditions.join(', ') : 'None Reported'}
          </div>
          <div style={{ gridColumn: 'span 2', padding: '10px', fontSize: '11px', borderBottom: '1px solid #000' }}>
            <strong>Severe Allergies:</strong> {medical.allergies || 'None Reported'}
          </div>
        </div>

        {/* Part D: Subjects */}
        <OfficialHeader title="Part D: Subject Choices and Academic History" />
        <div style={{ border: '1px solid #000', padding: '10px', fontSize: '11px' }}>
           <p style={{ margin: '0 0 10px 0' }}><strong>Subjects Selection:</strong></p>
           <div style={{ display: 'flex', gap: '30px' }}>
             <div><strong>Core:</strong> {subjects.core?.join(', ') || 'Standard Govt Curriculum'}</div>
             <div><strong>Electives:</strong> {subjects.electives?.join(', ') || 'N/A'}</div>
           </div>
        </div>

        {/* Part E: Fees */}
        <OfficialHeader title="Part E: Fee Responsibility" />
        <div style={{ border: '1px solid #000', borderBottom: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
          <FieldRow label="Payment Schedule" value={financing.plan} />
          <FieldRow label="Payer Name" value={fee.feePerson} />
          <FieldRow label="Relationship" value={fee.relationship} />
          <FieldRow label="Bank" value={fee.bankName} />
        </div>

        {/* Declaration */}
        <OfficialHeader title="Part F: Declaration and Agreement" />
        <div style={{ border: '1px solid #000', padding: '15px', fontSize: '11px', backgroundColor: '#fcfcfc' }}>
          <p style={{ textAlign: 'justify', lineHeight: '1.4' }}>
            I/We, the undersigned, hereby declare that the particulars furnished in this application form are true and correct. I/We understand that the school policy regarding admissions, discipline, and fees will apply. I/We undertake to adhere to all rules and regulations of the Department of Education and the School Governing Body.
          </p>
          
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ width: '45%' }}>
              <div style={{ borderBottom: '1px solid #000', height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pb: '5px' }}>
                {declaration.signature ? (
                  <img src={declaration.signature} alt="Signature" style={{ maxHeight: '55px', maxWidth: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ fontFamily: 'cursive', fontSize: '16px' }}>{declaration.fullName || student.name}</span>
                )}
              </div>
              <p style={{ textAlign: 'center', fontSize: '9px', fontWeight: 600, marginTop: '4px' }}>OFFICIAL SIGNATURE OF PARENT / GUARDIAN</p>
            </div>
            <div style={{ width: '30%' }}>
              <div style={{ borderBottom: '1px solid #000', height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', pb: '5px' }}>
                {new Date().toLocaleDateString('en-ZA')}
              </div>
              <p style={{ textAlign: 'center', fontSize: '9px', fontWeight: 600, marginTop: '4px' }}>DATE OF SIGNING</p>
            </div>
          </div>
        </div>

        {/* Admissions Stamp Placeholder */}
        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '150px', height: '100px', border: '2px solid #ccc', borderStyle: 'dashed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '10px', textAlign: 'center', transform: 'rotate(-5deg)' }}>
            OFFICIAL ADMISSIONS STAMP<br/>(FOR OFFICE USE)
          </div>
        </div>

        {/* Footer info */}
        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', pt: '5px', fontSize: '8px', color: '#666', textAlign: 'center' }}>
          Form ADM-2025 • Issued by Knit Academy in accordance with the South African Schools Act (Act No. 84 of 1996)
        </div>
      </div>
    </div>
  );
});

export default ApplicationForm;
