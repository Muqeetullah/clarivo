import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
export function errorMessage(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? error.code
      : undefined;
  if (code === "CONFLICT")
    return "These settings changed in another tab. Load the latest saved version before saving again. Your edits are still here.";
  if (code === "CONVERSATION_CLOSED")
    return "This conversation has closed. Your reply was not sent.";
  if (code === "UNAUTHORIZED")
    return "Your session has expired. Sign in again to continue.";
  if (code === "INVALID_UPLOAD")
    return "Choose a PNG, JPEG, WebP or GIF image up to 2 MB.";
  return "We couldn’t complete that request. Your changes are still here. Try again.";
}
export function Feedback({
  message,
  error = false,
}: {
  message: string;
  error?: boolean;
}) {
  if (!message) return null;
  return (
    <Alert
      variant={error ? "destructive" : "default"}
      role={error ? "alert" : "status"}
    >
      <AlertTitle>{error ? "Something needs attention" : "Saved"}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
