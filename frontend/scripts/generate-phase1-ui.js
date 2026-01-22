/**
 * Generator Script - Phase 1 UI (Hooks + Pages)
 * Tự động generate hooks và pages cho tất cả Phase 1 modules
 * 
 * Usage: node scripts/generate-phase1-ui.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// MODULE DEFINITIONS
// ============================================================================

const modules = [
  {
    name: 'authors',
    singular: 'Author',
    plural: 'Authors',
    icon: 'UserCircle',
    route: 'authors',
    endpoint: 'authors',
    title: 'Tác giả',
    titlePlural: 'Tác giả',
    fields: {
      main: 'name',
      isMultilang: true,
    },
    columns: ['Tên tác giả', 'Quốc tịch', 'Năm sinh', 'Trạng thái'],
  },
  {
    name: 'publishers',
    singular: 'Publisher',
    plural: 'Publishers',
    icon: 'Briefcase',
    route: 'publishers',
    endpoint: 'publishers',
    title: 'Nhà xuất bản',
    titlePlural: 'Nhà xuất bản',
    fields: {
      main: 'name',
      isMultilang: false,
    },
    columns: ['Tên NXB', 'Email', 'Số điện thoại', 'Trạng thái'],
  },
  {
    name: 'bookCategories',
    singular: 'BookCategory',
    plural: 'BookCategories',
    icon: 'FolderTree',
    route: 'book-categories',
    endpoint: 'bookCategories',
    title: 'Thể loại sách',
    titlePlural: 'Thể loại sách',
    fields: {
      main: 'name',
      isMultilang: true,
    },
    columns: ['Mã', 'Tên thể loại', 'Icon', 'Trạng thái'],
  },
  {
    name: 'courses',
    singular: 'Course',
    plural: 'Courses',
    icon: 'GraduationCap',
    route: 'courses',
    endpoint: 'courses',
    title: 'Khóa học',
    titlePlural: 'Khóa học',
    fields: {
      main: 'title',
      isMultilang: true,
    },
    columns: ['Tên khóa học', 'Cấp độ', 'Thời lượng', 'Giá', 'Trạng thái'],
  },
  {
    name: 'courseCategories',
    singular: 'CourseCategory',
    plural: 'CourseCategories',
    icon: 'FolderTree',
    route: 'course-categories',
    endpoint: 'courseCategories',
    title: 'Danh mục khóa học',
    titlePlural: 'Danh mục khóa học',
    fields: {
      main: 'name',
      isMultilang: true,
    },
    columns: ['Mã', 'Tên danh mục', 'Icon', 'Trạng thái'],
  },
  {
    name: 'instructors',
    singular: 'Instructor',
    plural: 'Instructors',
    icon: 'UserCircle',
    route: 'instructors',
    endpoint: 'instructors',
    title: 'Giảng viên',
    titlePlural: 'Giảng viên',
    fields: {
      main: 'name',
      isMultilang: true,
    },
    columns: ['Tên giảng viên', 'Chức danh', 'Chuyên môn', 'Trạng thái'],
  },
  {
    name: 'members',
    singular: 'Member',
    plural: 'Members',
    icon: 'Users',
    route: 'members',
    endpoint: 'members',
    title: 'Thành viên',
    titlePlural: 'Thành viên',
    fields: {
      main: 'full_name',
      isMultilang: false,
    },
    columns: ['Họ tên', 'Email', 'Số điện thoại', 'Gói thành viên', 'Trạng thái'],
  },
  {
    name: 'membershipPlans',
    singular: 'MembershipPlan',
    plural: 'MembershipPlans',
    icon: 'Package',
    route: 'membership-plans',
    endpoint: 'membershipPlans',
    title: 'Gói thành viên',
    titlePlural: 'Gói thành viên',
    fields: {
      main: 'name',
      isMultilang: true,
    },
    columns: ['Tên gói', 'Giá', 'Thời hạn', 'Max Books', 'Trạng thái'],
  },
];

// ============================================================================
// HOOKS TEMPLATE
// ============================================================================

function generateHook(module) {
  const { name, endpoint, singular, plural } = module;
  const hookName = `use${singular}`;
  const hooksName = `use${plural}`;
  
  return `/**
 * React Query Hooks - ${plural} Module
 * Phase 1 MVP - Auto-generated
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ============================================================================
// API CLIENT
// ============================================================================

const ${name}Api = {
  getAll: async (params?: any) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(\`\${API_BASE}/api/admin/${module.route}?\${query}\`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch ${name}');
    return res.json();
  },

  getById: async (id: number) => {
    const res = await fetch(\`\${API_BASE}/api/admin/${module.route}/\${id}\`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch ${singular.toLowerCase()}');
    return res.json();
  },

  create: async (data: any) => {
    const res = await fetch(\`\${API_BASE}/api/admin/${module.route}\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to create ${singular.toLowerCase()}');
    }
    return res.json();
  },

  update: async (id: number, data: any) => {
    const res = await fetch(\`\${API_BASE}/api/admin/${module.route}/\${id}\`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to update ${singular.toLowerCase()}');
    }
    return res.json();
  },

  delete: async (id: number) => {
    const res = await fetch(\`\${API_BASE}/api/admin/${module.route}/\${id}\`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || 'Failed to delete ${singular.toLowerCase()}');
    }
    return res.json();
  },
};

// ============================================================================
// REACT QUERY HOOKS
// ============================================================================

export function ${hooksName}(params?: any) {
  return useQuery({
    queryKey: ['${name}', params],
    queryFn: () => ${name}Api.getAll(params),
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function ${hookName}(id: number) {
  return useQuery({
    queryKey: ['${name}', id],
    queryFn: () => ${name}Api.getById(id),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreate${singular}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => ${name}Api.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${name}'] });
    },
  });
}

export function useUpdate${singular}(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => ${name}Api.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${name}'] });
      queryClient.invalidateQueries({ queryKey: ['${name}', id] });
    },
  });
}

export function useDelete${singular}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => ${name}Api.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${name}'] });
    },
  });
}
`;
}

// ============================================================================
// LIST PAGE TEMPLATE
// ============================================================================

function generateListPage(module) {
  const { name, singular, plural, icon, title, titlePlural, route } = module;
  
  return `'use client';

import { useState } from 'react';
import { use${plural}, useDelete${singular} } from '@/lib/hooks/use${plural}';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, ${icon} } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ${plural}Page() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');

  const { data, isLoading } = use${plural}({ 
    page, 
    limit: 20, 
    search, 
    status: status === 'all' ? undefined : status 
  });
  const { mutate: deleteItem } = useDelete${singular}();

  const handleDelete = (id: number, name: string) => {
    if (!confirm(\`Bạn có chắc muốn xóa "\${name}"?\`)) return;

    deleteItem(id, {
      onSuccess: () => {
        toast.success('Đã xóa thành công');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Không thể xóa');
      },
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      active: 'default',
      inactive: 'secondary',
      draft: 'outline',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <${icon} className="w-8 h-8" />
            Quản lý ${titlePlural}
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý toàn bộ ${titlePlural.toLowerCase()}
          </p>
        </div>
        <Link href="/admin/${route}/new">
          <Button size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Thêm mới
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>${title}</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  Đang tải...
                </TableCell>
              </TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((item: any) => {
                const displayName = ${module.fields.isMultilang}
                  ? (typeof item.name === 'string' ? JSON.parse(item.name).vi || item.name : item.name?.vi || item.${module.fields.main} || 'N/A')
                  : (item.name || item.${module.fields.main} || 'N/A');
                
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm">#{item.id}</TableCell>
                    <TableCell className="font-medium">{displayName}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link href={\`/admin/${route}/\${item.id}\`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item.id, displayName)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Trước
          </Button>
          <span className="flex items-center px-4">
            Trang {page} / {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= data.pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
}
`;
}

// ============================================================================
// NEW PAGE TEMPLATE (Simple)
// ============================================================================

function generateNewPage(module) {
  const { name, singular, plural, route, title } = module;
  
  return `'use client';

import { useRouter } from 'next/navigation';
import { useCreate${singular} } from '@/lib/hooks/use${plural}';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function New${singular}Page() {
  const router = useRouter();
  const { mutate: create, isPending } = useCreate${singular}();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.info('Form submission - Coming soon!');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/${route}">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Thêm ${title} mới</h1>
          <p className="text-muted-foreground">Nhập thông tin ${title.toLowerCase()}</p>
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
`;
}

// ============================================================================
// DETAIL PAGE TEMPLATE
// ============================================================================

function generateDetailPage(module) {
  const { name, singular, plural, route, title } = module;
  
  return `'use client';

import { useRouter } from 'next/navigation';
import { use${singular}, useDelete${singular} } from '@/lib/hooks/use${plural}';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ${singular}DetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const itemId = parseInt(params.id);

  const { data, isLoading } = use${singular}(itemId);
  const { mutate: deleteItem, isPending: isDeleting } = useDelete${singular}();

  const handleDelete = () => {
    if (!confirm('Bạn có chắc muốn xóa?')) return;

    deleteItem(itemId, {
      onSuccess: () => {
        toast.success('Đã xóa thành công');
        router.push('/admin/${route}');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Không thể xóa');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Đang tải...</div>
      </div>
    );
  }

  if (!data?.data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">Không tìm thấy dữ liệu</div>
      </div>
    );
  }

  const item = data.data;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/${route}">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Chi tiết ${title}</h1>
            <p className="text-muted-foreground">#{itemId}</p>
          </div>
        </div>
        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
          <Trash2 className="w-4 h-4 mr-2" />
          Xóa
        </Button>
      </div>

      <div className="bg-card p-6 rounded-lg border">
        <pre className="text-sm">{JSON.stringify(item, null, 2)}</pre>
      </div>
    </div>
  );
}
`;
}

// ============================================================================
// GENERATE FILES
// ============================================================================

console.log('🚀 Starting Phase 1 UI Generator...\n');

const hooksDir = path.join(__dirname, '../lib/hooks');
const adminDir = path.join(__dirname, '../app/(admin)/admin');

let generatedHooks = 0;
let generatedPages = 0;

modules.forEach(module => {
  console.log(`\n📦 Generating ${module.plural}...`);
  
  // 1. Generate hook
  const hookPath = path.join(hooksDir, `use${module.plural}.ts`);
  const hookContent = generateHook(module);
  fs.writeFileSync(hookPath, hookContent);
  console.log(`   ✅ Hook: lib/hooks/use${module.plural}.ts`);
  generatedHooks++;

  // 2. Create page directory
  const pageDir = path.join(adminDir, module.route);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  // 3. Generate list page
  const listPagePath = path.join(pageDir, 'page.tsx');
  const listPageContent = generateListPage(module);
  fs.writeFileSync(listPagePath, listPageContent);
  console.log(`   ✅ List: app/(admin)/admin/${module.route}/page.tsx`);
  generatedPages++;

  // 4. Generate new page
  const newPageDir = path.join(pageDir, 'new');
  if (!fs.existsSync(newPageDir)) {
    fs.mkdirSync(newPageDir, { recursive: true });
  }
  const newPagePath = path.join(newPageDir, 'page.tsx');
  const newPageContent = generateNewPage(module);
  fs.writeFileSync(newPagePath, newPageContent);
  console.log(`   ✅ New: app/(admin)/admin/${module.route}/new/page.tsx`);
  generatedPages++;

  // 5. Generate detail page
  const detailPageDir = path.join(pageDir, '[id]');
  if (!fs.existsSync(detailPageDir)) {
    fs.mkdirSync(detailPageDir, { recursive: true });
  }
  const detailPagePath = path.join(detailPageDir, 'page.tsx');
  const detailPageContent = generateDetailPage(module);
  fs.writeFileSync(detailPagePath, detailPageContent);
  console.log(`   ✅ Detail: app/(admin)/admin/${module.route}/[id]/page.tsx`);
  generatedPages++;
});

console.log('\n\n═══════════════════════════════════════════════════');
console.log('🎉 GENERATION COMPLETE!');
console.log('═══════════════════════════════════════════════════');
console.log(`✅ Hooks: ${generatedHooks} files`);
console.log(`✅ Pages: ${generatedPages} files`);
console.log(`✅ Total: ${generatedHooks + generatedPages} files\n`);
console.log('📝 Next steps:');
console.log('   1. Restart frontend dev server');
console.log('   2. Login to admin panel');
console.log('   3. Test all modules!');
console.log('\n🚀 All Phase 1 UI is ready!\n');
