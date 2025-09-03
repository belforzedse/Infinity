type PaymentMethod = {
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

type Transaction = {
  id: number;
  userCode: string;
  amount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

const latestTransactions: Transaction[] = [
  {
    id: 1,
    userCode: "1234567890",
    amount: 100000,
    status: "success",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    userCode: "9876543210",
    amount: 250000,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    userCode: "5678901234",
    amount: 75000,
    status: "failed",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 4,
    userCode: "2468013579",
    amount: 180000,
    status: "success",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 5,
    userCode: "1357924680",
    amount: 320000,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 6,
    userCode: "8642097531",
    amount: 95000,
    status: "success",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 7,
    userCode: "3141592653",
    amount: 450000,
    status: "failed",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 8,
    userCode: "2718281828",
    amount: 135000,
    status: "success",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 9,
    userCode: "1123581321",
    amount: 275000,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 10,
    userCode: "7777777777",
    amount: 500000,
    status: "success",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function SuperAdminPaymentMethodSummaryFooter(props: {
  paymentMethod: PaymentMethod;
}) {
  const {} = props;

  return (
    <div className="mt-0 rounded-xl bg-white p-5 md:mt-6">
      <h2 className="text-lg mb-2 text-right md:text-xl md:mb-4">
        تراکنش های اخیر
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-slate-100 p-2 md:p-4">
        <table className="w-full">
          <thead>
            <tr className="rounded-xl bg-slate-50 px-2 text-right">
              <th className="text-xs px-1 py-2 font-medium text-gray-600 md:text-sm md:py-2.5">
                شناسه کاربر
              </th>
              <th className="text-xs px-1 py-2 font-medium text-gray-600 md:text-sm md:py-2.5">
                مبلغ
              </th>
              <th className="text-xs px-1 py-2 font-medium text-gray-600 md:text-sm md:py-2.5">
                وضعیت
              </th>
              <th className="text-xs px-1 py-2 text-right font-medium text-gray-600 md:text-sm md:py-2.5">
                تاریخ ایجاد
              </th>
              <th className="text-xs px-1 py-2 text-left font-medium text-gray-600 md:text-sm md:py-2.5">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody>
            {latestTransactions.map((transaction) => (
              <tr key={transaction.id} className="border-b border-gray-100">
                <td className="text-xs py-2 md:text-sm md:py-3">
                  <a href="#" className="text-blue-500 hover:underline">
                    {transaction.userCode}
                  </a>
                </td>
                <td className="text-xs py-2 md:text-sm md:py-3">
                  {transaction.amount.toLocaleString()} تومان
                </td>
                <td className="text-xs py-2 md:text-sm md:py-3">
                  <span
                    className={`text-xs rounded-md px-2 py-1 ${
                      transaction.status === "success"
                        ? "text-green-700"
                        : transaction.status === "pending"
                          ? "text-yellow-700"
                          : "text-red-700"
                    }`}
                  >
                    {transaction.status === "success"
                      ? "موفق"
                      : transaction.status === "pending"
                        ? "در انتظار"
                        : "ناموفق"}
                  </span>
                </td>
                <td className="text-xs py-2 text-right text-slate-500 md:text-sm md:py-3">
                  {transaction.createdAt.toLocaleDateString("fa-IR")}
                </td>
                <td className="flex items-center justify-end py-2 md:py-3">
                  <button className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
                    <EyeIcon />
                  </button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={5} className="py-2 md:py-3">
                <div className="flex justify-center">
                  <button className="text-xs flex items-center text-gray-500 md:text-sm">
                    <span className="ml-2">مشاهده بیشتر</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="md:h-4 md:w-4"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v8M8 12h8" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.56738 9.81745C5.67213 4.5322 12.3269 4.5322 16.4316 9.81745"
        stroke="#64748B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11.5733 6.98851C12.8913 8.30653 12.8913 10.4435 11.5733 11.7615C10.2552 13.0795 8.1183 13.0795 6.80028 11.7615C5.48226 10.4435 5.48226 8.30653 6.80028 6.98851C8.1183 5.6705 10.2552 5.6705 11.5733 6.98851"
        stroke="#64748B"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
