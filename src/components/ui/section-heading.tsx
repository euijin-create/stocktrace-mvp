import type { ReactNode } from "react";

type SectionHeadingProps = {
  action?: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
  description?: ReactNode;
  eyebrow?: string;
  id?: string;
  title: ReactNode;
};

export function SectionHeading({
  action,
  as: Heading = "h2",
  className = "",
  description,
  eyebrow,
  id,
  title,
}: SectionHeadingProps) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.12em] text-action">
            {eyebrow}
          </p>
        ) : null}
        <Heading
          id={id}
          className="text-xl font-extrabold leading-tight tracking-[-0.035em] text-slate-950 sm:text-2xl"
        >
          {title}
        </Heading>
        {description ? (
          <div className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
