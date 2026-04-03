'use client';

import { useState } from 'react';
import { useAuditLogs } from '@/lib/hooks/useAudit';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  History, 
  Search, 
  Filter, 
  User, 
  Database, 
  Activity,
  Plus,
  Edit,
  Trash2,
  RefreshCcw,
  Eye
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useAuditLogs({ page, limit: 50, search });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'CREATE':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 border-none px-2 rounded-lg font-bold"><Plus className="w-3 h-3 mr-1" /> CREATE</Badge>;
      case 'UPDATE':
        return <Badge className="bg-amber-500 hover:bg-amber-600 border-none px-2 rounded-lg font-bold"><Edit className="w-3 h-3 mr-1" /> UPDATE</Badge>;
      case 'DELETE':
        return <Badge className="bg-rose-500 hover:bg-rose-600 border-none px-2 rounded-lg font-bold"><Trash2 className="w-3 h-3 mr-1" /> DELETE</Badge>;
      default:
        return <Badge variant="outline" className="px-2 rounded-lg font-bold">{action}</Badge>;
    }
  };

  const formatData = (json: any) => {
    if (!json) return 'N/A';
    return <pre className="text-[10px] bg-slate-50 p-2 rounded-lg overflow-auto max-h-40 font-mono text-slate-600">{JSON.stringify(json, null, 2)}</pre>;
  };

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <History className="w-7 h-7" />
            </div>
            Nhật ký <span className="text-indigo-600">Hoạt động Admin</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Theo dõi và giám sát mọi thay đổi dữ liệu trong hệ thống</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Tìm kiếm hành động, admin, module..." 
              className="pl-10 h-12 rounded-2xl bg-white border-slate-200 shadow-sm focus:ring-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button className="h-12 w-12 rounded-2xl bg-white border border-slate-200 shadow-sm text-slate-600 hover:bg-slate-50">
            <Filter className="w-5 h-5" />
          </Button>
          <Button 
            className="h-12 w-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700"
            onClick={() => window.location.reload()}
          >
            <RefreshCcw className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-slate-100 overflow-hidden rounded-3xl">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              <CardTitle className="text-lg font-bold text-slate-800">Dòng thời gian sự kiện</CardTitle>
            </div>
            <Badge variant="secondary" className="bg-white border text-slate-500 font-bold px-3 py-1">
              {data?.data?.total || 0} bản ghi
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow className="border-slate-100">
                <TableHead className="pl-6 py-4 font-bold text-slate-500 uppercase text-[10px]">Thời gian</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[10px]">Người thực hiện</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[10px]">Hành động</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[10px]">Module</TableHead>
                <TableHead className="font-bold text-slate-500 uppercase text-[10px]">ID Đối tượng</TableHead>
                <TableHead className="text-right pr-6 font-bold text-slate-500 uppercase text-[10px]">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-60 text-center text-slate-400 italic">Đang truy vấn nhật ký...</TableCell></TableRow>
              ) : data?.data?.logs?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-60 text-center text-slate-400 italic">Chưa có hoạt động nào được ghi lại</TableCell></TableRow>
              ) : (
                data.data.logs.map((log: any) => (
                  <TableRow key={log.id} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                    <TableCell className="pl-6 py-4">
                      <div className="font-mono text-[11px] text-slate-400">
                        {new Date(log.created_at).toLocaleString('vi-VN')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 text-sm">{log.user_name || 'Hệ thống'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {log.user_id || 'SYSTEM'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                        <Database className="w-3.5 h-3.5 text-slate-400" />
                        {log.module}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px] bg-slate-50 border-slate-200 text-slate-500">
                        {log.entity_id}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="rounded-xl hover:bg-indigo-50 text-indigo-600 font-bold text-xs">
                            <Eye className="w-4 h-4 mr-1" /> So sánh
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col rounded-3xl border-none shadow-2xl">
                          <DialogHeader className="p-6 pb-2">
                            <DialogTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                                <Activity className="w-6 h-6" />
                              </div>
                              Chi tiết Thay đổi
                            </DialogTitle>
                            <DialogDescription className="font-medium text-slate-500">
                              Người thực hiện: <span className="text-indigo-600 font-bold">{log.user_name}</span> lúc {new Date(log.created_at).toLocaleString('vi-VN')}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex-1 overflow-auto p-6 grid grid-cols-2 gap-6 bg-slate-50/50">
                            <div className="space-y-3">
                              <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                                Dữ liệu Cũ (Old)
                              </h4>
                              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm h-[400px] overflow-auto">
                                {formatData(log.old_data)}
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Dữ liệu Mới (New)
                              </h4>
                              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm h-[400px] overflow-auto">
                                {formatData(log.new_data)}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
