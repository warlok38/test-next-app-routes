import type { ReactNode } from "react";
import { ServiceProvider } from "@/lib/state/slideDraftsContext";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <ServiceProvider>{children}</ServiceProvider>;
}
