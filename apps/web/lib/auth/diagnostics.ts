// Deliberately omit messages, stacks, URLs, headers, bodies and identity values.
// Only allow bounded machine-readable classifications into server logs.
export function logAuthFailure(
  operation: "handler" | "session" | "proxy",
  error: unknown,
) {
  const value = error && typeof error === "object" ? error : {};
  const status =
    "status" in value && typeof value.status === "number"
      ? value.status
      : undefined;
  const rawCode = "code" in value ? value.code : undefined;
  const code =
    typeof rawCode === "string" && /^[A-Z_]{1,64}$/.test(rawCode)
      ? rawCode
      : undefined;
  const name =
    error instanceof Error &&
    [
      "Error",
      "TypeError",
      "SyntaxError",
      "ZodError",
      "AuthError",
      "AuthApiError",
      "AbortError",
      "TimeoutError",
    ].includes(error.name)
      ? error.name
      : undefined;
  const cause =
    "cause" in value && value.cause && typeof value.cause === "object"
      ? value.cause
      : {};
  const causeCode =
    "code" in cause &&
    typeof cause.code === "string" &&
    /^[A-Z_]{1,64}$/.test(cause.code)
      ? cause.code
      : undefined;
  console.error("[clarivo:auth]", {
    operation,
    name,
    causeCode,
    status,
    code,
    kind: error instanceof Error ? "exception" : "upstream",
  });
}
