"use client";

import React from "react";

interface InputFieldProps {
  label?: string;
  name: string; // Tambahan untuk mempermudah handle state
  placeholder: string;
  type?: string;
  large?: boolean;
  value?: string | number;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

export default function InputField({
  label,
  name,
  placeholder,
  type = "text",
  large = false,
  value,
  onChange,
}: InputFieldProps) {
  const baseClassName =
    "w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white";

  const labelClassName =
    "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2";

  if (large) {
    return (
      <div className="mb-4">
        {label && <label className={labelClassName}>{label}</label>}
        <textarea
          name={name}
          placeholder={placeholder}
          onChange={onChange}
          value={value}
          className={`${baseClassName} h-32 resize-y`}
        />
      </div>
    );
  }

  return (
    <div className="mb-4">
      {label && <label className={labelClassName}>{label}</label>}
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        className={baseClassName}
      />
    </div>
  );
}
