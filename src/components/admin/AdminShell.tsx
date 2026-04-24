'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Empty, Layout, Tabs, message } from 'antd';
import { useRouter } from 'next/navigation';
import type { FenceMonthUpdatePayload, Service, Slide } from '@/lib/api/types';
import { FencesEditor } from '@/components/admin/FencesEditor';
import { SlideEditor } from '@/components/admin/SlideEditor';
import { ServicesMenu } from '@/components/admin/ServicesMenu';
import { SlidesMenu } from '@/components/admin/SlidesMenu';
import { useSlideDrafts } from '@/lib/state/slideDraftsContext';
import {
  useGetFencesDetailQuery,
  useUpdateFencesByServiceIdMutation,
  useUpdateSlidesByServiceIdMutation,
} from '@/lib/store/adminApi';
import { findSlideById, flattenSlides } from '@/lib/slides/tree';

const { Sider, Content } = Layout;

type AdminShellProps = {
  services: Service[];
  slides: Slide[];
  selectedServiceId?: string;
  selectedSlideId?: string;
  /** Ошибка загрузки списка сервисов — показывается в левой колонке, URL остаётся /admin */
  servicesError?: string;
  error?: string;
  /** Загрузка сервисов (RTK Query isFetching) */
  servicesLoading?: boolean;
  /** Загрузка слайдов (RTK Query isFetching) */
  slidesLoading?: boolean;
};

type PendingUpdate = {
  id: string;
} & Record<string, unknown>;

function AdminShellInner({
  services,
  slides,
  selectedServiceId,
  selectedSlideId,
  servicesError,
  error,
  servicesLoading,
  slidesLoading,
}: AdminShellProps) {
  const router = useRouter();
  const { syncActiveService, confirmServiceChange, drafts, clearDrafts } = useSlideDrafts();
  const [pendingFencesByService, setPendingFencesByService] = useState<
    Record<string, FenceMonthUpdatePayload[]>
  >({});
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
  const activeFences = fencesQuery.data ?? [];
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

  const pendingUpdates = useMemo<PendingUpdate[]>(
    () =>
      Object.entries(drafts)
        .filter(([slideId]) => Boolean(slideMap[slideId]))
        .map(([slideId, fields]) => ({ id: slideId, ...fields })),
    [drafts, slideMap],
  );

  const hasPendingUpdates = pendingUpdates.length > 0;
  const pendingFences = activeServiceId ? pendingFencesByService[activeServiceId] ?? [] : [];
  const hasPendingFences = pendingFences.length > 0;
  const hasAnyPendingUpdates = hasPendingUpdates || hasPendingFences;
  const changedSlideIds = useMemo(() => pendingUpdates.map((item) => item.id), [pendingUpdates]);
  const isSaving = isSavingSlides || isSavingFences;

  const handlePendingFencesChange = useCallback(
    (nextMonths: FenceMonthUpdatePayload[]) => {
      if (!activeServiceId) {
        return;
      }

      setPendingFencesByService((previous) => {
        if (!nextMonths.length) {
          if (!previous[activeServiceId]) {
            return previous;
          }

          const next = { ...previous };
          delete next[activeServiceId];
          return next;
        }

        return {
          ...previous,
          [activeServiceId]: nextMonths,
        };
      });
    },
    [activeServiceId],
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
          fields: pendingFences,
        }).unwrap();
      }

      message.success('Изменения сохранены');
      clearDrafts();
      setPendingFencesByService((previous) => {
        if (!previous[activeServiceId]) {
          return previous;
        }

        const next = { ...previous };
        delete next[activeServiceId];
        return next;
      });
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Ошибка сохранения';
      message.error(text);
    }
  };

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
            router.push(`/admin/${nextServiceId}`);
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
                <Badge dot={hasPendingUpdates} size='small' offset={[6, -1]}>
                  <span>Слайды</span>
                </Badge>
              ),
              children: (
                <Layout style={{ minHeight: 'calc(100vh - 84px)' }}>
                  <Sider
                    theme="light"
                    style={{
                      flex: '1 1 800px',
                      minWidth: 300,
                      maxWidth: 800,
                      width: '100%',
                    }}
                  >
                    <SlidesMenu
                      slides={activeSlides}
                      activeServiceId={activeServiceId}
                      activeSlideId={activeSlideId}
                      changedSlideIds={changedSlideIds}
                      loading={slidesLoading}
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
                    ) : activeSlide ? (
                      <SlideEditor slide={activeSlide} key={activeSlide.id} />
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
                <Badge dot={hasPendingFences} size='small' offset={[6, -1]}>
                  <span>Забор</span>
                </Badge>
              ),
              children: (
                <div style={{ padding: 16 }}>
                  <FencesEditor
                    months={activeFences}
                    pendingMonths={pendingFences}
                    loading={fencesQuery.isFetching}
                    onPendingMonthsChange={handlePendingFencesChange}
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
