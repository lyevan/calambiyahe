// hooks/api/use-hazards.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { hazardsApi } from "../../lib/api/hazards.api";

export function useReportHazard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => hazardsApi.report(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hazards", "list"] });
    },
  });
}
