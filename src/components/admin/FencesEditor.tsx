'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Checkbox, Empty, Flex, Spin, Typography } from 'antd';
import type { FenceMonth, FenceMonthUpdatePayload } from '@/lib/api/types';

type FencesEditorProps = {
  months: FenceMonth[];
  pendingMonths: FenceMonthUpdatePayload[];
  loading?: boolean;
  onPendingMonthsChange: (nextMonths: FenceMonthUpdatePayload[]) => void;
};

const toMapById = (months: FenceMonthUpdatePayload[]): Record<string, boolean> =>
  months.reduce<Record<string, boolean>>((acc, month) => {
    acc[month.id] = month.isApproved;
    return acc;
  }, {});

export function FencesEditor({
  months,
  pendingMonths,
  loading = false,
  onPendingMonthsChange,
}: FencesEditorProps) {
  const [draftMap, setDraftMap] = useState<Record<string, boolean>>(() => toMapById(pendingMonths));

  useEffect(() => {
    setDraftMap(toMapById(pendingMonths));
  }, [pendingMonths]);

  const baseById = useMemo(
    () =>
      months.reduce<Record<string, boolean>>((acc, month) => {
        acc[month.id] = month.isApproved;
        return acc;
      }, {}),
    [months],
  );

  const mergedMonths = useMemo(
    () =>
      months.map((month) => ({
        ...month,
        isApproved: draftMap[month.id] !== undefined ? draftMap[month.id] : month.isApproved,
      })),
    [draftMap, months],
  );

  const updateDraft = useCallback(
    (monthId: string, checked: boolean) => {
      setDraftMap((previous) => {
        const next = { ...previous };
        const baseValue = baseById[monthId];

        if (checked === baseValue) {
          delete next[monthId];
        } else {
          next[monthId] = checked;
        }

        const changedMonths: FenceMonthUpdatePayload[] = Object.entries(next).map(
          ([id, isApproved]) => ({
            id,
            isApproved,
          }),
        );
        onPendingMonthsChange(changedMonths);
        return next;
      });
    },
    [baseById, onPendingMonthsChange],
  );

  return (
    <Card title='Забор'>
      <Spin spinning={loading}>
        {!months.length ? (
          <Empty description='Данные по забору не найдены' />
        ) : (
          <Flex vertical gap={12}>
            {mergedMonths.map((month) => (
              <Flex key={month.id} align='center' justify='space-between'>
                <Typography.Text>{month.name}</Typography.Text>
                <Checkbox
                  checked={month.isApproved}
                  onChange={(event) => updateDraft(month.id, event.target.checked)}
                />
              </Flex>
            ))}
          </Flex>
        )}
      </Spin>
    </Card>
  );
}
