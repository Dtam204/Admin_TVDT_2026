'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { adminApiCall } from '@/lib/api/admin/client';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  RefreshCw,
  ArrowRight,
  Filter,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { safeFormatDateTimeVN } from '@/lib/date';


type InternalAlert = {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'info';
  title: string;
  message: string;
  href?: string;
  count?: number;
  created_at?: string;
};

type AlertsPayload = {
  unreadCount: number;
  alerts: InternalAlert[];
  generatedAt: string;
};

function getSeverityMeta(severity: InternalAlert['severity']) {
  if (severity === 'high') {
    return {
      icon: AlertTriangle,
      badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
      rowClass: 'border-l-4 border-l-rose-400',
      label: 'Khẩn cấp',
    };
  }

  if (severity === 'medium') {
    return {
      icon: AlertCircle,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      rowClass: 'border-l-4 border-l-amber-400',
      label: 'Cần xử lý',
    };
  }

  return {
    icon: Info,
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    rowClass: 'border-l-4 border-l-sky-400',
    label: 'Thông tin',
  };
}

function formatAgo(raw?: string) {
  if (!raw) return 'Không rõ thời gian';
  const t = new Date(raw).getTime();
  if (Number.isNaN(t)) return 'Không rõ thời gian';

  const diff = Math.max(0, Date.now() - t);
  const m = 60 * 1000;
  const h = 60 * m;
  const d = 24 * h;

  if (diff < h) return `${Math.max(1, Math.floor(diff / m))} phút trước`;
  if (diff < d) return `${Math.floor(diff / h)} giờ trước`;
  return `${Math.floor(diff / d)} ngày trước`;
}

export default function InternalNotificationsPage() {
  const router = useRouter();
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'info'>('all');

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['admin-internal-notifications'],
    queryFn: async () => {
      const response = await adminApiCall<{ success?: boolean; data?: AlertsPayload }>('/api/admin/dashboard/alerts');
      return response?.data || { unreadCount: 0, alerts: [], generatedAt: new Date().toISOString() };
    },
    refetchInterval: 60000,
  });

  const alerts = Array.isArray(data?.alerts) ? data!.alerts : [];

  const filteredAlerts = useMemo(() => {
    if (severityFilter === 'all') return alerts;
    return alerts.filter((item) => item.severity === severityFilter);
  }, [alerts, severityFilter]);

  const stats = useMemo(() => {
    const high = alerts.filter((a) => a.severity === 'high').length;
    const medium = alerts.filter((a) => a.severity === 'medium').length;
    const info = alerts.filter((a) => a.severity === 'info').length;
    const total = alerts.length;
    return { high, medium, info, total };
  }, [alerts]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </span>
            Thông báo nội bộ Admin
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Bảng cảnh báo vận hành, nhắc việc và rủi ro cần xử lý trong hệ thống quản trị.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} className="gap-2" disabled={isRefetching}>
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardDescription>Tổng cảnh báo</CardDescription>
            <CardTitle className="text-2xl font-black">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-rose-200 bg-rose-50/60">
          <CardHeader className="pb-2">
            <CardDescription>Khẩn cấp</CardDescription>
            <CardTitle className="text-2xl font-black text-rose-700">{stats.high}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader className="pb-2">
            <CardDescription>Cần xử lý</CardDescription>
            <CardTitle className="text-2xl font-black text-amber-700">{stats.medium}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-sky-200 bg-sky-50/60">
          <CardHeader className="pb-2">
            <CardDescription>Thông tin</CardDescription>
            <CardTitle className="text-2xl font-black text-sky-700">{stats.info}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5" /> Danh sách thông báo nội bộ
            </CardTitle>
            <CardDescription>
              Cập nhật lúc: {safeFormatDateTimeVN(data?.generatedAt)}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="text-slate-500 text-sm font-semibold flex items-center gap-2">
              <Filter className="w-4 h-4" /> Mức độ
            </div>
            <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc mức độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="high">Khẩn cấp</SelectItem>
                <SelectItem value="medium">Cần xử lý</SelectItem>
                <SelectItem value="info">Thông tin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {isLoading && (
            <div className="py-14 text-center text-slate-500">Đang tải thông báo nội bộ...</div>
          )}

          {!isLoading && filteredAlerts.length === 0 && (
            <div className="py-14 text-center text-slate-500">Không có thông báo phù hợp bộ lọc hiện tại.</div>
          )}

          {!isLoading && filteredAlerts.map((alert) => {
            const meta = getSeverityMeta(alert.severity);
            const SeverityIcon = meta.icon;

            return (
              <div key={alert.id} className={`rounded-xl border border-slate-200 bg-white p-4 ${meta.rowClass}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SeverityIcon className="w-4 h-4 text-slate-600" />
                      <h3 className="text-sm md:text-base font-bold text-slate-900">{alert.title}</h3>
                      <Badge variant="outline" className={meta.badgeClass}>{meta.label}</Badge>
                      {Number(alert.count) > 0 && (
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300">{alert.count}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-2 leading-relaxed">{alert.message}</p>
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatAgo(alert.created_at)}
                    </p>
                  </div>

                  <div>
                    {alert.href && (
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => router.push(alert.href as string)}
                      >
                        Xử lý
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
