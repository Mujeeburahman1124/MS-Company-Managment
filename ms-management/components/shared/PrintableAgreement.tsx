"use client";

import React from "react";
import { Placement } from "@/lib/types";

export default function PrintableAgreement({ placement }: { placement: Placement }) {
  // Safe parsing of placement terms if it's stored as JSON
  let termsList: any[] = [];
  try {
    if (placement.termsAndConditions) {
      const parsed = JSON.parse(placement.termsAndConditions);
      if (Array.isArray(parsed)) termsList = parsed;
    }
  } catch(e) {}

  return (
    <div className="bg-white w-full h-full text-black printable-agreement relative">
      {/* Global CSS for A4 Print */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 20mm; }
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
          padding: 20mm;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          font-family: 'Times New Roman', Times, serif;
          color: #000;
          font-size: 11pt;
          line-height: 1.5;
        }

        .header-logo { max-width: 180px; max-height: 60px; object-fit: contain; }
        .client-logo { max-width: 120px; max-height: 60px; object-fit: contain; }
        
        h1, h2, h3, h4, h5 { font-family: 'Arial', sans-serif; color: #1a365d; margin-top: 0; }
        .section-title { font-size: 14pt; font-weight: bold; border-bottom: 2px solid #1a365d; padding-bottom: 5px; margin-bottom: 15px; margin-top: 25px; text-transform: uppercase; }
        
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .info-box { border: 1px solid #e2e8f0; padding: 12px; border-radius: 4px; }
        .info-label { font-size: 9pt; color: #64748b; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
        .info-value { font-size: 11pt; font-weight: bold; color: #0f172a; }
        
        table.prof-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        table.prof-table th, table.prof-table td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
        table.prof-table th { background-color: #f8fafc; font-weight: bold; color: #1e293b; font-size: 10pt; }
        table.prof-table td { font-size: 11pt; color: #334155; }
        
        .terms-list { padding-left: 20px; margin-bottom: 20px; text-align: justify; }
        .terms-list li { margin-bottom: 12px; }
        
        .signature-box { border: 1px dashed #cbd5e1; height: 100px; display: flex; align-items: center; justify-content: center; margin-top: 10px; border-radius: 4px; overflow: hidden; position: relative; }
        .signature-img { max-width: 100%; max-height: 100%; object-fit: contain; }
      `,}} />

      {/* HEADER (Appears at top of page 1 naturally, standard A4 layout) */}
      <div className="flex justify-between items-end border-b-2 border-slate-800 pb-4 mb-8">
        <div>
          <img src={(typeof window !== "undefined" && (JSON.parse(localStorage.getItem("auth-storage") || "{}")?.state?.currentUser?.companyLogo)) || "/logo.png"} alt="MS Horizon F.Z.E" className="header-logo" onError={(e) => e.currentTarget.style.display='none'} />
          <h2 className="text-2xl font-black text-slate-800 mt-2">MS HORIZON F.Z.E</h2>
          <p className="text-sm text-slate-600">Professional Recruitment Services</p>
          <p className="text-sm text-slate-600">www.mshorizon.ae | info@mshorizon.ae</p>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-black uppercase text-slate-800">Placement Agreement</h1>
          <p className="text-sm font-bold text-slate-600 mt-1">Ref: MSH-{placement.id?.substring(0, 8).toUpperCase()}</p>
          <p className="text-sm text-slate-600">Date: {new Date().toLocaleDateString('en-GB')}</p>
        </div>
      </div>

      <div className="mb-6 text-justify">
        <p>This Placement Agreement (the "Agreement") is made and entered into on <strong>{new Date().toLocaleDateString('en-GB')}</strong> by and between <strong>MS Horizon F.Z.E</strong> (hereinafter referred to as the "Consultancy") and the Applicant detailed below.</p>
      </div>

      {/* APPLICANT DETAILS */}
      <h3 className="section-title">1. Applicant Information</h3>
      <div className="info-box mb-6 bg-slate-50">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
          <div><div className="info-label">Full Name</div><div className="info-value">{placement.applicantName}</div></div>
          <div><div className="info-label">Passport Number</div><div className="info-value">{placement.passportNumber || "N/A"}</div></div>
          <div><div className="info-label">Nationality</div><div className="info-value">{placement.nationality || "N/A"}</div></div>
          <div><div className="info-label">Mobile Number</div><div className="info-value">{placement.mobileNumber || "N/A"}</div></div>
          <div><div className="info-label">Email Address</div><div className="info-value">{placement.emailAddress || "N/A"}</div></div>
          <div><div className="info-label">Date of Birth</div><div className="info-value">{placement.dateOfBirth || "N/A"}</div></div>
        </div>
      </div>

      {/* PLACEMENT DETAILS */}
      <h3 className="section-title no-break">2. Placement & Employment Details</h3>
      <div className="no-break mb-6">
        <p className="mb-4">The Applicant has been successfully placed with the following Client Company under the terms outlined below:</p>
        
        <table className="prof-table">
          <tbody>
            <tr>
              <th style={{ width: "30%" }}>Client Company</th>
              <td style={{ width: "70%" }}><strong>{placement.companyName}</strong></td>
            </tr>
            {placement.clientTradeLicense && (
              <tr>
                <th>Trade License Number</th>
                <td>{placement.clientTradeLicense}</td>
              </tr>
            )}
            <tr>
              <th>Job Title / Position</th>
              <td><strong>{placement.position}</strong></td>
            </tr>
            <tr>
              <th>Department / Location</th>
              <td>{placement.department || "N/A"} / {placement.workLocation || placement.city || "N/A"}</td>
            </tr>
            <tr>
              <th>Placement Date</th>
              <td>{placement.placementDate ? new Date(placement.placementDate).toLocaleDateString('en-GB') : "N/A"}</td>
            </tr>
            <tr>
              <th>Joining Date</th>
              <td>{placement.joiningDate ? new Date(placement.joiningDate).toLocaleDateString('en-GB') : "N/A"}</td>
            </tr>
            <tr>
              <th>Contract Duration</th>
              <td>{placement.contractDuration || "N/A"}</td>
            </tr>
            <tr>
              <th>Probation Period</th>
              <td>{placement.probationPeriod || "N/A"}</td>
            </tr>
            <tr>
              <th>Working Hours / Days</th>
              <td>{placement.workingHours || "N/A"} - Off: {placement.weeklyOff || "N/A"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SALARY & BENEFITS */}
      <h3 className="section-title no-break">3. Salary & Benefits Breakdown</h3>
      <div className="no-break mb-6">
        <table className="prof-table">
          <tbody>
            <tr>
              <th style={{ width: "30%" }}>Basic Salary</th>
              <td style={{ width: "70%" }}><strong>{placement.salary?.toLocaleString() || "0.00"} {placement.currency || "AED"}</strong> ({placement.paymentFrequency || "Monthly"})</td>
            </tr>
            <tr><th>Accommodation</th><td>{placement.accommodation || "Not Provided"}</td></tr>
            <tr><th>Transportation</th><td>{placement.transportation || "Not Provided"}</td></tr>
            <tr><th>Food Allowance</th><td>{placement.foodAllowance || "Not Provided"}</td></tr>
            <tr><th>Medical Insurance</th><td>{placement.medicalInsurance || "Provided as per UAE Law"}</td></tr>
            <tr><th>Air Ticket</th><td>{placement.airTicket || "Not Provided"}</td></tr>
            <tr><th>Annual Leave</th><td>{placement.annualLeave || "As per UAE Labour Law"}</td></tr>
            {placement.otherBenefits && <tr><th>Other Benefits</th><td>{placement.otherBenefits}</td></tr>}
          </tbody>
        </table>
      </div>

      {/* PLACEMENT FEES */}
      <h3 className="section-title no-break">4. Professional Fees</h3>
      <div className="no-break mb-6">
        <table className="prof-table">
          <tbody>
            <tr>
              <th style={{ width: "30%" }}>Registration Fee</th>
              <td style={{ width: "70%" }}>{placement.registrationFee?.toLocaleString() || "0.00"} AED</td>
            </tr>
            <tr>
              <th>Placement / Service Fee</th>
              <td>{placement.placementFee?.toLocaleString() || "0.00"} AED</td>
            </tr>
            <tr>
              <th>Total Paid Amount</th>
              <td><strong>{placement.paidAmount?.toLocaleString() || "0.00"} AED</strong> (Receipt: {placement.receiptNumber || "N/A"})</td>
            </tr>
            <tr>
              <th>Due Amount</th>
              <td className="text-rose-700 font-bold">{placement.dueAmount?.toLocaleString() || "0.00"} AED</td>
            </tr>
            <tr>
              <th>Payment Status</th>
              <td>{placement.paymentStatus || "Pending"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* PAGE BREAK usually needed around here for long documents */}
      <div className="page-break-before"></div>

      {/* TERMS AND CONDITIONS */}
      <h3 className="section-title mt-0">5. Terms & Conditions</h3>
      <div className="text-justify mb-8">
        {termsList.length > 0 ? (
          <ol className="terms-list list-decimal">
            {termsList.map((term: any, idx: number) => (
              <li key={idx}>
                <strong>{term.title}:</strong> {term.content}
              </li>
            ))}
          </ol>
        ) : (
          <div className="text-slate-500 italic p-4 bg-slate-50 border border-slate-200 rounded">
            Standard terms and conditions apply. (No specific terms loaded).
          </div>
        )}
      </div>

      {/* DECLARATIONS & SIGNATURES */}
      <h3 className="section-title no-break">6. Declarations & Signatures</h3>
      <div className="no-break">
        <p className="mb-6 text-justify text-sm">
          By signing below, I, <strong>{placement.applicantName}</strong>, confirm that I have read, understood, and agreed to all the terms, conditions, and placement details outlined in this Agreement. I acknowledge that the information provided is accurate and that I will abide by the policies of both MS Horizon F.Z.E and the Client Company.
        </p>

        <div className="grid grid-cols-2 gap-12 mt-10">
          {/* Applicant Signature */}
          <div>
            <div className="font-bold text-slate-800 mb-2">Applicant Signature:</div>
            <div className="signature-box">
              {placement.applicantSign ? (
                <img src={placement.applicantSign} alt="Applicant Signature" className="signature-img" />
              ) : (
                <span className="text-slate-400 italic text-sm">Digital signature pending</span>
              )}
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <p>Name: <strong>{placement.applicantName}</strong></p>
              <p>Date: {placement.applicantSignDate ? new Date(placement.applicantSignDate).toLocaleDateString('en-GB') : "Pending"}</p>
              {placement.applicantSignIp && <p>IP: {placement.applicantSignIp}</p>}
            </div>
          </div>

          {/* Company Stamp & Signature */}
          <div>
            <div className="font-bold text-slate-800 mb-2">For MS Horizon F.Z.E:</div>
            <div className="signature-box border-slate-300 bg-slate-50 flex-col">
              {placement.companySign ? (
                <img src={placement.companySign} alt="Company Signature" className="signature-img" />
              ) : (
                <span className="text-slate-400 italic text-sm text-center px-4">Authorized Signatory<br/>& Company Stamp</span>
              )}
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-600">
              <p>Name: <strong>{placement.createdBy || "Authorized Consultant"}</strong></p>
              <p>Designation: Recruitment Consultant</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* FOOTER */}
      <div className="mt-16 pt-4 border-t border-slate-200 text-center text-xs text-slate-400 no-break">
        <p>MS Horizon F.Z.E - Professional Placement Agreement - Page 1 of 1</p>
        <p>This is a system generated document. Ref: {placement.id}</p>
      </div>

    </div>
  );
}
