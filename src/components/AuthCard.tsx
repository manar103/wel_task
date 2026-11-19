import { useState, type ReactNode } from "react";
import type { AuthView } from "../types";
import { LockIcon } from "./ui/icons";
import { LoginForm } from "./LoginForm";
import { OtpForm } from "./OtpForm";
import { RegisterForm } from "./RegisterForm";

export function AuthCard() {
  const [view, setView] = useState<AuthView>({ name: "login" });
  // Focus moves to the heading only after the user changes view, not on first load.
  const [hasNavigated, setHasNavigated] = useState(false);

  function goTo(next: AuthView) {
    setHasNavigated(true);
    setView(next);
  }

  let content: ReactNode;
  switch (view.name) {
    case "login":
      content = (
        <LoginForm
          key={`login-${view.email ?? ""}`}
          initialEmail={view.email}
          focusHeading={hasNavigated}
          onGoToRegister={() => goTo({ name: "register" })}
          onVerifyEmail={(email) => goTo({ name: "otp", email })}
        />
      );
      break;
    case "register":
      content = (
        <RegisterForm
          focusHeading={hasNavigated}
          onRegistered={(email) => goTo({ name: "otp", email })}
          onGoToLogin={() => goTo({ name: "login" })}
        />
      );
      break;
    case "otp":
      content = (
        <OtpForm
          email={view.email}
          focusHeading={hasNavigated}
          onVerified={(email) => goTo({ name: "login", email })}
          onBack={() => goTo({ name: "login", email: view.email })}
        />
      );
      break;
    default: {
      const unreachable: never = view;
      throw new Error(`Unknown view: ${JSON.stringify(unreachable)}`);
    }
  }

  return (
    <section
      aria-label="Account access"
      className="w-full max-w-md rounded-card border border-rose/60 bg-surface px-5 py-8 shadow-card sm:px-10 sm:py-10"
    >
      <div className="mb-8 flex items-center gap-2.5 text-sm font-medium text-muted">
        <span className="grid size-8 place-items-center rounded-full bg-rose/35 text-primary">
          <LockIcon className="size-4" />
        </span>
        FreeAuth
      </div>
      {content}
    </section>
  );
}
