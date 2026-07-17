export type ScanStatus = { tone: "success" | "warning" | "error"; title: string; detail?: string };
export function StatusBox({ status }: { status: ScanStatus }) {
  const style = { success: "bg-green-50 text-green-800 border-green-200", warning: "bg-amber-50 text-amber-900 border-amber-200", error: "bg-red-50 text-red-800 border-red-200" }[status.tone];
  const icon = { success: "✅", warning: "⚠️", error: "❌" }[status.tone];
  return <div role="status" className={`rounded-2xl border-2 p-5 text-center ${style}`}><p className="text-xl font-black sm:text-2xl">{icon} {status.title}</p>{status.detail && <p className="mt-2 text-base font-semibold sm:text-lg">{status.detail}</p>}</div>;
}
