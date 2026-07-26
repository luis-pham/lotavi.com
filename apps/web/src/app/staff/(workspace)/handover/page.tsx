import { ResourcePage } from "@/components/console/ResourcePage";
export default function Page() { return <ResourcePage title="Handover" description="Record context the next shift needs to know." endpoint="/api/v1/staff/handover" singular="Handover note" />; }
