import { ResourcePage } from "@/components/console/ResourcePage";
export default function Page() { return <ResourcePage title="Departments" description="Configure operational teams and ownership." endpoint="/api/v1/admin/departments" singular="Department" />; }
