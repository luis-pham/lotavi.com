import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "@/i18n/config";

/**
 * Fallback if middleware is bypassed. Prefer middleware 307 with Accept-Language.
 */
export default function RootPage() {
  redirect(`/${DEFAULT_LOCALE}/`);
}
