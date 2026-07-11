"use client";

import React from "react";
import { Placement } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

export default function PrintableAgreement({ placement, terms }: { placement: Placement; terms?: any[] }) {
  const { siteSettings } = useAuthStore();

  // Load site setting variables with fallbacks
  const companyName = siteSettings?.siteName || "MS Horizon F.Z.E";
  const companyLicense = siteSettings?.companyLicense || "2013854/FZE";
  const companyAddress = siteSettings?.address || "Office 101, Business Bay, Dubai, UAE";
  const companyPhone = siteSettings?.phone || "+971 4 123 4567";
  const companyEmail = siteSettings?.email || "info@mshorizon.ae";
  const companyWebsite = siteSettings?.companyWebsite || "www.mshorizon.ae";
  const printFooterText = siteSettings?.printFooter || "MS Horizon F.Z.E - Recruitment Consultancy Placement Agreement";
  const primaryBrandingColor = siteSettings?.primaryColor || "#1a365d";

  const candidateDeclText = siteSettings?.candidateDeclaration || 
    "I hereby declare that I accept the offer of employment and the terms set out in this Agreement. I verify that the passport information, address, and credentials provided are correct. I agree to abide by the labour regulations of the United Arab Emirates.";
  const consultancyDeclText = siteSettings?.consultancyDeclaration || 
    "We declare that we will act as the authorized placement agent, coordinating the scheduling, interview processing, and document management in compliance with MoHRE policies and UAE Federal Labour Laws.";

  // Safe parsing of placement terms if it's stored as JSON
  let termsList: any[] = [];
  try {
    if (placement.termsAndConditions) {
      const parsed = JSON.parse(placement.termsAndConditions);
      if (Array.isArray(parsed)) termsList = parsed;
    }
  } catch(e) {}

  // Build the final T&Cs list
  let finalTerms: any[] = [];
  if (termsList.length > 0) {
    finalTerms = termsList;
  } else if (terms && terms.length > 0) {
    finalTerms = terms.filter((t: any) => t.isActive !== false);
  } else if (siteSettings?.placementTerms) {
    const lines = siteSettings.placementTerms.split("\n").filter(Boolean);
    finalTerms = lines.map((line: string, i: number) => {
      const dotIdx = line.indexOf(".");
      if (dotIdx > 0 && dotIdx < 30) {
        return {
          title: line.substring(0, dotIdx).trim(),
          content: line.substring(dotIdx + 1).trim()
        };
      }
      return {
        title: `Clause ${i + 1}`,
        content: line
      };
    });
  } else {
    // Standard legal fallback terms
    finalTerms = [
      { title: "Candidate Responsibilities", content: "The Candidate agrees to submit all necessary documentation, including passports, visa copies, and education credentials, within 3 business days. The Candidate agrees to perform their duties in accordance with the policies of the Placed Company and successfully complete the probation period." },
      { title: "Consultancy Responsibilities", content: "The Consultancy agrees to provide professional placement, screening, and guidance services. The Consultancy will coordinate recruitment timelines, coordinate interviews, and assist with document translation and onboarding with the Placed Company." },
      { title: "Placement/Service Fee Terms", content: "All service fees are subject to VAT at the prevailing rate in the UAE. The placement service fees are payable in full as set out in this Agreement and are non-refundable once visa processes or work permits have been initiated by the Placed Company." }
    ];
  }

  // Append Refund and Replacement policies if they exist in siteSettings
  if (siteSettings?.refundPolicy && !finalTerms.some(t => t.title.toLowerCase().includes("refund"))) {
    finalTerms.push({ title: "Refund Policy", content: siteSettings.refundPolicy });
  }
  if (siteSettings?.replacementPolicy && !finalTerms.some(t => t.title.toLowerCase().includes("replacement"))) {
    finalTerms.push({ title: "Replacement Policy", content: siteSettings.replacementPolicy });
  }

  return (
    <div className="bg-white w-full text-black printable-agreement relative">
      {/* Global CSS for A4 Print */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Hide on screen by default */
        .printable-agreement {
          display: none !important;
        }

        @media print {
          @page { size: A4 portrait; margin: 10mm 15mm; }
          html, body, main, div, table, tr, td {
            background: white !important;
            background-color: white !important;
            box-shadow: none !important;
          }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white !important; }
          
          /* Display on print */
          .printable-agreement { 
            display: block !important;
            width: 100% !important; 
            max-width: none !important; 
            padding: 0 !important; 
            margin: 0 !important; 
            box-shadow: none !important; 
            border: none !important; 
            background: white !important; 
          }
          
          /* Print engine table headers and footers repeating on every page */
          .print-header-spacer { height: 75px; }
          .print-footer-spacer { height: 50px; }
          
          .print-header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 75px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 5px;
            background: white !important;
          }
          
          .print-footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 45px;
            border-top: 1px solid #cbd5e1;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: white !important;
            font-size: 8pt;
            color: #64748b;
          }

          .page-break-before { page-break-before: always; }
          .page-break-after { page-break-after: always; }
          .no-break { page-break-inside: avoid; }
          .hide-on-print { display: none !important; }
          
          /* Native CSS page numbering counter */
          .page-number::after {
            content: "Page " counter(page) " of " counter(pages);
          }
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
        
        h1, h2, h3, h4, h5 { font-family: 'Arial', sans-serif; color: ${primaryBrandingColor}; margin-top: 0; }
        .section-title { font-size: 11pt; font-weight: bold; border-bottom: 1.5px solid ${primaryBrandingColor}; padding-bottom: 3px; margin-bottom: 10px; margin-top: 15px; text-transform: uppercase; }
        
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
        .info-box { border: 1px solid #cbd5e1; padding: 10px; border-radius: 4px; margin-bottom: 12px; }
        .info-label { font-size: 8pt; color: #475569; font-weight: bold; text-transform: uppercase; margin-bottom: 1px; }
        .info-value { font-size: 10pt; font-weight: bold; color: #0f172a; }
        
        .terms-list { padding-left: 18px; margin-bottom: 15px; text-align: justify; font-size: 9.5pt; }
        .terms-list li { margin-bottom: 8px; }
        
        .signature-box { border: 1px dashed #cbd5e1; height: 80px; display: flex; align-items: center; justify-content: center; margin-top: 5px; border-radius: 4px; overflow: hidden; position: relative; }
        .signature-img { max-width: 100%; max-height: 100%; object-fit: contain; }
      `,}} />

      {/* Repeating print engine layout table */}
      <table className="w-full">
        <thead className="hidden print:table-header-group">
          <tr>
            <td>
              <div className="print-header">
                <div className="flex items-center gap-2">
                  {siteSettings?.logo ? (
                    <img src={siteSettings.logo} alt="" className="h-8 w-auto object-contain" />
                  ) : null}
                  <span className="text-xs font-bold text-slate-800">{companyName}</span>
                </div>
                <div className="text-right text-[8px] text-slate-500">
                  <p>Agreement Ref: MSH-{placement.id?.substring(0, 8).toUpperCase()}</p>
                  <p>Applicant Name: {placement.applicantName}</p>
                </div>
              </div>
              <div className="print-header-spacer"></div>
            </td>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td className="p-0">
              {/* Branded Letterhead Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-3 mb-4 print:mt-0">
                <div>
                  <img src={siteSettings?.logo || "/logo.png"} alt="Company Logo" className="header-logo" onError={(e) => e.currentTarget.style.display='none'} />
                  <h2 className="text-lg font-black text-slate-800 mt-1">{companyName}</h2>
                  <p className="text-[9px] text-slate-600">Professional Recruitment & Placement Consultancy</p>
                  <p className="text-[8px] text-slate-500">License No: {companyLicense} • {companyAddress}</p>
                </div>
                <div className="text-right text-[8px] text-slate-500 space-y-0.5">
                  <p>Tel: {companyPhone}</p>
                  <p>Email: {companyEmail}</p>
                  <p>Web: {companyWebsite}</p>
                </div>
              </div>

              {/* Centered Agreement Title Block */}
              <div className="text-center my-6 no-break">
                <h1 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-double border-slate-900 pb-1 inline-block">
                  PAYMENT & PLACEMENT SERVICE AGREEMENT
                </h1>
                <div className="flex justify-center gap-12 mt-2 text-[9px] font-semibold text-slate-600">
                  <span>Agreement No: <strong className="text-slate-900">MSH-PLM-{placement.id?.substring(0, 8).toUpperCase()}</strong></span>
                  <span>Agreement Date: <strong className="text-slate-900">{placement.placementDate || new Date().toLocaleDateString('en-GB')}</strong></span>
                  <span>Applicant ID: <strong className="text-slate-900">{placement.applicantId?.substring(0, 8).toUpperCase()}</strong></span>
                </div>
              </div>

              <div className="mb-4 text-justify text-xs">
                <p>This Professional Placement Agreement (the "Agreement") is entered into on <strong>{placement.placementDate || new Date().toLocaleDateString('en-GB')}</strong> by and between the recruitment consultancy, candidate, and placed client company under the terms set out below.</p>
              </div>

              {/* EMPLOYEE INFORMATION */}
              <h3 className="section-title">1. Employee Information</h3>
              <div className="info-box bg-slate-50/50 no-break flex gap-6 items-start">
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-y-2.5 gap-x-4">
                  <div><div className="info-label">Full Name</div><div className="info-value">{placement.applicantName}</div></div>
                  <div><div className="info-label">Passport Number</div><div className="info-value">{placement.passportNumber || "N/A"}</div></div>
                  <div><div className="info-label">Nationality</div><div className="info-value">{placement.nationality || "N/A"}</div></div>
                  <div><div className="info-label">Gender</div><div className="info-value">{placement.gender || "N/A"}</div></div>
                  <div><div className="info-label">Date of Birth</div><div className="info-value">{placement.dateOfBirth || "N/A"}</div></div>
                  <div><div className="info-label">Mobile Number</div><div className="info-value">{placement.mobileNumber || "N/A"}</div></div>
                  <div><div className="info-label">WhatsApp Number</div><div className="info-value">{placement.whatsappNumber || "N/A"}</div></div>
                  <div><div className="info-label">Email Address</div><div className="info-value">{placement.emailAddress || "N/A"}</div></div>
                  <div><div className="info-label">Emirates ID</div><div className="info-value">{placement.emiratesId || "N/A"}</div></div>
                  <div><div className="info-label">Marital Status</div><div className="info-value">{placement.maritalStatus || "N/A"}</div></div>
                  <div><div className="info-label">Education</div><div className="info-value">{placement.education || "N/A"}</div></div>
                  <div><div className="info-label">Experience</div><div className="info-value">{placement.experience || "N/A"}</div></div>
                  <div><div className="info-label">Passport Expiry</div><div className="info-value">{placement.passportExpiry || "N/A"}</div></div>
                  <div><div className="info-label">Visa Status</div><div className="info-value">{placement.visaStatus || "N/A"}</div></div>
                  <div><div className="info-label">Registration Date</div><div className="info-value">{placement.registrationDate || "N/A"}</div></div>
                  <div className="col-span-2 md:col-span-3"><div className="info-label">Current Address</div><div className="info-value">{placement.currentAddress || "N/A"}</div></div>
                </div>
                {placement.photo && (
                  <div className="flex-shrink-0 w-24 h-32 border border-slate-200 rounded-md overflow-hidden bg-white p-1 self-center">
                    <img src={placement.photo} alt="Candidate Photo" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              {/* RECRUITMENT CONSULTANCY DETAILS */}
              <h3 className="section-title">2. Recruitment Consultancy Details</h3>
              <div className="info-box bg-slate-50/50 no-break">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2.5 gap-x-4">
                  <div><div className="info-label">Company Name</div><div className="info-value">{companyName}</div></div>
                  <div><div className="info-label">Trade License Number</div><div className="info-value">{companyLicense}</div></div>
                  <div><div className="info-label">Office Address</div><div className="info-value">{companyAddress}</div></div>
                  <div><div className="info-label">Telephone</div><div className="info-value">{companyPhone}</div></div>
                  <div><div className="info-label">Email Address</div><div className="info-value">{companyEmail}</div></div>
                  <div><div className="info-label">Website</div><div className="info-value">{companyWebsite}</div></div>
                  <div><div className="info-label">Authorized Representative</div><div className="info-value">{placement.createdBy || "Authorized Signatory"}</div></div>
                </div>
              </div>

              {/* PLACED COMPANY DETAILS */}
              {placement.status === "Placed" && (
                <>
                  <h3 className="section-title no-break">3. Placed Company Details</h3>
                  <div className="info-box bg-slate-50/50 no-break">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2.5 gap-x-4">
                      <div><div className="info-label">Client Company Name</div><div className="info-value">{placement.companyName}</div></div>
                      <div><div className="info-label">Trade License Number</div><div className="info-value">{placement.clientTradeLicense || "N/A (Optional)"}</div></div>
                      <div><div className="info-label">Company Address</div><div className="info-value">{placement.clientAddress || "N/A"}</div></div>
                      <div><div className="info-label">Contact Person</div><div className="info-value">{placement.clientContactPerson || "N/A"}</div></div>
                      <div><div className="info-label">Mobile Number</div><div className="info-value">{placement.clientContactNumber || "N/A"}</div></div>
                      <div><div className="info-label">Email Address</div><div className="info-value">{placement.clientEmail || "N/A"}</div></div>
                      <div><div className="info-label">Country</div><div className="info-value">{placement.clientCountry || "N/A"}</div></div>
                      <div><div className="info-label">Location / City</div><div className="info-value">{placement.workLocation || placement.city || "N/A"}</div></div>
                    </div>
                  </div>
                </>
              )}

              {/* EMPLOYMENT DETAILS */}
              <h3 className="section-title no-break">4. Employment Details</h3>
              <div className="info-box bg-slate-50/50 no-break">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2.5 gap-x-4">
                  <div><div className="info-label">Job Title</div><div className="info-value">{placement.position}</div></div>
                  <div><div className="info-label">Department</div><div className="info-value">{placement.department || "N/A"}</div></div>
                  <div><div className="info-label">Working Location</div><div className="info-value">{placement.workLocation || "N/A"}</div></div>
                  <div><div className="info-label">Country</div><div className="info-value">{placement.clientCountry || "United Arab Emirates"}</div></div>
                  <div><div className="info-label">Joining Date</div><div className="info-value">{placement.joiningDate ? new Date(placement.joiningDate).toLocaleDateString('en-GB') : "N/A"}</div></div>
                  <div><div className="info-label">Contract Duration</div><div className="info-value">{placement.contractDuration || "N/A"}</div></div>
                  <div><div className="info-label">Probation Period</div><div className="info-value">{placement.probationPeriod || "N/A"}</div></div>
                  <div><div className="info-label">Working Hours / Days</div><div className="info-value">{placement.workingHours || "N/A"}</div></div>
                  <div><div className="info-label">Weekly Off</div><div className="info-value">{placement.weeklyOff || "N/A"}</div></div>
                  <div><div className="info-label">Shift Timing</div><div className="info-value">{placement.shiftDetails || "N/A"}</div></div>
                </div>
              </div>

              {/* SALARY & COMPENSATION */}
              <h3 className="section-title no-break">5. Salary & Compensation Details</h3>
              <div className="info-box bg-slate-50/50 no-break">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2.5 gap-x-4">
                  <div><div className="info-label">Basic Salary</div><div className="info-value">{placement.salary?.toLocaleString() || "0.00"} {placement.currency || "AED"}</div></div>
                  <div><div className="info-label">Currency</div><div className="info-value">{placement.currency || "AED"}</div></div>
                  <div><div className="info-label">Payment Frequency</div><div className="info-value">{placement.paymentFrequency || "Monthly"}</div></div>
                  <div><div className="info-label">Accommodation</div><div className="info-value">{placement.accommodation || "Not Provided"}</div></div>
                  <div><div className="info-label">Transportation</div><div className="info-value">{placement.transportation || "Not Provided"}</div></div>
                  <div><div className="info-label">Food Allowance</div><div className="info-value">{placement.foodAllowance || "Not Provided"}</div></div>
                  <div><div className="info-label">Medical Insurance</div><div className="info-value">{placement.medicalInsurance || "Provided as per UAE Law"}</div></div>
                  <div><div className="info-label">Annual Leave</div><div className="info-value">{placement.annualLeave || "As per UAE Law"}</div></div>
                  <div><div className="info-label">Air Ticket</div><div className="info-value">{placement.airTicket || "Not Provided"}</div></div>
                  <div className="col-span-2"><div className="info-label">Other Benefits</div><div className="info-value">{placement.otherBenefits || "None"}</div></div>
                </div>
              </div>

              {/* VISA & EMPLOYMENT PROCESS */}
              <h3 className="section-title no-break">6. Visa & Employment Process</h3>
              <div className="info-box bg-slate-50/50 no-break">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2.5 gap-x-4">
                  <div><div className="info-label">Visa Type</div><div className="info-value">{placement.placementVisaType || "N/A"}</div></div>
                  <div><div className="info-label">Visa Status</div><div className="info-value">{placement.visaStatus || "N/A"}</div></div>
                  <div><div className="info-label">Medical Status</div><div className="info-value">{placement.medicalStatus || "N/A"}</div></div>
                  <div><div className="info-label">Labour Contract Status</div><div className="info-value">{placement.labourContractStatus || "N/A"}</div></div>
                  <div><div className="info-label">Emirates ID Status</div><div className="info-value">{placement.emiratesIdStatus || "N/A"}</div></div>
                  <div><div className="info-label">Joining Status</div><div className="info-value">{placement.joiningStatus || "N/A"}</div></div>
                  <div><div className="info-label">Travel Status</div><div className="info-value">{placement.travelStatus || "N/A"}</div></div>
                </div>
              </div>

              {/* FINANCIAL INFORMATION */}
              <h3 className="section-title no-break">7. Financial Information</h3>
              <div className="info-box bg-slate-50/50 no-break">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2.5 gap-x-4">
                  <div><div className="info-label">Registration Fee</div><div className="info-value">{placement.registrationFee?.toLocaleString() || "0.00"} AED</div></div>
                  <div><div className="info-label">Placement Fee</div><div className="info-value">{placement.placementFee?.toLocaleString() || "0.00"} AED</div></div>
                  <div><div className="info-label">Total Paid</div><div className="info-value">{placement.paidAmount?.toLocaleString() || "0.00"} AED</div></div>
                  <div><div className="info-label">Pending Balance</div><div className="info-value text-rose-600 font-bold">{placement.dueAmount?.toLocaleString() || "0.00"} AED</div></div>
                  <div><div className="info-label">Payment Date</div><div className="info-value">{placement.placementDate ? new Date(placement.placementDate).toLocaleDateString('en-GB') : "N/A"}</div></div>
                  <div><div className="info-label">Payment Method</div><div className="info-value">{placement.paymentMethod || "N/A"}</div></div>
                  <div><div className="info-label">Receipt Number</div><div className="info-value">{placement.receiptNumber || "N/A"}</div></div>
                  <div><div className="info-label">Refund Status</div><div className="info-value">{placement.refundStatus || "Not Applicable"}</div></div>
                </div>
              </div>

              <div className="page-break-before"></div>

              {/* TERMS AND CONDITIONS */}
              <h3 className="section-title mt-0">8. Terms & Conditions</h3>
              <div className="text-justify mb-4">
                <ol className="terms-list list-decimal">
                  {finalTerms.map((term: any, idx: number) => (
                    <li key={idx} className="no-break">
                      <strong>{term.title}:</strong> {term.content}
                    </li>
                  ))}
                </ol>
              </div>

              {/* DECLARATIONS */}
              <h3 className="section-title no-break">9. Declarations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-6 text-justify no-break">
                <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                  <h4 className="font-bold text-slate-800 mb-1">Candidate Declaration</h4>
                  <p className="text-[10px] leading-relaxed italic">{candidateDeclText}</p>
                </div>
                <div className="border border-slate-200 p-3 rounded-lg bg-slate-50/50">
                  <h4 className="font-bold text-slate-800 mb-1">Consultancy Declaration</h4>
                  <p className="text-[10px] leading-relaxed italic">{consultancyDeclText}</p>
                </div>
              </div>

              {/* SIGNATURES */}
              <h3 className="section-title no-break">10. Signatures & Stamp</h3>
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
                    <div className="font-bold text-slate-800 mb-1 text-xs">Consultancy Stamp & Signature:</div>
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
            </td>
          </tr>
        </tbody>

        <tfoot className="hidden print:table-footer-group">
          <tr>
            <td>
              <div className="print-footer-spacer"></div>
              <div className="print-footer">
                <span>{printFooterText}</span>
                <span className="page-number"></span>
              </div>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Screen-only Footer inside the scroll boundaries */}
      <div className="mt-10 pt-3 border-t border-slate-200 text-center text-[9px] text-slate-400 print:hidden">
        <p>{printFooterText}</p>
        <p>This is a system generated legal document. Ref Reference ID: {placement.id}</p>
      </div>

    </div>
  );
}
