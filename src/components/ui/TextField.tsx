import type { ComponentProps, ReactNode } from "react";
import { AlertIcon } from "./icons";

export type TextFieldProps = Omit<ComponentProps<"input">, "id" | "className"> & {
  id: string;
  label: string;
  error?: string;
  /** Extra ids for aria-describedby, e.g. the password rules list. */
  describedBy?: string;
  /** Content placed inside the input on the right (the show/hide button). */
  trailing?: ReactNode;
  /** Content shown under the input (the strength indicator). */
  children?: ReactNode;
};

export function TextField({ id, label, error, describedBy, trailing, children, ...inputProps }: TextFieldProps) {
  const errorId = `${id}-error`;
  const describedByIds =
    [error ? errorId : undefined, describedBy].filter((value): value is string => Boolean(value)).join(" ") ||
    undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          {...inputProps}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedByIds}
          className={`h-11 w-full rounded-control border bg-surface px-3 text-base text-ink motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            error ? "border-danger" : "border-mauve hover:border-primary"
          } ${trailing ? "pr-12" : ""}`}
        />
        {trailing && <div className="absolute inset-y-0 right-0.5 flex items-center">{trailing}</div>}
      </div>
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-sm text-danger">
          <AlertIcon className="mt-px size-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}
      {children}
    </div>
  );
}
