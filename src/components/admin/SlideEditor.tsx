'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Divider, Typography } from 'antd';
import { Form } from '@/components/ui/Form/Form';
import { Checkbox, Input, Select } from '@/components/ui/Form/controls';
import type { Slide, SlideDraftPayload } from '@/lib/api/types';
import type { SlideFormValues, SlideStatusOption } from '@/components/admin/slideEditorForm.types';
import { useServiceContext } from '@/lib/state/slideDraftsContext';

type SlideEditorProps = {
  slide: Slide;
  onResetOrderLevel?: (slideId: string) => void;
  onOrderInputChange?: (slideId: string, nextOrder: number) => void;
};

const statusOptions: SlideStatusOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'published', label: 'Published' },
];

export function SlideEditor({ slide, onResetOrderLevel, onOrderInputChange }: SlideEditorProps) {
  const [form] = Form.useForm<SlideFormValues>();
  const { slideDrafts, setSlideDraft, removeSlideDraft } = useServiceContext();
  const [hasOrderInputDeviation, setHasOrderInputDeviation] = useState(false);

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
      order: String(mergedSlide.order ?? 1),
      description: mergedSlide.description ?? '',
      status: mergedSlide.status ?? 'draft',
      isVisible: Boolean(mergedSlide.isVisible),
      isFeatured: Boolean(mergedSlide.isFeatured),
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
      order: String(slide.order ?? 1),
      description: slide.description ?? '',
      status: slide.status ?? 'draft',
      isVisible: Boolean(slide.isVisible),
      isFeatured: Boolean(slide.isFeatured),
    }),
    [slide.description, slide.isFeatured, slide.isVisible, slide.name, slide.order, slide.status],
  );

  const onValuesChange = useCallback(
    (changedValues: Partial<SlideFormValues>, allValues: SlideFormValues) => {
      const isOrderChanged = Object.prototype.hasOwnProperty.call(changedValues, 'order');
      if (isOrderChanged) {
        const orderInput = String(allValues.order ?? '');
        setHasOrderInputDeviation(orderInput !== initialValues.order);

        const parsedOrder = Number(orderInput);
        const parsedCurrentOrder = Number(initialValues.order);
        if (
          Number.isInteger(parsedOrder) &&
          parsedOrder >= 1 &&
          Number.isInteger(parsedCurrentOrder) &&
          parsedOrder !== parsedCurrentOrder
        ) {
          onOrderInputChange?.(slide.id, parsedOrder);
        }
      }

      const draftKeys = Object.keys(baseValues) as Array<keyof SlideFormValues>;

      const nextFields = draftKeys.reduce<SlideDraftPayload>((acc, field) => {
        const nextValue = allValues[field];
        const baseValue = baseValues[field];
        if (field === 'order') {
          return acc;
        }

        if (nextValue === baseValue) {
          return acc;
        }

        return {
          ...acc,
          [field]: nextValue,
        } as SlideDraftPayload;
      }, {});

      const hasOrderDraft = typeof slideDrafts[slide.id]?.order === 'number';
      if (!Object.keys(nextFields).length) {
        if (isOrderChanged) {
          return;
        }
        if (hasOrderDraft || hasOrderInputDeviation) {
          return;
        }
        removeSlideDraft(slide.id);
        return;
      }

      setSlideDraft(slide.id, nextFields);
    },
    [
      baseValues,
      hasOrderInputDeviation,
      initialValues.order,
      onOrderInputChange,
      removeSlideDraft,
      setSlideDraft,
      slide.id,
      slideDrafts,
    ],
  );

  useEffect(() => {
    setHasOrderInputDeviation(false);
  }, [initialValues.order, slide.id]);

  const draftForSlide = slideDrafts[slide.id];
  const canResetSlide =
    Boolean(draftForSlide && Object.keys(draftForSlide).length > 0) || hasOrderInputDeviation;

  const handleResetSlide = useCallback(() => {
    setHasOrderInputDeviation(false);
    onResetOrderLevel?.(slide.id);
    removeSlideDraft(slide.id);
    form.resetFields();
  }, [form, onResetOrderLevel, removeSlideDraft, slide.id]);

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
        <Typography.Text strong>Сервисные поля</Typography.Text>
        <Form.Item<SlideFormValues, 'name'>
          name="name"
          label="Название"
          rules={[{ required: true, message: 'Введите название' }]}
        >
          <Input placeholder="Введите название слайда" />
        </Form.Item>

        <Form.Item<SlideFormValues, 'order'>
          name="order"
          label="Порядок"
          rules={[
            { required: true, message: 'Введите порядок' },
            {
              validator: (value) => {
                const parsedOrder = Number(value);
                if (!Number.isInteger(parsedOrder) || parsedOrder < 1) {
                  return 'Порядок должен быть целым числом 1 или больше';
                }
                return undefined;
              },
            },
          ]}
        >
          <Input type="number" min={1} step={1} placeholder="Например: 3" />
        </Form.Item>

        <Form.Item<SlideFormValues, 'isVisible'> name="isVisible" valuePropName="checked">
          <Checkbox>Виден пользователям</Checkbox>
        </Form.Item>

        <Divider style={{ margin: '12px 0' }} />
        <Typography.Text strong>Общие поля</Typography.Text>
        <Form.Item<SlideFormValues, 'description'> name="description" label="Описание">
          <Input.TextArea placeholder="Введите описание" rows={4} />
        </Form.Item>

        <Form.Item<SlideFormValues, 'status'> name="status" label="Статус">
          <Select options={statusOptions} />
        </Form.Item>

        <Form.Item<SlideFormValues, 'isFeatured'> name="isFeatured" valuePropName="checked">
          <Checkbox>Показывать как избранный</Checkbox>
        </Form.Item>
      </Form>
    </Card>
  );
}
