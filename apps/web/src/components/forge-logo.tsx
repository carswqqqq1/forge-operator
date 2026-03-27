type ForgeLogoProps = {
  compact?: boolean;
};

export function ForgeLogo({ compact = false }: ForgeLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-white/12 bg-[linear-gradient(145deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_18px_40px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(198,255,77,0.25),transparent_40%)]" />
        <svg viewBox="0 0 48 48" className="relative h-5 w-5 text-[#d3ff63]" fill="none" aria-hidden="true">
          <path d="M33 10H18l-5 5v23h7V26h11v-6H20v-4h13V10Z" fill="currentColor" />
          <path d="M29 31h6l-8 8h-6l8-8Z" fill="currentColor" opacity="0.9" />
        </svg>
      </div>
      {!compact ? (
        <div className="flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-serif)] text-[1.7rem] tracking-[-0.04em] text-white">forge</span>
          <span className="hidden text-[0.72rem] uppercase tracking-[0.35em] text-white/35 sm:block">operator</span>
        </div>
      ) : null}
    </div>
  );
}
