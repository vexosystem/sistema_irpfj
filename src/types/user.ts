export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: "owner";
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};
