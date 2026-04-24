import { fencesMock, servicesMock, slidesMock } from "@/lib/api/mockDb";
import type {
  FenceMonth,
  FenceMonthUpdatePayload,
  Service,
  Slide,
  SlideUpdatePayload,
} from "@/lib/api/types";

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export async function getServices(): Promise<Service[]> {
  await sleep(1300);
  return servicesMock;
}

export async function getServicesDetail(serviceId: string): Promise<Slide[]> {
  await sleep(1500);
  const slides = slidesMock[serviceId];

  if (!slides) {
    throw new Error(`Service with id "${serviceId}" not found`);
  }

  return slides;
}

export async function getFencesDetail(serviceId: string): Promise<FenceMonth[]> {
  await sleep(1500);
  const fences = fencesMock[serviceId];

  if (!fences) {
    throw new Error(`Fences for service with id "${serviceId}" not found`);
  }

  return fences;
}

export async function updateSlidesByServiceId(params: {
  serviceId: string;
  fields: SlideUpdatePayload[];
}): Promise<void> {
  await sleep(450);

  const { serviceId, fields } = params;
  console.log("updateSlidesByServiceId payload", {
    serviceId,
    method: "PATCH",
    fields,
  });
}

export async function updateFencesByServiceId(params: {
  serviceId: string;
  fields: FenceMonthUpdatePayload[];
}): Promise<void> {
  await sleep(450);

  const { serviceId, fields } = params;
  console.log("updateFencesByServiceId payload", {
    serviceId,
    method: "PATCH",
    fields,
  });
}
