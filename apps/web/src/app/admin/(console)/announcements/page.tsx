import { ResourcePage } from "@/components/console/ResourcePage";
export default function Page() { return <ResourcePage title="Announcements" description="Publish time-sensitive updates to guests." endpoint="/api/v1/admin/announcements" singular="Announcement" />; }
