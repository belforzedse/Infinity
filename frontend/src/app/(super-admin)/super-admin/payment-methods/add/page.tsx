import { config } from "./config";
import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";

export type PaymentMethod = {
  id: number;
  name: string;
  accessLevel: string;
  apiKey: string;
  returnUrl: string;
  description: string;
  configJSON: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export default function Page() {
  return <UpsertPageContentWrapper<PaymentMethod> config={config} />;
}
