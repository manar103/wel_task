import { useState } from "react";
import { ApiError, login } from "../lib/mockApi";
import { useFormState } from "../lib/useFormState";
import { validateEmail, validateLoginPassword } from "../lib/validation";
import { Alert } from "./ui/Alert";
import { Button } from "./ui/Button";
import { CheckCircleIcon } from "./ui/icons";
import { PasswordField } from "./ui/PasswordField";
import { TextField } from "./ui/TextField";
import { ViewHeader } from "./ViewHeader";

type LoginFormProps = {
  initialEmail?: string;
  focusHeading: boolean;
  onGoToRegister: () => void;
  onVerifyEmail: (email: string) => void;
};

type LoginField = "email" | "password";

type FormError = {
  message: string;
  /** Set on 403: the account exists but its email isn't verified yet. */
  unverifiedEmail?: string;
};

const GENERIC_ERROR = "Something went wrong. Please try again.";

export function LoginForm({ initialEmail = "", focusHeading, onGoToRegister, onVerifyEmail }: LoginFormProps) {
  const form = useFormState<LoginField>({ email: initialEmail, password: "" }, (values) => ({
    email: validateEmail(values.email),
    password: validateLoginPassword(values.password),
  }));
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<FormError | null>(null);
  const [signedInAs, setSignedInAs] = useState<string | null>(null);
  const [returnedFromSuccess, setReturnedFromSuccess] = useState(false);

  async function submit() {
    if (loading) return;
    setFormError(null);
    if (!form.validateForSubmit()) return;

    const email = form.values.email.trim();
    setLoading(true);
    try {
      await login(email, form.values.password);
      setSignedInAs(email);
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setFormError({ message: GENERIC_ERROR });
      } else if (error.errors && form.applyServerErrors(error.errors)) {
        // Field errors are shown under their fields.
      } else {
        setFormError({
          message: error.message,
          unverifiedEmail: error.status === 403 ? email : undefined,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  if (signedInAs !== null) {
    return (
      <div className="flex flex-col gap-6">
        <span className="grid size-12 place-items-center rounded-full bg-success/10 text-success">
          <CheckCircleIcon className="size-6" />
        </span>
        <ViewHeader
          title="You're signed in"
          description={
            <>
              Welcome back. You're signed in as <span className="font-medium break-all text-ink">{signedInAs}</span>.
            </>
          }
          autoFocus
        />
        <div>
          <Button
            variant="link"
            onClick={() => {
              setSignedInAs(null);
              setReturnedFromSuccess(true);
            }}
          >
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <ViewHeader
        title="Welcome back"
        description="Sign in with your email and password."
        autoFocus={focusHeading || returnedFromSuccess}
      />

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        className="flex flex-col gap-5"
      >
        <TextField
          ref={form.inputRef("email")}
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={form.values.email}
          onChange={(event) => form.setValue("email", event.target.value)}
          onBlur={() => {
            form.setValue("email", form.values.email.trim());
            form.markTouched("email");
          }}
          error={form.errorFor("email")}
        />
        <PasswordField
          ref={form.inputRef("password")}
          id="login-password"
          label="Password"
          autoComplete="current-password"
          value={form.values.password}
          onChange={(event) => form.setValue("password", event.target.value)}
          onBlur={() => form.markTouched("password")}
          error={form.errorFor("password")}
        />

        {formError && (
          <Alert
            tone="error"
            action={
              formError.unverifiedEmail !== undefined ? (
                <Button variant="link" onClick={() => onVerifyEmail(formError.unverifiedEmail ?? "")}>
                  Verify your email
                </Button>
              ) : undefined
            }
          >
            {formError.message}
          </Alert>
        )}

        <Button type="submit" loading={loading} loadingText="Signing in…">
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        Don't have an account?{" "}
        <Button variant="link" onClick={onGoToRegister}>
          Create one
        </Button>
      </p>
    </div>
  );
}
