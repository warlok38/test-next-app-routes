import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type { Service, Slide, SlideUpdatePayload } from "@/lib/api/types";
import { getServices, getServicesDetail, updateService } from "@/lib/api/services";

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Services", "Slides"],
  endpoints: (builder) => ({
    getServices: builder.query<Service[], void>({
      queryFn: async () => {
        try {
          const data = await getServices();
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error instanceof Error ? error.message : "getServices failed",
            },
          };
        }
      },
      providesTags: ["Services"],
    }),
    getServicesDetail: builder.query<Slide[], { serviceId: string }>({
      queryFn: async ({ serviceId }) => {
        try {
          const data = await getServicesDetail(serviceId);
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error instanceof Error ? error.message : "getServicesDetail failed",
            },
          };
        }
      },
      providesTags: (_result, _err, arg) => [{ type: "Slides", id: arg.serviceId }],
    }),
    updateService: builder.mutation<
      void,
      { serviceId: string; fields: SlideUpdatePayload[] }
    >({
      queryFn: async ({ serviceId, fields }) => {
        try {
          await updateService({
            serviceId,
            fields,
          });
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error instanceof Error ? error.message : "updateService failed",
            },
          };
        }
      },
      invalidatesTags: (_result, _err, arg) => [{ type: "Slides", id: arg.serviceId }],
    }),
  }),
});

export const {
  useGetServicesQuery,
  useGetServicesDetailQuery,
  useUpdateServiceMutation,
} = adminApi;

