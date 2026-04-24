export type Service = {
  id: string;
  name: string;
};

export type SlideStatus = "draft" | "review" | "published";

export type Slide = {
  id: string;
  serviceId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  status?: SlideStatus;
  isVisible?: boolean;
  isFeatured?: boolean;
  children?: Slide[];
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
  name: string;
  isApproved: boolean;
};

export type FenceMonthUpdatePayload = {
  name: string;
  isApproved: boolean;
};
