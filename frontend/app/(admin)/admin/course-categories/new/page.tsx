'use client';

import { useRouter } from 'next/navigation';
import { useCreateCourseCategory } from '@/lib/hooks/useCourseCategories';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewCourseCategoryPage() {
  const router = useRouter();
  const { mutate: create, isPending } = useCreateCourseCategory();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info('Form submission - Coming soon!');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/course-categories">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Thêm Danh mục khóa học mới</h1>
          <p className="text-muted-foreground">Nhập thông tin danh mục khóa học</p>
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
