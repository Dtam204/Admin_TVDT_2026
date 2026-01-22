"use client";

import { Bot } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AIProvider } from '@/lib/hooks/useTranslationControls';

interface AIProviderSelectorProps {
  value: AIProvider;
  onChange: (value: AIProvider) => void;
}

/**
 * Component để chọn AI provider cho translation
 */
export function AIProviderSelector({ value, onChange }: AIProviderSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Bot className="h-4 w-4 text-gray-500" />
      <Select value={value} onValueChange={(val: AIProvider) => onChange(val)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="openai">OpenAI (GPT-4o-mini)</SelectItem>
          <SelectItem value="gemini">Google Gemini</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}


