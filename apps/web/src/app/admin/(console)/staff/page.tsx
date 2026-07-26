import { ResourcePage } from "@/components/console/ResourcePage";
export default function Page() { return <ResourcePage title="Staff" description="Manage team access, roles, and availability." endpoint="/api/v1/admin/staff" singular="Staff member" />; }
