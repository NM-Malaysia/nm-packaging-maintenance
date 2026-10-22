const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function maintenanceBack(value?: string): string {
  if (!value) return "/maintenance";
  try {
    const url = new URL(value, "https://maintenance.invalid");
    if (url.origin !== "https://maintenance.invalid"
        || url.pathname !== "/maintenance") return "/maintenance";
    const clean = new URLSearchParams();
    for (const key of ["q", "tab", "status", "department", "member", "from", "to", "page"]) {
      const item = url.searchParams.get(key);
      if (item) clean.set(key, item);
    }
    const query = clean.toString();
    return "/maintenance" + (query ? "?" + query : "");
  } catch {
    return "/maintenance";
  }
}

export function maintenanceResult(formData: FormData, result: string): string {
  const value = String(formData.get("return_to") ?? "");
  try {
    const url = new URL(value, "https://maintenance.invalid");
    const parts = url.pathname.split("/");
    if (url.origin === "https://maintenance.invalid"
        && parts.length === 3 && parts[1] === "maintenance"
        && uuid.test(parts[2])) {
      const query = new URLSearchParams();
      const back = maintenanceBack(url.searchParams.get("back") ?? undefined);
      if (back !== "/maintenance") query.set("back", back);
      query.set("result", result);
      return url.pathname + "?" + query.toString();
    }
  } catch {}
  return "/maintenance?result=" + encodeURIComponent(result);
}
