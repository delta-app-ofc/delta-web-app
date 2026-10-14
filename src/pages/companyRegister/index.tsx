import type { CompanyRegisterStep } from "../../types/companyRegister";
import { CompanyRegisterForm } from "../../components/CompanyRegisterForm";
import { RegisterLayout } from "../../components/RegisterLayout";

interface CompanyRegisterPageProps {
  step: CompanyRegisterStep;
}

export function CompanyRegisterPage({ step }: CompanyRegisterPageProps) {
  return (
    <RegisterLayout>
      <CompanyRegisterForm step={step} />
    </RegisterLayout>
  );
}
