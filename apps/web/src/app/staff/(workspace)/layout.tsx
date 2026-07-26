import { ConsoleLayout } from "@/components/console/ConsoleLayout";

export default function StaffWorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <ConsoleLayout role="staff">{children}</ConsoleLayout>;
}
