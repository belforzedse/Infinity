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

const data: Notification = {
  id: 1,
  sendType: ["email", "sms"],
  type: "free",
  selectedEvent: "event1",
  message: "",
  takers: ["admin", "user"],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export default function Page() {
  return <UpsertPageContentWrapper<Notification> config={config} data={data} />;
}
