'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { Button, Card, Divider, Typography } from 'antd';
import { Form } from '@/components/ui/Form/Form';
import { Checkbox, Input, Select } from '@/components/ui/Form/controls';
import type { Slide, SlideDraftPayload } from '@/lib/api/types';
import type { SlideFormValues, SlideStatusOption } from '@/components/admin/slideEditorForm.types';
import {
  buildSlideFormValues,
  SLIDE_VALIDATION_MESSAGES,
  validateSlideFormValues,
} from '@/components/admin/slideValidation';
import { useServiceContext } from '@/lib/state/slideDraftsContext';

type SlideEditorProps = {
  slide: Slide;
};

const statusOptions: SlideStatusOption[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'published', label: 'Published' },
];

export function SlideEditor({ slide }: SlideEditorProps) {
  const [form] = Form.useForm<SlideFormValues>();
  const { slideDrafts, setSlideDraft, removeSlideDraft, setSlideValidation, clearSlideValidation } =
    useServiceContext();
  const draftForSlide = slideDrafts[slide.id];

  const initialValues = useMemo<SlideFormValues>(
    () => buildSlideFormValues(slide, draftForSlide),
    [draftForSlide, slide],
  );

  const baseValues = useMemo<SlideFormValues>(
    () => buildSlideFormValues(slide),
    [slide],
  );

  const syncSlideValidation = useCallback(
    (values: SlideFormValues) => {
      const errors = validateSlideFormValues(values);
      if (!errors.length) {
        clearSlideValidation(slide.id);
        return;
      }
      setSlideValidation(slide.id, { isValid: false, errors });
    },
    [clearSlideValidation, setSlideValidation, slide.id],
  );

  const onValuesChange = useCallback(
    (_: Partial<SlideFormValues>, allValues: SlideFormValues) => {
      const draftKeys = Object.keys(baseValues) as Array<keyof SlideFormValues>;

      const nextFields = draftKeys.reduce<SlideDraftPayload>((acc, field) => {
        const nextValue = allValues[field];
        const baseValue = baseValues[field];
        if (field === 'order') {
          const parsedOrder = Number(nextValue);
          const parsedBaseOrder = Number(baseValue);
          if (
            !Number.isInteger(parsedOrder) ||
            parsedOrder < 1 ||
            Number.isNaN(parsedBaseOrder) ||
            parsedOrder === parsedBaseOrder
          ) {
            return acc;
          }
          return { ...acc, order: parsedOrder };
        }

        if (nextValue === baseValue) {
          return acc;
        }

        return {
          ...acc,
          [field]: nextValue,
        } as SlideDraftPayload;
      }, {});

      if (!Object.keys(nextFields).length) {
        removeSlideDraft(slide.id);
        return;
      }

      setSlideDraft(slide.id, nextFields);
      syncSlideValidation(allValues);
    },
    [baseValues, removeSlideDraft, setSlideDraft, slide.id, syncSlideValidation],
  );

  const canResetSlide = Boolean(draftForSlide && Object.keys(draftForSlide).length > 0);

  useEffect(() => {
    if (!draftForSlide) {
      clearSlideValidation(slide.id);
      return;
    }
    syncSlideValidation(initialValues);
  }, [clearSlideValidation, draftForSlide, initialValues, slide.id, syncSlideValidation]);

  const handleResetSlide = useCallback(() => {
    removeSlideDraft(slide.id);
  }, [removeSlideDraft, slide.id]);

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
          rules={[{ required: true, message: SLIDE_VALIDATION_MESSAGES.nameRequired }]}
        >
          <Input placeholder="Введите название слайда" />
        </Form.Item>

        <Form.Item<SlideFormValues, 'order'>
          name="order"
          label="Порядок"
          rules={[
            { required: true, message: SLIDE_VALIDATION_MESSAGES.orderRequired },
            {
              validator: (value) => {
                const parsedOrder = Number(value);
                if (!Number.isInteger(parsedOrder) || parsedOrder < 1) {
                  return SLIDE_VALIDATION_MESSAGES.orderInvalid;
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
