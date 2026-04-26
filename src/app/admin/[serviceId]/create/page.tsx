import { AdminRtkContainer } from "@/components/admin/AdminRtkContainer";

type CreatePageProps = {
  params: {
    serviceId: string;
  };
};

export default function CreatePage({ params }: CreatePageProps) {
  return <AdminRtkContainer initialServiceId={params.serviceId} isCreatePage />;
}
