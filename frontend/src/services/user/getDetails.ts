import { apiClient } from "../index";
import { ENDPOINTS } from "@/constants/api";

export interface UserInfoAttributes {
  FirstName?: string | null;
  LastName?: string | null;
  NationalCode?: string | null;
  BirthDate?: string | null;
  Sex?: boolean | null;
  Bio?: string | null;
}

export interface UserRoleAttributes {
  Title?: string | null;
}

export interface UserWalletAttributes {
  Balance?: string | null;
}

export interface PluginRoleInfo {
  id: number;
  name?: string | null;
  description?: string | null;
  type?: string | null;
}

export interface PluginUserDetails {
  id: number;
  phone: string;
  IsActive: boolean;
  removedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user_info?: (UserInfoAttributes & { id: number }) | null;
  user_role?: (UserRoleAttributes & { id: number }) | null;
  user_wallet?: (UserWalletAttributes & { id: number }) | null;
  role?: PluginRoleInfo | null;
}

type RelationShape<T> =
  | null
  | undefined
  | (T & { id: number })
  | {
      id: number;
      attributes?: T;
    }
  | {
      data?: {
        id: number;
        attributes?: T;
      } | null;
    };

const unwrapRelation = <T>(value: RelationShape<T>): ((T & { id: number }) | null) => {
  if (!value) return null;
  if (typeof value !== "object") return null;

  if ("data" in value && value.data) {
    return {
      id: value.data.id,
      ...(value.data.attributes || ({} as T)),
    };
  }

  return {
    id: (value as any).id,
    ...(((value as any).attributes as T) || (value as T) || ({} as T)),
  };
};

export const normalizePluginUser = (raw: any): PluginUserDetails => {
  if (!raw) {
    throw new Error("User payload is empty");
  }

  const normalizedUser = raw.data ?? raw;

  return {
    id: normalizedUser.id,
    phone: normalizedUser.phone ?? normalizedUser.Phone ?? "",
    IsActive: normalizedUser.IsActive ?? false,
    removedAt: normalizedUser.removedAt ?? null,
    createdAt: normalizedUser.createdAt ?? "",
    updatedAt: normalizedUser.updatedAt ?? "",
    user_info: unwrapRelation<UserInfoAttributes>(normalizedUser.user_info),
    user_role: unwrapRelation<UserRoleAttributes>(normalizedUser.user_role),
    user_wallet: unwrapRelation<UserWalletAttributes>(normalizedUser.user_wallet),
    role: normalizedUser.role
      ? {
          id: normalizedUser.role.id,
          name: normalizedUser.role.name,
          description: normalizedUser.role.description,
          type: normalizedUser.role.type,
        }
      : null,
  };
};

export const getDetails = async (id: string): Promise<PluginUserDetails> => {
  const endpoint = `${ENDPOINTS.USER.GET_DETAILS}/${id}?populate[user_info]=*&populate[user_role]=*&populate[user_wallet]=*&populate[role]=*`;

  const response = await apiClient.get<PluginUserDetails>(endpoint);

  return normalizePluginUser(response);
};
