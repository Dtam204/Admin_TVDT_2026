'use client';

import { useRouter } from 'next/navigation';
import { useCreateBookCategory } from '@/lib/hooks/useBookCategories';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewBookCategoryPage() {
  const router = useRouter();
  const { mutate: create, isPending } = useCreateBookCategory();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info('Form submission - Coming soon!');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/book-categories">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Thêm Thể loại sách mới</h1>
          <p className="text-muted-foreground">Nhập thông tin thể loại sách</p>
        </div>
      </div>

      <div className="bg-card p-6 rounded-lg border">
        <p className="text-muted-foreground">
          Form sẽ được implement sau. Pattern giống Books module.
        </p>
      </div>
    </div>
  );
}
