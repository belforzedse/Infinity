declare module "rc-slider/assets/index.css";
declare module "*.css";

declare module "react-window" {
  import * as React from "react";

  export type ListChildComponentProps = {
    index: number;
    style: React.CSSProperties;
    data?: any;
    isScrolling?: boolean;
  };

  export const FixedSizeList: React.ComponentType<{
    height: number | string;
    itemCount: number;
    itemSize: number;
    width: number | string;
    children: React.ComponentType<ListChildComponentProps>;
  }>;
}

declare module "jalaliday" {
  const plugin: any;
  export default plugin;
}
