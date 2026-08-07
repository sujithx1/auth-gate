import { QueryClient } from "@tanstack/react-query";
import { api } from "./lib/api";

// Create Query Client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Fetch user profile session context helper
export async function fetchUserSession() {
  try {
    const res: any = await api.get("/api/auth/me");
    return res.data?.user || null;
  } catch {
    return null;
  }
}
