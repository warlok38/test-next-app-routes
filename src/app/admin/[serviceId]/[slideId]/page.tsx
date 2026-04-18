import { AdminRtkContainer } from "@/components/admin/AdminRtkContainer";

type SlidePageProps = {
  params: {
    serviceId: string;
    slideId: string;
  };
};

export default function SlidePage({ params }: SlidePageProps) {
  return <AdminRtkContainer initialServiceId={params.serviceId} initialSlideId={params.slideId} />;
}
