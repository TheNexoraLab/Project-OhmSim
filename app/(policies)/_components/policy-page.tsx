import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Surface } from "@/components/ui/surface";

export type PolicySection = { id: string; title: string; content: ReactNode };

export function PolicyPage({ kind, title, description, sections }: {
  kind: "privacy" | "terms";
  title: string;
  description: string;
  sections: PolicySection[];
}) {
  const linkStyle = "inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-mocha-text-muted hover:text-mocha-accent";
  return (
    <div className="min-h-dvh bg-mocha-bg">
      <header className="border-b border-mocha-border bg-mocha-bg-secondary">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <Link href="/" aria-label="OhmSim — back to landing page" className="inline-flex min-h-11 items-center rounded-lg">
            <Image src="/logos/ohmsim-logo.png" alt="OhmSim" width={144} height={48} priority />
          </Link>
          <nav aria-label="Policy navigation" className="flex flex-wrap gap-1">
            <Link href="/privacy" aria-current={kind === "privacy" ? "page" : undefined} className={`${linkStyle} aria-[current=page]:bg-mocha-panel aria-[current=page]:text-mocha-accent`}>Privacy</Link>
            <Link href="/terms" aria-current={kind === "terms" ? "page" : undefined} className={`${linkStyle} aria-[current=page]:bg-mocha-panel aria-[current=page]:text-mocha-accent`}>Terms</Link>
            <Link href="/" className={linkStyle}>Back to home</Link>
          </nav>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-[1280px] px-5 py-10 sm:px-8 sm:py-16">
        <div className="mb-10 max-w-3xl">
          <p className="mb-3 font-mono text-xs tracking-widest text-mocha-accent-secondary">OHMSIM / SERVICE INFORMATION</p>
          <h1 className="text-3xl font-bold tracking-tight text-mocha-text sm:text-5xl">{title}</h1>
          <p className="mt-5 text-base leading-7 text-mocha-text-muted sm:text-lg">{description}</p>
        </div>
        <div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          <nav aria-label="On this page" className="rounded-panel border border-mocha-border bg-mocha-bg-secondary p-5 lg:sticky lg:top-6">
            <h2 className="mb-3 text-sm font-semibold text-mocha-text">On this page</h2>
            <ol className="space-y-1">
              {sections.map((section, index) => <li key={section.id}>
                <a href={`#${section.id}`} className="flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 text-sm text-mocha-text-muted hover:text-mocha-accent">
                  <span className="font-mono text-xs text-mocha-text-subtle">{String(index + 1).padStart(2, "0")}</span>{section.title}
                </a>
              </li>)}
            </ol>
          </nav>
          <div className="min-w-0 space-y-5">
            {sections.map((section, index) => <section key={section.id} id={section.id} aria-labelledby={`${section.id}-heading`} className="scroll-mt-6">
              <Surface className="p-6 sm:p-8">
                <h2 id={`${section.id}-heading`} className="mb-4 text-xl font-semibold text-mocha-text"><span className="mr-3 font-mono text-sm text-mocha-accent-secondary">{String(index + 1).padStart(2, "0")}</span>{section.title}</h2>
                <div className="space-y-4 break-words text-sm leading-7 text-mocha-text-muted sm:text-base [&_a]:text-mocha-accent [&_a]:underline [&_a]:underline-offset-4 [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_strong]:font-semibold [&_strong]:text-mocha-text">{section.content}</div>
              </Surface>
            </section>)}
          </div>
        </div>
      </main>
      <footer className="border-t border-mocha-border px-5 py-6 text-center text-sm text-mocha-text-subtle">
        <p>OhmSim by NEXORA Labs</p>
        <a href="#main-content" className={`${linkStyle} mt-2`}>Back to top ↑</a>
      </footer>
    </div>
  );
}
