export default function Navbar() {
  return (
    <header className="flex w-full items-center justify-between gap-6 border-b border-[#dcdde1] bg-[#ececed] px-16 py-2.5 min-[1181px]:min-h-[72px] max-[1180px]:flex-wrap max-[1180px]:justify-center max-[1180px]:px-5 max-[1180px]:py-4">
      <div className="leading-none font-bold tracking-[-0.02em] text-[#2dc2bd] text-[29px] max-[1180px]:text-[18px]">
        CommandCtr
      </div>

      <nav
        className="flex items-center gap-[38px] max-[1180px]:order-3 max-[1180px]:w-full max-[1180px]:flex-wrap max-[1180px]:justify-center max-[1180px]:gap-[18px]"
        aria-label="Main navigation"
      >
        <a className="text-[23px] leading-none font-medium text-[#171b2c] no-underline max-[1180px]:text-[18px]" href="#">
          Home
        </a>
        <a className="text-[23px] leading-none font-medium text-[#171b2c] no-underline max-[1180px]:text-[18px]" href="#">
          Integrations
        </a>
        <a className="text-[23px] leading-none font-medium text-[#171b2c] no-underline max-[1180px]:text-[18px]" href="#">
          Pricing
        </a>
        <a className="text-[23px] leading-none font-medium text-[#171b2c] no-underline max-[1180px]:text-[18px]" href="#">
          About Us
        </a>
        <a className="text-[23px] leading-none font-medium text-[#171b2c] no-underline max-[1180px]:text-[18px]" href="#">
          FAQ
        </a>
      </nav>

      <div className="flex items-center gap-[18px]">
        <a className="text-[23px] leading-none font-medium text-[#171b2c] no-underline max-[1180px]:text-[18px]" href="#">
          Sign In
        </a>
        <a
          className="whitespace-nowrap rounded-[6px] bg-[#132446] px-[22px] py-4 text-[23px] leading-none font-semibold text-[#2fd1c8] no-underline shadow-[0_4px_12px_rgba(11,20,40,0.18)] max-[1180px]:text-[18px]"
          href="#"
        >
          Start Free Trial
        </a>
      </div>
    </header>
  );
}
