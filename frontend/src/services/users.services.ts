import Axios from "@/axios/instance";
import {
  type UpdateUserPayload,
  type FetchUsersParams,
  type UpdateUserResponse,
  type FetchUsersResponse,
  type Filter,
  updateUserResponseSchema,
  fetchUsersResponseSchema,
  updateUserPayloadSchema,
  fetchUsersParamsSchema,
  type User,
} from "@/schemas/users.schema";
import type { ApiSuccess } from "@/types/api.types";

/* =========================================================
   QUERY STRING BUILDER
   ========================================================= */

function buildFilterQueryString(filter?: Filter): string {
  if (!filter) return "";

  const params: string[] = [];

  for (const field in filter) {
    const operators = filter[field];
    if (!operators) continue;

    for (const operator in operators) {
      // @ts-ignore
      const value = operators[operator];
      if (value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        value.forEach(v => {
          params.push(
            `filter[${field}][${operator}][]=${encodeURIComponent(String(v))}`
          );
        });
      } else {
        params.push(
          `filter[${field}][${operator}]=${encodeURIComponent(String(value))}`
        );
      }
    }
  }

  return params.join("&");
}

function buildQueryString(params: FetchUsersParams): string {
  const queryParts: string[] = [];

  if (params.page !== undefined) queryParts.push(`page=${params.page}`);
  if (params.limit !== undefined) queryParts.push(`limit=${params.limit}`);
  if (params.sort) queryParts.push(`sort=${encodeURIComponent(params.sort)}`);
  if (params.search)
    queryParts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.fields?.length) {
    params.fields.forEach(f => queryParts.push(`fields[]=${f}`));
  }
  if (params.includeDeleted !== undefined) {
    queryParts.push(`includeDeleted=${params.includeDeleted}`);
  }

  const filterString = buildFilterQueryString(params.filter);
  if (filterString) queryParts.push(filterString);

  return queryParts.join("&");
}

/* =========================================================
   USERS SERVICE
   ========================================================= */

export class UsersServices {
  static async updateUser(
    payload: UpdateUserPayload
  ): Promise<ApiSuccess<UpdateUserResponse["data"]>> {
    const validatedPayload = updateUserPayloadSchema.parse(payload);
    const response = await Axios.put("/users/me", validatedPayload);
    const validatedResponse = updateUserResponseSchema.parse(response.data);
    return validatedResponse as ApiSuccess<UpdateUserResponse["data"]>;
  }

  static async fetchUsers(
    params: FetchUsersParams = {}
  ): Promise<ApiSuccess<FetchUsersResponse["data"]>> {
    const validatedParams = fetchUsersParamsSchema.parse(params);
    const queryString = buildQueryString(validatedParams);
    const url = queryString ? `/users?${queryString}` : "/users";
    const response = await Axios.get(url);
    const validatedResponse = fetchUsersResponseSchema.parse(response.data);
    return validatedResponse as ApiSuccess<FetchUsersResponse["data"]>;
  }

  static async fetchUserById(userId: string): Promise<ApiSuccess<User>> {
    const response = await Axios.get(`/users/${userId}`);
    const validatedResponse = updateUserResponseSchema.parse(response.data);
    return validatedResponse as ApiSuccess<User>;
  }

  static async updateUserById(
    userId: string,
    payload: UpdateUserPayload
  ): Promise<ApiSuccess<UpdateUserResponse["data"]>> {
    const validatedPayload = updateUserPayloadSchema.parse(payload);
    const response = await Axios.put(`/users/${userId}`, validatedPayload);
    const validatedResponse = updateUserResponseSchema.parse(response.data);
    return validatedResponse as ApiSuccess<UpdateUserResponse["data"]>;
  }

  static async deleteUser(userId: string): Promise<ApiSuccess<null>> {
    const response = await Axios.delete(`/users/${userId}`);
    return response.data;
  }

  static async restoreUser(userId: string): Promise<ApiSuccess<null>> {
    const response = await Axios.post(`/users/${userId}/restore`);
    return response.data;
  }
}
