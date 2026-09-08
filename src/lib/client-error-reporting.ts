/** Client-side error hook. Integrate a monitoring provider here when one is chosen. */
export function reportClientError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  console.error("[AutoConnect] client error", { error, route: window.location.pathname, ...context });
}
