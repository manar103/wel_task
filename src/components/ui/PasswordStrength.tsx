import { getPasswordStrength, passwordRules, type StrengthLabel } from "../../lib/passwordRules";
import { CheckIcon, CircleIcon } from "./icons";

type PasswordStrengthProps = {
  password: string;
  /** Id of the rules list, so the password input can point to it with aria-describedby. */
  rulesId: string;
};

const fillColor: Record<StrengthLabel, string> = {
  Weak: "bg-danger",
  Fair: "bg-muted",
  Good: "bg-primary",
  Strong: "bg-success",
};

export function PasswordStrength({ password, rulesId }: PasswordStrengthProps) {
  const { passed, total, label } = getPasswordStrength(password);
  const hasInput = password.length > 0;

  return (
    <div className="mt-1 flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {passwordRules.map((rule, index) => (
            <span
              key={rule.id}
              className={`h-1.5 flex-1 rounded-full motion-safe:transition-colors ${
                index < passed ? fillColor[label] : "bg-rose/50"
              }`}
            />
          ))}
        </div>
        {/* The label is text, not just color, and is announced politely when it changes. */}
        <p aria-live="polite" className="min-w-24 text-right text-sm text-muted">
          {hasInput && (
            <>
              <span className="sr-only">Password strength: </span>
              <span className="font-semibold text-ink">{label}</span>
              <span className="sr-only">
                , {passed} of {total} requirements met
              </span>
            </>
          )}
        </p>
      </div>

      <ul id={rulesId} aria-label="Password requirements" className="grid gap-1 text-sm">
        {passwordRules.map((rule) => {
          const met = rule.test(password);
          return (
            <li key={rule.id} className={`flex items-center gap-2 ${met ? "text-ink" : "text-muted"}`}>
              {met ? (
                <CheckIcon className="size-4 shrink-0 text-success" />
              ) : (
                <CircleIcon className="size-4 shrink-0" />
              )}
              <span>
                <span className="sr-only">{met ? "Done: " : "Missing: "}</span>
                {rule.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
