import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$49",
    cta: "Start Trial",
    features: ["2 Channels", "500 Orders/mo", "Basic Support"],
  },
  {
    name: "Growth",
    price: "$149",
    cta: "Start Trial",
    features: [
      "10 Channels",
      "5,000 Orders/mo",
      "AI Optimization Suite",
      "Custom API Access",
    ],
    popular: true,
  },
  {
    name: "Scale",
    price: "$399",
    cta: "Contact Sales",
    features: [
      "Unlimited Channels",
      "Unlimited Orders",
      "Advanced API Limits",
      "Dedicated Success Manager",
    ],
  },
];

export default function PricingSection() {
  return (
    <section className="bg-[#f3f4f6] px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1260px]">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-[#151e32] sm:text-5xl">Simple Pricing</h2>
          <p className="mt-4 text-lg text-[#7f8899] sm:text-xl">
            Transparent plans for every stage of your empire.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-end">
          {plans.map((plan) => {
            const featured = !!plan.popular;

            return (
              <article
                key={plan.name}
                className={`relative rounded-[22px] px-8 py-9 shadow-sm ${
                  featured ? "bg-[#243a69] text-white lg:scale-[1.02]" : "bg-[#eef0f3] text-[#1a2236]"
                }`}
              >
                {featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#34d3cc] px-5 py-1.5 text-sm font-bold uppercase tracking-wide text-[#ffffff]">
                    Most Popular
                  </span>
                ) : null}

                <h3 className="text-[24px] font-semibold leading-tight">{plan.name}</h3>

                <p className="mt-2 flex items-end">
                  <span className="text-[46px] font-bold leading-none">{plan.price}</span>
                  <span className={`mb-1.5 text-[30px] ${featured ? "text-[#b7c3d9]" : "text-[#7b8496]"}`}>
                    /mo
                  </span>
                </p>

                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={`flex items-center gap-3 text-[18px] ${
                        featured ? "text-[#e7edf8]" : "text-[#5e687b]"
                      }`}
                    >
                      <Check className="h-5 w-5 shrink-0" strokeWidth={3} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={`mt-9 w-full rounded-full px-8 py-3.5 text-xl font-semibold transition ${
                    featured
                      ? "bg-white text-[#2b354a] hover:bg-[#edf2fb]"
                      : "bg-white text-[#3a4356] hover:bg-[#f8fbff]"
                  }`}
                >
                  {plan.cta}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
