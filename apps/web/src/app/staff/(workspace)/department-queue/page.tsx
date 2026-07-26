import { ResourcePage } from "@/components/console/ResourcePage";
export default function Page() { return <ResourcePage title="Department queue" description="Unassigned and shared work for your department." endpoint="/api/v1/staff/department-queue" singular="Request" readOnly />; }
