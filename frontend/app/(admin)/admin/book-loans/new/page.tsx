'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewBookLoanPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/book-loans">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Tạo phiếu mượn sách</h1>
          <p className="text-muted-foreground">Form sẽ được implement sau</p>
        </div>
      </div>
      <div className="bg-card p-6 rounded-lg border">
        <p className="text-muted-foreground">Coming soon...</p>
      </div>
    </div>
  );
}
