import clsx from "clsx";

type PanelProps = {
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
};

export function Panel({ title, eyebrow, children, className }: PanelProps) {
  return (
    <section className={clsx("rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl", className)}>
      {eyebrow ? <div className="text-xs uppercase tracking-[0.24em] text-white/36">{eyebrow}</div> : null}
      {title ? (
        <div className="mt-2 font-[family-name:var(--font-serif)] text-3xl tracking-[-0.05em] text-white">{title}</div>
      ) : null}
      <div className={title || eyebrow ? "mt-5" : undefined}>{children}</div>
    </section>
  );
}
