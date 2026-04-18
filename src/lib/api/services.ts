import { servicesMock, slidesMock } from '@/lib/api/mockDb';
import type { Service, Slide, SlideUpdatePayload } from '@/lib/api/types';

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

export async function updateService(params: {
  serviceId: string;
  fields: SlideUpdatePayload[];
}): Promise<void> {
  await sleep(450);

  const { serviceId, fields } = params;
  console.log('updateService payload', {
    serviceId,
    method: 'PATCH',
    fields,
  });
}
