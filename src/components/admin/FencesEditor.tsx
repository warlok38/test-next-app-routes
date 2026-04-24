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

const toMapByName = (months: FenceMonthUpdatePayload[]): Record<string, boolean> =>
  months.reduce<Record<string, boolean>>((acc, month) => {
    acc[month.name] = month.isApproved;
    return acc;
  }, {});

export function FencesEditor({
  months,
  pendingMonths,
  loading = false,
  onPendingMonthsChange,
}: FencesEditorProps) {
  const [draftMap, setDraftMap] = useState<Record<string, boolean>>(() => toMapByName(pendingMonths));

  useEffect(() => {
    setDraftMap(toMapByName(pendingMonths));
  }, [pendingMonths]);

  const baseByName = useMemo(
    () =>
      months.reduce<Record<string, boolean>>((acc, month) => {
        acc[month.name] = month.isApproved;
        return acc;
      }, {}),
    [months],
  );

  const mergedMonths = useMemo(
    () =>
      months.map((month) => ({
        ...month,
        isApproved:
          draftMap[month.name] !== undefined ? draftMap[month.name] : month.isApproved,
      })),
    [draftMap, months],
  );

  const updateDraft = useCallback(
    (monthName: string, checked: boolean) => {
      setDraftMap((previous) => {
        const next = { ...previous };
        const baseValue = baseByName[monthName];

        if (checked === baseValue) {
          delete next[monthName];
        } else {
          next[monthName] = checked;
        }

        const changedMonths: FenceMonthUpdatePayload[] = Object.entries(next).map(
          ([name, isApproved]) => ({
            name,
            isApproved,
          }),
        );
        onPendingMonthsChange(changedMonths);
        return next;
      });
    },
    [baseByName, onPendingMonthsChange],
  );

  return (
    <Card title='Забор'>
      <Spin spinning={loading}>
        {!months.length ? (
          <Empty description='Данные по забору не найдены' />
        ) : (
          <Flex vertical gap={12}>
            {mergedMonths.map((month) => (
              <Flex key={month.name} align='center' justify='space-between'>
                <Typography.Text>{month.name}</Typography.Text>
                <Checkbox
                  checked={month.isApproved}
                  onChange={(event) => updateDraft(month.name, event.target.checked)}
                />
              </Flex>
            ))}
          </Flex>
        )}
      </Spin>
    </Card>
  );
}
