'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, X, UserPlus, Search, User } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useAuthors } from '@/lib/hooks/useAuthors';
import Link from 'next/link';
import { getCleanValue } from '@/lib/utils/locale-admin';

interface MultiAuthorSelectProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  className?: string;
}

export function MultiAuthorSelect({
  selectedIds = [],
  onChange,
  className,
}: MultiAuthorSelectProps) {
  const [open, setOpen] = React.useState(false);
  const { data: authorsResponse, isLoading } = useAuthors({ limit: 100 });
  const authors = authorsResponse?.data || [];

  const handleUnselect = (id: number) => {
    onChange(selectedIds.filter((s) => s !== id));
  };

  const selectedAuthors = Array.isArray(authors) 
    ? authors.filter((a: any) => selectedIds.includes(a.id))
    : [];

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap gap-1.5 min-h-[44px] p-2 bg-slate-50 rounded-xl border border-slate-200">
        {selectedAuthors.length === 0 && !isLoading && (
          <span className="text-sm text-slate-400 p-1.5 italic">Chưa chọn tác giả nào...</span>
        )}
        {isLoading && (
          <span className="text-sm text-slate-400 p-1.5 animate-pulse">Đang tải danh sách tác giả...</span>
        )}
        {selectedAuthors.map((author: any) => (
          <Badge
            key={author.id}
            variant="secondary"
            className="rounded-lg py-1 pl-2 pr-1 bg-white border border-slate-200 shadow-sm flex items-center gap-1 animate-in zoom-in-50 duration-200"
          >
            <User className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-medium text-slate-700">
              {getCleanValue(author.name) || 'Tác giả'}
            </span>
            <button
              type="button"
              className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-slate-100 p-0.5 transition-colors"
              onClick={() => handleUnselect(author.id)}
            >
              <X className="h-3 w-3 text-slate-400" />
            </button>
          </Badge>
        ))}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="justify-between rounded-xl h-11 border-slate-200 hover:bg-slate-50 transition-all font-normal text-slate-600"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <span>Tìm kiếm & Chọn tác giả...</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0 rounded-2xl shadow-2xl border-none" align="start">
          <Command className="rounded-2xl border-none">
            <CommandInput placeholder="Gõ tên tác giả để tìm..." className="h-12 border-none focus:ring-0" />
            <CommandEmpty className="p-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-slate-500">Không tìm thấy tác giả này.</p>
                <Link href="/admin/authors/new" target="_blank">
                  <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5">
                    <UserPlus className="w-3.5 h-3.5" />
                    Thêm tác giả mới
                  </Button>
                </Link>
              </div>
            </CommandEmpty>
            <CommandList className="max-h-[300px] p-2">
              <CommandGroup heading="Danh sách tác giả">
                {Array.isArray(authors) && authors.map((author: any) => {
                  const isSelected = selectedIds.includes(author.id);
                  return (
                    <CommandItem
                      key={author.id}
                      value={getCleanValue(author.name)}
                      onSelect={() => {
                        if (isSelected) {
                          onChange(selectedIds.filter((id) => id !== author.id));
                        } else {
                          onChange([...selectedIds, author.id]);
                        }
                      }}
                      className={cn(
                        "rounded-xl h-12 gap-2 px-3 transition-colors cursor-pointer mb-1",
                        isSelected ? "bg-blue-50 text-blue-700 font-medium" : "hover:bg-slate-50"
                      )}
                    >
                      <div className="flex-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           {author.avatar ? (
                             <img src={author.avatar} className="w-7 h-7 rounded-full object-cover border" />
                           ) : (
                             <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                               <User className="w-4 h-4 text-slate-400" />
                             </div>
                           )}
                           <span className="text-sm">
                             {getCleanValue(author.name)}
                           </span>
                        </div>
                        <Check
                          className={cn(
                            "h-4 w-4 text-blue-600",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
            <div className="p-2 border-t border-slate-100 bg-slate-50/50">
              <Link href="/admin/authors/new" target="_blank">
                <Button variant="ghost" className="w-full justify-start text-xs text-slate-500 hover:text-blue-600 hover:bg-white gap-2 h-9">
                  <UserPlus className="w-3.5 h-3.5" />
                  Không thấy tác giả? Tạo mới tại đây
                </Button>
              </Link>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
