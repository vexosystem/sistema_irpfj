import { create } from "zustand";
import { listClients } from "@/services/clients.service";
import { Client } from "@/types/client";

type ClientsStore = {
  clients: Client[];
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
};

export const useClientsStore = create<ClientsStore>((set) => ({
  clients: [],
  loading: false,
  error: null,
  fetchClients: async () => {
    set({ loading: true, error: null });

    try {
      const clients = await listClients();
      set({ clients, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Nao foi possivel listar os clientes.",
      });
    }
  },
}));
