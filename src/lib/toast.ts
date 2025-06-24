import { toast } from "sonner";

export const showToast = {
  loading: (message: string, options?: { id?: string }) => {
    return toast.loading(message, options);
  },

  success: (message: string, options?: { id?: string }) => {
    return toast.success(message, options);
  },

  error: (message: string, options?: { id?: string }) => {
    return toast.error(message, options);
  },

  info: (message: string, options?: { id?: string }) => {
    return toast.info(message, options);
  },

  dismiss: (toastId?: string | number) => {
    toast.dismiss(toastId);
  },

  // Helper for updating an existing toast
  update: (toastId: string | number, message: string, type: 'success' | 'error' | 'info') => {
    switch (type) {
      case 'success':
        toast.success(message, { id: toastId });
        break;
      case 'error':
        toast.error(message, { id: toastId });
        break;
      case 'info':
        toast.info(message, { id: toastId });
        break;
    }
  },
};

// Predefined toast messages for common operations
export const toastMessages = {
  deleting: "Deleting item...",
  saving: "Saving changes...",
  creating: "Creating item...",
  deleted: "Item deleted successfully",
  saved: "Changes saved successfully",
  created: "Item created successfully",
  deleteError: "Failed to delete item",
  saveError: "Failed to save changes",
  createError: "Failed to create item",
};
