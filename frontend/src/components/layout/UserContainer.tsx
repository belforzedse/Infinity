"use client";

import { cn } from "@/lib/utils";
import React from "react";

export type UserContainerProps = React.HTMLAttributes<HTMLDivElement>;

const UserContainer = ({
  className,
  children,
  ...props
}: UserContainerProps) => {
  return (
    <div className={cn("container mx-auto px-4 lg:p-0", className)} {...props}>
      {children}
    </div>
  );
};

export default UserContainer;
