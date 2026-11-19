import { useRef, useState } from "react";
import type { FieldError } from "../types";

export type FieldErrors<F extends string> = Partial<Record<F, string>>;

/**
 * Small form helper shared by Login and Register.
 *
 * Error timing: a field's error stays hidden while the user types their first
 * characters. It appears after the field is left with something in it (blur), or
 * after the first submit attempt, and from then on it updates live.
 * Errors from the server (`errors[]`) win over client errors until that field changes.
 */
export function useFormState<F extends string>(
  initialValues: Record<F, string>,
  validate: (values: Record<F, string>) => FieldErrors<F>,
) {
  const [values, setValues] = useState<Record<F, string>>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<F, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors<F>>({});
  const inputs = useRef<Partial<Record<F, HTMLInputElement | null>>>({});
  const fieldOrder = Object.keys(initialValues) as F[];

  const clientErrors = validate(values);

  function setValue(field: F, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }) as Record<F, string>);
    setServerErrors((prev) => {
      if (prev[field] === undefined) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  /** Call on blur. An empty field that the user only tabbed through is not marked. */
  function markTouched(field: F) {
    if (values[field] === "") return;
    setTouched((prev) => (prev[field] ? prev : { ...prev, [field]: true }));
  }

  function errorFor(field: F): string | undefined {
    const serverError = serverErrors[field];
    if (serverError !== undefined) return serverError;
    return touched[field] || submitAttempted ? clientErrors[field] : undefined;
  }

  function inputRef(field: F) {
    return (element: HTMLInputElement | null) => {
      inputs.current[field] = element;
    };
  }

  function focusField(field: F) {
    inputs.current[field]?.focus();
  }

  /** Returns true when the form is valid. Otherwise focuses the first invalid field. */
  function validateForSubmit(): boolean {
    setSubmitAttempted(true);
    const firstInvalid = fieldOrder.find((field) => clientErrors[field] !== undefined);
    if (firstInvalid === undefined) return true;
    focusField(firstInvalid);
    return false;
  }

  /**
   * Shows `errors[]` from the API under the matching fields and focuses the first one.
   * Returns false when none of the errors belong to a field of this form.
   */
  function applyServerErrors(errors: readonly FieldError[]): boolean {
    const mapped: FieldErrors<F> = {};
    for (const error of errors) {
      if (isField(error.field) && mapped[error.field] === undefined) {
        mapped[error.field] = error.message;
      }
    }
    const firstField = fieldOrder.find((field) => mapped[field] !== undefined);
    if (firstField === undefined) return false;
    setServerErrors(mapped);
    focusField(firstField);
    return true;
  }

  function isField(name: string): name is F {
    return (fieldOrder as string[]).includes(name);
  }

  return { values, setValue, markTouched, errorFor, inputRef, validateForSubmit, applyServerErrors };
}
