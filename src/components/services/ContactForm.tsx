"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

const SERVICES = [
  "Bank Account",
  "Company Formation",
  "Virtual Address",
  "KYC",
  "eBay",
  "Shopify",
  "AdSense",
  "Digital Marketing",
  "Business Finance",
  "Other",
];

const SERVICE_MAP: Record<string, string> = {
  banking: "Bank Account",
  "uk-company-formation": "Company Formation",
  "virtual-addresses": "Virtual Address",
  "kyc-assistance": "KYC",
  ebay: "eBay",
  shopify: "Shopify",
  "google-adsense": "AdSense",
  "digital-marketing": "Digital Marketing",
  "tide-business-loan": "Business Finance",
};

const LOCATION_MAP: Record<string, string> = {
  uk: "United Kingdom",
  pakistan: "Pakistan",
};

type Fields = "name" | "email" | "phone" | "country" | "service" | "message";

const fieldClass =
  "mt-2 w-full rounded-lg border bg-black/40 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none";

export default function ContactForm() {
  const searchParams = useSearchParams();
  const initialService = SERVICE_MAP[searchParams.get("service") ?? ""] ?? "";
  const initialCountry = LOCATION_MAP[searchParams.get("location") ?? ""] ?? "";

  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    country: initialCountry,
    service: initialService,
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function validate(v: typeof values) {
    const e: Partial<Record<Fields, string>> = {};
    if (!v.name.trim()) e.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = "Please enter a valid email address.";
    if (!/\d{7,}/.test(v.phone.replace(/[^\d]/g, ""))) e.phone = "Please enter a valid WhatsApp/phone number.";
    if (!v.country.trim()) e.country = "Please enter your country.";
    if (!v.service) e.service = "Please select a service.";
    if (v.message.trim().length < 10) e.message = "Please provide a few more details (at least 10 characters).";
    return e;
  }

  function update(field: Fields, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const foundErrors = validate(values);
    setErrors(foundErrors);
    if (Object.keys(foundErrors).length === 0) {
      setSubmitting(true);
      setTimeout(() => setSubmitted(true), 500);
    }
  }

  const border = (field: Fields) => (errors[field] ? "border-red-400/60" : "border-white/15 focus:border-white/40");

  if (submitted) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <h3 className="text-lg font-semibold text-white">Enquiry received</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Thank you, {values.name.split(" ")[0]}. We&apos;ve received your enquiry and will get back
          to you soon.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-5"
    >
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white">Name</label>
        <input
          id="name"
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          className={`${fieldClass} ${border("name")}`}
          placeholder="Your full name"
        />
        {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-white">Email</label>
        <input
          id="email"
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          className={`${fieldClass} ${border("email")}`}
          placeholder="you@example.com"
        />
        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-white">WhatsApp / Phone</label>
        <input
          id="phone"
          value={values.phone}
          onChange={(e) => update("phone", e.target.value)}
          className={`${fieldClass} ${border("phone")}`}
          placeholder="+44 7xxx xxxxxx"
        />
        {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="country" className="block text-sm font-medium text-white">Country</label>
        <input
          id="country"
          value={values.country}
          onChange={(e) => update("country", e.target.value)}
          className={`${fieldClass} ${border("country")}`}
          placeholder="e.g. United Kingdom"
        />
        {errors.country && <p className="mt-1 text-xs text-red-400">{errors.country}</p>}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="service" className="block text-sm font-medium text-white">Service Required</label>
        <select
          id="service"
          value={values.service}
          onChange={(e) => update("service", e.target.value)}
          className={`${fieldClass} ${border("service")}`}
        >
          <option value="" className="bg-black">Select a service</option>
          {SERVICES.map((s) => (
            <option key={s} value={s} className="bg-black">{s}</option>
          ))}
        </select>
        {errors.service && <p className="mt-1 text-xs text-red-400">{errors.service}</p>}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="message" className="block text-sm font-medium text-white">Message</label>
        <textarea
          id="message"
          rows={4}
          value={values.message}
          onChange={(e) => update("message", e.target.value)}
          className={`${fieldClass} ${border("message")}`}
          placeholder="Tell us about your business needs"
        />
        {errors.message && <p className="mt-1 text-xs text-red-400">{errors.message}</p>}
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
