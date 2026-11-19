/**
 * The single source of truth for password rules.
 *
 * These mirror FreeAuth's backend `passwordSchema` (controllers/auth/authValidation.js):
 * 8 to 100 characters, at least one uppercase, one lowercase, one digit and one
 * special character (`[^A-Za-z0-9]`). The Register validation and the strength
 * indicator both read from this list, so they can never disagree.
 */

export type PasswordRuleId = "length" | "upper" | "lower" | "digit" | "symbol";

export type PasswordRule = {
  id: PasswordRuleId;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;

export const passwordRules: readonly PasswordRule[] = [
  {
    id: "length",
    label: `${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters`,
    test: (p) => p.length >= PASSWORD_MIN_LENGTH && p.length <= PASSWORD_MAX_LENGTH,
  },
  { id: "upper", label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "digit", label: "A number", test: (p) => /[0-9]/.test(p) },
  { id: "symbol", label: "A special character (like ! or #)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export type StrengthLabel = "Weak" | "Fair" | "Good" | "Strong";

export type PasswordStrength = {
  passed: number;
  total: number;
  label: StrengthLabel;
};

/**
 * Strength = how many backend rules pass. This is a rules checklist, not an
 * entropy estimate: "Strong" means "the server will accept it".
 */
export function getPasswordStrength(password: string): PasswordStrength {
  const passed = passwordRules.filter((rule) => rule.test(password)).length;
  const total = passwordRules.length;

  let label: StrengthLabel = "Weak";
  if (passed === total) label = "Strong";
  else if (passed === total - 1) label = "Good";
  else if (passed >= 3) label = "Fair";

  return { passed, total, label };
}

/** The rules a password still fails, in list order. */
export function failedPasswordRules(password: string): PasswordRule[] {
  return passwordRules.filter((rule) => !rule.test(password));
}
