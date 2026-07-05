"use client";

import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface BaseProps {
  label: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, BaseProps & InputHTMLAttributes<HTMLInputElement>>(
  function TextField({ label, error, ...props }, ref) {
    return (
      <div>
        <label className="label">{label}</label>
        <input ref={ref} className={`input ${error ? "!border-rose-400 !ring-rose-400/20" : ""}`} {...props} />
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      </div>
    );
  }
);

export const SelectField = forwardRef<HTMLSelectElement, BaseProps & SelectHTMLAttributes<HTMLSelectElement>>(
  function SelectField({ label, error, children, ...props }, ref) {
    return (
      <div>
        <label className="label">{label}</label>
        <select ref={ref} className={`input ${error ? "!border-rose-400 !ring-rose-400/20" : ""}`} {...props}>
          {children}
        </select>
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      </div>
    );
  }
);

export const TextAreaField = forwardRef<HTMLTextAreaElement, BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function TextAreaField({ label, error, ...props }, ref) {
    return (
      <div>
        <label className="label">{label}</label>
        <textarea ref={ref} rows={3} className={`input ${error ? "!border-rose-400 !ring-rose-400/20" : ""}`} {...props} />
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      </div>
    );
  }
);
