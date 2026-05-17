/** Map thrown error keys (error.*) to localized strings. */
export function translateError(t, message) {
  if (typeof message === "string" && message.startsWith("error.")) {
    return t(message);
  }
  return message;
}
