export type AnnualRecordStatus =
  | "pendente"
  | "aguardando_documentos"
  | "em_andamento"
  | "finalizado";

export type TaxResultType = "a_pagar" | "a_restituir" | "sem_resultado";

export type AnnualRecord = {
  id: string;
  year: number;
  govLogin: string;
  driveLink?: string;
  govCredentialRef?: string;
  hasWithholding: boolean;
  withholdingNotes: string;
  taxResultType: TaxResultType;
  taxResultAmount: number;
  status: AnnualRecordStatus;
  servicePaid: boolean;
  servicePaidAmount: number;
  servicePaidAt?: string | null;
  observation: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy: string;
  updatedBy: string;
};

export type AnnualRecordFormValues = {
  year: number;
  govLogin: string;
  govPassword: string;
  updateGovPassword: boolean;
  driveLink?: string;
  hasWithholding: boolean;
  withholdingNotes: string;
  taxResultType: TaxResultType;
  taxResultAmount: number;
  status: AnnualRecordStatus;
  servicePaid: boolean;
  servicePaidAmount: number;
  observation: string;
};
