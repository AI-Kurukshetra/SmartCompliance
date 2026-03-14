"use client";

type BrandLoaderProps = {
  label?: string;
  compact?: boolean;
};

export function BrandLoader({
  label = "Loading SmartCompliance",
  compact = false,
}: BrandLoaderProps) {
  const frameSize = compact ? "h-5 w-5" : "h-12 w-12";
  const ringInset = compact ? "inset-[2px]" : "inset-[5px]";
  const dotSize = compact ? "h-1.5 w-1.5" : "h-3 w-3";

  return (
    <div
      className={
        compact
          ? "inline-flex items-center gap-2"
          : "flex min-h-[50vh] flex-col items-center justify-center gap-5"
      }
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className={`relative flex items-center justify-center ${frameSize}`}>
        <span className="absolute inset-0 rounded-full border-2 border-ink/15" />
        <span
          className={`absolute ${ringInset} animate-spin rounded-full border-2 border-lime-300/60 border-t-lime-300`}
        />
        <span className={`rounded-full bg-ink ${dotSize}`} />
      </div>
      {!compact ? (
        <p className="text-sm uppercase tracking-[0.32em] text-ink/62">{label}</p>
      ) : null}
    </div>
  );
}
