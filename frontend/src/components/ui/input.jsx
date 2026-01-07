import React from "react";

export function Input({ className = "", ...props }) {
  return (
    <input
      className={`block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 disabled:pointer-events-none ${className}`}
      {...props}
    />
  );
}
