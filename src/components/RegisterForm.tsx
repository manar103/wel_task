import { useState } from "react";
import { ApiError, register } from "../lib/mockApi";
import { useFormState } from "../lib/useFormState";
import { validateConfirmPassword, validateEmail, validateNewPassword } from "../lib/validation";
import { Alert } from "./ui/Alert";
import { Button } from "./ui/Button";
import { PasswordField } from "./ui/PasswordField";
import { PasswordStrength } from "./ui/PasswordStrength";
import { TextField } from "./ui/TextField";
import { ViewHeader } from "./ViewHeader";

type RegisterFormProps = {
  focusHeading: boolean;
  onRegistered: (email: string) => void;
  onGoToLogin: () => void;
};

type RegisterField = "email" | "password" | "confirmPassword";

const GENERIC_ERROR = "Something went wrong. Please try again.";
const RULES_ID = "register-password-rules";

export function RegisterForm({ focusHeading, onRegistered, onGoToLogin }: RegisterFormProps) {
  const form = useFormState<RegisterField>({ email: "", password: "", confirmPassword: "" }, (values) => ({
    email: validateEmail(values.email),
    password: validateNewPassword(values.password),
    confirmPassword: validateConfirmPassword(values.password, values.confirmPassword),
  }));
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit() {
    if (loading) return;
    setFormError(null);
    if (!form.validateForSubmit()) return;

    const email = form.values.email.trim();
    setLoading(true);
    try {
      await register(email, form.values.password);
      onRegistered(email);
    } catch (error) {
      setLoading(false);
      if (!(error instanceof ApiError)) {
        setFormError(GENERIC_ERROR);
      } else if (!(error.errors && form.applyServerErrors(error.errors))) {
        setFormError(error.message);
      }
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <ViewHeader
        title="Create your account"
        description="Use your email and a strong password. We'll send you a code to confirm the email."
        autoFocus={focusHeading}
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
          id="register-email"
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
          id="register-password"
          label="Password"
          autoComplete="new-password"
          value={form.values.password}
          onChange={(event) => form.setValue("password", event.target.value)}
          onBlur={() => form.markTouched("password")}
          error={form.errorFor("password")}
          describedBy={RULES_ID}
        >
          <PasswordStrength password={form.values.password} rulesId={RULES_ID} />
        </PasswordField>
        <PasswordField
          ref={form.inputRef("confirmPassword")}
          id="register-confirm-password"
          label="Confirm password"
          autoComplete="new-password"
          value={form.values.confirmPassword}
          onChange={(event) => form.setValue("confirmPassword", event.target.value)}
          onBlur={() => form.markTouched("confirmPassword")}
          error={form.errorFor("confirmPassword")}
        />

        {formError && <Alert tone="error">{formError}</Alert>}

        <Button type="submit" loading={loading} loadingText="Creating account…">
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Button variant="link" onClick={onGoToLogin}>
          Sign in
        </Button>
      </p>
    </div>
  );
}
