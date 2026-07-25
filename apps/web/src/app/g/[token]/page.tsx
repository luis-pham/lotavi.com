import type { Metadata } from "next";
import { GuestPortal } from "@/components/GuestPortal";

export const metadata: Metadata = {
  title: "Guest Portal",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function GuestQrPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <GuestPortal token={token} />;
}
