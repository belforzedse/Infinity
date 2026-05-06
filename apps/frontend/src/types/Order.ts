export enum SubmitOrderStep {
  Bill = "bill",
  Table = "table",
  Success = "success",
  Failure = "failure",
}

export interface OrderStatus {
  id: number;
  status: string;
  orderNumber: string;
  paymentStatus: string;
  createdAt: string;
  total: number;
}
