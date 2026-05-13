'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card } from 'antd';
import type { Slide } from '@/lib/api/types';
import { Form } from '@/components/ui/Form/Form';
import { Input } from '@/components/ui/Form/controls';
import { useServiceContext } from '@/lib/state/slideDraftsContext';

type GroupEditorProps = {
  slide: Slide;
  onResetOrderConnected?: (slideId: string) => void;
  onOrderInputChange?: (slideId: string, nextOrder: number) => void;
};

type GroupFormValues = {
  name: string;
  order: string;
};

export function GroupEditor({ slide, onResetOrderConnected, onOrderInputChange }: GroupEditorProps) {
  const [form] = Form.useForm<GroupFormValues>();
  const { groupDrafts, setGroupDraft, removeGroupDraft } = useServiceContext();
  const [hasOrderInputDeviation, setHasOrderInputDeviation] = useState(false);

  const mergedGroup = useMemo(() => {
    const draft = groupDrafts[slide.id];
    return {
      ...slide,
      ...draft,
    };
  }, [groupDrafts, slide]);

  const initialValues = useMemo<GroupFormValues>(
    () => ({
      name: mergedGroup.name,
      order: String(mergedGroup.order ?? 1),
    }),
    [mergedGroup.name, mergedGroup.order],
  );

  const baseValues = useMemo<GroupFormValues>(
    () => ({
      name: slide.name,
      order: String(slide.order ?? 1),
    }),
    [slide.name, slide.order],
  );

  const onValuesChange = useCallback(
    (changedValues: Partial<GroupFormValues>, allValues: GroupFormValues) => {
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

      const nextFields: { name?: string } = {};
      if (allValues.name !== baseValues.name) {
        nextFields.name = allValues.name;
      }

      const hasOrderDraft = typeof groupDrafts[slide.id]?.order === 'number';
      if (!Object.keys(nextFields).length) {
        if (isOrderChanged) {
          return;
        }
        if (hasOrderDraft || hasOrderInputDeviation) {
          return;
        }
        removeGroupDraft(slide.id);
        return;
      }

      setGroupDraft(slide.id, nextFields);
    },
    [
      baseValues.name,
      groupDrafts,
      hasOrderInputDeviation,
      initialValues.order,
      onOrderInputChange,
      removeGroupDraft,
      setGroupDraft,
      slide.id,
    ],
  );

  useEffect(() => {
    setHasOrderInputDeviation(false);
  }, [initialValues.order, slide.id]);

  const draftForGroup = groupDrafts[slide.id];
  const canResetGroup =
    Boolean(draftForGroup && Object.keys(draftForGroup).length > 0) || hasOrderInputDeviation;

  const handleResetGroup = useCallback(() => {
    setHasOrderInputDeviation(false);
    onResetOrderConnected?.(slide.id);
    removeGroupDraft(slide.id);
    form.resetFields();
  }, [form, onResetOrderConnected, removeGroupDraft, slide.id]);

  return (
    <Card
      title={`Редактирование группы: ${slide.name}`}
      extra={
        <Button type="default" disabled={!canResetGroup} onClick={handleResetGroup}>
          Сбросить
        </Button>
      }
    >
      <Form<GroupFormValues> form={form} initialValues={initialValues} onValuesChange={onValuesChange}>
        <Form.Item<GroupFormValues, 'name'>
          name="name"
          label="Название группы"
          rules={[{ required: true, message: 'Введите название группы' }]}
        >
          <Input placeholder="Введите название группы" />
        </Form.Item>

        <Form.Item<GroupFormValues, 'order'>
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
      </Form>
    </Card>
  );
}
