'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiCall } from '@/lib/api/admin/client';
import { ArrowLeft, User, Save, Info, Sparkles, Globe, Link as LinkIcon, Facebook, Twitter, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import Link from 'next/link';

import { AuthorForm } from '@/components/admin/AuthorForm';

export default function EditAuthorPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: authorResponse, isLoading } = useQuery({
    queryKey: ['authors', id],
    queryFn: () => adminApiCall(`/api/admin/authors/${id}`),
  });

  const author = authorResponse?.data || authorResponse;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <AuthorForm initialData={author} isNew={false} id={id} />
    </div>
  );
}
