import { usersRepository } from "./users.repository";

type SelectableUserRole =
  | "commuter"
  | "driver"
  | "private_driver"
  | "citizen"
  | "guide";

type ServiceError = Error & { statusCode?: number };

function createServiceError(message: string, statusCode: number): ServiceError {
  const error = new Error(message) as ServiceError;
  error.statusCode = statusCode;
  return error;
}

export const usersService = {
  async getMyProfile(user_id: string) {
    const user = await usersRepository.getById(user_id);
    if (!user) {
      throw createServiceError("User not found", 404);
    }
    return user;
  },

  async updateMyProfile(user_id: string, data: { username?: string }) {
    const current = await usersRepository.getById(user_id);
    if (!current) {
      throw createServiceError("User not found", 404);
    }

    if (data.username && data.username !== current.username) {
      const existing = await usersRepository.getByUsername(data.username);
      if (existing) {
        throw createServiceError("Username already exists", 409);
      }
    }

    return await usersRepository.updateProfile(user_id, data);
  },

  async listUsers() {
    return await usersRepository.listUsers();
  },

  async updateUserRole(user_id: string, role: SelectableUserRole) {
    const user = await usersRepository.getById(user_id);
    if (!user) {
      throw createServiceError("User not found", 404);
    }

    return await usersRepository.updateUserRole(user_id, role);
  },
};
