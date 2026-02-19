import React from "react";
import { cn } from "@/lib/utils";

export const PageContainer = ({ children, className }) => {
    return (
        <div className={cn(
            "w-full h-full p-6",
            "bg-card text-card-foreground rounded-xl border shadow-sm",
            className
        )}>
            {children}
        </div>
    );
};

export default PageContainer;
