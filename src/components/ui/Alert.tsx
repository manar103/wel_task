import type { ReactNode } from "react";
import { AlertIcon, CheckCircleIcon } from "./icons";

type AlertProps = {
  tone: "error" | "success";
  children: ReactNode;
  id?: string;
  /** Optional button or link shown under the message. */
  action?: ReactNode;
  /**
   * Errors use role="alert", successes role="status". Set to false when the alert is
   * placed inside a live region that is already on the page, so it isn't announced twice.
   */
  announce?: boolean;
};

export function Alert({ tone, children, id, action, announce = true }: AlertProps) {
  const isError = tone === "error";
  const role = announce ? (isError ? "alert" : "status") : undefined;

  return (
    <div
      id={id}
      role={role}
      className={`flex gap-2.5 rounded-control border px-3.5 py-3 text-sm ${
        isError ? "border-danger/40 bg-danger/5 text-danger" : "border-success/40 bg-success/5 text-success"
      }`}
    >
      {isError ? (
        <AlertIcon className="mt-px size-5 shrink-0" />
      ) : (
        <CheckCircleIcon className="mt-px size-5 shrink-0" />
      )}
      <div className="flex flex-col items-start gap-2">
        <p className="font-medium">{children}</p>
        {action}
      </div>
    </div>
  );
}
