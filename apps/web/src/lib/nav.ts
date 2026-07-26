export type ConsoleNavItem = {
  label: string;
  href: string;
  icon: string;
  group?: string;
};

export const ADMIN_NAV: ConsoleNavItem[] = [
  { label: "Overview", href: "/admin/overview", icon: "⌂", group: "Operations" },
  { label: "Requests", href: "/admin/requests", icon: "⇄" },
  { label: "Guests", href: "/admin/guests", icon: "◎" },
  { label: "Cabins", href: "/admin/cabins", icon: "▦" },
  { label: "Journeys", href: "/admin/journeys", icon: "↗" },
  { label: "Announcements", href: "/admin/announcements", icon: "◉" },
  { label: "Portal content", href: "/admin/portal-content", icon: "◫", group: "Portal" },
  { label: "Categories", href: "/admin/categories", icon: "◇" },
  { label: "QR access", href: "/admin/qr-access", icon: "⌗" },
  { label: "Staff", href: "/admin/staff", icon: "♙", group: "Organization" },
  { label: "Departments", href: "/admin/departments", icon: "⊞" },
  { label: "Settings", href: "/admin/settings", icon: "⚙", group: "System" },
];

export const STAFF_NAV: ConsoleNavItem[] = [
  { label: "My work", href: "/staff/my-work", icon: "✓", group: "Workspace" },
  { label: "Department queue", href: "/staff/department-queue", icon: "≡" },
  { label: "Lookup", href: "/staff/lookup", icon: "⌕" },
  { label: "Shift activity", href: "/staff/shift-activity", icon: "◷" },
  { label: "Handover", href: "/staff/handover", icon: "⇥" },
  { label: "Notifications", href: "/staff/notifications", icon: "◉", group: "Account" },
  { label: "Profile", href: "/staff/profile", icon: "○" },
];
