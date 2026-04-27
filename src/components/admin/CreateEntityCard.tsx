'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Segmented, Space, Typography, message } from 'antd';
import { useRouter } from 'next/navigation';
import { SLIDES_MAP } from '@/constants/slides';
import type { GroupCreateRequest, Slide, SlideCreateRequest, SlideStatus } from '@/lib/api/types';
import { useCreateGroupMutation, useCreateSlideMutation } from '@/lib/store/adminApi';
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
  const slideIdOptions = useMemo<SlideIdOption[]>(
    () => {
      const options = allSlideIds.map((option) => {
        const used = Boolean(slideMap[option.value]);
        return {
          value: option.value,
          label: used ? `${option.label} (занят)` : option.label,
          disabled: used,
        };
      });

      return options.sort((left, right) => Number(left.disabled) - Number(right.disabled));
    },
    [allSlideIds, slideMap],
  );
  const availableSlideIdOptions = useMemo(
    () => slideIdOptions.filter((option) => !option.disabled),
    [slideIdOptions],
  );
  const availableSlideIdSet = useMemo(
    () => new Set(availableSlideIdOptions.map((option) => option.value)),
    [availableSlideIdOptions],
  );
  const groupOptions = useMemo(() => collectGroupOptions(slides), [slides]);
  const groupSelectOptions = useMemo(
    () => [{ value: NO_GROUP_VALUE, label: 'Без группы (корневой слайд)' }, ...groupOptions],
    [groupOptions],
  );
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

      if (previous.id === nextId && previous.groupId === nextGroupId) {
        return previous;
      }

      const nextState = {
        ...previous,
        id: nextId,
        groupId: nextGroupId,
      };
      slideForm.setFieldsValue({ id: nextId, groupId: nextGroupId });
      return nextState;
    });
  }, [availableSlideIdOptions, availableSlideIdSet, createEntityType, groupOptions, slideForm]);

  const handleCreateGroup = async () => {
    if (!activeServiceId) {
      message.error('Сервис не выбран');
      return;
    }

    const isValid = groupForm.validateFields();
    if (!isValid) {
      return;
    }

    const values = groupForm.getFieldsValue();
    const parsedOrder = parseOptionalOrder(values.order);
    if (typeof parsedOrder === 'string') {
      return;
    }

    const payload: GroupCreateRequest = {
      name: values.name.trim(),
      serviceId: activeServiceId,
      order: parsedOrder,
    };

    try {
      const createdGroup = await createGroup(payload).unwrap();
      message.success('Группа создана');
      router.push(`/admin/${activeServiceId}/${createdGroup.id}`);
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

    const parsedOrder = parseOptionalOrder(values.order);
    if (typeof parsedOrder === 'string') {
      return;
    }

    const payload: SlideCreateRequest = {
      id: values.id,
      serviceId: activeServiceId,
      groupId: values.groupId && values.groupId !== NO_GROUP_VALUE ? values.groupId : undefined,
      name: values.name.trim(),
      description: values.description.trim() || undefined,
      status: values.status,
      isVisible: values.isVisible,
      isFeatured: values.isFeatured,
      order: parsedOrder,
    };

    try {
      const createdSlide = await createSlide(payload).unwrap();
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
        <Button onClick={() => activeServiceId && router.push(`/admin/${activeServiceId}`)} disabled={isCreating}>
          К списку
        </Button>
      }
    >
      <Space direction="vertical" size={12} style={{ width: '100%', marginBottom: 12 }}>
        <div>
          <label>Что создать</label>
          <Segmented<CreateEntityType>
            value={createEntityType}
            options={[
              { label: 'Слайд', value: 'slide' },
              { label: 'Группа', value: 'group' },
            ]}
            onChange={(value) => setCreateEntityType(value)}
          />
        </div>
      </Space>
      {createEntityType === 'group' ? (
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
              label="Порядок (опционально)"
              rules={[{ validator: (value) => validateOrderField(value) }]}
            >
              <Input placeholder="Например: 10" />
            </Form.Item>
          </Form>
          <Button type="primary" onClick={handleCreateGroup} loading={isCreatingGroup}>
            Создать группу
          </Button>
        </Space>
      ) : (
        <Space direction="vertical" size={12} style={{ width: '100%' }} key="slide-form">
          <Form<CreateSlideFormValues>
            form={slideForm}
            initialValues={createSlideState}
            onValuesChange={(_, values) => setCreateSlideState(values)}
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
                    return availableSlideIdSet.has(slideId) ? undefined : 'Этот ID уже используется';
                  },
                },
              ]}
            >
              <Select options={slideIdOptions} />
            </Form.Item>
            <Form.Item<CreateSlideFormValues, 'groupId'> name="groupId" label="Группа (опционально)">
              <Select options={groupSelectOptions} />
            </Form.Item>
            <Form.Item<CreateSlideFormValues, 'name'>
              name="name"
              label="Название"
              rules={[{ required: true, message: 'Введите название слайда' }]}
            >
              <Input placeholder="Введите название слайда" />
            </Form.Item>
            <Form.Item<CreateSlideFormValues, 'description'> name="description" label="Описание">
              <Input.TextArea placeholder="Введите описание" rows={4} />
            </Form.Item>
            <Form.Item<CreateSlideFormValues, 'status'> name="status" label="Статус">
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
            <Form.Item<CreateSlideFormValues, 'order'>
              name="order"
              label="Порядок (опционально)"
              rules={[{ validator: (value) => validateOrderField(value) }]}
            >
              <Input placeholder="Например: 30" />
            </Form.Item>
            <Form.Item<CreateSlideFormValues, 'isVisible'> name="isVisible" valuePropName="checked">
              <Checkbox>Виден пользователям</Checkbox>
            </Form.Item>
            <Form.Item<CreateSlideFormValues, 'isFeatured'> name="isFeatured" valuePropName="checked">
              <Checkbox>Показывать как избранный</Checkbox>
            </Form.Item>
          </Form>
          {!availableSlideIdOptions.length ? (
            <Typography.Text type="secondary">
              Все ID из `SLIDES_MAP` уже заняты в этом сервисе. Добавьте новый ключ в карту слайдов
              или используйте другой сервис.
            </Typography.Text>
          ) : null}
          <Button
            type="primary"
            onClick={handleCreateSlide}
            loading={isCreatingSlide}
          >
            Создать слайд
          </Button>
        </Space>
      )}
    </Card>
  );
}

function validateOrderField(value: unknown): string | undefined {
  const result = parseOptionalOrder(String(value ?? ''));
  return typeof result === 'string' ? result : undefined;
}

function parseOptionalOrder(value: string): number | undefined | string {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return 'Порядок должен быть целым числом 0 или больше';
  }

  return parsed;
}

function collectGroupOptions(slides: Slide[], prefix = ''): GroupOption[] {
  return slides.flatMap((slide) => {
    const hasChildren = Boolean(slide.children?.length);
    const groupPath = prefix ? `${prefix} / ${slide.name}` : slide.name;
    const isGroupNode = Boolean(slide.isGroup) || hasChildren;
    const ownOption = isGroupNode
      ? [
          {
            value: slide.groupId ?? slide.id,
            label: groupPath,
          },
        ]
      : [];
    const nestedOptions = slide.children?.length ? collectGroupOptions(slide.children, groupPath) : [];

    return [...ownOption, ...nestedOptions];
  });
}
