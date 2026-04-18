import { getServices, getServicesDetail } from "@/lib/api/services";
import type { Service, Slide } from "@/lib/api/types";

export type AdminData = {
  services: Service[];
  slides: Slide[];
  selectedServiceId?: string;
  selectedSlideId?: string;
  error?: string;
};

export async function loadAdminData(params?: {
  serviceId?: string;
  slideId?: string;
}): Promise<AdminData> {
  const services = await getServices().catch(() => []);

  if (!services.length) {
    return { services: [], slides: [], error: "Не удалось загрузить список сервисов" };
  }

  const selectedServiceId = params?.serviceId ?? services[0].id;

  try {
    const slides = await getServicesDetail(selectedServiceId);
    const requestedSlideId = params?.slideId;
    if (requestedSlideId && !slides.some((slide) => slide.id === requestedSlideId)) {
      return {
        services,
        slides,
        selectedServiceId,
        error: `Слайд с id "${requestedSlideId}" не найден`,
      };
    }

    return {
      services,
      slides,
      selectedServiceId,
      selectedSlideId: requestedSlideId,
    };
  } catch (error) {
    const text = error instanceof Error ? error.message : "Не удалось загрузить данные";
    return {
      services,
      slides: [],
      selectedServiceId,
      error: text,
    };
  }
}
