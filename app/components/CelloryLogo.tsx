import clsx from "clsx";

interface CelloryLogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
}

export default function CelloryLogo({
  className,
  iconClassName,
  textClassName,
}: CelloryLogoProps) {
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <span
        className={clsx(
          "relative inline-flex h-7 w-7 items-center justify-center rounded-lg bg-stone-900",
          iconClassName
        )}
      >
        <span className="absolute h-3.5 w-3.5 rounded-full border-2 border-[#ff6b35]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#ff6b35]" />
      </span>
      <span className={clsx("text-xl font-bold text-foreground", textClassName)}>
        Cellory
      </span>
    </span>
  );
}
