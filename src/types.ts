/**
 * The three views of the auth card. The OTP view always carries an email,
 * so the type system makes "OTP screen without an email" impossible.
 */
export type AuthView =
  | { name: "login"; email?: string }
  | { name: "register" }
  | { name: "otp"; email: string };

/** One field-level error, the same shape as FreeAuth's `errors[]` items. */
export type FieldError = { field: string; message: string };
