import { create } from "zustand";
import { listClients } from "@/services/clients.service";
import { Client } from "@/types/client";

type ClientsStore = {
  clients: Client[];
  loading: boolean;
  fetchClients: () => Promise<void>;
};

export const useClientsStore = create<ClientsStore>((set) => ({
  clients: [],
  loading: false,
  fetchClients: async () => {
    set({ loading: true });
    const clients = await listClients();
    set({ clients, loading: false });
  },
}));
