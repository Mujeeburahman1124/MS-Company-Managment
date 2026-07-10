"use client";

import React from "react";
import { Placement } from "@/lib/types";

export default function PrintableAgreement({ placement, terms }: { placement: Placement; terms?: any[] }) {
  // Safe parsing of placement terms if it's stored as JSON
  let termsList: any[] = [];
  try {
    if (placement.termsAndConditions) {
      const parsed = JSON.parse(placement.termsAndConditions);
      if (Array.isArray(parsed)) termsList = parsed;
    }
  } catch(e) {}

  // Fallback default terms if no termsList or custom terms are passed
  const defaultTerms = [
    { title: "Candidate Responsibilities", content: "The Candidate agrees to submit all necessary documentation, including passports, visa copies, and education credentials, within 3 business days. The Candidate agrees to perform their duties in accordance with the policies of the Placed Company and successfully complete the probation period." },
    { title: "Consultancy Responsibilities", content: "The Consultancy agrees to provide professional placement, screening, and guidance services. The Consultancy will coordinate recruitment timelines, coordinate interviews, and assist with document translation and onboarding with the Placed Company." },
    { title: "Placement/Service Fee Terms", content: "All service fees are subject to VAT at the prevailing rate in the UAE. The placement service fees are payable in full as set out in this Agreement and are non-refundable once visa processes or work permits have been initiated by the Placed Company." },
    { title: "Payment Schedule", content: "Registration fees are payable upon signing this Agreement. Placement fees or service fee balances are payable within 5 working days of receiving the final selection confirmation or offer letter from the Placed Company." },
    { title: "Refund/Cancellation Policy", content: "In the event of cancellation by the candidate before processing has commenced, a refund may be issued minus administrative processing fees. No refunds are allowed if the candidate fails the medical test due to pre-existing undisclosed conditions." },
    { title: "Confidentiality", content: "Both parties agree to hold all personal, proprietary, and commercial information in strict confidence and shall not disclose any agreements, rates, or candidate profiles to third parties without prior written consent." },
    { title: "Compliance with UAE Labour Laws", content: "This placement process is conducted in full compliance with Federal Decree-Law No. (33) of 2021 regarding the Regulation of Labour Relations in the UAE and its executive regulations." },
    { title: "Dispute Resolution", content: "Any disputes arising from this Agreement shall first be negotiated amicably. If unresolved, the dispute shall be referred to the Ministry of Human Resources and Emiratisation (MOHRE) or resolved through Dubai Courts." },
    { title: "Governing Law", content: "This Agreement shall be governed by, and construed in accordance with, the federal laws of the United Arab Emirates as applied in the Emirate of Dubai." }
  ];

  const finalTerms = termsList.length > 0 ? termsList : defaultTerms;

  return (
    <div className="bg-white w-full h-full text-black printable-agreement relative">
      {/* Global CSS for A4 Print */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
          .printable-agreement { padding: 0 !important; max-width: none !important; box-shadow: none !important; border: none !important; }
          .page-break-before { page-break-before: always; }
          .page-break-after { page-break-after: always; }
          .no-break { page-break-inside: avoid; }
          .hide-on-print { display: none !important; }
        }
        
        .printable-agreement {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: white;
          padding: 15mm;
          font-family: 'Times New Roman', Times, serif;
          color: #000;
          font-size: 10pt;
          line-height: 1.4;
        }

        .header-logo { max-width: 180px; max-height: 65px; object-fit: contain; }
        
        h1, h2, h3, h4, h5 { font-family: 'Arial', sans-serif; color: #1a365d; margin-top: 0; }
        .section-title { font-size: 11pt; font-weight: bold; border-bottom: 1.5px solid #1a365d; padding-bottom: 3px; margin-bottom: 10px; margin-top: 15px; text-transform: uppercase; }
        
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
        .info-box { border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px; margin-bottom: 12px; }
        .info-label { font-size: 8pt; color: #475569; font-weight: bold; text-transform: uppercase; margin-bottom: 1px; }
        .info-value { font-size: 10pt; font-weight: bold; color: #0f172a; }
        
        .terms-list { padding-left: 18px; margin-bottom: 15px; text-align: justify; font-size: 9.5pt; }
        .terms-list li { margin-bottom: 8px; }
        
        .signature-box { border: 1px dashed #cbd5e1; height: 80px; display: flex; align-items: center; justify-content: center; margin-top: 5px; border-radius: 4px; overflow: hidden; position: relative; }
        .signature-img { max-width: 100%; max-height: 100%; object-fit: contain; }
      `,}} />

      {/* HEADER */}
      <div className="flex justify-between items-end border-b-2 border-slate-800 pb-3 mb-4">
        <div>
          <img src={(typeof window !== "undefined" && (JSON.parse(localStorage.getItem("auth-storage") || "{}")?.state?.currentUser?.companyLogo)) || "/logo.png"} alt="MS Horizon F.Z.E" className="header-logo" onError={(e) => e.currentTarget.style.display='none'} />
          <h2 className="text-xl font-black text-slate-800 mt-1">MS HORIZON F.Z.E</h2>
          <p className="text-xs text-slate-600">Professional Recruitment & Placement Consultancy</p>
          <p className="text-[10px] text-slate-500">License No: 2013854/FZE • Dubai, UAE • info@mshorizon.ae</p>
        </div>
        <div className="text-right">
          <h1 className="text-lg font-black uppercase text-slate-800 tracking-tight">Placement Agreement</h1>
          <p className="text-xs font-bold text-slate-600">Ref: MSH-{placement.id?.substring(0, 8).toUpperCase()}</p>
          <p className="text-[10px] text-slate-500">Date: {new Date().toLocaleDateString('en-GB')}</p>
        </div>
      </div>

      <div className="mb-4 text-justify text-xs">
        <p>This Professional Placement Agreement (the "Agreement") is entered into on <strong>{new Date().toLocaleDateString('en-GB')}</strong> by and between the recruitment consultancy, candidate, and placed client company under the terms set out below.</p>
      </div>

      {/* EMPLOYEE INFORMATION */}
      <h3 className="section-title">1. Employee Information</h3>
      <div className="info-box bg-slate-50/50">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2.5 gap-x-4">
          <div><div className="info-label">Full Name</div><div className="info-value">{placement.applicantName}</div></div>
          <div><div className="info-label">Passport Number</div><div className="info-value">{placement.passportNumber || "N/A"}</div></div>
          <div><div className="info-label">Nationality</div><div className="info-value">{placement.nationality || "N/A"}</div></div>
          <div><div className="info-label">Date of Birth</div><div className="info-value">{placement.dateOfBirth || "N/A"}</div></div>
          <div><div className="info-label">Mobile Number</div><div className="info-value">{placement.mobileNumber || "N/A"}</div></div>
          <div><div className="info-label">Email Address</div><div className="info-value">{placement.emailAddress || "N/A"}</div></div>
          <div className="col-span-2 md:col-span-3"><div className="info-label">Current Address</div><div className="info-value">{placement.currentAddress || "N/A"}</div></div>
        </div>
      </div>

      {/* RECRUITMENT CONSULTANCY DETAILS */}
      <h3 className="section-title">2. Recruitment Consultancy Details</h3>
      <div className="info-box bg-slate-50/50">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2.5 gap-x-4">
          <div><div className="info-label">Company Name</div><div className="info-value">MS Horizon F.Z.E</div></div>
          <div><div className="info-label">Trade License Number</div><div className="info-value">2013854/FZE</div></div>
          <div><div className="info-label">Office Address</div><div className="info-value">Office 101, Business Bay, Dubai, UAE</div></div>
          <div><div className="info-label">Contact Number</div><div className="info-value">+971 4 123 4567</div></div>
          <div><div className="info-label">Email Address</div><div className="info-value">info@mshorizon.ae</div></div>
          <div><div className="info-label">Authorized Representative</div><div className="info-value">{placement.createdBy || "Authorized Signatory"}</div></div>
        </div>
      </div>

      {/* PLACED COMPANY DETAILS */}
      <h3 className="section-title">3. Placed Company Details</h3>
      <div className="info-box bg-slate-50/50">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2.5 gap-x-4">
          <div><div className="info-label">Company Name</div><div className="info-value">{placement.companyName}</div></div>
          <div><div className="info-label">Trade License Number</div><div className="info-value">{placement.clientTradeLicense || "N/A (Optional)"}</div></div>
          <div><div className="info-label">Office Address</div><div className="info-value">{placement.clientAddress || "N/A"}</div></div>
          <div><div className="info-label">Contact Person</div><div className="info-value">{placement.clientContactPerson || "N/A"}</div></div>
          <div><div className="info-label">Contact Number</div><div className="info-value">{placement.clientContactNumber || "N/A"}</div></div>
          <div><div className="info-label">Email Address</div><div className="info-value">{placement.clientEmail || "N/A"}</div></div>
        </div>
      </div>

      {/* EMPLOYMENT DETAILS */}
      <h3 className="section-title">4. Employment Details</h3>
      <div className="info-box bg-slate-50/50">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2.5 gap-x-4">
          <div><div className="info-label">Position / Job Title</div><div className="info-value">{placement.position}</div></div>
          <div><div className="info-label">Department</div><div className="info-value">{placement.department || "N/A"}</div></div>
          <div><div className="info-label">Work Location</div><div className="info-value">{placement.workLocation || "N/A"}</div></div>
          <div><div className="info-label">Joining Date</div><div className="info-value">{placement.joiningDate ? new Date(placement.joiningDate).toLocaleDateString('en-GB') : "N/A"}</div></div>
          <div><div className="info-label">Contract Duration</div><div className="info-value">{placement.contractDuration || "N/A"}</div></div>
          <div><div className="info-label">Probation Period</div><div className="info-value">{placement.probationPeriod || "N/A"}</div></div>
        </div>
      </div>

      {/* SALARY & COMPENSATION */}
      <h3 className="section-title">5. Salary Details</h3>
      <div className="info-box bg-slate-50/50">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2.5 gap-x-4">
          <div><div className="info-label">Basic Salary</div><div className="info-value">{placement.salary?.toLocaleString() || "0.00"}</div></div>
          <div><div className="info-label">Currency</div><div className="info-value">{placement.currency || "AED"}</div></div>
          <div><div className="info-label">Payment Frequency</div><div className="info-value">{placement.paymentFrequency || "Monthly"}</div></div>
        </div>
      </div>

      <div className="page-break-before"></div>

      {/* ALLOWANCE & BENEFITS */}
      <h3 className="section-title mt-0">6. Allowance & Benefits</h3>
      <div className="info-box bg-slate-50/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2.5 gap-x-4">
          <div><div className="info-label">Food Allowance</div><div className="info-value">{placement.foodAllowance || "Not Provided"}</div></div>
          <div><div className="info-label">Accommodation</div><div className="info-value">{placement.accommodation || "Not Provided"}</div></div>
          <div><div className="info-label">Transportation</div><div className="info-value">{placement.transportation || "Not Provided"}</div></div>
          <div><div className="info-label">Overtime</div><div className="info-value">{placement.overtime || "As per UAE Law"}</div></div>
          <div><div className="info-label">Medical Insurance</div><div className="info-value">{placement.medicalInsurance || "Provided as per UAE Law"}</div></div>
          <div><div className="info-label">Annual Leave</div><div className="info-value">{placement.annualLeave || "As per UAE Law"}</div></div>
          <div><div className="info-label">Air Ticket</div><div className="info-value">{placement.airTicket || "Not Provided"}</div></div>
          <div><div className="info-label">Other Benefits</div><div className="info-value">{placement.otherBenefits || "None"}</div></div>
        </div>
      </div>

      {/* VISA & EMPLOYMENT PROCESS */}
      <h3 className="section-title">7. Visa & Employment Process</h3>
      <div className="info-box bg-slate-50/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2.5 gap-x-4">
          <div><div className="info-label">Visa Status</div><div className="info-value">{placement.visaStatus || "N/A"}</div></div>
          <div><div className="info-label">Visa Type</div><div className="info-value">{placement.placementVisaType || "N/A"}</div></div>
          <div><div className="info-label">Visa Processing Stage</div><div className="info-value">{placement.visaProcessingStage || "N/A"}</div></div>
          <div><div className="info-label">Medical Test Status</div><div className="info-value">{placement.medicalStatus || "N/A"}</div></div>
          <div><div className="info-label">Emirates ID Status</div><div className="info-value">{placement.emiratesIdStatus || "N/A"}</div></div>
          <div><div className="info-label">Labour Contract Status</div><div className="info-value">{placement.labourContractStatus || "N/A"}</div></div>
          <div><div className="info-label">Joining Status</div><div className="info-value">{placement.joiningStatus || "N/A"}</div></div>
        </div>
      </div>

      {/* TERMS AND CONDITIONS */}
      <h3 className="section-title">8. Terms & Conditions</h3>
      <div className="text-justify mb-4">
        <ol className="terms-list list-decimal">
          {finalTerms.map((term: any, idx: number) => (
            <li key={idx}>
              <strong>{term.title}:</strong> {term.content}
            </li>
          ))}
        </ol>
      </div>

      {/* DECLARATIONS */}
      <h3 className="section-title">9. Declarations</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6 text-justify">
        <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50">
          <h4 className="font-bold text-slate-800 mb-1">Candidate Declaration</h4>
          <p className="text-[10px] leading-relaxed">
            I hereby declare that I accept the offer of employment and the terms set out in this Agreement. I verify that the passport information, address, and credentials provided are correct. I agree to abide by the labour regulations of the United Arab Emirates.
          </p>
        </div>
        <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50">
          <h4 className="font-bold text-slate-800 mb-1">Consultancy Declaration</h4>
          <p className="text-[10px] leading-relaxed">
            We declare that we will act as the authorized placement agent, coordinating the scheduling, interview processing, and document management in compliance with MoHRE policies and UAE Federal Labour Laws.
          </p>
        </div>
      </div>

      {/* SIGNATURES */}
      <h3 className="section-title no-break">10. Signatures & Place</h3>
      <div className="no-break">
        <div className="grid grid-cols-2 gap-12 mt-4">
          {/* Applicant Signature */}
          <div>
            <div className="font-bold text-slate-800 mb-1 text-xs">Employee Signature:</div>
            <div className="signature-box bg-white">
              {placement.applicantSign ? (
                <img src={placement.applicantSign} alt="Applicant Signature" className="signature-img" />
              ) : (
                <span className="text-slate-400 italic text-xs">Digital signature pending</span>
              )}
            </div>
            <div className="mt-2 space-y-0.5 text-[10px] text-slate-600">
              <p>Name: <strong>{placement.applicantName}</strong></p>
              <p>Date: {placement.applicantSignDate ? new Date(placement.applicantSignDate).toLocaleDateString('en-GB') : "Pending"}</p>
              {placement.applicantSignIp && <p>IP: {placement.applicantSignIp}</p>}
            </div>
          </div>

          {/* Company Stamp & Signature */}
          <div>
            <div className="font-bold text-slate-800 mb-1 text-xs">Consultancy Representative & Stamp:</div>
            <div className="signature-box border-slate-300 bg-slate-50/50 flex-col">
              {placement.companySign ? (
                <img src={placement.companySign} alt="Company Signature" className="signature-img" />
              ) : (
                <span className="text-slate-400 italic text-[10px] text-center px-4">Authorized Signature<br/>& Company Stamp</span>
              )}
            </div>
            <div className="mt-2 space-y-0.5 text-[10px] text-slate-600">
              <p>Name: <strong>{placement.createdBy || "Authorized Signatory"}</strong></p>
              <p>Place: Dubai, UAE</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* FOOTER */}
      <div className="mt-10 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400 no-break">
        <p>MS Horizon F.Z.E - Recruitment Consultancy Placement Agreement</p>
        <p>This is a system generated legal document. Ref Reference ID: {placement.id}</p>
      </div>

    </div>
  );
}
