import { failedPasswordRules } from "./passwordRules";

/** A basic shape check: something@something.something, no spaces. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const listFormat = new Intl.ListFormat("en", { style: "long", type: "conjunction" });

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (email === "") return "Enter your email address";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address, like name@example.com";
  return undefined;
}

/**
 * Login only checks that a password was entered. This matches FreeAuth's
 * `loginSchema`: strength rules are not re-checked at login, so accounts created
 * under older rules keep working if the rules change later.
 */
export function validateLoginPassword(value: string): string | undefined {
  return value === "" ? "Enter your password" : undefined;
}

export function validateNewPassword(value: string): string | undefined {
  if (value === "") return "Create a password";
  const missing = failedPasswordRules(value);
  if (missing.length === 0) return undefined;
  const parts = missing.map((rule) => lowerFirst(rule.label));
  return `Your password needs ${listFormat.format(parts)}`;
}

export function validateConfirmPassword(password: string, confirm: string): string | undefined {
  if (confirm === "") return "Confirm your password";
  if (confirm !== password) return "Passwords don't match";
  return undefined;
}

function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}
