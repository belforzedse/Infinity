import { cn } from "@/lib/utils";
import React from "react";
import { StorefrontContainer } from "@/components/storefront";

export type UserContainerProps = React.HTMLAttributes<HTMLDivElement>;

const UserContainer = ({ className, children, ...props }: UserContainerProps) => {
  return (
    <StorefrontContainer className={cn(className)} {...props}>
      {children}
    </StorefrontContainer>
  );
};

export default UserContainer;
