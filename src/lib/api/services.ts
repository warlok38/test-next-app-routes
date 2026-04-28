import { fencesMock, groupsMock, normalizeGroupsOrder, servicesMock, slidesMock } from "@/lib/api/mockDb";
import type {
  CommonSlide,
  FencesByKey,
  FenceUpdatePayload,
  GroupListItem,
  GroupCreateRequest,
  GroupUpdateQuery,
  GroupUpdateRequest,
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
const ROOT_LEVEL_KEY = "__root__";

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

function compareSlidesByOrder(left: Slide, right: Slide): number {
  const leftOrder = Number.isFinite(left.order) ? left.order : Number.MAX_SAFE_INTEGER;
  const rightOrder = Number.isFinite(right.order) ? right.order : Number.MAX_SAFE_INTEGER;
  if (leftOrder === rightOrder) {
    return left.name.localeCompare(right.name, "ru");
  }
  return leftOrder - rightOrder;
}

function clampOrder(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function cloneGroups(items: GroupListItem[]): GroupListItem[] {
  return items.map((item) => ({ ...item }));
}

function toCommonSlide(slide: Slide): CommonSlide {
  const commonSlide: CommonSlide = {
    id: slide.id,
    groupId: slide.groupId,
    name: slide.name,
    description: slide.description,
    imageUrl: slide.imageUrl,
    category: slide.category,
    status: slide.status,
    isVisible: slide.isVisible,
    isFeatured: slide.isFeatured,
    isGroup: slide.isGroup,
    order: slide.order,
  };

  if (slide.children?.length) {
    commonSlide.children = slide.children.map((child) => toCommonSlide(child));
  }

  return commonSlide;
}

function cloneCommonSlide(slide: CommonSlide): CommonSlide {
  return {
    ...slide,
    children: slide.children?.length ? slide.children.map((child) => cloneCommonSlide(child)) : undefined,
  };
}

function collectCommonSlides(items: Slide[], commonById: Map<string, CommonSlide>) {
  items.forEach((slide) => {
    if (!commonById.has(slide.id)) {
      commonById.set(slide.id, toCommonSlide(slide));
    }
    if (slide.children?.length) {
      collectCommonSlides(slide.children, commonById);
    }
  });
}

const standaloneCommonSlides: CommonSlide[] = [
  {
    id: "u-1",
    name: "Universal Overview",
    description: "Shared slide template that is not attached to any service yet",
    status: "draft",
    isVisible: true,
    isFeatured: false,
    order: 1,
  },
  {
    id: "u-2",
    name: "Universal Roadmap",
    description: "Shared roadmap slide available for future services",
    status: "draft",
    isVisible: true,
    isFeatured: false,
    order: 2,
  },
  {
    id: "u-3",
    name: "Universal KPI Snapshot",
    description: "Common KPI slide prepared in the global pool",
    status: "review",
    isVisible: true,
    isFeatured: true,
    order: 3,
  },
];

const commonSlidesById = new Map<string, CommonSlide>();
Object.values(slidesMock).forEach((serviceSlides) => {
  collectCommonSlides(serviceSlides, commonSlidesById);
});
standaloneCommonSlides.forEach((slide) => {
  commonSlidesById.set(slide.id, cloneCommonSlide(slide));
});

function upsertCommonSlide(slide: Slide) {
  if (!commonSlidesById.has(slide.id)) {
    commonSlidesById.set(slide.id, toCommonSlide(slide));
    return;
  }

  const current = commonSlidesById.get(slide.id);
  if (!current) {
    return;
  }

  current.description = slide.description;
  current.imageUrl = slide.imageUrl;
  current.category = slide.category;
  current.status = slide.status;
  current.isFeatured = slide.isFeatured;
  current.isGroup = slide.isGroup;
  current.groupId = slide.groupId;
}

function normalizeGlobalGroups() {
  const normalized = normalizeGroupsOrder(groupsMock);
  groupsMock.splice(0, groupsMock.length, ...normalized);
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
  items.sort(compareSlidesByOrder);
}

function normalizeLevelOrder(items: Slide[]) {
  sortByOrder(items);
  items.forEach((item, index) => {
    item.order = index + 1;
  });
}

function normalizeTreeOrder(items: Slide[]) {
  normalizeLevelOrder(items);
  items.forEach((item) => {
    if (item.children?.length) {
      normalizeTreeOrder(item.children);
    }
  });
}

function getTargetLevel(
  serviceSlides: Slide[],
  serviceId: string,
  groupId?: string,
): { level: Slide[]; levelKey: string } {
  if (!groupId) {
    return { level: serviceSlides, levelKey: ROOT_LEVEL_KEY };
  }

  let parentGroup = findSlideByGroupId(serviceSlides, groupId);
  if (!parentGroup) {
    const group = groupsMock.find((item) => item.id === groupId);
    if (!group) {
      throw new Error(`Group with id "${groupId}" not found`);
    }

    parentGroup = {
      id: `${GROUP_ID_PREFIX}-${group.id.slice(0, 8)}`,
      serviceId,
      groupId: group.id,
      isGroup: true,
      name: group.name,
      order: serviceSlides.length + 1,
      status: "draft",
      isVisible: true,
      isFeatured: false,
      children: [],
    };
    serviceSlides.push(parentGroup);
    normalizeLevelOrder(serviceSlides);
  }

  if (!parentGroup.children) {
    parentGroup.children = [];
  }

  return {
    level: parentGroup.children,
    levelKey: parentGroup.groupId ?? parentGroup.id,
  };
}

function visitSlides(items: Slide[], visitor: (slide: Slide) => void) {
  items.forEach((item) => {
    visitor(item);
    if (item.children?.length) {
      visitSlides(item.children, visitor);
    }
  });
}

function findLevelByKey(items: Slide[], levelKey: string): Slide[] | undefined {
  if (levelKey === ROOT_LEVEL_KEY) {
    return items;
  }

  const parent = findSlideByGroupId(items, levelKey);
  return parent?.children;
}

export async function getServices(): Promise<Service[]> {
  await sleep(1300);
  return servicesMock;
}

export async function getAllSlides(): Promise<CommonSlide[]> {
  await sleep(900);
  return Array.from(commonSlidesById.values())
    .map((slide) => cloneCommonSlide(slide))
    .sort((left, right) => left.id.localeCompare(right.id, "ru"));
}

export async function getServicesDetail(serviceId: string): Promise<Slide[]> {
  await sleep(1500);
  const slides = slidesMock[serviceId];

  if (!slides) {
    throw new Error(`Service with id "${serviceId}" not found`);
  }

  normalizeTreeOrder(slides);
  return cloneSlides(slides);
}

export async function getFencesDetail(serviceId: string): Promise<FencesByKey> {
  await sleep(1500);
  const fences = fencesMock[serviceId];

  if (!fences) {
    throw new Error(`Fences for service with id "${serviceId}" not found`);
  }

  return Object.fromEntries(
    Object.entries(fences).map(([key, items]) => [key, items.map((item) => ({ ...item }))]),
  );
}

export async function getGroups(): Promise<GroupListItem[]> {
  await sleep(700);
  normalizeGlobalGroups();
  return cloneGroups(groupsMock);
}

export async function updateSlidesByServiceId(params: {
  serviceId: string;
  fields: SlideUpdatePayload[];
}): Promise<void> {
  await sleep(450);

  const { serviceId, fields } = params;
  const serviceSlides = slidesMock[serviceId];
  if (!serviceSlides) {
    throw new Error(`Service with id "${serviceId}" not found`);
  }

  normalizeTreeOrder(serviceSlides);
  const patchesById = new Map(fields.map((item) => [item.id, item]));
  const affectedLevelKeys = new Set<string>();

  visitSlides(serviceSlides, (slide) => {
    const patch = patchesById.get(slide.id);
    if (!patch) {
      return;
    }

    if (patch.name !== undefined) {
      slide.name = patch.name;
    }
    if (patch.description !== undefined) {
      slide.description = patch.description;
    }
    if (patch.status !== undefined) {
      slide.status = patch.status;
    }
    if (patch.isVisible !== undefined) {
      slide.isVisible = patch.isVisible;
    }
    if (patch.isFeatured !== undefined) {
      slide.isFeatured = patch.isFeatured;
    }
    if (patch.order !== undefined) {
      slide.order = patch.order;
    }

    upsertCommonSlide(slide);

    affectedLevelKeys.add(slide.groupId ?? ROOT_LEVEL_KEY);
  });

  if (!affectedLevelKeys.size) {
    return;
  }

  affectedLevelKeys.forEach((levelKey) => {
    const level = findLevelByKey(serviceSlides, levelKey);
    if (level) {
      normalizeLevelOrder(level);
    }
  });

  normalizeTreeOrder(serviceSlides);

  console.log("updateSlidesByServiceId payload", {
    serviceId,
    method: "PATCH",
    fields,
  });
}

export async function updateFencesByServiceId(params: {
  serviceId: string;
  body: FenceUpdatePayload[];
}): Promise<void> {
  await sleep(450);

  const { serviceId, body } = params;
  const serviceFences = fencesMock[serviceId];
  if (!serviceFences) {
    throw new Error(`Fences for service with id "${serviceId}" not found`);
  }

  const approvedById = new Map(body.map((item) => [item.id, item.approved]));
  Object.values(serviceFences).forEach((fences) => {
    fences.forEach((fence) => {
      const nextApproved = approvedById.get(fence.id);
      if (nextApproved !== undefined) {
        fence.approved = nextApproved;
      }
    });
  });

  console.log("updateFencesByServiceId payload", {
    serviceId,
    method: "PATCH",
    body,
  });
}

export async function createGroup(payload: GroupCreateRequest): Promise<GroupListItem> {
  await sleep(450);

  normalizeGlobalGroups();
  const groupId = createUuid();
  const targetOrder = clampOrder(payload.order, 1, groupsMock.length + 1);
  const group: GroupListItem = {
    id: groupId,
    name: payload.name,
    order: targetOrder,
  };

  groupsMock.splice(targetOrder - 1, 0, group);
  normalizeGlobalGroups();

  console.log("createGroup payload", {
    method: "POST",
    endpoint: "/groups",
    body: payload,
    query: {},
  });

  return { ...group };
}

export async function updateGroup(params: {
  body: GroupUpdateRequest;
  query: GroupUpdateQuery;
}): Promise<GroupListItem> {
  await sleep(450);

  normalizeGlobalGroups();
  const { body, query } = params;
  const index = groupsMock.findIndex((item) => item.id === query.id);
  if (index === -1) {
    throw new Error(`Group with id "${query.id}" not found`);
  }

  const targetOrder = clampOrder(body.order, 1, groupsMock.length);
  const [group] = groupsMock.splice(index, 1);
  group.name = body.name;
  group.order = targetOrder;
  groupsMock.splice(targetOrder - 1, 0, group);
  normalizeGlobalGroups();

  console.log("updateGroup payload", {
    method: "PATCH",
    endpoint: "/groups",
    body,
    query,
  });

  return { ...group };
}

export async function createSlide(payload: SlideCreateRequest): Promise<Slide> {
  await sleep(450);

  const serviceSlides = slidesMock[payload.serviceId];
  if (!serviceSlides) {
    throw new Error(`Service with id "${payload.serviceId}" not found`);
  }

  normalizeTreeOrder(serviceSlides);
  const commonSlide = commonSlidesById.get(payload.id);
  if (hasSlideWithId(serviceSlides, payload.id)) {
    throw new Error(`Slide with id "${payload.id}" already exists`);
  }

  const { level: targetLevel } = getTargetLevel(serviceSlides, payload.serviceId, payload.groupId);
  const targetOrder = clampOrder(payload.order ?? targetLevel.length + 1, 1, targetLevel.length + 1);

  const createdSlide: Slide = commonSlide
    ? {
        id: payload.id,
        serviceId: payload.serviceId,
        groupId: payload.groupId ?? commonSlide.groupId,
        name: payload.name,
        description: commonSlide.description,
        imageUrl: commonSlide.imageUrl,
        category: commonSlide.category,
        status: commonSlide.status ?? "draft",
        isVisible: payload.isVisible ?? (commonSlide.isVisible ?? true),
        isFeatured: commonSlide.isFeatured ?? false,
        isGroup: commonSlide.isGroup,
        order: targetOrder,
      }
    : {
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
        order: targetOrder,
      };

  targetLevel.splice(targetOrder - 1, 0, createdSlide);
  normalizeLevelOrder(targetLevel);
  normalizeTreeOrder(serviceSlides);
  if (!commonSlide) {
    upsertCommonSlide(createdSlide);
  }

  console.log("createSlide payload", {
    method: "POST",
    endpoint: "/slides",
    body: payload,
  });

  return { ...createdSlide };
}
