import { useState, useEffect } from "react";
import { me, MeResponse } from "@/services/user/me";

interface UseUserReturnType {
  userData: MeResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export default function useUser(): UseUserReturnType {
  const [userData, setUserData] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await me();
      setUserData(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch user data"));
      console.error("Error fetching user data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    const accessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    if (accessToken) {
      fetchUserData();
    } else {
      setIsLoading(false);
    }
  }, []);

  return {
    userData,
    isLoading,
    error,
    refetch: fetchUserData,
  };
}
