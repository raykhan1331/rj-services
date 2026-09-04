"use client";

import { useState } from "react";

const SERVICES = ["Company Formation", "Virtual Address", "KYC Assistance", "Banking Assistance", "Other"];

const fieldClass =
  "mt-2 w-full rounded-lg border border-white/15 bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40";

export default function EnquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <h3 className="text-lg font-semibold text-white">Thank you</h3>
        <p className="mt-2 text-sm text-zinc-400">
          We&apos;ve received your enquiry and will be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitting(true);
        setTimeout(() => setSubmitted(true), 500);
      }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-5"
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white">Full Name</label>
        <input id="name" name="name" required className={fieldClass} placeholder="Your name" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white">Email</label>
        <input id="email" name="email" type="email" required className={fieldClass} placeholder="you@example.com" />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-white">Phone (optional)</label>
        <input id="phone" name="phone" className={fieldClass} placeholder="Optional" />
      </div>
      <div>
        <label htmlFor="service" className="block text-sm font-medium text-white">Service</label>
        <select id="service" name="service" defaultValue={SERVICES[0]} className={fieldClass}>
          {SERVICES.map((s) => (
            <option key={s} value={s} className="bg-black">
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="message" className="block text-sm font-medium text-white">Message</label>
        <textarea id="message" name="message" rows={4} className={fieldClass} placeholder="Tell us about your business needs" />
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto rounded-full bg-white text-black px-8 py-3 text-sm font-medium hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send Enquiry"}
        </button>
      </div>
    </form>
  );
}
