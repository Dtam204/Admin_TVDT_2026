"use client";

import { Languages } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { Locale } from "@/lib/hooks/useTranslationControls";

interface TranslationControlsProps {
  globalLocale: Locale;
  setGlobalLocale: (locale: Locale) => void;
}

/**
 * Component tái sử dụng để hiển thị controls cho locale selection
 */
export function TranslationControls({
  globalLocale,
  setGlobalLocale,
}: TranslationControlsProps) {
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Locale Selector */}
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-gray-500" />
            <Label className="text-sm text-gray-600 whitespace-nowrap">Hiển thị:</Label>
            <Select value={globalLocale} onValueChange={(value: Locale) => setGlobalLocale(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vi">🇻🇳 Tiếng Việt</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="ja">🇯🇵 日本語</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


