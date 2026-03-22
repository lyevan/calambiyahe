import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hazardsApi, Hazard } from "../../lib/api/hazards.api";

export function useHazards() {
  return useQuery<Hazard[], Error>({
    queryKey: ["hazards", "list"],
    queryFn: hazardsApi.list,
    staleTime: 60 * 1000, // 1 min
  });
}

export function useCreateHazard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => hazardsApi.create(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hazards", "list"] });
    },
  });
}

export function useConfirmHazard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hazardsApi.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hazards", "list"] });
    },
  });
}
