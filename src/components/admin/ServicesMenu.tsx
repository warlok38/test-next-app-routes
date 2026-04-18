'use client';

import { Alert, Menu, Spin, Typography } from 'antd';
import type { Service } from '@/lib/api/types';

type ServicesMenuProps = {
  services: Service[];
  servicesError?: string;
  loading?: boolean;
  activeServiceId?: string;
  onSelect: (serviceId: string) => void;
};

export function ServicesMenu({ services, servicesError, loading, activeServiceId, onSelect }: ServicesMenuProps) {
  return (
    <Spin spinning={Boolean(loading)}>
      <div>
        <Typography.Title level={5} style={{ margin: 16 }}>
          Сервисы
        </Typography.Title>
        {servicesError ? (
          <div style={{ padding: '0 16px 16px' }}>
            <Alert type="error" message={servicesError} showIcon />
          </div>
        ) : null}
        <Menu
          mode="inline"
          selectedKeys={activeServiceId ? [activeServiceId] : []}
          items={services.map((service) => ({
            key: service.id,
            label: service.name,
          }))}
          onClick={(item) => onSelect(item.key)}
        />
      </div>
    </Spin>
  );
}
