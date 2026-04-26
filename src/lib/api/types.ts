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
  order?: number;
  children?: Slide[];
};

export type GroupCreateRequest = {
  name: string;
  serviceId: string;
  order?: number;
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
};

export type SlideDraftPayload = Omit<SlideUpdatePayload, "id">;

export type FenceMonth = {
  id: string;
  name: string;
  isApproved: boolean;
};

export type FenceMonthUpdatePayload = {
  id: string;
  isApproved: boolean;
};
