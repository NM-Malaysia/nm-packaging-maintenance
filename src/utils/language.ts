import "server-only";
import { cache } from "react";
import { createClient } from "@/utils/supabase/server";

export const languages = {
  en: "English",
  ms: "Bahasa Melayu",
  zh: "中文",
  ne: "नेपाली",
} as const;

export type Language = keyof typeof languages;

export function isLanguage(value: string): value is Language {
  return Object.prototype.hasOwnProperty.call(languages, value);
}

const dictionaries = {
  en: {
    navigation: "Main navigation",
    dashboard: "Dashboard",
    requests: "Requests",
    newRequest: "New Request",
    approvals: "HOD Approvals",
    employees: "Employees",
    signOut: "Sign out",
    language: "Language",
    apply: "Apply",
  },
  ms: {
    navigation: "Navigasi utama",
    dashboard: "Papan Pemuka",
    requests: "Permohonan",
    newRequest: "Permohonan Baharu",
    approvals: "Kelulusan Ketua Jabatan",
    employees: "Pekerja",
    signOut: "Log keluar",
    language: "Bahasa",
    apply: "Guna",
  },
  zh: {
    navigation: "主导航",
    dashboard: "仪表板",
    requests: "维修申请",
    newRequest: "新建申请",
    approvals: "部门主管审批",
    employees: "员工管理",
    signOut: "退出登录",
    language: "语言",
    apply: "应用",
  },
  ne: {
    navigation: "मुख्य नेभिगेसन",
    dashboard: "ड्यासबोर्ड",
    requests: "अनुरोधहरू",
    newRequest: "नयाँ अनुरोध",
    approvals: "विभाग प्रमुखको स्वीकृति",
    employees: "कर्मचारीहरू",
    signOut: "लग आउट",
    language: "भाषा",
    apply: "लागू गर्नुहोस्",
  },
} as const;

export const getMyLanguage = cache(async (): Promise<Language> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "en";

  const { data, error } = await supabase
    .from("employee_language_preferences")
    .select("language_code")
    .eq("employee_id", user.id)
    .maybeSingle();

  if (error || !data || !isLanguage(data.language_code)) return "en";
  return data.language_code;
});

export function navigationText(language: Language) {
  return dictionaries[language];
}
