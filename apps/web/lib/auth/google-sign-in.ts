import { authClient } from "./client";
import type { WorkflowContext } from "./workflow-context";
export async function google({
  pending,
  setPending,
  setMessage,
  setMessageIsError,
  callbackURL,
  setGooglePending,
}: WorkflowContext & { setGooglePending: (pending: boolean) => void }) {
  if (pending) return;
  setPending(true);
  setGooglePending(true);
  setMessage("");
  setMessageIsError(true);
  let redirecting = false;
  try {
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: callbackURL(),
      newUserCallbackURL: callbackURL(),
      errorCallbackURL: `${window.location.origin}/auth-error`,
      additionalParams: { prompt: "select_account" },
    });
    if (result.error)
      setMessage(
        "Google sign-in is unavailable right now. Please try again or use email and password.",
      );
    else redirecting = true;
  } catch {
    setMessage("We couldn’t connect to Google sign-in. Please try again.");
  } finally {
    // The SDK initiates navigation; keep feedback visible until it completes.
    if (!redirecting) {
      setPending(false);
      setGooglePending(false);
    }
  }
}
