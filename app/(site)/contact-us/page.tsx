import {
  Clock3,
  Headset,
  Mail,
  MessageCircleMore,
  Navigation,
} from "lucide-react";

export default function ContactUsPage() {
  return (
    <main className="bg-[linear-gradient(180deg,#eaf5f5_0%,#f3f4f6_32%)] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
      <div className="mx-auto w-full max-w-[1300px]">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-[#24479b] sm:text-6xl">Get in Touch</h1>
          <p className="mt-4 text-xl text-[#5c6b82] sm:text-2xl">
            Our team is here to help you scale your commerce empire.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-[#e2e6ee] bg-[#f7f8fa] p-6 shadow-sm sm:p-8">
            <form className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-lg font-semibold text-[#4e596c]" htmlFor="full-name">
                    Full Name
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    placeholder="John Doe"
                    className="h-12 w-full rounded-xl border border-[#cfd5de] bg-[#f7f8fa] px-4 text-base text-[#24324b] placeholder:text-[#9aa4b4] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-lg font-semibold text-[#4e596c]" htmlFor="business-email">
                    Business Email
                  </label>
                  <input
                    id="business-email"
                    type="email"
                    placeholder="john@company.com"
                    className="h-12 w-full rounded-xl border border-[#cfd5de] bg-[#f7f8fa] px-4 text-base text-[#24324b] placeholder:text-[#9aa4b4] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-lg font-semibold text-[#4e596c]" htmlFor="company-name">
                  Company Name
                </label>
                <input
                  id="company-name"
                  type="text"
                  placeholder="Acme Inc."
                  className="h-12 w-full rounded-xl border border-[#cfd5de] bg-[#f7f8fa] px-4 text-base text-[#24324b] placeholder:text-[#9aa4b4] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-lg font-semibold text-[#4e596c]" htmlFor="subject">
                  Subject
                </label>
                <select
                  id="subject"
                  className="h-12 w-full rounded-xl border border-[#cfd5de] bg-[#f7f8fa] px-4 text-base text-[#4e596c] focus:outline-none"
                  defaultValue="General Inquiry"
                >
                  <option>General Inquiry</option>
                  <option>Sales Question</option>
                  <option>Technical Support</option>
                  <option>Partnership</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-lg font-semibold text-[#4e596c]" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  placeholder="How can we help you?"
                  className="w-full resize-none rounded-xl border border-[#cfd5de] bg-[#f7f8fa] px-4 py-3 text-base text-[#24324b] placeholder:text-[#9aa4b4] focus:outline-none"
                />
              </div>

              <button
                type="button"
                className="h-12 w-full rounded-xl bg-[#2a4798] text-2xl font-semibold text-white transition hover:bg-[#3557b4]"
              >
                Send Message
              </button>
            </form>
          </section>

          <div className="space-y-8">
            <section className="rounded-2xl border border-[#e2e6ee] bg-[#f7f8fa] p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <Headset className="h-6 w-6 text-[#2fd1c8]" />
                <h2 className="text-4xl font-bold text-[#24479b]">Support &amp; Sales</h2>
              </div>

              <div className="mt-8 space-y-7">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-[#eef1f5] p-2">
                    <Mail className="h-6 w-6 text-[#2a4798]" />
                  </div>
                  <div>
                    <p className="text-lg text-[#7a8598]">Email Support</p>
                    <p className="text-[30px] font-semibold text-[#2a4798]">support@commandcenter.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-[#eef1f5] p-2">
                    <Clock3 className="h-6 w-6 text-[#2a4798]" />
                  </div>
                  <div>
                    <p className="text-lg text-[#7a8598]">Business Hours</p>
                    <p className="text-[34px] font-semibold text-[#2d3a52]">9 AM - 6 PM EST</p>
                    <p className="text-[30px] text-[#6a768d]">Monday - Friday</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-[#e4e8ef] pt-7">
                <p className="text-lg font-medium text-[#6f7b90]">Need a quicker answer?</p>
                <button
                  type="button"
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-[#2a4798] text-xl font-semibold text-[#2a4798] transition hover:bg-[#eef3ff]"
                >
                  <MessageCircleMore className="h-5 w-5" />
                  Chat with Us
                </button>
              </div>
            </section>

            <section className="rounded-2xl bg-[#24479b] p-6 text-white shadow-sm sm:p-8">
              <h3 className="text-4xl font-bold">Visit our Headquarters</h3>
              <p className="mt-4 text-[29px] leading-[1.55] text-[#cad5ee]">
                100 Innovation Drive, Suite 500
                <br />
                Tech District, NY 10011
              </p>
              <a
                href="#"
                className="mt-5 inline-flex items-center gap-2 text-[30px] font-semibold text-[#2fd1c8] transition hover:text-[#56c7c6]"
              >
                Get Directions
                <Navigation className="h-5 w-5" />
              </a>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
