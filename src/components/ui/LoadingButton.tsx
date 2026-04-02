import { ComponentPropsWithoutRef, forwardRef, ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type LoadingButtonProps = ComponentPropsWithoutRef<typeof Button> & {
  loading?: boolean;
  loadingText?: string;
  spinnerSize?: "sm" | "md" | "lg";
  children: ReactNode;
};

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(function LoadingButton(
  { children, disabled, loading = false, loadingText, spinnerSize = "sm", ...props },
  ref,
) {
  return (
    <Button aria-busy={loading} disabled={disabled || loading} ref={ref} {...props}>
      {loading ? <LoadingSpinner size={spinnerSize} /> : null}
      {loading ? loadingText ?? children : children}
    </Button>
  );
});
