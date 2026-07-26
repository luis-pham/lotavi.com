import { ConsoleLayout } from "@/components/console/ConsoleLayout";

export default function AdminConsoleLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleLayout role="admin">{children}</ConsoleLayout>;
}
