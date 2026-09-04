import { IconArrowRight } from "@/components/home/icons";

export default function ProcessSteps({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-4 lg:flex-1">
          <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center">
            <span className="text-xs font-semibold text-zinc-500">STEP {i + 1}</span>
            <p className="mt-1 font-medium text-white">{step}</p>
          </div>
          {i < steps.length - 1 && (
            <IconArrowRight className="hidden lg:block w-5 h-5 text-zinc-600 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}
