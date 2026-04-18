import { AdminRtkContainer } from "@/components/admin/AdminRtkContainer";

type ServicePageProps = {
  params: {
    serviceId: string;
  };
};

export default function ServicePage({ params }: ServicePageProps) {
  return <AdminRtkContainer initialServiceId={params.serviceId} />;
}
