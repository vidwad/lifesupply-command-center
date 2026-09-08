export function isLifeSupplyPublicHost(host: string | null | undefined) {
  if (process.env.PUBLIC_SITE_MODE === "true") return true;

  const normalizedHost = ((host ?? "").split(":")[0] ?? "").trim().toLowerCase();
  const configuredHosts = (process.env.PUBLIC_SITE_HOSTS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return configuredHosts.includes(normalizedHost);
}
