import { PermitWizardWithPreview } from "@/components/catering-permit/permit-wizard-preview";

export const metadata = {
  title: "TEST — Permit Wizard with PDF Preview",
};

export default function TestPermitPreviewPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PermitWizardWithPreview />
    </div>
  );
}
