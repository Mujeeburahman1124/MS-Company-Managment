import re
import sys

with open('app/placement/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import PrintableAgreement
if 'import PrintableAgreement from "@/components/shared/PrintableAgreement";' not in content:
    content = content.replace(
        'import ConfirmDialog from "@/components/shared/ConfirmDialog";',
        'import ConfirmDialog from "@/components/shared/ConfirmDialog";\nimport PrintableAgreement from "@/components/shared/PrintableAgreement";'
    )

# 2. Add placementTerms state
if 'const [placementTerms, setPlacementTerms]' not in content:
    state_block = """  const [activeTab, setActiveTab] = useState<"all" | "pipeline" | "refunds" | "placed">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [placementTerms, setPlacementTerms] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/placement-terms")
      .then(res => res.json())
      .then(data => setPlacementTerms(data))
      .catch(console.error);
  }, []);"""
    content = re.sub(
        r'const \[activeTab, setActiveTab\] = useState<"all" \| "pipeline" \| "refunds" \| "placed">\("all"\);\s*const \[searchTerm, setSearchTerm\] = useState\(""\);\s*const \[statusFilter, setStatusFilter\] = useState\("all"\);',
        state_block,
        content
    )

# 3. Replace handleRegisterSubmit
old_submit = """  const handleRegisterSubmit = () => {
    if (!registerForm.applicantId || !registerForm.passportNumber || !registerForm.mobileNumber) {
      toast.error("Applicant information and contact details are required.");
      return;
    }
    if (!termsAccepted) {
      toast.error("You must accept the terms and conditions before proceeding.");
      return;
    }
    if (!wizardSignatures.applicant) {
      toast.error("Applicant signature is required.");
      return;
    }

    const newId = `PLA${Math.floor(100 + Math.random() * 900)}`;
    const newRecord: Placement = {
      id: newId,
      applicantId: registerForm.applicantId,
      applicantName: registerForm.applicantName,
      passportNumber: registerForm.passportNumber,
      mobileNumber: registerForm.mobileNumber,
      registrationDate: registerForm.registrationDate,
      placementDeadline: registerForm.placementDeadline,
      registrationFee: registerForm.registrationFee,
      placementFee: registerForm.placementFee,
      position: registerForm.position || "Not Specified",
      salary: 0,
      companyName: "-",
      placementDate: "-",
      status: "Registered",
      agreementStatus: "Signed",
      refundStatus: "Not Applicable",
      agreementAccepted: true,
      applicantSign: wizardSignatures.applicant,
      companySign: wizardSignatures.company || undefined,
      notes: registerForm.notes,
      termsAndConditions: registerForm.termsAndConditions,
      createdBy: currentUser.name,
      createdAt: registerForm.registrationDate,
      agreementHistory: [
        `Registration recorded and Registration Fee (AED ${registerForm.registrationFee}) paid on ${formatDate(registerForm.registrationDate)} by ${currentUser.name}.`,
        `Terms & Conditions accepted and signed by Applicant.`,
        wizardSignatures.company ? `Counter-signed by Company Officer.` : `Pending Counter-signature.`
      ]
    };

    addPlacement(newRecord);
    toast.success("Applicant registered and payment agreement executed!");
    setRegisterModal(false);
    resetRegisterForm();
  };"""

new_submit = """  const handleRegisterSubmit = async () => {
    if (!registerForm.applicantId || !registerForm.passportNumber || !registerForm.mobileNumber) {
      toast.error("Applicant information and contact details are required.");
      return;
    }
    if (!termsAccepted) {
      toast.error("You must accept the terms and conditions before proceeding.");
      return;
    }
    if (!wizardSignatures.applicant) {
      toast.error("Applicant signature is required.");
      return;
    }

    let ip = "Unknown";
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipRes.json();
      ip = ipData.ip;
    } catch (e) {}

    const newId = `PLA${Math.floor(100 + Math.random() * 900)}`;
    const newRecord: Placement = {
      id: newId,
      applicantId: registerForm.applicantId,
      applicantName: registerForm.applicantName,
      passportNumber: registerForm.passportNumber,
      mobileNumber: registerForm.mobileNumber,
      registrationDate: registerForm.registrationDate,
      placementDeadline: registerForm.placementDeadline,
      registrationFee: registerForm.registrationFee,
      placementFee: registerForm.placementFee,
      position: registerForm.position || "Not Specified",
      salary: 0,
      companyName: "-",
      placementDate: "-",
      status: "Registered",
      agreementStatus: "Signed",
      refundStatus: "Not Applicable",
      agreementAccepted: true,
      applicantSign: wizardSignatures.applicant,
      applicantSignDate: new Date().toISOString(),
      applicantSignIp: ip,
      applicantSignDevice: navigator.userAgent,
      companySign: wizardSignatures.company || undefined,
      notes: registerForm.notes,
      termsAndConditions: registerForm.termsAndConditions,
      createdBy: currentUser.name,
      createdAt: registerForm.registrationDate,
      agreementHistory: [
        `Registration recorded and Registration Fee (AED ${registerForm.registrationFee}) paid on ${formatDate(registerForm.registrationDate)} by ${currentUser.name}.`,
        `Terms & Conditions accepted and signed by Applicant (IP: ${ip}).`,
        wizardSignatures.company ? `Counter-signed by Company Officer.` : `Pending Counter-signature.`
      ]
    };

    addPlacement(newRecord);
    toast.success("Applicant registered and payment agreement executed!");
    setRegisterModal(false);
    resetRegisterForm();
  };"""

content = content.replace(old_submit, new_submit)

# 4. Remove printAgreement and update button calls
print_func_start = '  const printAgreement = (p: Placement) => {'
if print_func_start in content:
    # We will just strip it out via regex or simple slice
    start_idx = content.find(print_func_start)
    end_str = '  // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------'
    end_idx = content.find(end_str, start_idx)
    
    if start_idx != -1 and end_idx != -1:
        content = content[:start_idx] + content[end_idx:]

# 5. Replace button onClick
content = content.replace('onClick={() => printAgreement(agreementModal)}', 'onClick={() => window.print()}')

# 6. Add PrintableAgreement component
if '<PrintableAgreement' not in content:
    content = content.replace(
        '    </div>\n  );\n}',
        '      {agreementModal && <PrintableAgreement placement={agreementModal} terms={placementTerms} />}\n    </div>\n  );\n}'
    )

with open('app/placement/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched app/placement/page.tsx")
