import { ResourcePage } from "@/components/console/ResourcePage";
export default function Page() { return <ResourcePage title="Lookup" description="Find guests, cabins, and request history." endpoint="/api/v1/staff/lookup" singular="Result" readOnly />; }
