import { ResourcePage } from "@/components/console/ResourcePage";
export default function Page() { return <ResourcePage title="Shift activity" description="A chronological record of work during this shift." endpoint="/api/v1/staff/shift-activity" singular="Activity" readOnly />; }
