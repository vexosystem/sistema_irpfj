export type Client = {
  id: string;
  fullName: string;
  cpf: string;
  cpfDigits: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  isActive: boolean;
  notesGeneral: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy: string;
  updatedBy: string;
};

export type ClientFormValues = {
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  isActive: boolean;
  notesGeneral: string;
};
