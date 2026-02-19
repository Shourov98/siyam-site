"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    quote:
      "Command Center gave us the visibility we did not know we were missing. It is the backbone of our operations.",
    name: "Alex Visser",
    role: "CTO, Global Retail Inc.",
    initials: "AV",
  },
  {
    quote:
      "Inventory drift dropped by 78% in the first month. Our teams now trust one source of truth across channels.",
    name: "Maya Reynolds",
    role: "Head of Ecommerce, Nova Supply",
    initials: "MR",
  },
  {
    quote:
      "Automation replaced our manual sync process and saved us hours every day. It scales with zero chaos.",
    name: "Daniel Kim",
    role: "Operations Director, BrightCart",
    initials: "DK",
  },
];

export default function TestimonialSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = testimonials[activeIndex];

  const previous = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const next = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="bg-[#f3f4f6] px-6 py-16 sm:px-10 lg:px-16 lg:py-20">
      <div className="mx-auto w-full max-w-[1240px] rounded-[10px] bg-[#223867] px-6 py-14 text-center text-white sm:px-12 lg:px-24 lg:py-20">
        <p className="mx-auto max-w-[980px] text-3xl font-semibold leading-[1.2] sm:text-4xl lg:text-[62px]">
          &quot;{active.quote}&quot;
        </p>

        <div className="mt-10 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#3ad7cf] to-[#1f2f58] text-lg font-bold">
            {active.initials}
          </div>
          <p className="mt-4 text-[34px] font-semibold text-[#f0f4fb]">{active.name}</p>
          <p className="mt-1 text-[18px] uppercase tracking-[0.14em] text-[#8f9db8]">{active.role}</p>

          <div className="mt-6 flex items-center gap-4">
            <button
              type="button"
              onClick={previous}
              aria-label="Previous testimonial"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#c2ccde] text-[#d7dfed] transition hover:border-[#2fd1c8] hover:text-[#2fd1c8]"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next testimonial"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2fd1c8] text-[#2fd1c8] transition hover:bg-[#2fd1c8]/10"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
