import Link from "next/link";
import Image from "next/image";

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="AutonoService, inicio">
      <Image
        className="brand-mark"
        src="/branding/autonoservice-mark.svg"
        alt=""
        width={38}
        height={29}
        priority
      />
      <span className="brand-wordmark" aria-hidden="true">
        <strong>autono</strong><span>service</span><i className="brand-dot">.</i>
      </span>
    </Link>
  );
}
