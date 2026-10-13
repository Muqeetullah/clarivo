import { authClient } from "./client";
import type { WorkflowContext } from "./workflow-context";
import type { UseFormReturn } from "react-hook-form";
import { emailSchema, type Credentials } from "./credentials";
export async function magicLink({
  pending,
  setPending,
  setMessage,
  setMessageIsError,
  callbackURL,
  form,
}: WorkflowContext & { form: UseFormReturn<Credentials> }) {
  if (pending) return;
  const email = emailSchema.safeParse(form.getValues("email"));
  if (!email.success) {
    form.setError("email", { message: "Enter a valid email address." });
    return;
  }
  form.clearErrors();
  setPending(true);
  setMessage("");
  setMessageIsError(true);
  try {
    const result = await authClient.signIn.magicLink({
      email: email.data,
      callbackURL: callbackURL(),
      errorCallbackURL: `${window.location.origin}/auth-error`,
    });
    setMessageIsError(!!result.error);
    setMessage(
      result.error
        ? "Email link sign-in is unavailable right now. Please use email and password or Google."
        : "If an account exists for this email, you’ll receive a sign-in link. Check your inbox and spam folder.",
    );
  } catch {
    setMessage(
      "Email link sign-in is unavailable right now. Please use email and password or Google.",
    );
  } finally {
    setPending(false);
  }
}
