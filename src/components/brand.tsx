import Link from "next/link";
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Nexo, inicio">
      <svg
        width="30"
        height="30"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 25V7h6l10 18h6V7h-6v18L11 7H5"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        nexo<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
