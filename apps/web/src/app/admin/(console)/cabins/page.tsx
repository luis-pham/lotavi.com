import { ResourcePage } from "@/components/console/ResourcePage";
export default function Page() { return <ResourcePage title="Cabins" description="Manage cabins, occupancy, and service status." endpoint="/api/v1/admin/cabins" singular="Cabin" />; }
