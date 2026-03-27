import clsx from "clsx";

type PanelProps = {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
};

export function Panel({ title, eyebrow, children, className }: PanelProps) {
  return (
    <section className={clsx("rounded-[1.5rem] border border-[var(--forge-border)] bg-white p-5", className)}>
      {eyebrow ? <div className="text-xs uppercase tracking-[0.24em] text-[var(--forge-muted)]">{eyebrow}</div> : null}
      {title ? (
        <div className="mt-2 font-[family-name:var(--font-serif)] text-3xl tracking-[-0.05em] text-[var(--forge-ink)]">{title}</div>
      ) : null}
      <div className={title || eyebrow ? "mt-5" : undefined}>{children}</div>
    </section>
  );
}
