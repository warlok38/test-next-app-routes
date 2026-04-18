import type { ReactNode } from "react";
import { SlideDraftsProvider } from "@/lib/state/slideDraftsContext";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <SlideDraftsProvider>{children}</SlideDraftsProvider>;
}
