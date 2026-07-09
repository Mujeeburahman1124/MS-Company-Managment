const fs = require('fs');

let content = fs.readFileSync('app/placement/page.tsx', 'utf8');

// 1. Import PrintableAgreement
if (!content.includes('import PrintableAgreement from "@/components/shared/PrintableAgreement";')) {
    content = content.replace(
        'import ConfirmDialog from "@/components/shared/ConfirmDialog";',
        'import ConfirmDialog from "@/components/shared/ConfirmDialog";\nimport PrintableAgreement from "@/components/shared/PrintableAgreement";'
    );
}

// 2. Add placementTerms state
if (!content.includes('const [placementTerms, setPlacementTerms]')) {
    const state_block = `  const [activeTab, setActiveTab] = useState<"all" | "pipeline" | "refunds" | "placed">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [placementTerms, setPlacementTerms] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/placement-terms")
      .then(res => res.json())
      .then(data => setPlacementTerms(data))
      .catch(console.error);
  }, []);`;
    content = content.replace(
        /const \[activeTab, setActiveTab\] = useState<"all" \| "pipeline" \| "refunds" \| "placed">\("all"\);\s*const \[searchTerm, setSearchTerm\] = useState\(""\);\s*const \[statusFilter, setStatusFilter\] = useState\("all"\);/,
        state_block
    );
}

// 3. Replace handleRegisterSubmit
const old_submit = `  const handleRegisterSubmit = () => {
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

    const newId = \`PLA\${Math.floor(100 + Math.random() * 900)}\`;
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
        \`Registration recorded and Registration Fee (AED \${registerForm.registrationFee}) paid on \${formatDate(registerForm.registrationDate)} by \${currentUser.name}.\`,
        \`Terms & Conditions accepted and signed by Applicant.\`,
        wizardSignatures.company ? \`Counter-signed by Company Officer.\` : \`Pending Counter-signature.\`
      ]
    };

    addPlacement(newRecord);
    toast.success("Applicant registered and payment agreement executed!");
    setRegisterModal(false);
    resetRegisterForm();
  };`;

const new_submit = `  const handleRegisterSubmit = async () => {
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

    const newId = \`PLA\${Math.floor(100 + Math.random() * 900)}\`;
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
        \`Registration recorded and Registration Fee (AED \${registerForm.registrationFee}) paid on \${formatDate(registerForm.registrationDate)} by \${currentUser.name}.\`,
        \`Terms & Conditions accepted and signed by Applicant (IP: \${ip}).\`,
        wizardSignatures.company ? \`Counter-signed by Company Officer.\` : \`Pending Counter-signature.\`
      ]
    };

    addPlacement(newRecord);
    toast.success("Applicant registered and payment agreement executed!");
    setRegisterModal(false);
    resetRegisterForm();
  };`;

content = content.replace(old_submit, new_submit);

// 4. Remove printAgreement and update button calls
const print_func_start = '  const printAgreement = (p: Placement) => {';
if (content.includes(print_func_start)) {
    const start_idx = content.indexOf(print_func_start);
    const end_str = '  // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------';
    const end_idx = content.indexOf(end_str, start_idx);
    
    if (start_idx !== -1 && end_idx !== -1) {
        content = content.substring(0, start_idx) + content.substring(end_idx);
    }
}

// 5. Replace button onClick
content = content.replaceAll('onClick={() => printAgreement(agreementModal)}', 'onClick={() => window.print()}');

// 6. Add PrintableAgreement component
if (!content.includes('<PrintableAgreement')) {
    content = content.replace(
        '    </div>\n  );\n}',
        '      {agreementModal && <PrintableAgreement placement={agreementModal} terms={placementTerms} />}\n    </div>\n  );\n}'
    );
}

// Also need to hide the main application container when printing!
// Let's wrap the main layout elements with a container that has "print:hidden"
if (!content.includes('className="flex flex-col h-full print:hidden"')) {
    content = content.replace(
        '<div className="flex flex-col h-full pb-24 md:pb-12 bg-slate-50/50">',
        '<div className="flex flex-col h-full pb-24 md:pb-12 bg-slate-50/50 print:hidden">'
    );
}


fs.writeFileSync('app/placement/page.tsx', content, 'utf8');
console.log("Patched app/placement/page.tsx");
