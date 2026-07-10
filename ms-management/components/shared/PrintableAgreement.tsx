import React from "react";
import { Placement } from "@/lib/types";

type PrintableAgreementProps = {
  placement: Placement;
  terms: any[];
};

export default function PrintableAgreement({ placement, terms }: PrintableAgreementProps) {
  if (!placement) return null;

  return (
    <div className="hidden print:block absolute inset-0 bg-white z-[9999] w-full print-container" style={{ WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; }
          
          /* A4 size and margins */
          @page { 
            size: A4 portrait; 
            margin: 15mm; 
          }
          
          .page-break { page-break-after: always; break-after: page; }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
        }
        
        .terms-content p { margin-bottom: 0.75rem; }
        
        /* Table structure for repeating header/footer */
        table.print-table { width: 100%; border-collapse: collapse; }
        thead.print-header { display: table-header-group; }
        tfoot.print-footer { display: table-footer-group; }
        tbody.print-body { display: table-row-group; }
      `}} />

      <table className="print-table text-slate-800 text-[11px] leading-relaxed">
        {/* REPEATING HEADER */}
        <thead className="print-header">
          <tr>
            <td>
              <div className="text-center border-b-2 border-slate-200 pb-4 mb-4 relative">
                <h2 className="text-lg font-bold uppercase text-slate-900 m-0 tracking-wider">Payment & Placement Service Agreement</h2>
                <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-1">MS HORIZON F.Z.E • Website: msjobs.net</p>
                
                <div className="absolute right-0 top-0 border-2 border-dashed border-blue-500/40 rounded-full w-14 h-14 flex flex-col items-center justify-center text-[6px] text-blue-500/60 uppercase font-bold transform rotate-12 leading-tight">
                  <span>MS Horizon</span>
                  <span className="text-[4px]">F.Z.E</span>
                  <span className="text-[4px]">Verified</span>
                </div>
              </div>
            </td>
          </tr>
        </thead>

        {/* REPEATING FOOTER */}
        <tfoot className="print-footer">
          <tr>
            <td>
              <div className="w-full text-center text-[8px] text-slate-400 font-medium pt-2 pb-2 mt-4 border-t border-slate-100">
                MS Horizon F.Z.E | Payment & Placement Agreement | Reference: {placement.id} | Generated: {new Date().toLocaleString()}
              </div>
            </td>
          </tr>
        </tfoot>

        {/* MAIN CONTENT */}
        <tbody className="print-body">
          <tr>
            <td>
              <div className="max-w-4xl mx-auto space-y-6 px-2">
                
                <p className="font-medium text-sm">This Payment & Placement Service Agreement is entered into between <strong>MS Horizon F.Z.E</strong> ("Company") and the registered Applicant ("Applicant") detailed below:</p>

                {/* Applicant Details Table */}
                <table className="w-full border-collapse border border-slate-200 mb-6 avoid-break text-[10px]">
                  <tbody>
                    <tr>
                      <td className="border border-slate-200 p-2 font-bold bg-slate-50 w-1/3 text-slate-600">Applicant Name</td>
                      <td className="border border-slate-200 p-2 font-bold text-slate-900 text-sm">{placement.applicantName}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-2 font-bold bg-slate-50 text-slate-600">Passport / Emirates ID No.</td>
                      <td className="border border-slate-200 p-2 text-slate-800">{placement.passportNumber || "-"}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-2 font-bold bg-slate-50 text-slate-600">Nationality</td>
                      <td className="border border-slate-200 p-2 text-slate-800">{(placement as any).nationality || "-"}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-2 font-bold bg-slate-50 text-slate-600">Mobile Number</td>
                      <td className="border border-slate-200 p-2 text-slate-800">{placement.mobileNumber || "-"}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-2 font-bold bg-slate-50 text-slate-600">Email</td>
                      <td className="border border-slate-200 p-2 text-slate-800">{(placement as any).email || "-"}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-2 font-bold bg-slate-50 text-slate-600">Registration Date</td>
                      <td className="border border-slate-200 p-2 text-slate-800">{placement.registrationDate ? new Date(placement.registrationDate).toLocaleDateString() : "-"}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-2 font-bold bg-slate-50 text-slate-600">Assigned Company & Branch</td>
                      <td className="border border-slate-200 p-2 text-slate-800">{placement.company} - {placement.branch}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-2 font-bold bg-slate-50 text-slate-600">Consultant</td>
                      <td className="border border-slate-200 p-2 text-slate-800">{placement.createdBy || "-"}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-2 font-bold bg-slate-50 text-slate-600">Placement Deadline</td>
                      <td className="border border-slate-200 p-2 text-slate-800">{placement.placementDeadline ? new Date(placement.placementDeadline).toLocaleDateString() : "-"}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-2 font-bold bg-slate-50 text-slate-600">Registration Fee Paid</td>
                      <td className="border border-slate-200 p-2 font-bold text-slate-900">AED {placement.registrationFee?.toLocaleString() || "0"}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-2 font-bold bg-slate-50 text-slate-600">Placement Fee (Upon Placement)</td>
                      <td className="border border-slate-200 p-2 font-bold text-slate-900">AED {(placement as any).placementFee?.toLocaleString() || "0"}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Dynamic Terms */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold border-b border-slate-200 pb-1 uppercase">Terms & Conditions</h3>
                  {terms && terms.length > 0 ? (
                    terms.filter(t => t.isActive).map((term, i) => (
                      <div key={term.id} className="avoid-break mb-3">
                        <h4 className="font-bold text-slate-800 text-xs">{i + 1}. {term.title}</h4>
                        <div className="text-slate-600 whitespace-pre-wrap mt-1 terms-content">{term.content}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-600 whitespace-pre-wrap terms-content avoid-break">{placement.termsAndConditions || "Standard Terms and Conditions apply."}</div>
                  )}
                </div>

                {/* Declaration and Signatures */}
                <div className="avoid-break mt-10 pt-6 border-t-2 border-slate-200">
                  <h3 className="font-bold text-sm mb-3 uppercase">Applicant Declaration & Acceptance</h3>
                  
                  <div className="space-y-2 mb-6 text-[10px]">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border border-slate-800 flex items-center justify-center bg-slate-800 text-white font-bold leading-none">
                        ✓
                      </div>
                      <span className="font-bold">I have read all Terms & Conditions carefully.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border border-slate-800 flex items-center justify-center bg-slate-800 text-white font-bold leading-none">
                        ✓
                      </div>
                      <span className="font-bold">I agree to be legally bound by this Agreement.</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12 mt-8">
                    {/* Applicant Signature */}
                    <div className="text-center space-y-2">
                      <div className="h-20 border-b border-slate-300 flex items-end justify-center relative bg-slate-50/50">
                        {placement.applicantSign ? (
                          <img src={placement.applicantSign} alt="Applicant Signature" className="max-h-full max-w-full object-contain mb-1 mix-blend-multiply" />
                        ) : (
                          <span className="text-slate-300 italic mb-2">Signature Pending</span>
                        )}
                      </div>
                      <div className="font-bold border-t border-slate-200 pt-1 text-xs">Applicant Digital Signature</div>
                      <div className="text-[8px] text-slate-500 space-y-0.5 text-left bg-slate-50 p-2 rounded border border-slate-100">
                        <div><strong>Accepted On:</strong> {placement.applicantSignDate ? new Date(placement.applicantSignDate).toLocaleString() : "-"}</div>
                        <div><strong>IP Address:</strong> {placement.applicantSignIp || "-"}</div>
                        <div className="truncate"><strong>Device:</strong> {placement.applicantSignDevice || "-"}</div>
                      </div>
                    </div>

                    {/* Company Signature */}
                    <div className="text-center space-y-2">
                      <div className="h-20 border-b border-slate-300 flex items-end justify-center bg-slate-50/50">
                        {placement.companySign ? (
                          <img src={placement.companySign} alt="Company Signature" className="max-h-full max-w-full object-contain mb-1 mix-blend-multiply" />
                        ) : (
                          <span className="text-slate-300 italic mb-2">Signature Pending</span>
                        )}
                      </div>
                      <div className="font-bold border-t border-slate-200 pt-1 text-xs">Company Representative</div>
                      <div className="text-[8px] text-slate-500 mt-1 h-[42px] border border-dashed border-slate-200 rounded flex items-center justify-center bg-slate-50">
                        MS Horizon F.Z.E Official Stamp
                      </div>
                    </div>
                  </div>
                  
                </div>

              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
