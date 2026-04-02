export type ClientDocument = {
  id: string;
  name: string;
  storagePath: string;
  contentType: string;
  size: number;
  uploadedAt?: string;
  uploadedBy: string;
  category: string;
};
