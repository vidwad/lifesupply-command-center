const DEFAULT_COMMAND_CENTER_URL = "https://lifesupply-cc-web.onrender.com";

function normalizeCommandCenterBaseUrl(value: string | undefined) {
  const candidate = value?.trim() || DEFAULT_COMMAND_CENTER_URL;
  const url = new URL(candidate);

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("NEXT_PUBLIC_COMMAND_CENTER_URL must use HTTP or HTTPS");
  }

  return url;
}

/**
 * Returns the Render-hosted Command Center login destination. This deliberately
 * stays external to Vercel so public visitors never authenticate against the
 * public-only deployment.
 */
export function getCommandCenterLoginUrl() {
  const url = normalizeCommandCenterBaseUrl(process.env.NEXT_PUBLIC_COMMAND_CENTER_URL);
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("redirectTo", "/dashboard");
  return url.toString();
}
