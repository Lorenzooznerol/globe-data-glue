import { useQuery } from "@tanstack/react-query";
import { loadStore, type DataStore } from "./store";

export function useDataStore() {
  return useQuery<DataStore>({
    queryKey: ["data-store"],
    queryFn: loadStore,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
