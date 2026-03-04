import { PermitWizard } from "@/components/catering-permit/permit-wizard";

export const metadata = {
  title: "Catering Permit Assistant | Culinary Block",
  description:
    "Fill out your Santa Clara County catering permit application with our AI assistant. Supports English, Spanish, Chinese, and Vietnamese.",
};

export default function CateringPermitPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PermitWizard />
    </div>
  );
}
