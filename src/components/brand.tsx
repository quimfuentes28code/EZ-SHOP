import Link from "next/link";
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="AutonoService, inicio">
      <svg
        width="30"
        height="30"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 25 13 7h6l9 18M9 17h14M13 25h6"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>
        Autono<span className="brand-service">Service</span>
      </span>
    </Link>
  );
}
