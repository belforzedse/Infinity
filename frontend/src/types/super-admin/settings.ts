export type SuperAdminSettings = {
  id: number;
  filterPublicProductsByTitle: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const defaultSettings = (): SuperAdminSettings => ({
  id: 1,
  filterPublicProductsByTitle: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});
