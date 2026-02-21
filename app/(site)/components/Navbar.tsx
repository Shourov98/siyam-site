import Link from "next/link";

export default function Navbar() {
  const navLinkClass =
    "text-[18px] leading-none font-medium text-[#171b2c] no-underline max-[1180px]:text-[15px]";

  return (
    <header className="flex w-full items-center justify-between gap-6 border-b border-[#dcdde1] bg-[#ececed] px-16 py-2.5 min-[1181px]:min-h-[72px] max-[1180px]:flex-wrap max-[1180px]:justify-center max-[1180px]:px-5 max-[1180px]:py-4">
      <Link
        className="leading-none font-bold tracking-[-0.02em] text-[#2dc2bd] text-[24px] max-[1180px]:text-[17px]"
        href="/"
      >
        CommandCtr
      </Link>

      <nav
        className="flex items-center gap-[38px] max-[1180px]:order-3 max-[1180px]:w-full max-[1180px]:flex-wrap max-[1180px]:justify-center max-[1180px]:gap-[18px]"
        aria-label="Main navigation"
      >
        <Link className={navLinkClass} href="/">
          Home
        </Link>
        <Link className={navLinkClass} href="/integrations">
          Integrations
        </Link>
        <Link className={navLinkClass} href="/pricing">
          Pricing
        </Link>
        <Link className={navLinkClass} href="/about-us">
          About Us
        </Link>
        <Link className={navLinkClass} href="/faq">
          FAQ
        </Link>
        <Link className={navLinkClass} href="/privacy-policy">
          Privacy Policy
        </Link>
      </nav>

      <div className="flex items-center gap-[18px]">
        <Link className={navLinkClass} href="/login">
          Sign In
        </Link>
        <Link
          className="whitespace-nowrap rounded-[6px] bg-[#132446] px-[22px] py-4 text-[18px] leading-none font-semibold text-[#2fd1c8] no-underline shadow-[0_4px_12px_rgba(11,20,40,0.18)] max-[1180px]:text-[15px]"
          href="/signup"
        >
          Start Free Trial
        </Link>
      </div>
    </header>
  );
}
