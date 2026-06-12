export const storefrontBaseURL = () =>
  process.env.E2E_BASE_URL?.trim() || "http://localhost:2888";

export const strapiApiURL = () =>
  process.env.E2E_API_URL?.trim() || "http://127.0.0.1:1337/api";

export const strapiOrigin = () => {
  const url = new URL(strapiApiURL());
  return `${url.protocol}//${url.host}`;
};

export const cacheBustingSearchParam = () => ({
  key: "_e2e",
  value: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
});
