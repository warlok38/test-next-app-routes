'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Space, Tabs, Typography, message } from 'antd';
import { useRouter } from 'next/navigation';
import { SLIDES_MAP } from '@/constants/slides';
import type {
  GroupCreateRequest,
  GroupListItem,
  Slide,
  SlideCreateRequest,
  SlideStatus,
} from '@/lib/api/types';
import {
  useCreateGroupMutation,
  useCreateSlideMutation,
  useGetGroupsQuery,
  useUpdateGroupMutation,
  useUpdateSlidesByServiceIdMutation,
} from '@/lib/store/adminApi';
import { flattenSlides } from '@/lib/slides/tree';
import { Form } from '@/components/ui/Form/Form';
import { Checkbox, Input, Select } from '@/components/ui/Form/controls';

type CreateEntityCardProps = {
  activeServiceId?: string;
  slides: Slide[];
};

type CreateEntityType = 'group' | 'slide';

type GroupOption = {
  value: string;
  label: string;
};

type SlideIdOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type CreateGroupFormValues = {
  name: string;
  order: string;
};

type CreateSlideFormValues = {
  id: string;
  groupId: string;
  name: string;
  description: string;
  status: SlideStatus;
  isVisible: boolean;
  isFeatured: boolean;
  order: string;
};

const STATUS_OPTIONS: Array<{ value: SlideStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'published', label: 'Published' },
];

const NO_GROUP_VALUE = '__NO_GROUP__';

export function CreateEntityCard({ activeServiceId, slides }: CreateEntityCardProps) {
  const router = useRouter();
  const [createGroup, { isLoading: isCreatingGroup }] = useCreateGroupMutation();
  const [createSlide, { isLoading: isCreatingSlide }] = useCreateSlideMutation();
  const [updateGroup] = useUpdateGroupMutation();
  const [updateSlidesByServiceId] = useUpdateSlidesByServiceIdMutation();
  const { data: groups = [] } = useGetGroupsQuery();
  const [groupForm] = Form.useForm<CreateGroupFormValues>();
  const [slideForm] = Form.useForm<CreateSlideFormValues>();
  const [createEntityType, setCreateEntityType] = useState<CreateEntityType>('slide');
  const [createGroupState, setCreateGroupState] = useState<CreateGroupFormValues>({
    name: '',
    order: '',
  });
  const [createSlideState, setCreateSlideState] = useState<CreateSlideFormValues>({
    id: '',
    groupId: NO_GROUP_VALUE,
    name: '',
    description: '',
    status: 'draft',
    isVisible: true,
    isFeatured: false,
    order: '',
  });
  const isOrderManuallyEditedRef = useRef(false);
  const isProgrammaticOrderUpdateRef = useRef(false);

  const isCreating = isCreatingGroup || isCreatingSlide;
  const slideMap = useMemo(
    () =>
      flattenSlides(slides).reduce<Record<string, Slide>>((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {}),
    [slides],
  );

  const allSlideIds = useMemo(
    () =>
      Object.keys(SLIDES_MAP)
        .sort((left, right) => left.localeCompare(right))
        .map((id) => ({ value: id, label: id })),
    [],
  );
  const slideIdOptions = useMemo<SlideIdOption[]>(() => {
    const options = allSlideIds.map((option) => {
      const used = Boolean(slideMap[option.value]);
      return {
        value: option.value,
        label: used ? `${option.label} (занят)` : option.label,
        disabled: used,
      };
    });

    return options.sort((left, right) => Number(left.disabled) - Number(right.disabled));
  }, [allSlideIds, slideMap]);
  const availableSlideIdOptions = useMemo(
    () => slideIdOptions.filter((option) => !option.disabled),
    [slideIdOptions],
  );
  const availableSlideIdSet = useMemo(
    () => new Set(availableSlideIdOptions.map((option) => option.value)),
    [availableSlideIdOptions],
  );
  const groupOptions = useMemo(
    () =>
      normalizeGroupItems(groups).map((group) => ({
        value: group.id,
        label: group.name,
      })),
    [groups],
  );
  const groupSelectOptions = useMemo(
    () => [{ value: NO_GROUP_VALUE, label: 'Без группы (корневой слайд)' }, ...groupOptions],
    [groupOptions],
  );
  const groupOrderMax = groups.length + 1;
  const groupOrderLabel = `Порядок (группы: ${groups.length}; диапазон: 1..${groupOrderMax})`;
  const slideOrderMax = useMemo(
    () => getNextOrderOnLevel(slides, normalizeGroupId(createSlideState.groupId)),
    [createSlideState.groupId, slides],
  );
  const slideCountOnLevel = Math.max(0, slideOrderMax - 1);
  const slideOrderLabel = `Порядок (текущий уровень: ${slideCountOnLevel}; диапазон: 1..${slideOrderMax})`;
  useEffect(() => {
    if (createEntityType !== 'slide') {
      return;
    }

    setCreateSlideState((previous) => {
      const nextId =
        previous.id && availableSlideIdSet.has(previous.id)
          ? previous.id
          : (availableSlideIdOptions[0]?.value ?? '');
      const nextGroupId =
        previous.groupId &&
        (previous.groupId === NO_GROUP_VALUE ||
          groupOptions.some((groupOption) => groupOption.value === previous.groupId))
          ? previous.groupId
          : NO_GROUP_VALUE;
      const defaultOrder = String(getNextOrderOnLevel(slides, normalizeGroupId(nextGroupId)));
      const shouldKeepManualOrder =
        isOrderManuallyEditedRef.current &&
        previous.groupId === nextGroupId &&
        previous.order.trim().length > 0;
      const nextOrder = shouldKeepManualOrder ? previous.order : defaultOrder;

      if (previous.groupId !== nextGroupId) {
        isOrderManuallyEditedRef.current = false;
      }

      if (previous.id === nextId && previous.groupId === nextGroupId && previous.order === nextOrder) {
        return previous;
      }

      const nextState = {
        ...previous,
        id: nextId,
        groupId: nextGroupId,
        order: nextOrder,
      };
      isProgrammaticOrderUpdateRef.current = true;
      slideForm.setFieldsValue({ id: nextId, groupId: nextGroupId, order: nextOrder });
      return nextState;
    });
  }, [availableSlideIdOptions, availableSlideIdSet, createEntityType, groupOptions, slideForm, slides]);

  useEffect(() => {
    if (createEntityType !== 'group') {
      return;
    }

    setCreateGroupState((previous) => {
      if (previous.order.trim().length > 0) {
        return previous;
      }

      const nextOrder = String(groupOrderMax);
      const nextState = { ...previous, order: nextOrder };
      groupForm.setFieldsValue({ order: nextOrder });
      return nextState;
    });
  }, [createEntityType, groupForm, groupOrderMax]);

  const handleSlideValuesChange = (
    changedValues: Partial<CreateSlideFormValues>,
    values: CreateSlideFormValues,
  ) => {
    if (changedValues.order !== undefined) {
      if (isProgrammaticOrderUpdateRef.current) {
        isProgrammaticOrderUpdateRef.current = false;
      } else {
        isOrderManuallyEditedRef.current = true;
      }
    }

    if (changedValues.groupId !== undefined) {
      const nextMaxOrder = getNextOrderOnLevel(slides, normalizeGroupId(values.groupId));
      const nextOrder = String(nextMaxOrder);
      const nextValues = {
        ...values,
        order: nextOrder,
      };
      isOrderManuallyEditedRef.current = false;
      isProgrammaticOrderUpdateRef.current = true;
      setCreateSlideState(nextValues);
      slideForm.setFieldsValue({ order: nextOrder });
      return;
    }

    setCreateSlideState(values);
  };

  const handleCreateGroup = async () => {
    const isValid = groupForm.validateFields();
    if (!isValid) {
      return;
    }

    const values = groupForm.getFieldsValue();
    const parsedOrder = parseRequiredOrder(values.order, groupOrderMax);
    if (typeof parsedOrder === 'string') {
      return;
    }
    const targetOrder = clampOrder(parsedOrder, 1, groupOrderMax);
    const groupsOnLevel = normalizeGroupItems(groups);
    const shiftedGroups = groupsOnLevel
      .map((group) => {
        if (group.order >= targetOrder) {
          return {
            id: group.id,
            name: group.name,
            order: group.order + 1,
          };
        }

        return null;
      })
      .filter((item): item is GroupListItem => item !== null);

    const payload: GroupCreateRequest = {
      name: values.name.trim(),
      order: targetOrder,
    };

    try {
      await createGroup(payload).unwrap();
      if (shiftedGroups.length) {
        await Promise.all(
          shiftedGroups.map((group) =>
            updateGroup({
              query: { id: group.id },
              body: {
                name: group.name,
                order: group.order,
              },
            }).unwrap(),
          ),
        );
      }
      message.success('Группа создана');
      const resetOrder = String(groupOrderMax + 1);
      setCreateGroupState({ name: '', order: resetOrder });
      groupForm.setFieldsValue({ name: '', order: resetOrder });
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Ошибка создания группы';
      message.error(text);
    }
  };

  const handleCreateSlide = async () => {
    if (!activeServiceId) {
      message.error('Сервис не выбран');
      return;
    }

    const isValid = slideForm.validateFields();
    if (!isValid) {
      return;
    }

    const values = slideForm.getFieldsValue();
    if (!availableSlideIdSet.has(values.id)) {
      return;
    }

    const parsedOrder = parseRequiredOrder(values.order, slideOrderMax);
    if (typeof parsedOrder === 'string') {
      return;
    }
    const selectedGroupId = normalizeGroupId(values.groupId);
    const siblings = normalizeSiblingOrders(getLevelSlides(slides, selectedGroupId));
    const maxOrder = siblings.length + 1;
    const targetOrder = clampOrder(parsedOrder, 1, maxOrder);

    const payload: SlideCreateRequest = {
      id: values.id,
      serviceId: activeServiceId,
      groupId: selectedGroupId,
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      status: values.status,
      isVisible: values.isVisible,
      isFeatured: values.isFeatured,
      order: targetOrder,
    };
    const shiftedSiblings = siblings
      .map((sibling) => {
        if (sibling.order >= targetOrder) {
          return {
            id: sibling.id,
            order: sibling.order + 1,
          };
        }

        return null;
      })
      .filter((item): item is { id: string; order: number } => item !== null);

    try {
      const createdSlide = await createSlide(payload).unwrap();
      if (shiftedSiblings.length) {
        await updateSlidesByServiceId({
          serviceId: activeServiceId,
          fields: shiftedSiblings,
        }).unwrap();
      }
      message.success('Слайд создан');
      router.push(`/admin/${activeServiceId}/${createdSlide.id}`);
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Ошибка создания слайда';
      message.error(text);
    }
  };

  return (
    <Card
      title="Создание"
      extra={
        <Button
          onClick={() => activeServiceId && router.push(`/admin/${activeServiceId}`)}
          disabled={isCreating}
        >
          К списку
        </Button>
      }
    >
      <Space direction="vertical" size={12} style={{ width: '100%', marginBottom: 12 }}>
        <label>Что создать</label>
      </Space>
      <Tabs
        activeKey={createEntityType}
        onChange={(key) => setCreateEntityType(key as CreateEntityType)}
        items={[
          {
            key: 'slide',
            label: 'Слайд',
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }} key="slide-form">
                <Form<CreateSlideFormValues>
                  form={slideForm}
                  initialValues={createSlideState}
                  onValuesChange={handleSlideValuesChange}
                >
                  <Form.Item<CreateSlideFormValues, 'id'>
                    name="id"
                    label="ID слайда (из SLIDES_MAP)"
                    rules={[
                      { required: true, message: 'Выберите ID слайда' },
                      {
                        validator: (value) => {
                          const slideId = String(value ?? '');
                          if (!slideId) {
                            return undefined;
                          }
                          return availableSlideIdSet.has(slideId)
                            ? undefined
                            : 'Этот ID уже используется';
                        },
                      },
                    ]}
                  >
                    <Select options={slideIdOptions} />
                  </Form.Item>
                  <Form.Item<CreateSlideFormValues, 'groupId'>
                    name="groupId"
                    label="Группа (опционально)"
                  >
                    <Select options={groupSelectOptions} />
                  </Form.Item>
                  <Form.Item<CreateSlideFormValues, 'name'>
                    name="name"
                    label="Название"
                    rules={[{ required: true, message: 'Введите название слайда' }]}
                  >
                    <Input placeholder="Введите название слайда" />
                  </Form.Item>
                  <Form.Item<CreateSlideFormValues, 'description'>
                    name="description"
                    label="Описание"
                  >
                    <Input.TextArea placeholder="Введите описание" rows={4} />
                  </Form.Item>
                  <Form.Item<CreateSlideFormValues, 'status'> name="status" label="Статус">
                    <Select options={STATUS_OPTIONS} />
                  </Form.Item>
                  <Form.Item<CreateSlideFormValues, 'order'>
                    name="order"
                    label={slideOrderLabel}
                    rules={[
                      { required: true, message: 'Введите порядок' },
                      { validator: (value) => validateRequiredOrderField(value, slideOrderMax) },
                    ]}
                  >
                    <Input type="number" min={1} max={slideOrderMax} step={1} placeholder="Например: 3" />
                  </Form.Item>
                  <Form.Item<CreateSlideFormValues, 'isVisible'>
                    name="isVisible"
                    valuePropName="checked"
                  >
                    <Checkbox>Виден пользователям</Checkbox>
                  </Form.Item>
                  <Form.Item<CreateSlideFormValues, 'isFeatured'>
                    name="isFeatured"
                    valuePropName="checked"
                  >
                    <Checkbox>Показывать как избранный</Checkbox>
                  </Form.Item>
                </Form>
                {!availableSlideIdOptions.length ? (
                  <Typography.Text type="secondary">
                    Все ID из `SLIDES_MAP` уже заняты в этом сервисе. Добавьте новый ключ в карту
                    слайдов или используйте другой сервис.
                  </Typography.Text>
                ) : null}
                <Button type="primary" onClick={handleCreateSlide} loading={isCreatingSlide}>
                  Создать слайд
                </Button>
              </Space>
            ),
          },
          {
            key: 'group',
            label: 'Группа',
            children: (
              <Space direction="vertical" size={12} style={{ width: '100%' }} key="group-form">
                <Form<CreateGroupFormValues>
                  form={groupForm}
                  initialValues={createGroupState}
                  onValuesChange={(_, values) => setCreateGroupState(values)}
                >
                  <Form.Item<CreateGroupFormValues, 'name'>
                    name="name"
                    label="Название"
                    rules={[{ required: true, message: 'Введите название группы' }]}
                  >
                    <Input placeholder="Введите название группы" />
                  </Form.Item>
                  <Form.Item<CreateGroupFormValues, 'order'>
                    name="order"
                    label={groupOrderLabel}
                    rules={[
                      { required: true, message: 'Введите порядок' },
                      { validator: (value) => validateRequiredOrderField(value, groupOrderMax) },
                    ]}
                  >
                    <Input type="number" min={1} max={groupOrderMax} step={1} placeholder="Например: 3" />
                  </Form.Item>
                </Form>
                <Button type="primary" onClick={handleCreateGroup} loading={isCreatingGroup}>
                  Создать группу
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}

function validateRequiredOrderField(value: unknown, maxOrder: number): string | undefined {
  const result = parseRequiredOrder(String(value ?? ''), maxOrder);
  return typeof result === 'string' ? result : undefined;
}

function parseOptionalOrder(value: string): number | undefined | string {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return 'Порядок должен быть целым числом 1 или больше';
  }

  return parsed;
}

function parseRequiredOrder(value: string, maxOrder: number): number | string {
  const parsed = parseOptionalOrder(value);
  if (parsed === undefined) {
    return 'Порядок обязателен';
  }
  if (typeof parsed === 'string') {
    return parsed;
  }
  if (parsed > maxOrder) {
    return `Максимальное значение порядка для выбранного уровня: ${maxOrder}`;
  }
  return parsed;
}

function clampOrder(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeGroupItems(items: GroupListItem[]): GroupListItem[] {
  return [...items]
    .sort((left, right) => {
      if (left.order === right.order) {
        return left.name.localeCompare(right.name, 'ru');
      }
      return left.order - right.order;
    })
    .map((item, index) => ({ ...item, order: index + 1 }));
}

function normalizeGroupId(groupId: string): string | undefined {
  return groupId && groupId !== NO_GROUP_VALUE ? groupId : undefined;
}

function compareByOrder(left: Slide, right: Slide): number {
  if (left.order === right.order) {
    return left.name.localeCompare(right.name, 'ru');
  }
  return left.order - right.order;
}

function normalizeSiblingOrders(items: Slide[]): Array<{ id: string; order: number }> {
  return [...items].sort(compareByOrder).map((slide, index) => ({ id: slide.id, order: index + 1 }));
}

function findGroupById(items: Slide[], groupId: string): Slide | undefined {
  for (const slide of items) {
    if (slide.groupId === groupId || slide.id === groupId) {
      return slide;
    }
    if (slide.children?.length) {
      const nested = findGroupById(slide.children, groupId);
      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
}

function getLevelSlides(items: Slide[], groupId?: string): Slide[] {
  if (!groupId) {
    return items;
  }

  return findGroupById(items, groupId)?.children ?? [];
}

function getNextOrderOnLevel(items: Slide[], groupId?: string): number {
  const siblings = normalizeSiblingOrders(getLevelSlides(items, groupId));
  return siblings.length + 1;
}
