'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Empty, Layout, Tabs, message } from 'antd';
import { useRouter } from 'next/navigation';
import type { Service, Slide } from '@/lib/api/types';
import { SlideEditor } from '@/components/admin/SlideEditor';
import { ServicesMenu } from '@/components/admin/ServicesMenu';
import { SlidesMenu } from '@/components/admin/SlidesMenu';
import { useSlideDrafts } from '@/lib/state/slideDraftsContext';
import { useUpdateServiceMutation } from '@/lib/store/adminApi';
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
  const [updateService, { isLoading: isSaving }] = useUpdateServiceMutation();

  const fallbackServiceId = services[0]?.id;
  const activeServiceId = selectedServiceId ?? fallbackServiceId;
  const activeSlides = slides;
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
  const changedSlideIds = useMemo(() => pendingUpdates.map((item) => item.id), [pendingUpdates]);

  const handleSaveChanges = async () => {
    if (!activeServiceId || !hasPendingUpdates) {
      return;
    }

    try {
      await updateService({
        serviceId: activeServiceId,
        fields: pendingUpdates,
      }).unwrap();

      message.success('Изменения сохранены');
      clearDrafts();
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
              disabled={!hasPendingUpdates}
            >
              Сохранить изменения
            </Button>
          }
          items={[
            {
              key: 'slides',
              label: 'Слайды',
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
              key: 'numbers',
              label: 'Цифры',
              children: <div style={{ padding: 16 }}>Цифры</div>,
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
