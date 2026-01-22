'use client';

import { useRouter } from 'next/navigation';
import { useCreateBook, useAuthorsSelect, useBookCategoriesSelect, usePublishersSelect } from '@/lib/hooks/useBooks';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewBookPage() {
  const router = useRouter();
  const { mutate: createBook, isPending } = useCreateBook();
  
  // Fetch select options
  const { data: authorsData } = useAuthorsSelect();
  const { data: categoriesData } = useBookCategoriesSelect();
  const { data: publishersData } = usePublishersSelect();

  // Form state
  const [formData, setFormData] = useState({
    isbn: '',
    title: { vi: '', en: '', ja: '' },
    slug: '',
    publisher_id: '',
    description: { vi: '', en: '', ja: '' },
    cover_image: '',
    publication_year: new Date().getFullYear(),
    language: 'vi',
    pages: '',
    format: 'paperback',
    quantity: '0',
    price: '0',
    rental_price: '0',
    status: 'available',
    featured: false,
    location: '',
    author_ids: [] as number[],
    category_ids: [] as number[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.isbn || !formData.title.vi || !formData.slug) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    createBook(
      {
        ...formData,
        publication_year: parseInt(formData.publication_year as any),
        pages: parseInt(formData.pages) || 0,
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
        rental_price: parseFloat(formData.rental_price),
        publisher_id: formData.publisher_id ? parseInt(formData.publisher_id) : null,
      },
      {
        onSuccess: () => {
          toast.success('Đã tạo sách thành công');
          router.push('/admin/books');
        },
        onError: (error: any) => {
          toast.error(error.message || 'Có lỗi xảy ra');
        },
      }
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/books">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Thêm sách mới</h1>
          <p className="text-muted-foreground">Nhập thông tin sách và liên kết với tác giả, thể loại</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="isbn">
                    ISBN <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="isbn"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="978-604-..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">
                    Slug <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="ten-sach-slug"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title_vi">
                  Tên sách (Tiếng Việt) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title_vi"
                  value={formData.title.vi}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      title: { ...formData.title, vi: e.target.value },
                    })
                  }
                  placeholder="Truyện Kiều"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title_en">Tên sách (English)</Label>
                  <Input
                    id="title_en"
                    value={formData.title.en}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        title: { ...formData.title, en: e.target.value },
                      })
                    }
                    placeholder="The Tale of Kieu"
                  />
                </div>

                <div>
                  <Label htmlFor="title_ja">Tên sách (日本語)</Label>
                  <Input
                    id="title_ja"
                    value={formData.title.ja}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        title: { ...formData.title, ja: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Publishing Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin xuất bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="publisher">Nhà xuất bản</Label>
                <Select
                  value={formData.publisher_id}
                  onValueChange={(value) => setFormData({ ...formData, publisher_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn nhà xuất bản" />
                  </SelectTrigger>
                  <SelectContent>
                    {publishersData?.data?.map((pub: any) => (
                      <SelectItem key={pub.id} value={pub.id.toString()}>
                        {pub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="publication_year">Năm xuất bản</Label>
                  <Input
                    id="publication_year"
                    type="number"
                    value={formData.publication_year}
                    onChange={(e) => setFormData({ ...formData, publication_year: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="pages">Số trang</Label>
                  <Input
                    id="pages"
                    type="number"
                    value={formData.pages}
                    onChange={(e) => setFormData({ ...formData, pages: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="format">Định dạng</Label>
                  <Select
                    value={formData.format}
                    onValueChange={(value) => setFormData({ ...formData, format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hardcover">Hardcover</SelectItem>
                      <SelectItem value="paperback">Paperback</SelectItem>
                      <SelectItem value="ebook">eBook</SelectItem>
                      <SelectItem value="audiobook">Audiobook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Kho & Giá</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="quantity">Số lượng</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="price">Giá mua (VNĐ)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="rental_price">Giá thuê (VNĐ)</Label>
                  <Input
                    id="rental_price"
                    type="number"
                    value={formData.rental_price}
                    onChange={(e) => setFormData({ ...formData, rental_price: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="location">Vị trí</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Kệ A1-B3"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4 justify-end">
            <Link href="/admin/books">
              <Button variant="outline" type="button">
                Hủy
              </Button>
            </Link>
            <Button type="submit" disabled={isPending}>
              <Save className="w-4 h-4 mr-2" />
              {isPending ? 'Đang lưu...' : 'Lưu sách'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
