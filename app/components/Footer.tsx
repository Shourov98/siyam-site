import { AtSign, CirclePlay, Facebook, Link as LinkIcon } from "lucide-react";

const productLinks = ["Features", "Integrations", "Pricing", "Roadmap"];
const resourceLinks = ["Blog", "Help Center", "API Documentation", "Community"];
const legalLinks = ["Privacy Policy", "Terms of Service"];

export default function Footer() {
  return (
    <footer className="bg-[#223867] px-6 py-14 text-[#8f9bb1] sm:px-10 lg:px-16 lg:py-16">
      <div className="mx-auto w-full max-w-[1400px]">
        <div className="grid gap-14 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-[#2fd1c8] sm:text-4xl">CommandCtr</h2>
            <LinkIcon className="mt-8 h-6 w-6 text-[#e2e9f7]" strokeWidth={2.2} />
            <address className="mt-7 not-italic text-xl leading-[1.6] text-[#d5deec] sm:text-2xl">
              12th Floor
              <br />
              Innovation Hub Tower
              <br />
              SoMa, San Francisco
              <br />
              CA 94103
            </address>
            <p className="mt-8 text-lg text-[#71809f] sm:text-xl">Command Center Platforms © 2026</p>
          </div>

          <div>
            <h3 className="max-w-[700px] text-4xl font-medium leading-[1.1] text-[#f3f6fc] sm:text-5xl">
              Unifying Commerce That Moves Us Forward.
            </h3>
            <p className="mt-10 text-2xl text-[#dfe6f4] sm:text-3xl">Sign up for our email list</p>

            <div className="mt-8">
              <label htmlFor="footer-email" className="sr-only">
                Your email
              </label>
              <div className="flex items-center border-b border-[#6f7f9f] pb-3">
                <input
                  id="footer-email"
                  type="email"
                  placeholder="Your email"
                  className="w-full bg-transparent text-2xl text-[#dfe6f4] placeholder:text-[#7b88a3] focus:outline-none sm:text-3xl"
                />
                <button
                  type="button"
                  aria-label="Submit email"
                  className="text-[#e7edf8] transition hover:text-[#2fd1c8]"
                >
                  <span className="text-3xl leading-none sm:text-4xl">→</span>
                </button>
              </div>
            </div>

            <label className="mt-4 flex items-start gap-3 text-base text-[#9ba7bf] sm:text-lg">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border border-[#7383a2] bg-transparent accent-[#2fd1c8]"
              />
              <span>I have read and agree to the Privacy Policy.</span>
            </label>
          </div>
        </div>

        <div className="mt-14 border-t border-[#344b76] pt-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 className="text-2xl font-semibold text-[#eef3fb] sm:text-3xl">Product</h4>
              <ul className="mt-5 space-y-2.5">
                {productLinks.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-lg transition hover:text-[#dce5f5] sm:text-2xl">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-2xl font-semibold text-[#eef3fb] sm:text-3xl">Resources</h4>
              <ul className="mt-5 space-y-2.5">
                {resourceLinks.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-lg transition hover:text-[#dce5f5] sm:text-2xl">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-2xl font-semibold text-[#eef3fb] sm:text-3xl">Legal</h4>
              <ul className="mt-5 space-y-2.5">
                {legalLinks.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-lg transition hover:text-[#dce5f5] sm:text-2xl">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-6 border-t border-[#2d8c9c] pt-8">
          <p className="text-base text-[#8c99b1] sm:text-xl">© 2026 BusinessOS Inc. All rights reserved.</p>
          <div className="flex items-center gap-5 text-[#9ba7bf]">
            <a href="#" aria-label="Facebook" className="transition hover:text-[#dbe5f6]">
              <Facebook className="h-7 w-7" />
            </a>
            <a href="#" aria-label="YouTube" className="transition hover:text-[#dbe5f6]">
              <CirclePlay className="h-7 w-7" />
            </a>
            <a href="#" aria-label="Email" className="transition hover:text-[#dbe5f6]">
              <AtSign className="h-7 w-7" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
