import { toast as sonnerToast } from "sonner";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  const toast = ({ title, description, variant }: ToastOptions) => {
    const message = description ? `${title}\n${description}` : title;

    if (variant === "destructive") {
      sonnerToast.error(message);
    } else {
      sonnerToast.success(message);
    }
  };

  return { toast };
}

export { sonnerToast as toast };
