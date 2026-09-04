import Link from "next/link";
import Container from "./Container";
import Logo from "@/components/Logo";
import { mainNav, servicesNav } from "@/lib/nav";

export default function Footer() {
  return (
    <footer className="bg-black text-zinc-400 border-t border-white/10">
      <Container>
        <div className="py-14 grid grid-cols-1 sm:grid-cols-3 gap-10">
          <div>
            <Logo size="sm" />
            <p className="mt-4 text-sm max-w-xs">
              Global business support &mdash; banking, company formation, and
              e-commerce growth, for the UK and Pakistan.
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500">
              Services
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {servicesNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-zinc-500">
              Company
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {mainNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 py-6 text-xs">
          &copy; {new Date().getFullYear()} RJ Services. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}
