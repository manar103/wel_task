import {
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
  type Ref,
} from "react";

export const OTP_LENGTH = 6;

export type OtpInputHandle = {
  /** Focus a box (default: the first one). */
  focus: (index?: number) => void;
};

type OtpInputProps = {
  /** One entry per box: a single digit or "". */
  value: readonly string[];
  onChange: (next: string[]) => void;
  /** Visually hidden legend for the fieldset, e.g. "Verification code". */
  legend: string;
  invalid?: boolean;
  /** Id of the error message, linked with aria-describedby. */
  describedBy?: string;
  ref?: Ref<OtpInputHandle>;
};

const onlyDigits = (text: string) => text.replace(/\D/g, "");

export function OtpInput({ value, onChange, legend, invalid = false, describedBy, ref }: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  // When a change moves focus, we wait for React to render the new digits first,
  // so the box we land on is selected with its new content.
  const pendingFocus = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (pendingFocus.current === null) return;
    const box = inputs.current[pendingFocus.current];
    pendingFocus.current = null;
    box?.focus();
    box?.select();
  });

  function focusBox(index: number) {
    inputs.current[clamp(index)]?.focus();
  }

  function focusAfterRender(index: number) {
    pendingFocus.current = clamp(index);
  }

  useImperativeHandle(ref, () => ({ focus: (index = 0) => focusBox(index) }), []);

  function setDigit(index: number, digit: string) {
    const next = [...value];
    next[index] = digit;
    onChange(next);
  }

  /** Paste and autofill both land here: fill from the first box, focus the last filled one. */
  function fillFromStart(digits: string) {
    const code = digits.slice(0, OTP_LENGTH).split("");
    onChange(Array.from({ length: OTP_LENGTH }, (_, i) => code[i] ?? ""));
    focusAfterRender(code.length - 1);
  }

  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    const digits = onlyDigits(raw);
    const current = value[index] ?? "";

    if (raw === "") {
      // The digit was removed some other way (cut, Delete, a mobile keyboard's backspace).
      setDigit(index, "");
      return;
    }
    // A letter or symbol: ignore it. React puts the old value back in the box.
    if (digits === "") return;

    if (digits.length === 1) {
      setDigit(index, digits);
      if (index < OTP_LENGTH - 1) focusAfterRender(index + 1);
      return;
    }

    // Two digits in a box that already had one: the caret wasn't selecting the old
    // digit, so the user typed next to it. Keep only the new digit.
    if (digits.length === 2 && current !== "") {
      setDigit(index, digits[0] === current ? digits[1] : digits[0]);
      if (index < OTP_LENGTH - 1) focusAfterRender(index + 1);
      return;
    }

    // Several digits through onChange without a paste event: mobile one-time-code
    // autofill does this. Treat it exactly like a paste.
    fillFromStart(digits);
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const digits = onlyDigits(event.clipboardData.getData("text"));
    if (digits !== "") fillFromStart(digits);
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "Backspace": {
        event.preventDefault();
        if (value[index]) {
          // Clear this box and stay.
          setDigit(index, "");
        } else if (index > 0) {
          // Empty box: go back one and clear that one.
          setDigit(index - 1, "");
          focusAfterRender(index - 1);
        }
        break;
      }
      case "ArrowLeft":
        event.preventDefault();
        focusBox(index - 1);
        break;
      case "ArrowRight":
        event.preventDefault();
        focusBox(index + 1);
        break;
    }
  }

  return (
    <fieldset aria-describedby={describedBy} className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div className="flex justify-center gap-1.5 sm:gap-2.5">
        {Array.from({ length: OTP_LENGTH }, (_, index) => (
          <input
            key={index}
            ref={(element) => {
              inputs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
            aria-invalid={invalid || undefined}
            value={value[index] ?? ""}
            onChange={(event) => handleChange(index, event)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            onFocus={(event) => event.target.select()}
            className={`h-14 w-full min-w-0 max-w-12 flex-1 rounded-control border bg-surface text-center text-xl font-medium text-ink tabular-nums caret-primary motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              invalid ? "border-danger" : value[index] ? "border-primary" : "border-mauve hover:border-primary"
            }`}
          />
        ))}
      </div>
    </fieldset>
  );
}

function clamp(index: number): number {
  return Math.max(0, Math.min(OTP_LENGTH - 1, index));
}
