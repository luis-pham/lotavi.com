import { ResourcePage } from "@/components/console/ResourcePage";
export default function Page() { return <ResourcePage title="Notifications" description="Updates, mentions, and assignment changes." endpoint="/api/v1/staff/notifications" singular="Notification" readOnly />; }
