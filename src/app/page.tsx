"use client";

import type { Slide } from "@/lib/api/types";
import * as Slides from "@/components/slides";
import { SLIDES_FALLBACK, SLIDES_MAP } from "@/constants/slides";
import { useGetServicesDetailQuery } from "@/lib/store/adminApi";
import { flattenSlides } from "@/lib/slides/tree";
import { Alert, Layout, Menu, Spin, Typography } from "antd";
import type { MenuProps } from "antd";
import { useEffect, useMemo, useState } from "react";

const CLIENT_SERVICE_ID = "analytics";
const { Header, Content } = Layout;

function mapSlidesToMenuItems(slides: Slide[]): MenuProps["items"] {
  return slides.map((slide) => ({
    key: slide.id,
    label: slide.name,
    children: slide.children?.length ? mapSlidesToMenuItems(slide.children) : undefined,
  }));
}

export default function HomePage() {
  const { data, isLoading, isError } = useGetServicesDetailQuery({
    serviceId: CLIENT_SERVICE_ID,
  });
  const [selectedSlideId, setSelectedSlideId] = useState<string>();
  const menuItems = useMemo(() => mapSlidesToMenuItems(data ?? []), [data]);
  const flatSlides = useMemo(() => flattenSlides(data ?? []), [data]);
  const selectedSlide = useMemo(
    () => flatSlides.find((slide) => slide.id === selectedSlideId),
    [flatSlides, selectedSlideId],
  );

  useEffect(() => {
    if (!flatSlides.length) {
      setSelectedSlideId(undefined);
      return;
    }

    setSelectedSlideId((prev) =>
      prev && flatSlides.some((slide) => slide.id === prev) ? prev : flatSlides[0].id,
    );
  }, [flatSlides]);

  if (isLoading) {
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <Content style={{ padding: 24 }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout style={{ minHeight: "100vh" }}>
        <Content style={{ padding: 24 }}>
          <Alert
            type="error"
            showIcon
            message={`Failed to load slides for service "${CLIENT_SERVICE_ID}".`}
          />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#fff",
          borderBottom: "1px solid #f0f0f0",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Typography.Text strong style={{ whiteSpace: "nowrap" }}>
          Client Slides
        </Typography.Text>
        <Menu
          mode="horizontal"
          items={menuItems}
          selectedKeys={selectedSlideId ? [selectedSlideId] : []}
          onClick={(item) => setSelectedSlideId(item.key)}
          style={{ borderBottom: "none", minWidth: 0, flex: 1 }}
        />
      </Header>
      <Content style={{ padding: 24 }}>
        {!flatSlides.length ? (
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">No slides were returned by the service.</p>
            {SLIDES_FALLBACK.slide}
          </section>
        ) : selectedSlide ? (
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <header className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">{selectedSlide.name}</h2>
              <p className="text-xs text-slate-500">{selectedSlide.id}</p>
            </header>
            {SLIDES_MAP[selectedSlide.id]?.slide ?? (
              <Slides.PlaceholderSlide slideId={selectedSlide.id} />
            )}
          </section>
        ) : (
          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            {SLIDES_FALLBACK.slide}
          </section>
        )}
      </Content>
    </Layout>
  );
}
