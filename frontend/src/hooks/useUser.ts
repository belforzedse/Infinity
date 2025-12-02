import { useAtom } from "jotai";
import { currentUserAtom, userLoadingAtom, userErrorAtom } from "@/lib/atoms/auth";
import UserService from "@/services/user";
import type { MeResponse } from "@/services/user/me";

interface UseUserReturnType {
  userData: MeResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export default function useUser(): UseUserReturnType {
  const [userData, setUserData] = useAtom(currentUserAtom);
  const [isLoading, setIsLoading] = useAtom(userLoadingAtom);
  const [error, setError] = useAtom(userErrorAtom);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await UserService.me();
      setUserData(data);
    } catch (err) {
      const parsedError = err instanceof Error ? err : new Error("Failed to fetch user data");
      setError(parsedError);
      console.error("Error fetching user data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    userData,
    isLoading,
    error,
    refetch: fetchUserData,
  };
}
