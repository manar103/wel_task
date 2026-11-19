import { useEffect, useRef, type ReactNode } from "react";

type ViewHeaderProps = {
  title: string;
  description?: ReactNode;
  /**
   * Move focus to the heading when it appears. Used when the view changes, so keyboard
   * and screen reader users land at the top of the new view and hear its title.
   */
  autoFocus: boolean;
};

export function ViewHeader({ title, description, autoFocus }: ViewHeaderProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (autoFocus) headingRef.current?.focus();
  }, [autoFocus]);

  return (
    <header className="flex flex-col gap-2">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="rounded-sm text-[1.75rem] leading-tight font-light tracking-tight text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      >
        {title}
      </h1>
      {description && <p className="text-[0.9375rem] leading-relaxed text-muted">{description}</p>}
    </header>
  );
}
