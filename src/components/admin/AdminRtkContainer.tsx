"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { useGetServicesDetailQuery, useGetServicesQuery } from "@/lib/store/adminApi";
import { findSlideById } from "@/lib/slides/tree";

type AdminRtkContainerProps = {
  initialServiceId?: string;
  initialSlideId?: string;
  isCreatePage?: boolean;
};

export function AdminRtkContainer({
  initialServiceId,
  initialSlideId,
  isCreatePage = false,
}: AdminRtkContainerProps) {
  const router = useRouter();
  const servicesQuery = useGetServicesQuery();
  const services = servicesQuery.data || [];

  const selectedServiceId = initialServiceId ?? services[0]?.id;

  const firstServiceId = services[0]?.id;

  useEffect(() => {
    if (
      initialServiceId !== undefined ||
      servicesQuery.isError ||
      !servicesQuery.isSuccess ||
      !firstServiceId
    ) {
      return;
    }
    router.replace(`/admin/${firstServiceId}`);
  }, [initialServiceId, router, firstServiceId, servicesQuery.isError, servicesQuery.isSuccess]);

  const slidesQuery = useGetServicesDetailQuery(
    { serviceId: selectedServiceId ?? "" },
    { skip: !selectedServiceId }
  );
  const slides = slidesQuery.data || [];

  const servicesError =
    typeof servicesQuery.error === "object" && servicesQuery.error && "error" in servicesQuery.error
      ? String((servicesQuery.error as { error?: unknown }).error ?? "Не удалось загрузить сервисы")
      : servicesQuery.error
        ? "Не удалось загрузить сервисы"
        : undefined;

  const slidesError =
    typeof slidesQuery.error === "object" && slidesQuery.error && "error" in slidesQuery.error
      ? String((slidesQuery.error as { error?: unknown }).error ?? "Не удалось загрузить слайды")
      : slidesQuery.error
        ? "Не удалось загрузить слайды"
        : undefined;

  const slideNotFoundError =
    !isCreatePage && initialSlideId && slides.length > 0 && !findSlideById(slides, initialSlideId)
      ? `Слайд с id "${initialSlideId}" не найден`
      : undefined;

  const detailError = slidesError ?? slideNotFoundError;

  const selectedSlideId =
    !isCreatePage && initialSlideId && findSlideById(slides, initialSlideId) ? initialSlideId : undefined;

  return (
    <AdminShell
      services={services}
      slides={slides}
      selectedServiceId={selectedServiceId}
      selectedSlideId={selectedSlideId}
      servicesError={servicesError}
      error={detailError}
      servicesLoading={servicesQuery.isFetching}
      slidesLoading={slidesQuery.isFetching}
      isCreatePage={isCreatePage}
    />
  );
}

