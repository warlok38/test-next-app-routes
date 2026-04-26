import { fencesMock, servicesMock, slidesMock } from "@/lib/api/mockDb";
import type {
  FenceMonth,
  FenceMonthUpdatePayload,
  GroupCreateRequest,
  Service,
  Slide,
  SlideCreateRequest,
  SlideUpdatePayload,
} from "@/lib/api/types";

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const GROUP_ID_PREFIX = "group";

const createUuid = () => {
  if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
};

function cloneSlides(items: Slide[]): Slide[] {
  return items.map((item) => ({
    ...item,
    children: item.children?.length ? cloneSlides(item.children) : undefined,
  }));
}

function hasSlideWithId(items: Slide[], slideId: string): boolean {
  return items.some((item) => item.id === slideId || (item.children ? hasSlideWithId(item.children, slideId) : false));
}

function findSlideByGroupId(items: Slide[], groupId: string): Slide | undefined {
  for (const item of items) {
    if (item.groupId === groupId || item.id === groupId) {
      return item;
    }
    if (item.children?.length) {
      const nestedMatch = findSlideByGroupId(item.children, groupId);
      if (nestedMatch) {
        return nestedMatch;
      }
    }
  }

  return undefined;
}

function sortByOrder(items: Slide[]) {
  items.sort((left, right) => {
    const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder === rightOrder) {
      return left.name.localeCompare(right.name, "ru");
    }
    return leftOrder - rightOrder;
  });
}

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

  return cloneSlides(slides);
}

export async function getFencesDetail(serviceId: string): Promise<FenceMonth[]> {
  await sleep(1500);
  const fences = fencesMock[serviceId];

  if (!fences) {
    throw new Error(`Fences for service with id "${serviceId}" not found`);
  }

  return fences.map((item) => ({ ...item }));
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

export async function createGroup(payload: GroupCreateRequest): Promise<Slide> {
  await sleep(450);

  const serviceSlides = slidesMock[payload.serviceId];
  if (!serviceSlides) {
    throw new Error(`Service with id "${payload.serviceId}" not found`);
  }

  const groupId = createUuid();
  const groupSlide: Slide = {
    id: `${GROUP_ID_PREFIX}-${groupId.slice(0, 8)}`,
    serviceId: payload.serviceId,
    groupId,
    isGroup: true,
    name: payload.name,
    order: payload.order,
    status: "draft",
    isVisible: true,
    isFeatured: false,
    children: [],
  };

  serviceSlides.push(groupSlide);
  sortByOrder(serviceSlides);

  console.log("createGroup payload", {
    method: "POST",
    endpoint: "/groups",
    body: payload,
    groupId,
  });

  return { ...groupSlide, children: [] };
}

export async function createSlide(payload: SlideCreateRequest): Promise<Slide> {
  await sleep(450);

  const serviceSlides = slidesMock[payload.serviceId];
  if (!serviceSlides) {
    throw new Error(`Service with id "${payload.serviceId}" not found`);
  }

  if (hasSlideWithId(serviceSlides, payload.id)) {
    throw new Error(`Slide with id "${payload.id}" already exists`);
  }

  const parentGroup = payload.groupId ? findSlideByGroupId(serviceSlides, payload.groupId) : undefined;
  if (payload.groupId && !parentGroup) {
    throw new Error(`Group with id "${payload.groupId}" not found`);
  }

  const createdSlide: Slide = {
    id: payload.id,
    serviceId: payload.serviceId,
    groupId: payload.groupId,
    name: payload.name,
    description: payload.description,
    imageUrl: payload.imageUrl,
    category: payload.category,
    status: payload.status ?? "draft",
    isVisible: payload.isVisible ?? true,
    isFeatured: payload.isFeatured ?? false,
    order: payload.order,
  };

  if (parentGroup) {
    const nextChildren = [...(parentGroup.children ?? []), createdSlide];
    sortByOrder(nextChildren);
    parentGroup.children = nextChildren;
  } else {
    serviceSlides.push(createdSlide);
    sortByOrder(serviceSlides);
  }

  console.log("createSlide payload", {
    method: "POST",
    endpoint: "/slides",
    body: payload,
  });

  return { ...createdSlide };
}
