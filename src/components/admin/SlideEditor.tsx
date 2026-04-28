'use client';

import { useCallback, useMemo } from 'react';
import { Button, Card } from 'antd';
import { Form } from '@/components/ui/Form/Form';
import { Checkbox, Input, Select } from '@/components/ui/Form/controls';
import type { Slide, SlideDraftPayload } from '@/lib/api/types';
import type { SlideFormValues, SlideStatusOption } from '@/components/admin/slideEditorForm.types';
import { useServiceContext } from '@/lib/state/slideDraftsContext';

type SlideEditorProps = {
  slide: Slide;
  onResetOrderLevel?: (slideId: string) => void;
};

const statusOptions: SlideStatusOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'published', label: 'Published' },
];

export function SlideEditor({ slide, onResetOrderLevel }: SlideEditorProps) {
  const [form] = Form.useForm<SlideFormValues>();
  const { slideDrafts, setSlideDraft, removeSlideDraft } = useServiceContext();

  const mergedSlide = useMemo(() => {
    const draft = slideDrafts[slide.id];
    return {
      ...slide,
      ...draft,
    };
  }, [slideDrafts, slide]);

  const initialValues = useMemo<SlideFormValues>(
    () => ({
      name: mergedSlide.name,
      description: mergedSlide.description ?? '',
      status: mergedSlide.status ?? 'draft',
      isVisible: Boolean(mergedSlide.isVisible),
      isFeatured: Boolean(mergedSlide.isFeatured),
      order: mergedSlide.order,
    }),
    [
      mergedSlide.description,
      mergedSlide.isFeatured,
      mergedSlide.isVisible,
      mergedSlide.name,
      mergedSlide.order,
      mergedSlide.status,
    ],
  );

  const baseValues = useMemo<SlideFormValues>(
    () => ({
      name: slide.name,
      description: slide.description ?? '',
      status: slide.status ?? 'draft',
      isVisible: Boolean(slide.isVisible),
      isFeatured: Boolean(slide.isFeatured),
      order: slide.order,
    }),
    [slide.description, slide.isFeatured, slide.isVisible, slide.name, slide.order, slide.status],
  );

  const onValuesChange = useCallback(
    (_: Partial<SlideFormValues>, allValues: SlideFormValues) => {
      const draftKeys = Object.keys(baseValues) as Array<keyof SlideFormValues>;

      const nextFields = draftKeys.reduce<SlideDraftPayload>((acc, field) => {
        if (allValues[field] === baseValues[field]) {
          return acc;
        }

        return {
          ...acc,
          [field]: allValues[field],
        } as SlideDraftPayload;
      }, {});

      if (!Object.keys(nextFields).length) {
        removeSlideDraft(slide.id);
        return;
      }

      setSlideDraft(slide.id, nextFields);
    },
    [baseValues, removeSlideDraft, setSlideDraft, slide.id],
  );

  const draftForSlide = slideDrafts[slide.id];
  const canResetSlide = Boolean(draftForSlide && Object.keys(draftForSlide).length > 0);

  const handleResetSlide = useCallback(() => {
    onResetOrderLevel?.(slide.id);
    removeSlideDraft(slide.id);
  }, [onResetOrderLevel, removeSlideDraft, slide.id]);

  return (
    <Card
      title={`Редактирование: ${slide.name}`}
      extra={
        <Button type="default" disabled={!canResetSlide} onClick={handleResetSlide}>
          Сбросить
        </Button>
      }
    >
      <Form<SlideFormValues>
        form={form}
        initialValues={initialValues}
        onValuesChange={onValuesChange}
      >
        <Form.Item<SlideFormValues, 'name'>
          name="name"
          label="Название"
          rules={[{ required: true, message: 'Введите название' }]}
        >
          <Input placeholder="Введите название слайда" />
        </Form.Item>

        <Form.Item<SlideFormValues, 'description'> name="description" label="Описание">
          <Input.TextArea placeholder="Введите описание" rows={4} />
        </Form.Item>

        <Form.Item<SlideFormValues, 'status'> name="status" label="Статус">
          <Select options={statusOptions} />
        </Form.Item>

        <Form.Item<SlideFormValues, 'order'> name="order" label="Порядок">
          <Input type="number" disabled />
        </Form.Item>

        <Form.Item<SlideFormValues, 'isVisible'> name="isVisible" valuePropName="checked">
          <Checkbox>Виден пользователям</Checkbox>
        </Form.Item>

        <Form.Item<SlideFormValues, 'isFeatured'> name="isFeatured" valuePropName="checked">
          <Checkbox>Показывать как избранный</Checkbox>
        </Form.Item>
      </Form>
    </Card>
  );
}
