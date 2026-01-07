import React from "react";

export function Card({ children, className = "" }) {
  return <div className={`rounded-2xl bg-white shadow ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = "" }) {
  return <div className={`border-b px-6 py-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
  return <h2 className={`text-xl font-bold ${className}`}>{children}</h2>;
}

export function CardContent({ children, className = "" }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}
