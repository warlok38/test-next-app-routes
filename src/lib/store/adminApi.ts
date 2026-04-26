import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  FenceMonth,
  FenceMonthUpdatePayload,
  GroupCreateRequest,
  Service,
  Slide,
  SlideCreateRequest,
  SlideUpdatePayload,
} from "@/lib/api/types";
import {
  createGroup,
  createSlide,
  getFencesDetail,
  getServices,
  getServicesDetail,
  updateFencesByServiceId,
  updateSlidesByServiceId,
} from "@/lib/api/services";

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Services", "Slides", "Fences"],
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
    getFencesDetail: builder.query<FenceMonth[], { serviceId: string }>({
      queryFn: async ({ serviceId }) => {
        try {
          const data = await getFencesDetail(serviceId);
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error instanceof Error ? error.message : "getFencesDetail failed",
            },
          };
        }
      },
      providesTags: (_result, _err, arg) => [{ type: "Fences", id: arg.serviceId }],
    }),
    updateSlidesByServiceId: builder.mutation<
      void,
      { serviceId: string; fields: SlideUpdatePayload[] }
    >({
      queryFn: async ({ serviceId, fields }) => {
        try {
          await updateSlidesByServiceId({
            serviceId,
            fields,
          });
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error:
                error instanceof Error ? error.message : "updateSlidesByServiceId failed",
            },
          };
        }
      },
      invalidatesTags: (_result, _err, arg) => [{ type: "Slides", id: arg.serviceId }],
    }),
    updateFencesByServiceId: builder.mutation<
      void,
      { serviceId: string; fields: FenceMonthUpdatePayload[] }
    >({
      queryFn: async ({ serviceId, fields }) => {
        try {
          await updateFencesByServiceId({
            serviceId,
            fields,
          });
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error:
                error instanceof Error ? error.message : "updateFencesByServiceId failed",
            },
          };
        }
      },
      invalidatesTags: (_result, _err, arg) => [{ type: "Fences", id: arg.serviceId }],
    }),
    createGroup: builder.mutation<Slide, GroupCreateRequest>({
      queryFn: async (payload) => {
        try {
          const data = await createGroup(payload);
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error instanceof Error ? error.message : "createGroup failed",
            },
          };
        }
      },
      invalidatesTags: (_result, _err, arg) => [{ type: "Slides", id: arg.serviceId }],
    }),
    createSlide: builder.mutation<Slide, SlideCreateRequest>({
      queryFn: async (payload) => {
        try {
          const data = await createSlide(payload);
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error instanceof Error ? error.message : "createSlide failed",
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
  useGetFencesDetailQuery,
  useUpdateSlidesByServiceIdMutation,
  useUpdateFencesByServiceIdMutation,
  useCreateGroupMutation,
  useCreateSlideMutation,
} = adminApi;

