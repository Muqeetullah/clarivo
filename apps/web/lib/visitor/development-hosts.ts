import { isHostAllowed } from "@clarivo/shared";

export function hostAllowed(host: string, domains: readonly string[]) {
  return isHostAllowed(host, domains, process.env.NODE_ENV === "production");
}

export function frameAncestors(domains: readonly string[]) {
  const hosts = [...domains];
  if (process.env.NODE_ENV !== "production") hosts.push("localhost");
  return hosts.length
    ? `frame-ancestors ${hosts.flatMap((host) => [`https://${host}:*`, `http://${host}:*`]).join(" ")}`
    : "frame-ancestors 'none'";
}
