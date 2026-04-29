import { create } from "zustand";

export type AdminTableKey = "applications" | "clients" | "sales";

type RowSelectionState = Record<string, boolean>;

type AdminWorkflowUiState = {
  closeSalesDetail: () => void;
  rowSelections: Record<AdminTableKey, RowSelectionState>;
  salesDetailPaymentId: string | null;
  setRowSelection: (table: AdminTableKey, rowSelection: RowSelectionState) => void;
  openSalesDetail: (paymentId: string) => void;
};

const EMPTY_SELECTIONS: Record<AdminTableKey, RowSelectionState> = {
  applications: {},
  clients: {},
  sales: {},
};

export const useAdminWorkflowUiStore = create<AdminWorkflowUiState>((set) => ({
  closeSalesDetail: () => set({ salesDetailPaymentId: null }),
  openSalesDetail: (paymentId) => set({ salesDetailPaymentId: paymentId }),
  rowSelections: EMPTY_SELECTIONS,
  salesDetailPaymentId: null,
  setRowSelection: (table, rowSelection) =>
    set((state) => ({
      rowSelections: {
        ...state.rowSelections,
        [table]: rowSelection,
      },
    })),
}));
