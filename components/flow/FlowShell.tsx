import type { ReactNode } from "react";

export function FlowShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto w-full max-w-md rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-xl backdrop-blur">
      {eyebrow ? (
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">
          {eyebrow}
        </p>
      ) : null}

      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        {title}
      </h1>

      <div className="mt-5">{children}</div>
    </section>
  );
}
