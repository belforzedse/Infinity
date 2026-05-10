/** Current user from `GET /auth/self` (same shape as storefront `MeResponse`). */
export interface MeResponse {
  Bio: string | null;
  BirthDate: string | null;
  FirstName: string;
  IsActive: boolean;
  IsVerified: boolean;
  LastName: string;
  NationalCode: string | null;
  Phone: string;
  Sex: string | null;
  createdAt: string;
  id: number;
  updatedAt: string;
  isAdmin?: boolean;
  UserName?: string;
  roleName?: string | null;
}
