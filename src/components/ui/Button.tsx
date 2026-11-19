import type { ComponentProps } from "react";
import { SpinnerIcon } from "./icons";

type ButtonProps = Omit<ComponentProps<"button">, "className"> & {
  variant?: "primary" | "link";
  /** Disables the button, shows a spinner and swaps the text for `loadingText`. */
  loading?: boolean;
  loadingText?: string;
};

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function Button({
  variant = "primary",
  loading = false,
  loadingText,
  disabled,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  if (variant === "link") {
    return (
      <button
        type={type}
        disabled={disabled}
        className={`${focusRing} cursor-pointer rounded-sm font-semibold text-primary underline decoration-1 underline-offset-4 hover:decoration-2 disabled:cursor-not-allowed`}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${focusRing} inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-control bg-primary px-4 font-semibold text-on-primary hover:bg-ink motion-safe:transition-colors ${
        loading ? "cursor-wait" : "disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:bg-primary"
      }`}
      {...props}
    >
      {loading ? (
        <>
          <SpinnerIcon className="size-4 motion-safe:animate-spin" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
