'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { Alert, Button, Empty, Layout, Tabs, message } from 'antd';
import { useRouter } from 'next/navigation';
import type {
  CommonSlide,
  FenceUpdatePayload,
  Service,
  Slide,
  SlideUpdatePayload,
} from '@/lib/api/types';
import { CreateEntityCard } from '@/components/admin/CreateEntityCard';
import { FencesEditor } from '@/components/admin/FencesEditor';
import { SlideEditor } from '@/components/admin/SlideEditor';
import { ServicesMenu } from '@/components/admin/ServicesMenu';
import { SlidesMenu } from '@/components/admin/SlidesMenu';
import { Badge } from '@/components/ui/Badge';
import { useServiceContext } from '@/lib/state/slideDraftsContext';
import {
  useGetFencesDetailQuery,
  useUpdateFencesByServiceIdMutation,
  useUpdateSlidesByServiceIdMutation,
} from '@/lib/store/adminApi';
import {
  collectConnectedOrderComponent,
  compareByOrder,
  findLevelBySlideId,
} from '@/lib/slides/order';
import { findSlideById, flattenSlides } from '@/lib/slides/tree';

const { Sider, Content } = Layout;

type AdminShellProps = {
  services: Service[];
  slides: Slide[];
  commonSlides: CommonSlide[];
  selectedServiceId?: string;
  selectedSlideId?: string;
  isCreatePage?: boolean;
  /** Ошибка загрузки списка сервисов — показывается в левой колонке, URL остаётся /admin */
  servicesError?: string;
  error?: string;
  /** Загрузка сервисов (RTK Query isFetching) */
  servicesLoading?: boolean;
  /** Загрузка слайдов (RTK Query isFetching) */
  slidesLoading?: boolean;
};

function AdminShellInner({
  services,
  slides,
  commonSlides,
  selectedServiceId,
  selectedSlideId,
  isCreatePage = false,
  servicesError,
  error,
  servicesLoading,
  slidesLoading,
}: AdminShellProps) {
  const router = useRouter();
  const {
    syncActiveService,
    confirmServiceChange,
    slideDrafts,
    replaceSlideDraft,
    removeSlideDraft,
    fenceDrafts,
    setFenceDrafts,
    clearAllDrafts,
  } = useServiceContext();
  const [updateSlidesByServiceId, { isLoading: isSavingSlides }] =
    useUpdateSlidesByServiceIdMutation();
  const [updateFencesByServiceId, { isLoading: isSavingFences }] =
    useUpdateFencesByServiceIdMutation();

  const fallbackServiceId = services[0]?.id;
  const activeServiceId = selectedServiceId ?? fallbackServiceId;
  const activeSlides = slides;
  const fencesQuery = useGetFencesDetailQuery(
    { serviceId: activeServiceId ?? '' },
    { skip: !activeServiceId },
  );
  const activeFences = fencesQuery.data ?? {};
  const activeSlide = findSlideById(activeSlides, selectedSlideId);
  const activeSlideId = activeSlide?.id;
  const flatSlides = useMemo(() => flattenSlides(activeSlides), [activeSlides]);

  useEffect(() => {
    if (activeServiceId) {
      syncActiveService(activeServiceId);
    }
  }, [activeServiceId, syncActiveService]);

  const slideMap = useMemo(
    () =>
      flatSlides.reduce<Record<string, Slide>>((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {}),
    [flatSlides],
  );
  const pendingUpdates = useMemo<SlideUpdatePayload[]>(
    () =>
      Object.entries(slideDrafts)
        .filter(([slideId]) => Boolean(slideMap[slideId]))
        .map(
          ([slideId, fields]) =>
            ({ id: slideId, ...(fields as Record<string, unknown>) }) as SlideUpdatePayload,
        ),
    [slideDrafts, slideMap],
  );

  const hasPendingUpdates = pendingUpdates.length > 0;
  const pendingFences = fenceDrafts;
  const hasPendingFences = pendingFences.length > 0;
  const hasAnyPendingUpdates = hasPendingUpdates || hasPendingFences;
  const changedSlideIds = useMemo(() => pendingUpdates.map((item) => item.id), [pendingUpdates]);
  const orderDrafts = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(slideDrafts)
          .filter(([, draft]) => typeof draft.order === 'number')
          .map(([slideId, draft]) => [slideId, draft.order as number]),
      ) as Record<string, number>,
    [slideDrafts],
  );
  const effectiveSlides = useMemo(
    () => applyOrderDrafts(activeSlides, orderDrafts),
    [activeSlides, orderDrafts],
  );
  const isSaving = isSavingSlides || isSavingFences;

  const handlePendingFencesChange = useCallback(
    (nextFences: FenceUpdatePayload[]) => {
      if (!activeServiceId) {
        return;
      }

      setFenceDrafts(nextFences);
    },
    [activeServiceId, setFenceDrafts],
  );

  const handleSaveChanges = async () => {
    if (!activeServiceId || !hasAnyPendingUpdates) {
      return;
    }

    try {
      if (hasPendingUpdates) {
        await updateSlidesByServiceId({
          serviceId: activeServiceId,
          fields: pendingUpdates,
        }).unwrap();
      }

      if (hasPendingFences) {
        await updateFencesByServiceId({
          serviceId: activeServiceId,
          body: pendingFences,
        }).unwrap();
      }

      message.success('Изменения сохранены');
      clearAllDrafts();
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Ошибка сохранения';
      message.error(text);
    }
  };

  const applyOrderUpdates = useCallback(
    (updates: Array<{ id: string; order: number }>) => {
      updates.forEach(({ id, order }) => {
        const sourceSlide = slideMap[id];
        if (!sourceSlide) {
          return;
        }

        const currentDraft = slideDrafts[id] ?? {};
        const nextDraft = { ...currentDraft };
        if (order === sourceSlide.order) {
          delete nextDraft.order;
        } else {
          nextDraft.order = order;
        }

        if (Object.keys(nextDraft).length > 0) {
          replaceSlideDraft(id, nextDraft);
          return;
        }
        removeSlideDraft(id);
      });
    },
    [removeSlideDraft, replaceSlideDraft, slideDrafts, slideMap],
  );

  const handleSlidesReorder = useCallback(
    (updates: Array<{ id: string; order: number }>) => {
      applyOrderUpdates(updates);
    },
    [applyOrderUpdates],
  );

  const handleSlideOrderInputChange = useCallback(
    (slideId: string, targetOrder: number) => {
      const levelSlides = findLevelBySlideId(effectiveSlides, slideId);
      if (!levelSlides?.length) {
        return;
      }

      const orderedLevel = [...levelSlides].sort(compareByOrder);
      const currentIndex = orderedLevel.findIndex((item) => item.id === slideId);
      if (currentIndex === -1) {
        return;
      }

      const targetIndex = clamp(targetOrder - 1, 0, orderedLevel.length - 1);
      if (currentIndex === targetIndex) {
        return;
      }

      const reorderedLevel = move(orderedLevel, currentIndex, targetIndex);
      applyOrderUpdates(
        reorderedLevel.map((slide, index) => ({
          id: slide.id,
          order: index + 1,
        })),
      );
    },
    [applyOrderUpdates, effectiveSlides],
  );

  const handleResetOrderConnectedComponent = useCallback(
    (slideId: string) => {
      const baseLevel = findLevelBySlideId(activeSlides, slideId);
      const effectiveLevel = findLevelBySlideId(effectiveSlides, slideId);
      if (!baseLevel || !effectiveLevel) {
        return;
      }

      const connectedIds = collectConnectedOrderComponent({
        selectedId: slideId,
        baseLevel: [...baseLevel].sort(compareByOrder),
        effectiveLevel: [...effectiveLevel].sort(compareByOrder),
      });

      connectedIds.forEach((id) => {
        const currentDraft = slideDrafts[id];
        if (!currentDraft || typeof currentDraft.order !== 'number') {
          return;
        }

        const nextDraft = { ...currentDraft };
        delete nextDraft.order;
        if (Object.keys(nextDraft).length > 0) {
          replaceSlideDraft(id, nextDraft);
          return;
        }
        removeSlideDraft(id);
      });
    },
    [activeSlides, effectiveSlides, removeSlideDraft, replaceSlideDraft, slideDrafts],
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="light"
        style={{
          flex: '1 1 400px',
          minWidth: 200,
          maxWidth: 400,
          width: '100%',
        }}
      >
        <ServicesMenu
          services={services}
          servicesError={servicesError}
          loading={servicesLoading}
          activeServiceId={activeServiceId}
          onSelect={(nextServiceId) => {
            if (!confirmServiceChange(nextServiceId)) {
              return;
            }
            router.push(
              isCreatePage ? `/admin/${nextServiceId}/create` : `/admin/${nextServiceId}`,
            );
          }}
        />
      </Sider>
      <Content style={{ minWidth: 0, padding: 12 }}>
        <Tabs
          defaultActiveKey="slides"
          tabBarExtraContent={
            <Button
              type="primary"
              onClick={handleSaveChanges}
              loading={isSaving}
              disabled={!hasAnyPendingUpdates}
            >
              Сохранить изменения
            </Button>
          }
          items={[
            {
              key: 'slides',
              label: (
                <Badge mode="dot" size="small" show={hasPendingUpdates} offset={[-2, -4]}>
                  <span>Слайды</span>
                </Badge>
              ),
              children: (
                <Layout
                  style={{
                    height: 'calc(100vh - 84px)',
                    minHeight: 0,
                    minWidth: 0,
                    overflow: 'hidden',
                  }}
                >
                  <Sider
                    theme="light"
                    style={{
                      flex: '0 0 380px',
                      minWidth: 360,
                      maxWidth: 460,
                      width: 380,
                      minHeight: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <SlidesMenu
                      slides={activeSlides}
                      orderDrafts={orderDrafts}
                      activeServiceId={activeServiceId}
                      activeSlideId={activeSlideId}
                      changedSlideIds={changedSlideIds}
                      loading={slidesLoading}
                      onReorderLevel={handleSlidesReorder}
                      onCreate={() => {
                        if (!activeServiceId) {
                          return;
                        }
                        router.push(`/admin/${activeServiceId}/create`);
                      }}
                      onSelect={(nextSlideId) => {
                        if (!activeServiceId) {
                          return;
                        }
                        router.push(`/admin/${activeServiceId}/${nextSlideId}`);
                      }}
                    />
                  </Sider>
                  <Content style={{ padding: 24, minWidth: 0 }}>
                    {error ? (
                      <Alert type="error" message={error} showIcon />
                    ) : isCreatePage ? (
                      <CreateEntityCard
                        activeServiceId={activeServiceId}
                        slides={activeSlides}
                        commonSlides={commonSlides}
                      />
                    ) : activeSlide ? (
                      <SlideEditor
                        slide={activeSlide}
                        key={activeSlide.id}
                        onResetOrderConnected={handleResetOrderConnectedComponent}
                        onOrderInputChange={handleSlideOrderInputChange}
                      />
                    ) : (
                      <Empty description="Выберите слайд из списка" />
                    )}
                  </Content>
                </Layout>
              ),
            },
            {
              key: 'fence',
              label: (
                <Badge mode="dot" size="small" show={hasPendingFences} offset={[-2, -4]}>
                  <span>Забор</span>
                </Badge>
              ),
              children: (
                <div style={{ padding: 16 }}>
                  <FencesEditor
                    fences={activeFences}
                    pendingFences={pendingFences}
                    loading={fencesQuery.isFetching}
                    onPendingFencesChange={handlePendingFencesChange}
                  />
                </div>
              ),
            },
            {
              key: 'data',
              label: 'Данные',
              children: <div style={{ padding: 16 }}>Данные</div>,
            },
          ]}
        />
      </Content>
    </Layout>
  );
}

export function AdminShell(props: AdminShellProps) {
  return <AdminShellInner {...props} />;
}

function applyOrderDrafts(items: Slide[], orderDrafts: Record<string, number>): Slide[] {
  return [...items]
    .map((item) => ({
      ...item,
      order: typeof orderDrafts[item.id] === 'number' ? orderDrafts[item.id] : item.order,
      children: item.children?.length ? applyOrderDrafts(item.children, orderDrafts) : undefined,
    }))
    .sort(compareByOrder);
}

function move<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
