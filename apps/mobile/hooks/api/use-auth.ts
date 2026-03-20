// hooks/api/use-auth.ts
import { useMutation } from "@tanstack/react-query";
import { authApi } from "../../lib/api/auth.api";
import { useAuthStore } from "../../stores/auth.store";
import { LoginInput, RegisterInput } from "../../lib/schemas/auth.schema";

export function useLogin() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (data: LoginInput) => authApi.login(data),
    onSuccess: (data) => {
      setAuth(data.data.user, data.data.token);
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();

  return useMutation({
    mutationFn: (data: RegisterInput) => authApi.register(data),
    onSuccess: (data) => {
      setAuth(data.data, data.data.token); // Adjust based on API response structure
    },
  });
}
