import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { config } from "./config";

export type Notification = {
  id: number;
  sendType: string[];
  type: string;
  selectedEvent: string;
  message: string;
  takers: string[];
  createdAt: Date;
  updatedAt: Date;
};

export default function Page() {
  return <UpsertPageContentWrapper<Notification> config={config} />;
}
