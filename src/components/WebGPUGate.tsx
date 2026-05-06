import { AlertTriangle, ExternalLink } from "lucide-react";

export function WebGPUGate(): JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <h1 className="ipsivra-wordmark text-base">WebGPU required</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          IPSIVRA runs the model on your device via WebGPU. Your browser does
          not currently expose <code className="font-mono">navigator.gpu</code>.
        </p>
        <div className="space-y-2 text-sm">
          <p className="font-medium">Try one of:</p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            <li>Chrome / Edge 113+ on a desktop machine</li>
            <li>Firefox Nightly with WebGPU enabled</li>
            <li>Safari 18+ on macOS / iOS</li>
          </ul>
        </div>
        <div className="mt-5 flex flex-col gap-2 text-xs">
          <a
            href="https://caniuse.com/webgpu"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-2"
          >
            Browser support matrix <ExternalLink className="h-3 w-3" />
          </a>
          <a
            href="https://developer.chrome.com/docs/web-platform/webgpu/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 underline underline-offset-2"
          >
            Chrome WebGPU docs <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
