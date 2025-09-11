import { toast, ToastOptions } from "react-hot-toast";

const baseOptions: ToastOptions = {
  duration: 4000,
  style: {
    background: "#333",
    color: "#fff",
    fontSize: "14px",
    borderRadius: "8px",
  },
};

const notify = {
  success: (message: string, options?: ToastOptions) =>
    toast.success(message, { ...baseOptions, ...options }),
  error: (message: string, options?: ToastOptions) =>
    toast.error(message, { ...baseOptions, ...options }),
  info: (message: string, options?: ToastOptions) =>
    toast(message, { ...baseOptions, ...options }),
};

export default notify;
