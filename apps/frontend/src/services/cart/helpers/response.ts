export const unwrap = <T = any>(response: any): T => {
  return (response?.data?.data ?? response?.data ?? response) as T;
};
