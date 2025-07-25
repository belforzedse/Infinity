import { UpsertPageConfigType } from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import EditIcon from "@/components/SuperAdmin/UpsertPage/Icons/EditIcon";

export type Comment = {
  id: string;
  username: string;
  name: string;
  status: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
};

export const config: UpsertPageConfigType<Comment> = {
  headTitle: "دیدگاه ها",
  showTimestamp: true,
  actionButtons: (props) => (
    <>
      <button
        className="px-5 py-2 rounded-xl bg-slate-200 text-slate-500 text-sm flex-1 md:flex-none"
        onClick={props.onCancel}
      >
        بیخیال شدن
      </button>

      <button
        className="px-5 py-2 rounded-xl bg-actions-primary text-white text-sm flex-1 md:flex-none"
        onClick={props.onSubmit}
      >
        ذخیره
      </button>
    </>
  ),
  config: [
    {
      title: "متن دیدگاه",
      iconButton: (
        <button className="w-8 h-8 bg-slate-100 rounded-md flex justify-center items-center">
          <EditIcon />
        </button>
      ),
      sections: [
        {
          fields: [
            {
              name: "username",
              type: "text",
              label: "شناسه کاربر",
              readOnly: true,
              colSpan: 4,
              mobileColSpan: 12,
            },
            {
              name: "name",
              type: "text",
              label: "نام",
              readOnly: true,
              colSpan: 4,
              mobileColSpan: 12,
            },
            {
              name: "status",
              type: "dropdown",
              label: "وضعیت",
              colSpan: 4,
              options: [
                {
                  label: "به انتظار بررسی",
                  value: "Need for Review",
                },
                {
                  label: "رد شده",
                  value: "Rejected",
                },
                {
                  label: "قبول شده",
                  value: "Accepted",
                },
              ],
              mobileColSpan: 12,
            },
            {
              name: "message",
              type: "multiline-text",
              label: "دیدگاه",
              colSpan: 12,
              mobileColSpan: 12,
            },
          ],
        },
      ],
    },
  ],
};
