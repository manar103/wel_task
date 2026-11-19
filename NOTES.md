# NOTES (working log for "Decisions & notes")

Raw log of every decision made while building, with the reason, plus things that were tried and changed. It is source material for the README's "Decisions & notes" section, which Manar writes herself. AI tool used: Claude (Opus), working from a written prompt plus FreeAuth's task PDF, onboarding guide, `backend.md` and `freeauth-architecture.md`.

---

## 1. Differences found between the prompt and the real FreeAuth backend

I read the backend docs before planning and found these. Manar decided how to handle each one (marked **Decision**).

1. **Register needs `name` in the real API.** `registerSchema` requires `name` (2–50 chars, letters and spaces only). The prompt has `register(email, password)`.
   **Decision:** follow the prompt (no name field) and log the difference here.
2. **OTP lockout timing.** The prompt says "after 5 wrong tries, 429". In `backend.md` §5, a wrong code increments the counter and returns **400**, and reaching 5 sets the lock. The architecture doc's §10 table also says "400 OTP attempts exhausted (→ lockout)". So in the real backend the 5th wrong try likely returns **400** and the **next** try returns **429**. The two docs aren't fully explicit, so this is a reading, not a certainty.
   **Decision:** follow the prompt. In the mock, the 5th wrong try returns 429 and locks for 15 minutes.
3. **No mock function returned `errors[]`**, so the "show the API error under the field" requirement could never be exercised.
   **Decision:** make the mock return a 422 with `errors[]` in one case. I picked a real backend rule that the client doesn't check: emails are capped at 100 characters in `registerSchema` and `loginSchema`, while the client only checks the email's shape. A 101+ character email reaches the "server" and comes back as `422 Validation failed` with `errors: [{ field: "email", message: "Email must be at most 100 characters" }]`. Unsure: the exact Zod message text the real backend uses for this rule isn't in the docs, so that message is my wording.
4. **Email normalization.** The backend does not trim or lowercase emails (listed as Known Security Concern #7). The UI trims (the prompt asks for it), but the mock stores emails exactly as sent, so `Ada@example.com` and `ada@example.com` are different accounts, like the real backend. Not raised as a question; flagged here.
5. **`resend-otp` exists in the real API** but isn't in the task or prompt. Not added (stay in scope). Side effect: in the real backend an OTP expires after 10 minutes, so a real user who comes back later through the 403 "Verify your email" button would need a resend. The mock's code never expires.
6. **Real register already sets session cookies before verification** (Known Security Concern #3). Not relevant to a mock without tokens, but worth knowing when writing "How auth works".

## 2. Setup decisions

- **Scaffold:** `npm create vite@latest -- --template react-ts`. The current template ships Vite 8, TypeScript 7, React 19.
- **Removed `oxlint`** (and the `lint` script and `.oxlintrc.json`) that the template now includes. The rule is "the only dependencies are React, React DOM, TypeScript, Vite, Tailwind and @tailwindcss/vite". The `@types/*` packages and `@vitejs/plugin-react` stay because the template needs them to compile.
- **Added `"strict": true`** to both tsconfig files. The template didn't set it explicitly, and the prompt asks for strict TypeScript.
- **Tailwind and @tailwindcss/vite are devDependencies** (they're only used at build time).
- **`engines.node`: `^20.19.0 || >=22.12.0`**, copied from Vite 8's own requirement, so the README's Node version is accurate.
- **Template files removed:** `App.css`, `assets/`, `icons.svg`, the template README. The favicon was replaced with a small lock in the palette colors.
- **Reference docs moved out of the project folder.** The FreeAuth task PDF, onboarding guide, `backend.md` and `freeauth-architecture.md` were in the same folder at first. Manar moved them elsewhere, because they're internal FreeAuth documents and this repo is public. (Before that, they were listed in `.gitignore`. Those lines were removed after the move.)

## 3. Design decisions

- **Tokens exactly as given, plus three additions:**
  - `--color-*: initial;` first, which removes Tailwind's default palette. A component can then only use the project's tokens; a stray `bg-blue-500` simply wouldn't exist.
  - `--color-on-primary: #ffffff` for text on primary buttons (needed once the defaults are removed; `text-surface` would work but reads wrong).
  - `--radius-control` (10px, inputs and buttons) and `--radius-card` (20px): "one radius for inputs/buttons and one for the card", enforced by tokens.
  - `--shadow-card` so the card shadow isn't a raw value inside a component.
- **Hover on the primary button** uses `bg-ink` (darker), not a new token.
- **Rose** is used only for decoration: card border, the circle behind the lock, the empty segments of the strength bar. **Mauve** only for input borders. Neither is ever text.
- **Big text light (300), body 400–500, labels and buttons 600.** Inputs are 16px so iOS doesn't zoom on focus.
- **Strength bar has 5 segments**, one per rule. Fill color: Weak = danger, Fair = muted, Good = primary, Strong = success. The label is always text too.
- **Strength scale:** 0–2 rules Weak, 3 Fair, 4 Good, 5 Strong. It counts backend rules, so "Strong" means "the server will accept it", not a real entropy estimate (no zxcvbn, per the rules). Worth saying in the README.
- **Rules checklist is one column.** First try was two columns on desktop, but "A special character (like ! or #)" wrapped awkwardly in the screenshot, so I changed it.
- **Mobile sizing:** page padding 12px + card padding 20px leaves 296px at a 360px viewport. The OTP boxes are `flex-1` with `max-w-12`, so they come out 44px on mobile and 48px on desktop (measured in the browser).
- **Motion:** the spinner uses `motion-safe:animate-spin`, color transitions use `motion-safe:transition-colors`, and there's a global `prefers-reduced-motion` rule as a backstop.

## 4. Behavior decisions

- **When errors show:** not while typing. They show after leaving a field that has something in it (blur), or after the first submit attempt, then update live. **Choice:** tabbing through an *empty* field does not show "Enter your email address"; that one waits for submit. Showing it on every tab-through felt noisy.
- **Email is trimmed on blur** (the field value itself), and again before sending.
- **Server field errors** (from `errors[]`) show under their field and win over client errors until that field is edited.
- **Weak password message** lists exactly what is missing, e.g. "Your password needs a number and a special character (like ! or #)", built from the same rule labels as the checklist.
- **Login success** is a state inside `LoginForm` ("You're signed in" + the email), not a fourth `AuthView`. The prompt gave the exact union, so I kept it. Added a "Back to sign in" link so the user isn't stuck on that screen.
- **OTP "way back"** goes to Login with the email prefilled. Going back to Register would be confusing because the account already exists (re-registering would give 409).
- **OTP success:** shows "Email verified. Taking you to sign in…" for 1.5 seconds, then opens Login with the email prefilled. The message sits in an `aria-live` region that is always on the page, because a `role="status"` element that is added and filled at the same moment is not announced reliably.
- **Focus on view change** goes to the new view's `<h1 tabIndex={-1}>`. It does not happen on first page load, only after the user navigates.
- **A "Demo code: 123456" line is on the OTP screen** so a reviewer can complete the flow without opening the README. Easy to remove if it counts as extra.
- **OTP inputs are not disabled during the request.** First version disabled the fieldset while loading. Then focusing the first box after a wrong code ran while the inputs were still disabled, so focus was lost. The submit button is disabled and `submit()` ignores calls while loading, so there's still no double submit.

## 5. OTP input details

- No `maxLength`. A `maxLength={1}` would block mobile autofill from putting the whole code into the first box.
- `onChange` cases: empty value → clear the box; only non-digits → ignore (React restores the old value); one digit → set it and move on; two digits in a box that already had one → keep the new digit (happens when the caret wasn't selecting the old digit); more digits → treat as paste (autofill).
- Paste: strip non-digits, take up to 6, fill from the first box, clear the rest, focus the last filled box.
- Focus moves *after* React renders the new digits (a `useLayoutEffect` with a pending index), so the box we land on is selected with its new content.
- Enter submits only when all 6 are filled: the submit button is disabled otherwise, and a form with a disabled submit button doesn't submit implicitly.
- On a wrong code: error shown in `role="alert"`, boxes cleared, first box focused, boxes get `aria-invalid`.

## 6. Accessibility choice that differs from the prompt's wording

- **Show/hide password button.** The prompt asks for `aria-pressed` **and** a label that switches between "Show password" and "Hide password". Doing both makes a screen reader say "Hide password, toggle button, pressed", which is a double negative. The usual pattern is: a toggle button keeps one fixed name and `aria-pressed` carries the state. **Choice:** fixed label "Show password" + `aria-pressed`. If Manar prefers the prompt's version, it's a one-line change in `PasswordField.tsx` (swap the label and drop `aria-pressed`, or keep both).

## 7. How it was checked

- `npm run build` (tsc -b + vite build): passes, no type errors. No `any` anywhere (`grep`). No raw hex values in components.
- A Playwright script (kept out of the repo, since the rules say no test frameworks) drove the app in Chrome using the keyboard: 61 checks, all passing. It covers: Tab order; error timing; aria-invalid/aria-describedby; show/hide toggle with Space and Enter; focus on the first invalid field; loading text, aria-busy, disabled button and no double submit; 401; 422 under the email field; seeded login and the signed-in state; heading focus on every view change; strength labels; "Passwords don't match"; 409; register → OTP; OTP typing with a letter in between; backspace on an empty box; backspace on a filled box; arrow keys; paste of `12-34-56`; multi-digit onChange (autofill simulation); wrong code (cleared + first box focused); partial paste; Enter on an incomplete code; `123456` → success → Login with prefilled email; 403 → "Verify your email" → OTP; five wrong codes (4× 400 then 429); right code while locked still 429; no console errors.
- Screenshots at 360×780 and 1280×900 for every view: no horizontal scroll at either width.

## 8. Not checked / unsure

- **Real phones were not tested.** Mobile one-time-code autofill was only simulated (a multi-digit input event). Android keyboards often send Backspace as key "Unidentified", so on an **empty** box Backspace may not move back there. On a filled box it still works through onChange.
- **No real screen reader was used** (NVDA/VoiceOver). ARIA was checked in code and in the DOM, not by listening.
- **Only Chrome** was used for the automated checks; Firefox and Safari were not.
- **A disabled button loses focus.** The prompt asks for `disabled` on the loading button. If the user clicked the button (not Enter in a field), focus drops to the page while loading. `aria-disabled` would keep focus but differs from the prompt, so I left it as `disabled`.
- Lockout detail from section 1, item 2 (400 vs 429 on the 5th try).
