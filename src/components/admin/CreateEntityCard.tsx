'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Checkbox, Input, InputNumber, Segmented, Select, Space, Typography, message } from 'antd';
import { useRouter } from 'next/navigation';
import { SLIDES_MAP } from '@/constants/slides';
import type { GroupCreateRequest, Slide, SlideCreateRequest, SlideStatus } from '@/lib/api/types';
import { useCreateGroupMutation, useCreateSlideMutation } from '@/lib/store/adminApi';
import { flattenSlides } from '@/lib/slides/tree';

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

type CreateGroupFormState = {
  name: string;
  order: number | null;
};

type CreateSlideFormState = {
  id?: string;
  groupId?: string;
  name: string;
  description: string;
  status: SlideStatus;
  isVisible: boolean;
  isFeatured: boolean;
  order: number | null;
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
  const [createEntityType, setCreateEntityType] = useState<CreateEntityType>('slide');
  const [createGroupState, setCreateGroupState] = useState<CreateGroupFormState>({
    name: '',
    order: null,
  });
  const [createSlideState, setCreateSlideState] = useState<CreateSlideFormState>({
    name: '',
    description: '',
    status: 'draft',
    isVisible: true,
    isFeatured: false,
    order: null,
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
    () =>
      allSlideIds.map((option) => {
        const used = Boolean(slideMap[option.value]);
        return {
          value: option.value,
          label: used ? `${option.label} (занят)` : option.label,
          disabled: used,
        };
      }),
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
  const canSubmitGroup = Boolean(activeServiceId && createGroupState.name.trim());
  const canSubmitSlide = Boolean(
    activeServiceId &&
      createSlideState.name.trim() &&
      createSlideState.id &&
      availableSlideIdSet.has(createSlideState.id),
  );

  useEffect(() => {
    if (createEntityType !== 'slide') {
      return;
    }

    setCreateSlideState((previous) => ({
      ...previous,
      id:
        previous.id && availableSlideIdSet.has(previous.id)
          ? previous.id
          : availableSlideIdOptions[0]?.value,
      groupId:
        previous.groupId &&
        (previous.groupId === NO_GROUP_VALUE ||
          groupOptions.some((groupOption) => groupOption.value === previous.groupId))
          ? previous.groupId
          : NO_GROUP_VALUE,
    }));
  }, [availableSlideIdOptions, availableSlideIdSet, createEntityType, groupOptions]);

  const handleCreateGroup = async () => {
    if (!activeServiceId || !createGroupState.name.trim()) {
      return;
    }

    const payload: GroupCreateRequest = {
      name: createGroupState.name.trim(),
      serviceId: activeServiceId,
      order: createGroupState.order ?? undefined,
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
    if (!activeServiceId || !createSlideState.id || !createSlideState.name.trim()) {
      return;
    }

    if (!availableSlideIdSet.has(createSlideState.id)) {
      message.error('Выбранный id недоступен или уже используется');
      return;
    }

    const payload: SlideCreateRequest = {
      id: createSlideState.id,
      serviceId: activeServiceId,
      groupId:
        createSlideState.groupId && createSlideState.groupId !== NO_GROUP_VALUE
          ? createSlideState.groupId
          : undefined,
      name: createSlideState.name.trim(),
      description: createSlideState.description.trim() || undefined,
      status: createSlideState.status,
      isVisible: createSlideState.isVisible,
      isFeatured: createSlideState.isFeatured,
      order: createSlideState.order ?? undefined,
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
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <label htmlFor="create-group-name">Название</label>
            <Input
              id="create-group-name"
              value={createGroupState.name}
              placeholder="Введите название группы"
              onChange={(event) =>
                setCreateGroupState((previous) => ({ ...previous, name: event.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="create-group-order">Порядок (опционально)</label>
            <InputNumber
              id="create-group-order"
              value={createGroupState.order}
              min={0}
              style={{ width: '100%' }}
              placeholder="Например: 10"
              onChange={(value) =>
                setCreateGroupState((previous) => ({ ...previous, order: value ?? null }))
              }
            />
          </div>
          <Button type="primary" onClick={handleCreateGroup} loading={isCreatingGroup} disabled={!canSubmitGroup}>
            Создать группу
          </Button>
        </Space>
      ) : (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <label htmlFor="create-slide-id">ID слайда (из SLIDES_MAP)</label>
            <Select
              id="create-slide-id"
              value={createSlideState.id}
              options={slideIdOptions}
              onChange={(value) =>
                setCreateSlideState((previous) => ({ ...previous, id: value }))
              }
              placeholder="Выберите id из доступных"
              showSearch
              optionFilterProp="label"
            />
            {!availableSlideIdOptions.length ? (
              <Typography.Text type="secondary">
                Все id из `SLIDES_MAP` уже заняты в этом сервисе. Добавьте новый ключ в карту
                слайдов или используйте другой сервис.
              </Typography.Text>
            ) : null}
          </div>
          <div>
            <label htmlFor="create-slide-group">Группа (опционально)</label>
            <Select
              id="create-slide-group"
              value={createSlideState.groupId}
              options={groupSelectOptions}
              onChange={(value) =>
                setCreateSlideState((previous) => ({ ...previous, groupId: value }))
              }
              placeholder="Выберите группу"
            />
          </div>
          <div>
            <label htmlFor="create-slide-name">Название</label>
            <Input
              id="create-slide-name"
              value={createSlideState.name}
              placeholder="Введите название слайда"
              onChange={(event) =>
                setCreateSlideState((previous) => ({ ...previous, name: event.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="create-slide-description">Описание</label>
            <Input.TextArea
              id="create-slide-description"
              value={createSlideState.description}
              rows={4}
              placeholder="Введите описание"
              onChange={(event) =>
                setCreateSlideState((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <label htmlFor="create-slide-status">Статус</label>
            <Select
              id="create-slide-status"
              value={createSlideState.status}
              options={STATUS_OPTIONS}
              onChange={(value) =>
                setCreateSlideState((previous) => ({
                  ...previous,
                  status: value as SlideStatus,
                }))
              }
            />
          </div>
          <div>
            <label htmlFor="create-slide-order">Порядок (опционально)</label>
            <InputNumber
              id="create-slide-order"
              value={createSlideState.order}
              min={0}
              style={{ width: '100%' }}
              placeholder="Например: 30"
              onChange={(value) =>
                setCreateSlideState((previous) => ({ ...previous, order: value ?? null }))
              }
            />
          </div>
          <Checkbox
            checked={createSlideState.isVisible}
            onChange={(event) =>
              setCreateSlideState((previous) => ({
                ...previous,
                isVisible: event.target.checked,
              }))
            }
          >
            Виден пользователям
          </Checkbox>
          <Checkbox
            checked={createSlideState.isFeatured}
            onChange={(event) =>
              setCreateSlideState((previous) => ({
                ...previous,
                isFeatured: event.target.checked,
              }))
            }
          >
            Показывать как избранный
          </Checkbox>
          <Button
            type="primary"
            onClick={handleCreateSlide}
            loading={isCreatingSlide}
            disabled={!canSubmitSlide || !availableSlideIdOptions.length}
          >
            Создать слайд
          </Button>
        </Space>
      )}
    </Card>
  );
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
