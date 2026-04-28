export type Service = {
  id: string;
  name: string;
};

export type SlideStatus = "draft" | "review" | "published";

export type Slide = {
  id: string;
  serviceId: string;
  groupId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  status?: SlideStatus;
  isVisible?: boolean;
  isFeatured?: boolean;
  isGroup?: boolean;
  order: number;
  children?: Slide[];
};

export type CommonSlide = Omit<Slide, "serviceId" | "children"> & {
  isUsedInAnyService?: boolean;
  children?: CommonSlide[];
};

export type ServiceSlideOverride = {
  serviceId: string;
  slideId: string;
  name?: string;
  order?: number;
  isVisible?: boolean;
};

export type ResolvedSlide = Slide;

export type GroupListItem = {
  id: string;
  name: string;
  order: number;
};

export type GroupCreateRequest = {
  name: string;
  order: number;
};

export type GroupUpdateRequest = {
  name: string;
  order: number;
};

export type GroupUpdateQuery = {
  id: string;
};

export type SlideCreateRequest = {
  id: string;
  serviceId: string;
  groupId?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  status?: SlideStatus;
  isVisible?: boolean;
  isFeatured?: boolean;
  order?: number;
};

export type SlideUpdatePayload = {
  id: string;
  name?: string;
  description?: string;
  status?: SlideStatus;
  isVisible?: boolean;
  isFeatured?: boolean;
  order?: number;
};

export type SlideDraftPayload = Omit<SlideUpdatePayload, "id">;

export type FenceItem = {
  id: string;
  month: string;
  approved: boolean;
};

export type FencesByKey = Record<string, FenceItem[]>;

export type FenceUpdatePayload = {
  id: string;
  approved: boolean;
};
