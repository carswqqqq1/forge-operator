type ForgeLogoProps = {
  compact?: boolean;
};

export function ForgeLogo({ compact = false }: ForgeLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--forge-border)] bg-white">
        <svg viewBox="0 0 48 48" className="h-5 w-5 text-[var(--forge-ink)]" fill="none" aria-hidden="true">
          <path
            d="M22 11c5.7 0 10 3.8 10 9.3 0 5.3-3.2 8.7-7.8 8.7h-1.6l2.6 5.7c.3.8-.2 1.3-.9 1.3h-2.1c-.5 0-.9-.2-1.1-.7l-2.9-6.3c-3.4-.9-5.7-3.8-5.7-8.1 0-6.2 4.4-10 9.5-10Zm0 3.5c-3.2 0-5.6 2.4-5.6 6.3 0 3.8 2.3 6.1 5.6 6.1 3.4 0 5.7-2.4 5.7-6.2 0-3.8-2.3-6.2-5.7-6.2Zm11.8-3.2c.8 0 1.3.5 1.3 1.3v2.1h2.1c.8 0 1.3.5 1.3 1.3v.7c0 .8-.5 1.3-1.3 1.3h-2.1v2.1c0 .8-.5 1.3-1.3 1.3h-.7c-.8 0-1.3-.5-1.3-1.3V18h-2.1c-.8 0-1.3-.5-1.3-1.3V16c0-.8.5-1.3 1.3-1.3h2.1v-2.1c0-.8.5-1.3 1.3-1.3h.7Z"
            fill="currentColor"
          />
        </svg>
      </div>
      {!compact ? (
        <div className="flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-serif)] text-[1.7rem] tracking-[-0.04em] text-[var(--forge-ink)]">forge</span>
          <span className="hidden text-[0.72rem] uppercase tracking-[0.35em] text-[var(--forge-muted)] sm:block">operator</span>
        </div>
      ) : null}
    </div>
  );
}
