import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "./icons";
import { TextField, type TextFieldProps } from "./TextField";

type PasswordFieldProps = Omit<TextFieldProps, "type" | "trailing">;

export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      trailing={
        // A toggle button: the name stays "Show password" and aria-pressed carries
        // the state, so a screen reader says "Show password, toggle button, pressed".
        <button
          type="button"
          aria-pressed={visible}
          aria-label="Show password"
          aria-controls={props.id}
          onClick={() => setVisible((value) => !value)}
          className="grid size-10 cursor-pointer place-items-center rounded-control text-muted hover:text-primary motion-safe:transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}
