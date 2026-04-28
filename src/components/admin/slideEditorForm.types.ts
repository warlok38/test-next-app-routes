import type { SlideStatus } from "@/lib/api/types";

export type SlideFormValues = {
  name: string;
  description: string;
  status: SlideStatus;
  isVisible: boolean;
  isFeatured: boolean;
  order: number;
};

export type SlideStatusOption = {
  value: SlideStatus;
  label: string;
};
