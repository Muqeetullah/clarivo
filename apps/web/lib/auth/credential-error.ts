// Both SDK result errors and thrown errors go through this mapper.
export function credentialError(
  error: unknown,
  signup: boolean,
): { message: string; verify?: boolean } {
  const value = error && typeof error === "object" ? error : {};
  const status =
    "status" in value && typeof value.status === "number"
      ? value.status
      : undefined;
  const code =
    "code" in value && typeof value.code === "string"
      ? value.code.toUpperCase()
      : "";
  if (status === 429 || (status !== undefined && status >= 500))
    return {
      message:
        "Sign-in is unavailable right now. Please try again in a moment.",
    };
  if (["EMAIL_NOT_VERIFIED", "EMAIL_NOT_CONFIRMED"].includes(code))
    return {
      message:
        "Verify your email to continue. You can request a new code below.",
      verify: true,
    };
  if (
    signup &&
    ["USER_ALREADY_EXISTS", "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL"].includes(
      code,
    )
  )
    return {
      message:
        "An account already exists with this email. Log in instead, or continue with Google if you used Google to sign up.",
    };
  if (
    !signup &&
    [
      "INVALID_CREDENTIALS",
      "INVALID_EMAIL_OR_PASSWORD",
      "INVALID_PASSWORD",
      "USER_NOT_FOUND",
    ].includes(code)
  )
    return {
      message:
        "We couldn’t log you in. Check your email and password and try again.",
    };
  return {
    message:
      status !== undefined || code
        ? "Sign-in is unavailable right now. Please try again in a moment."
        : "We couldn’t connect. Check your connection and try again.",
  };
}
