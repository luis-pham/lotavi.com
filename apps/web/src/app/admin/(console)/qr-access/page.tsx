import { ResourcePage } from "@/components/console/ResourcePage";
export default function Page() { return <ResourcePage title="QR access" description="Issue and revoke guest portal access codes." endpoint="/api/v1/admin/qr" singular="QR access" />; }
