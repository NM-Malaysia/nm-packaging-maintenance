import { getMyLanguage } from "@/utils/language";
import { actionText, actionTitle } from "@/utils/actionTranslations";
import Link from "next/link";
import { cache } from "react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

type Action = {
  action_key: string;
  request_id: string | null;
  mrf_number: string | null;
  machine_name: string;
  title: string;
  action_label: string;
  href: string;
  action_since: string;
  priority: number;
  is_unread: boolean;
};

const pmTranslations: Record<string, Record<string, string>> = {
  ms: {
    "PM reminder": "Peringatan PM",
    "PM MRF needs to be issued": "MRF PM perlu dikeluarkan",
    "Issue PM MRF": "Keluarkan MRF PM",
    "Planned PM date": "Tarikh PM dirancang",
    "Overdue": "Lewat",
    "Due today": "Perlu dibuat hari ini",
    "Upcoming": "Akan datang",
  },
  zh: {
    "PM reminder": "保养提醒",
    "PM MRF needs to be issued": "需要发出保养 MRF",
    "Issue PM MRF": "发出保养 MRF",
    "Planned PM date": "计划保养日期",
    "Overdue": "已逾期",
    "Due today": "今天到期",
    "Upcoming": "即将到期",
  },
  ne: {
    "PM reminder": "PM सम्झना",
    "PM MRF needs to be issued": "PM MRF जारी गर्न आवश्यक छ",
    "Issue PM MRF": "PM MRF जारी गर्नुहोस्",
    "Planned PM date": "योजनाबद्ध PM मिति",
    "Overdue": "म्याद नाघेको",
    "Due today": "आजको म्याद",
    "Upcoming": "आगामी",
  },
};

function pmText(language: string, text: string) {
  return pmTranslations[language]?.[text] ?? text;
}

function malaysiaToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

function pmDateFromKey(key: string) {
  const match = key.match(
    /^pm_issue:[0-9a-f-]{36}:(\d{4}-\d{2}-\d{2})$/i
  );

  return match?.[1] ?? null;
}

const loadActions = cache(async (page: number) => {
  const supabase = await createClient();

  const [list, unread] = await Promise.all([
    supabase
      .rpc("my_maintenance_actions", {}, { count: "exact" })
      .range((page - 1) * 10, page * 10 - 1),
    supabase
      .rpc("my_maintenance_actions", {}, {
        count: "exact",
        head: true,
      })
      .eq("is_unread", true),
  ]);

  return {
    items: (list.data ?? []) as Action[],
    total: list.count ?? 0,
    unread: unread.count ?? 0,
    error: Boolean(list.error || unread.error),
  };
});

async function handleAction(formData: FormData) {
  "use server";

  const key = String(formData.get("action_key") ?? "");
  const since = String(formData.get("action_since") ?? "");
  const intent = String(formData.get("intent") ?? "");

  if (
    !key ||
    key.length > 300 ||
    !since ||
    !["read", "open"].includes(intent)
  ) {
    redirect("/my-actions?result=changed");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get the current destination from the server.
  const { data, error } = await supabase
    .rpc("my_maintenance_actions")
    .eq("action_key", key)
    .eq("action_since", since)
    .maybeSingle();

  const item = data as Action | null;

  if (error || !item) {
    redirect("/my-actions?result=changed");
  }

  const marked = await supabase.rpc("mark_maintenance_action_read", {
    p_key: key,
    p_since: since,
  });

  if (marked.error) {
    redirect("/my-actions?result=changed");
  }

  revalidatePath("/");
  revalidatePath("/my-actions");

  if (intent === "open") {
    const destination = item.href;

    if (
      destination.startsWith("/") &&
      !destination.startsWith("//") &&
      !destination.includes("\\") &&
      !/[\r\n]/.test(destination)
    ) {
      redirect(destination);
    }
  }

  redirect("/my-actions");
}

export async function NotificationBell() {
  const language = await getMyLanguage();

  const t = (
    text: string,
    values: Record<string, string | number> = {}
  ) => actionText(language, text, values);

  const result = await loadActions(1);

  return (
    <Link
      href="/my-actions"
      aria-label={
        result.error
          ? t("Notifications unavailable. Open My Actions.")
          : t("My Actions, {count} unread", {
              count: result.unread,
            })
      }
      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-blue-700 hover:bg-blue-50"
    >
      <span aria-hidden="true">🔔</span>
      <span>{t("My Actions")}</span>

      {result.error ? (
        <span className="text-xs text-slate-500">
          {t("Unavailable")}
        </span>
      ) : (
        <span className="rounded-full bg-blue-700 px-2 py-0.5 text-xs text-white">
          {result.unread}
        </span>
      )}
    </Link>
  );
}

function elapsed(value: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - Date.parse(value)) / 60000)
  );

  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);

  return hours < 24
    ? `${hours}h ${minutes % 60}m`
    : `${Math.floor(hours / 24)}d ${hours % 24}h`;
}

export default async function MyActions({
  compact = false,
  page = 1,
}: {
  compact?: boolean;
  page?: number;
}) {
  const language = await getMyLanguage();

  const t = (
    text: string,
    values: Record<string, string | number> = {}
  ) => actionText(language, text, values);

  const pt = (text: string) => pmText(language, text);

  const result = await loadActions(page);
  const items = compact ? result.items.slice(0, 5) : result.items;
  const pages = Math.max(1, Math.ceil(result.total / 10));
  const today = malaysiaToday();

  const priorities: Record<number, string> = {
    1: "Urgent",
    2: "High",
    3: "Normal",
    4: "Low",
  };

  return (
    <section
      id="my-actions"
      className="mb-8 rounded-xl border bg-white p-5 text-slate-900 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{t("My Actions")}</h2>

        {compact && (
          <Link
            href="/my-actions"
            className="font-semibold text-blue-700 hover:underline"
          >
            {t("View all →")}
          </Link>
        )}
      </div>

      <p className="mt-2 text-sm text-slate-600">
        {result.error
          ? t("Actions are temporarily unavailable.")
          : t("{total} outstanding · {unread} unread", {
              total: result.total,
              unread: result.unread,
            })}
        {" "}
        {t(
          "Reading clears the unread indicator. The action remains until the required work is completed. Refresh to update."
        )}
      </p>

      {result.error ? (
        <p role="alert" className="mt-4 text-red-700">
          {t("Your actions could not be loaded. Please refresh.")}
        </p>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {items.map((item) => {
              const plannedDate = pmDateFromKey(item.action_key);
              const isPmReminder = plannedDate !== null;

              const pmStatus = !plannedDate
                ? null
                : plannedDate < today
                  ? "Overdue"
                  : plannedDate === today
                    ? "Due today"
                    : "Upcoming";

              const cardStyle =
                pmStatus === "Overdue"
                  ? "border-red-300 bg-red-50"
                  : pmStatus === "Due today"
                    ? "border-amber-300 bg-amber-50"
                    : item.is_unread
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-200";

              return (
                <article
                  key={item.action_key}
                  className={`rounded-lg border p-4 ${cardStyle}`}
                >
                  <div className="flex flex-wrap justify-between gap-2 text-sm">
                    <p className="font-semibold">
                      {isPmReminder
                        ? `${pt("PM reminder")} · ${item.machine_name}`
                        : `MRF ${item.mrf_number} · ${item.machine_name}`}
                    </p>

                    <p>
                      {isPmReminder && pmStatus ? (
                        <span
                          className={
                            pmStatus === "Overdue"
                              ? "font-semibold text-red-700"
                              : pmStatus === "Due today"
                                ? "font-semibold text-amber-800"
                                : "font-semibold text-blue-700"
                          }
                        >
                          {pt(pmStatus)}
                        </span>
                      ) : (
                        t(priorities[item.priority] ?? "Normal")
                      )}
                      {" · "}
                      {t(item.is_unread ? "Unread" : "Read")}
                    </p>
                  </div>

                  <h3 className="mt-2 font-semibold">
                    {isPmReminder
                      ? pt(item.title)
                      : actionTitle(language, item.title)}
                  </h3>

                  {isPmReminder && (
                    <p className="mt-2 text-sm font-medium">
                      {pt("Planned PM date")}: {plannedDate}
                    </p>
                  )}

                  <p className="mt-2 text-sm text-slate-600">
                    {t("Action waiting")}: {elapsed(item.action_since)}
                    {" · "}
                    {t("Since")}{" "}
                    {new Date(item.action_since).toLocaleString(
                      "en-MY",
                      { timeZone: "Asia/Kuala_Lumpur" }
                    )}{" "}
                    ({t("Malaysia time")})
                  </p>

                  <form
                    action={handleAction}
                    className="mt-3 flex flex-wrap gap-3"
                  >
                    <input
                      type="hidden"
                      name="action_key"
                      value={item.action_key}
                    />
                    <input
                      type="hidden"
                      name="action_since"
                      value={item.action_since}
                    />

                    <button
                      name="intent"
                      value="open"
                      className="rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white"
                    >
                      {isPmReminder
                        ? pt(item.action_label)
                        : t(item.action_label)}{" "}
                      →
                    </button>

                    {item.is_unread && (
                      <button
                        name="intent"
                        value="read"
                        className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-700"
                      >
                        {t("Mark as read")}
                      </button>
                    )}
                  </form>
                </article>
              );
            })}

            {!items.length && (
              <p className="rounded-lg bg-slate-50 p-4">
                {result.total === 0
                  ? t("No outstanding actions for your account.")
                  : t("No actions on this page. Return to page 1.")}
              </p>
            )}
          </div>

          {compact && result.total > items.length && (
            <Link
              href="/my-actions"
              className="mt-4 inline-block text-blue-700"
            >
              {t("View all {count} actions →", {
                count: result.total,
              })}
            </Link>
          )}

          {!compact && (
            <nav
              aria-label={t("Action pages")}
              className="mt-5 flex flex-wrap justify-between gap-3 text-blue-700"
            >
              <span>
                {page > 1 && (
                  <Link href={`/my-actions?page=${page - 1}`}>
                    {t("← Previous")}
                  </Link>
                )}
              </span>

              <Link href="/my-actions">
                {t("Page {page} of {pages}", { page, pages })}
              </Link>

              <span>
                {page < pages && (
                  <Link href={`/my-actions?page=${page + 1}`}>
                    {t("Next →")}
                  </Link>
                )}
              </span>
            </nav>
          )}
        </>
      )}
    </section>
  );
}