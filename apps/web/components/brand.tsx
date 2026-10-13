import Image from "next/image";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <Image
        src="/assets/logo.svg"
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0"
      />
      <span
        className={
          compact ? "truncate group-data-[collapsible=icon]:hidden" : "truncate"
        }
      >
        Clarivo
      </span>
    </>
  );
}
