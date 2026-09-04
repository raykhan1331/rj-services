import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Container from "@/components/layout/Container";
import Reveal from "@/components/home/Reveal";
import ContactForm from "@/components/services/ContactForm";
import { IconChat, IconMail, IconMapPin } from "@/components/home/icons";
import Image from "next/image";
import { MEDIA } from "@/lib/media";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with RJ Services — send an enquiry about banking, UK company formation, KYC, e-commerce, or digital marketing, and our team will follow up.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="bg-black text-white">
      <Container>
        <div className="py-20 sm:py-24 text-center max-w-2xl mx-auto">
          <div className="relative mx-auto mb-2 w-40 sm:w-48 aspect-square rounded-2xl overflow-hidden">
            <Image
              src={MEDIA.consultation.src}
              alt={MEDIA.consultation.alt}
              fill
              priority
              sizes="192px"
              className="object-cover"
            />
          </div>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-400">Contact</p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">Get in Touch</h1>
          <p className="mt-5 text-zinc-400">
            Send us an enquiry, message us on WhatsApp, or email us directly &mdash; we&apos;ll get
            back to you as soon as we can.
          </p>
        </div>
      </Container>

      <Reveal>
        <Container>
          <div className="pb-20 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Suspense fallback={null}>
                <ContactForm />
              </Suspense>
            </div>

            <div className="flex flex-col gap-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <IconChat className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-white">WhatsApp</h3>
                </div>
                <p className="mt-3 text-sm italic text-zinc-500">[Insert WhatsApp Number]</p>
                <span className="mt-4 block text-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-zinc-500 cursor-not-allowed">
                  Chat on WhatsApp
                </span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <IconMail className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-white">Email</h3>
                </div>
                <p className="mt-3 text-sm italic text-zinc-500">[Insert Email Address]</p>
                <span className="mt-4 block text-center rounded-full border border-white/20 px-5 py-2.5 text-sm font-medium text-zinc-500 cursor-not-allowed">
                  Send an Email
                </span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <IconMapPin className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-white">Locations</h3>
                </div>
                <p className="mt-3 text-sm text-zinc-400">United Kingdom &amp; Pakistan.</p>
                <Link href="/locations" className="mt-4 inline-block text-sm font-medium hover:opacity-70">
                  View location details &rarr;
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </Reveal>
    </div>
  );
}
