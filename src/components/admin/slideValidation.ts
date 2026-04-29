import type { Slide, SlideDraftPayload } from '@/lib/api/types';
import type { SlideFormValues } from '@/components/admin/slideEditorForm.types';

export const SLIDE_VALIDATION_MESSAGES = {
  nameRequired: 'Введите название',
  orderRequired: 'Введите порядок',
  orderInvalid: 'Порядок должен быть целым числом 1 или больше',
} as const;

export function buildSlideFormValues(slide: Slide, draft?: SlideDraftPayload): SlideFormValues {
  const merged = {
    ...slide,
    ...draft,
  };

  return {
    name: merged.name,
    order: String(merged.order ?? 1),
    description: merged.description ?? '',
    status: merged.status ?? 'draft',
    isVisible: Boolean(merged.isVisible),
    isFeatured: Boolean(merged.isFeatured),
  };
}

export function validateSlideFormValues(values: SlideFormValues): string[] {
  const errors: string[] = [];
  if (!values.name.trim()) {
    errors.push(`Название: ${SLIDE_VALIDATION_MESSAGES.nameRequired}`);
  }

  if (!values.order.trim()) {
    errors.push(`Порядок: ${SLIDE_VALIDATION_MESSAGES.orderRequired}`);
    return errors;
  }

  const parsedOrder = Number(values.order);
  if (!Number.isInteger(parsedOrder) || parsedOrder < 1) {
    errors.push(`Порядок: ${SLIDE_VALIDATION_MESSAGES.orderInvalid}`);
  }

  return errors;
}
