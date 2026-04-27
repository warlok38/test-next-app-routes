import { fencesMock, groupsMock, normalizeGroupsOrder, servicesMock, slidesMock } from "@/lib/api/mockDb";
import type {
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
  if (hasSlideWithId(serviceSlides, payload.id)) {
    throw new Error(`Slide with id "${payload.id}" already exists`);
  }

  const { level: targetLevel } = getTargetLevel(serviceSlides, payload.serviceId, payload.groupId);
  const targetOrder = clampOrder(payload.order ?? targetLevel.length + 1, 1, targetLevel.length + 1);

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
    order: targetOrder,
  };

  targetLevel.splice(targetOrder - 1, 0, createdSlide);
  normalizeLevelOrder(targetLevel);
  normalizeTreeOrder(serviceSlides);

  console.log("createSlide payload", {
    method: "POST",
    endpoint: "/slides",
    body: payload,
  });

  return { ...createdSlide };
}
