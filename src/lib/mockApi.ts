/**
 * A mock of three FreeAuth endpoints, kept in memory and delayed with setTimeout.
 * Messages and status codes match the real API (see FreeAuth's backend reference, §4).
 *
 * About tokens: the real API never sends tokens in the response body. On register and
 * login it sets `accessToken` and `refreshToken` as httpOnly cookies, and JavaScript
 * in the page cannot read httpOnly cookies. So the UI must not expect or store a token:
 * it only looks at the status and the message. That is why these functions return
 * no tokens at all.
 */
import type { FieldError } from "../types";

export class ApiError extends Error {
  readonly status: number;
  readonly errors?: FieldError[];

  constructor(status: number, message: string, errors?: FieldError[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

export type ApiSuccess = { message: string };

type MockUser = {
  /** Plain text only because this is a demo. The real backend stores a bcrypt hash. */
  password: string;
  isVerified: boolean;
  otpAttempts: number;
  /** Epoch ms. While this is in the future, every OTP attempt gets 429. */
  lockedUntil: number | null;
};

export const DEMO_OTP = "123456";

const NETWORK_DELAY_MS = 900;
const MAX_OTP_ATTEMPTS = 5;
const OTP_LOCKOUT_MS = 15 * 60 * 1000;
const EMAIL_MAX_LENGTH = 100;

// Keyed by email exactly as sent. Like the real backend, emails are not lowercased,
// so "Ada@example.com" and "ada@example.com" are different accounts.
const users = new Map<string, MockUser>([
  ["ada@example.com", { password: "Str0ng!Pass", isVerified: true, otpAttempts: 0, lockedUntil: null }],
]);

function networkDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, NETWORK_DELAY_MS));
}

/**
 * The one server-side validation error this mock simulates: the real `registerSchema`
 * and `loginSchema` cap emails at 100 characters, and the client only checks the
 * email's shape. A longer email reaches the "server" and comes back as a 422 with
 * `errors[]`, the same envelope Zod failures use in FreeAuth.
 */
function assertEmailLength(email: string): void {
  if (email.length > EMAIL_MAX_LENGTH) {
    throw new ApiError(422, "Validation failed", [
      { field: "email", message: `Email must be at most ${EMAIL_MAX_LENGTH} characters` },
    ]);
  }
}

/** POST /api/auth/register */
export async function register(email: string, password: string): Promise<ApiSuccess> {
  await networkDelay();
  assertEmailLength(email);

  if (users.has(email)) {
    throw new ApiError(409, "Email already in use");
  }

  users.set(email, { password, isVerified: false, otpAttempts: 0, lockedUntil: null });
  return { message: "User registered successfully" };
}

/** POST /api/auth/verify-email */
export async function verifyEmail(email: string, otp: string): Promise<ApiSuccess> {
  await networkDelay();
  const user = users.get(email);

  // Unknown or already-verified accounts have no pending code, so any code is "invalid".
  if (!user || user.isVerified) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  if (user.lockedUntil !== null && user.lockedUntil > Date.now()) {
    throw new ApiError(429, "Too many attempts, try again later");
  }

  if (otp !== DEMO_OTP) {
    user.otpAttempts += 1;
    if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
      // Lock the flow and reset the counter, so after the lock ends there are 5 fresh tries.
      user.lockedUntil = Date.now() + OTP_LOCKOUT_MS;
      user.otpAttempts = 0;
      throw new ApiError(429, "Too many attempts, try again later");
    }
    throw new ApiError(400, "Invalid or expired OTP");
  }

  user.isVerified = true;
  user.otpAttempts = 0;
  user.lockedUntil = null;
  return { message: "Email verified successfully" };
}

/** POST /api/auth/login */
export async function login(email: string, password: string): Promise<ApiSuccess> {
  await networkDelay();
  assertEmailLength(email);
  const user = users.get(email);

  // Same message for "no such email" and "wrong password", so the response
  // can't be used to find out which emails have accounts.
  if (!user || user.password !== password) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.isVerified) {
    throw new ApiError(403, "Please verify your email before logging in");
  }

  return { message: "Login successful" };
}
