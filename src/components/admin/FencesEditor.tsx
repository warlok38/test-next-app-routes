'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Checkbox, Empty, Flex, Spin, Typography } from 'antd';
import type { FencesByKey, FenceUpdatePayload } from '@/lib/api/types';

type FencesEditorProps = {
  fences: FencesByKey;
  pendingFences: FenceUpdatePayload[];
  loading?: boolean;
  onPendingFencesChange: (nextFences: FenceUpdatePayload[]) => void;
};

type FenceRow = {
  fenceKey: string;
  id: string;
  month: string;
  approved: boolean;
};

const toMapById = (fences: FenceUpdatePayload[]): Record<string, boolean> =>
  fences.reduce<Record<string, boolean>>((acc, fence) => {
    acc[fence.id] = fence.approved;
    return acc;
  }, {});

export function FencesEditor({
  fences,
  pendingFences,
  loading = false,
  onPendingFencesChange,
}: FencesEditorProps) {
  const [draftMap, setDraftMap] = useState<Record<string, boolean>>(() => toMapById(pendingFences));

  useEffect(() => {
    setDraftMap(toMapById(pendingFences));
  }, [pendingFences]);

  const baseById = useMemo(
    () =>
      Object.values(fences).reduce<Record<string, boolean>>(
        (acc, fenceItems) => {
          fenceItems.forEach((fence) => {
            acc[fence.id] = fence.approved;
          });
          return acc;
        },
        {},
      ),
    [fences],
  );

  const rowsByKey = useMemo<Record<string, FenceRow[]>>(
    () =>
      Object.fromEntries(
        Object.entries(fences).map(([fenceKey, fenceItems]) => [
          fenceKey,
          fenceItems.map((fence) => ({
            fenceKey,
            id: fence.id,
            month: fence.month,
            approved: draftMap[fence.id] !== undefined ? draftMap[fence.id] : fence.approved,
          })),
        ]),
      ),
    [draftMap, fences],
  );

  const updateDraft = useCallback(
    (fenceId: string, checked: boolean) => {
      setDraftMap((previous) => {
        const next = { ...previous };
        const baseValue = baseById[fenceId];

        if (checked === baseValue) {
          delete next[fenceId];
        } else {
          next[fenceId] = checked;
        }

        const nextChangedFences = Object.entries(next).map(([id, approved]) => ({
            id,
            approved,
          }));
        onPendingFencesChange(nextChangedFences);
        return next;
      });
    },
    [baseById, onPendingFencesChange],
  );

  return (
    <Spin spinning={loading}>
      <Typography.Title level={5} style={{ marginBottom: 12 }}>
        Забор
      </Typography.Title>
      {!Object.keys(rowsByKey).length ? (
        <Empty description='Данные по забору не найдены' />
      ) : (
        <Flex vertical gap={12}>
          {Object.entries(rowsByKey).map(([fenceKey, rows]) => (
            <Card key={fenceKey} size='small' title={fenceKey}>
              <Flex vertical gap={10}>
                {rows.map((row) => (
                  <Flex key={row.id} align='center' justify='space-between'>
                    <Typography.Text>{row.month}</Typography.Text>
                    <Checkbox
                      checked={row.approved}
                      onChange={(event) => updateDraft(row.id, event.target.checked)}
                    />
                  </Flex>
                ))}
              </Flex>
            </Card>
          ))}
        </Flex>
      )}
    </Spin>
  );
}
