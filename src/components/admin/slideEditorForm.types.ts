import type { SlideStatus } from "@/lib/api/types";

export type SlideFormValues = {
  name: string;
  order: string;
  description: string;
  status: SlideStatus;
  isVisible: boolean;
  isFeatured: boolean;
};

export type SlideStatusOption = {
  value: SlideStatus;
  label: string;
};
