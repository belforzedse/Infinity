"use client";

import Desktop from "./Desktop";
import Mobile from "./Mobile";

type Props = {
  children: React.ReactNode;
  title: string;
  titleSuffixComponent?: React.ReactNode;
  hasRecycleBin?: boolean;
  hasAddButton?: boolean;
  addButtonText?: string;
  addButtonPath?: string;
  hasFilterButton?: boolean;
  hasPagination?: boolean;
  apiUrl?: string;
  totalPages?: number;
  isRecycleBinOpen?: boolean;
  filterOptions?: {
    id: number | string;
    title: string;
  }[];
  setIsRecycleBinOpen?: (isRecycleBinOpen: boolean) => void;
};

export default function ContentWrapper(props: Props) {
  return (
    <div className="w-full">
      <div className="hidden md:block">
        <Desktop {...props} />
      </div>
      <div className="block md:hidden">
        <Mobile {...props} />
      </div>
    </div>
  );
}
