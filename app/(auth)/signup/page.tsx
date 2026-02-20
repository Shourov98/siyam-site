import Link from "next/link";
import AuthShell from "../../components/auth/AuthShell";

export default function SignupPage() {
  return (
    <AuthShell>
      <Link href="/" className="text-3xl font-bold text-[#33cac7] sm:text-4xl">
        CommandCtr
      </Link>

      <h1 className="mt-10 text-4xl font-medium tracking-[-0.02em] text-[#303a4f] sm:text-5xl">
        Create your account
      </h1>
      <p className="mt-3 text-lg text-[#8b95a7] sm:text-xl">
        Join the elite network of multichannel retailers.
      </p>

      <form className="mt-8 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold tracking-[0.08em] text-[#8b93a2] sm:text-sm">
              FIRST NAME
            </label>
            <input
              type="text"
              name="firstName"
              autoComplete="given-name"
              autoFocus
              placeholder="Jane"
              className="mt-2 h-14 w-full border border-[#e3e7ed] bg-[#eef1f5] px-4 text-lg text-[#4a556a] placeholder:text-[#b4bcc8] transition focus:border-[#32cbc6] focus:outline-none focus:ring-2 focus:ring-[#32cbc6]/25 sm:h-16 sm:text-xl"
            />
          </div>
          <div>
            <label className="text-xs font-semibold tracking-[0.08em] text-[#8b93a2] sm:text-sm">
              LAST NAME
            </label>
            <input
              type="text"
              name="lastName"
              autoComplete="family-name"
              placeholder="Doe"
              className="mt-2 h-14 w-full border border-[#e3e7ed] bg-[#eef1f5] px-4 text-lg text-[#4a556a] placeholder:text-[#b4bcc8] transition focus:border-[#32cbc6] focus:outline-none focus:ring-2 focus:ring-[#32cbc6]/25 sm:h-16 sm:text-xl"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold tracking-[0.08em] text-[#8b93a2] sm:text-sm">
            EMAIL ADDRESS
          </label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="jane@example.com"
            className="mt-2 h-14 w-full border border-[#e3e7ed] bg-[#eef1f5] px-4 text-lg text-[#4a556a] placeholder:text-[#b4bcc8] transition focus:border-[#32cbc6] focus:outline-none focus:ring-2 focus:ring-[#32cbc6]/25 sm:h-16 sm:text-xl"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold tracking-[0.08em] text-[#8b93a2] sm:text-sm">
              PASSWORD
            </label>
            <span className="text-xs font-semibold text-[#34c7c3] sm:text-sm">
              STRONG
            </span>
          </div>
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="•••••••••"
            className="mt-2 h-14 w-full border border-[#e3e7ed] bg-[#eef1f5] px-4 text-lg text-[#4a556a] placeholder:text-[#b4bcc8] transition focus:border-[#32cbc6] focus:outline-none focus:ring-2 focus:ring-[#32cbc6]/25 sm:h-16 sm:text-xl"
          />
        </div>

        <div className="mt-2 flex items-center justify-between text-sm sm:text-base">
          <label className="flex items-center gap-2 text-[#98a1b0]">
            <input type="checkbox" className="h-4 w-4 rounded border-[#ccd3de]" />
            Remember me
          </label>
          <Link href="#" className="font-medium text-[#32cbc6]">
            Forgot Password?
          </Link>
        </div>

        <button
          type="submit"
          className="mt-2 h-14 w-full rounded-xl bg-[#263f72] text-lg font-semibold text-white shadow-[0_7px_16px_rgba(24,39,70,0.25)] transition hover:bg-[#2d497f] sm:h-16 sm:text-xl"
        >
          Create Account
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#97a0af] sm:text-base">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#32cbc6]">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
