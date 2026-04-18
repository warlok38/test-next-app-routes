"use client";

import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { ConfigProvider } from "antd";
import { store } from "@/lib/store/store";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <ConfigProvider>{children}</ConfigProvider>
    </Provider>
  );
}

