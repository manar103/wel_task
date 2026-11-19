import { useEffect, useRef, useState } from "react";
import { ApiError, DEMO_OTP, verifyEmail } from "../lib/mockApi";
import { Alert } from "./ui/Alert";
import { Button } from "./ui/Button";
import { OTP_LENGTH, OtpInput, type OtpInputHandle } from "./ui/OtpInput";
import { ViewHeader } from "./ViewHeader";

type OtpFormProps = {
  email: string;
  focusHeading: boolean;
  onVerified: (email: string) => void;
  onBack: () => void;
};

type Status = "idle" | "loading" | "verified";

const ERROR_ID = "otp-error";
const SUCCESS_DELAY_MS = 1500;
const GENERIC_ERROR = "Something went wrong. Please try again.";

const emptyCode = () => Array.from({ length: OTP_LENGTH }, () => "");

export function OtpForm({ email, focusHeading, onVerified, onBack }: OtpFormProps) {
  const [digits, setDigits] = useState<string[]>(emptyCode);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const otpRef = useRef<OtpInputHandle>(null);

  const isComplete = digits.every((digit) => digit !== "");

  // After a short success message, continue to Login with the email prefilled.
  useEffect(() => {
    if (status !== "verified") return;
    const timer = window.setTimeout(() => onVerified(email), SUCCESS_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [status, email, onVerified]);

  // No auto-submit on the 6th digit: in FreeAuth every wrong code counts toward the
  // 5-attempt lockout, so the user gets a moment to check the code before sending it.
  async function submit() {
    if (!isComplete || status !== "idle") return;
    setError(null);
    setStatus("loading");
    try {
      await verifyEmail(email, digits.join(""));
      setStatus("verified");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof ApiError ? err.message : GENERIC_ERROR);
      setDigits(emptyCode());
      otpRef.current?.focus(0);
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <ViewHeader
        title="Check your email"
        description={
          <>
            We sent a 6-digit code to <span className="font-medium break-all text-ink">{email}</span>. Enter it below to
            verify your account.
          </>
        }
        autoFocus={focusHeading}
      />

      {/* Kept on the page so the success message is announced when it appears. */}
      <div aria-live="polite">
        {status === "verified" && (
          <Alert tone="success" announce={false}>
            Email verified. Taking you to sign in…
          </Alert>
        )}
      </div>

      {status !== "verified" && (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-3">
            <OtpInput
              ref={otpRef}
              legend="Verification code"
              value={digits}
              onChange={setDigits}
              invalid={error !== null}
              describedBy={error ? ERROR_ID : undefined}
            />
            <p className="text-center text-sm text-muted">
              Demo code: <span className="font-medium text-ink tabular-nums">{DEMO_OTP}</span>
            </p>
          </div>

          {error && (
            <Alert tone="error" id={ERROR_ID}>
              {error}
            </Alert>
          )}

          <Button type="submit" disabled={!isComplete} loading={status === "loading"} loadingText="Verifying…">
            Verify email
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted">
        <Button variant="link" onClick={onBack}>
          Back to sign in
        </Button>
      </p>
    </div>
  );
}
