import { ReactNode } from "react";
import Switch from "../../Table/Cells/Switch";

type Props = {
  title: string;
  label: ReactNode;
  status: boolean;
  onChange: (status: boolean) => void;
};

export default function UpsertPageContentWrapperActiveBox(props: Props) {
  const { title, label, status, onChange } = props;

  return (
    <div className="bg-white rounded-2xl p-5 flex flex-col gap-2 sticky top-5">
      <span className="text-lg text-foreground-primary">{title}</span>

      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-500">{label}</span>

        <Switch status={status ? "active" : "inactive"} onChange={onChange} />
      </div>
    </div>
  );
}
