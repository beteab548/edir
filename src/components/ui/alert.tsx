import React from "react";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
}

export function Alert({
  children,
  className = "",
  variant = "default",
  ...props
}: AlertProps) {
  const baseClasses =
    "relative w-full rounded-lg border p-4 text-gray-800 shadow-sm flex items-start space-x-3";
  const variantClasses =
    variant === "destructive"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-gray-200 bg-white text-gray-800";

  return (
    <div
      role="alert"
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5 className={`font-semibold text-sm ${className}`} {...props}>
      {children}
    </h5>
  );
}

export function AlertDescription({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-gray-600 ${className}`} {...props}>
      {children}
    </p>
  );
}
