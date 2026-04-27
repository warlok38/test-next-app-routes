import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  FencesByKey,
  FenceUpdatePayload,
  GroupListItem,
  GroupCreateRequest,
  GroupUpdateQuery,
  GroupUpdateRequest,
  Service,
  Slide,
  SlideCreateRequest,
  SlideUpdatePayload,
} from "@/lib/api/types";
import {
  createGroup,
  createSlide,
  getFencesDetail,
  getGroups,
  getServices,
  getServicesDetail,
  updateGroup,
  updateFencesByServiceId,
  updateSlidesByServiceId,
} from "@/lib/api/services";

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Services", "Slides", "Fences", "Groups"],
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
    getFencesDetail: builder.query<FencesByKey, { serviceId: string }>({
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
    getGroups: builder.query<GroupListItem[], void>({
      queryFn: async () => {
        try {
          const data = await getGroups();
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error instanceof Error ? error.message : "getGroups failed",
            },
          };
        }
      },
      providesTags: ["Groups"],
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
      { serviceId: string; body: FenceUpdatePayload[] }
    >({
      queryFn: async ({ serviceId, body }) => {
        try {
          await updateFencesByServiceId({
            serviceId,
            body,
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
    createGroup: builder.mutation<GroupListItem, GroupCreateRequest>({
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
      invalidatesTags: ["Groups"],
    }),
    updateGroup: builder.mutation<GroupListItem, { body: GroupUpdateRequest; query: GroupUpdateQuery }>({
      queryFn: async ({ body, query }) => {
        try {
          const data = await updateGroup({ body, query });
          return { data };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: error instanceof Error ? error.message : "updateGroup failed",
            },
          };
        }
      },
      invalidatesTags: ["Groups"],
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
  useGetGroupsQuery,
  useUpdateSlidesByServiceIdMutation,
  useUpdateFencesByServiceIdMutation,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useCreateSlideMutation,
} = adminApi;

