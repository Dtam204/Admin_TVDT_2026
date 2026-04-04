"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/components/ui/utils";
import { getLocaleConfig } from "@/lib/utils/locale-admin";

// Define the Locale type
type Locale = 'vi' | 'en' | 'ja';

interface LocaleInputProps {
  label?: string;
  value: Record<Locale, string> | any; // Any for flexibility with old data
  onChange: (value: Record<Locale, string>) => void;
  locale: Locale; // The currently selected display locale
  type?: "text" | "textarea";
  placeholder?: string;
  className?: string;
  required?: boolean;
}

/**
 * Component nhập liệu đa ngôn ngữ chuẩn cho Admin Panel
 */
export const LocaleInput: React.FC<LocaleInputProps> = ({
  label,
  value,
  onChange,
  locale,
  type = "text",
  placeholder,
  className,
  required,
}) => {
  const locales = getLocaleConfig();
  const currentLocaleConfig = locales.find((l) => l.id === locale);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Đảm bảo value là object
    const valObj = (typeof value === 'object' && value !== null && !Array.isArray(value)) 
      ? { ...value } 
      : { vi: typeof value === 'string' ? value : '', en: '', ja: '' };

    onChange({
      ...valObj,
      [locale]: e.target.value,
    });
  };

  // Lấy giá trị của locale hiện tại
  const currentValue = (typeof value === 'object' && value !== null && !Array.isArray(value))
    ? (value[locale] || "")
    : (locale === 'vi' && typeof value === 'string' ? value : "");

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        {label && (
          <Label className="flex items-center gap-1">
            {label}
            {required && <span className="text-destructive">*</span>}
          </Label>
        )}
        <div className="flex gap-1">
          {locales.map((l) => {
            const hasData = typeof value === 'object' && value !== null && value[l.id]?.trim();
            const isActive = l.id === locale;
            
            return (
              <Badge
                key={l.id}
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "cursor-default text-[10px] px-1.5 py-0 h-5 flex gap-1 items-center font-medium",
                  !isActive && hasData && "border-primary/50 text-primary bg-primary/5"
                )}
                title={l.name}
              >
                <span>{l.flag}</span>
                <span>{l.id.toUpperCase()}</span>
              </Badge>
            );
          })}
        </div>
      </div>
      
      {type === "text" ? (
        <Input
          value={currentValue}
          onChange={handleInputChange}
          placeholder={`${placeholder || label || ""} (${currentLocaleConfig?.name})`}
          className="h-10"
        />
      ) : (
        <Textarea
          value={currentValue}
          onChange={handleInputChange}
          placeholder={`${placeholder || label || ""} (${currentLocaleConfig?.name})`}
          className="min-h-[100px] resize-y"
        />
      )}
    </div>
  );
};

export default LocaleInput;
