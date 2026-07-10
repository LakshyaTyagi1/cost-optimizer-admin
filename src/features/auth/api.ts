import { fetchAdminApiResponse } from "@/lib/api/client";
import type { AdminUser } from "@/lib/auth/storage";

type LoginPayload = {
  email_id: string;
  password: string;
};

type LoginResponse = {
  data?: AdminUser & {
    atoken?: string;
  };
  message?: string;
};

type UserInfoResponse = {
  data?: AdminUser;
  message?: string;
};

export async function loginAdmin(payload: LoginPayload) {
  const loginResponse = await fetchAdminApiResponse<LoginResponse["data"]>("/adm/user/login", {
    errorMessage: "Unable to log in",
    json: payload,
    method: "POST",
    requireAuth: false,
  });

  if (!loginResponse?.data?.atoken || !loginResponse.data._id) {
    throw new Error(loginResponse?.message || "Unable to log in");
  }

  return loginResponse.data;
}

export async function getAdminUserInfo(userId: string) {
  const userInfoResponse = await fetchAdminApiResponse<UserInfoResponse["data"]>(
    `/adm/user/get-user-info/${userId}`,
    {
      authErrorMessage: "Session expired, please login again",
      errorMessage: "Session expired, please login again",
    },
  );

  if (!userInfoResponse?.data) {
    throw new Error(userInfoResponse?.message || "Session expired, please login again");
  }

  return userInfoResponse.data;
}
