'use client';

import { AuthorForm } from '@/components/admin/AuthorForm';

export default function NewAuthorPage() {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <AuthorForm isNew={true} />
    </div>
  );
}
