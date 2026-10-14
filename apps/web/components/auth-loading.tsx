import { LoaderCircleIcon } from "lucide-react";

export function AuthLoading({
  message = "Getting things ready…",
}: {
  message?: string;
}) {
  return (
    <div className="auth-loading" role="status" aria-live="polite">
      <LoaderCircleIcon
        className="size-6 animate-spin motion-reduce:animate-none"
        aria-hidden="true"
      />
      <span className="sr-only">{message}</span>
    </div>
  );
}

export function WorkspaceLoading() {
  return (
    <main className="workspace-loading" role="status" aria-live="polite">
      <LoaderCircleIcon
        className="size-6 animate-spin motion-reduce:animate-none"
        aria-hidden="true"
      />
      <h1>Opening your workspace…</h1>
      <p>Loading your profile and conversations.</p>
    </main>
  );
}
