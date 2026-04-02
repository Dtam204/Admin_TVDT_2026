'use client';

import {
  TrendingUp,
  Users,
  Eye,
  Heart,
  BookOpen,
  Star as StarIcon,
  DollarSign,
  Layers,
  History,
  MessageSquare,
  AlertCircle,
  LayoutDashboard
} from "lucide-react";
import Link from 'next/link';
import { cn } from "@/components/ui/utils";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useDashboardStats } from "@/lib/hooks/useDashboard";
import { Skeleton } from "@/components/ui/skeleton";

// Định dạng tiền tệ VNĐ
const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
};

// Định dạng số rút gọn (1.2k, 1M,...)
const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
  return num;
};

export default function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useDashboardStats();

  if (error) return <div className="p-10 text-rose-500 font-bold">Lỗi tải dữ liệu Dashboard: {(error as any).message}</div>;

  const mainStats = [
    {
      title: "Lượt xem",
      value: formatNumber(stats?.totalViews || 0),
      label: "Tổng đọc & tải",
      icon: Eye,
      color: "from-blue-600 to-indigo-600",
      bg: "bg-blue-50 text-blue-600"
    },
    {
      title: "Doanh thu",
      value: formatCurrency(stats?.totalRevenue || 0),
      label: "Phí & Nạp tiền",
      icon: DollarSign,
      color: "from-amber-500 to-orange-600",
      bg: "bg-amber-50 text-amber-600"
    },
    {
      title: "Yêu thích",
      value: formatNumber(stats?.totalFavorites || 0),
      label: "Lượt thả tim",
      icon: Heart,
      color: "from-rose-500 to-pink-600",
      bg: "bg-rose-50 text-rose-600"
    },
    {
      title: "Số lượng mượn",
      value: formatNumber(stats?.totalBorrows || 0),
      label: "Phiếu mượn hệ thống",
      icon: BookOpen,
      color: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-50 text-emerald-600"
    },
  ];

  const ratingData = stats?.ratingDistribution?.map((item: any) => ({
    name: `${item.rating} Sao`,
    value: parseInt(item.count)
  })) || [];

  return (
    <div className="w-full pb-8 space-y-0 text-slate-900 bg-slate-50/30 min-h-screen">
      {/* ── RICH COMPACT HEADER – DASHBOARD ── */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-black px-6 py-5 md:px-10 md:py-6 2xl:py-10 shadow-xl relative overflow-hidden flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/10 mb-0">
        {/* Subtle Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/5 rounded-full -ml-24 -mb-24 blur-[80px]" />

        {/* LEFT SECTION: BRAND & GREETING */}
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 shadow-2xl">
              <LayoutDashboard className="w-8 h-8 lg:w-9 lg:h-9 text-white" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl 2xl:text-4xl font-black text-white tracking-tight">Thư viện Thông minh</h1>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 mt-1 opacity-60">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                HỆ THỐNG QUẢN TRỊ REAL-TIME
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: SYSTEM STATUS */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl">
             <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
             <div className="text-left">
                <p className="text-[7px] text-slate-400 uppercase font-bold tracking-widest leading-none mb-1">TRẠNG THÁI HỆ THỐNG</p>
                <p className="text-[10px] font-black text-white uppercase tracking-tighter">Live & Operational</p>
             </div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6 pt-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_: any, i: number) => <Skeleton key={i} className="h-32 rounded-2xl" />)
          ) : (
            mainStats.map((stat: any, index: number) => (
              <Card key={index} className="border-2 border-slate-100 shadow-lg hover:shadow-xl transition-all rounded-2xl overflow-hidden group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.title}</p>
                      <h3 className="text-xl lg:text-2xl mt-1 font-black text-slate-900 line-clamp-1">
                        {stat.value}
                      </h3>
                      <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-500 font-bold uppercase tracking-tight">
                         <span>{stat.label}</span>
                      </div>
                    </div>
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0", stat.bg)}>
                      <stat.icon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Loan Trends Chart */}
          <Card className="lg:col-span-4 border-none shadow-2xl rounded-[1.5rem] bg-indigo-950 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
            <CardHeader className="p-6 border-b border-white/5 relative z-10 flex flex-row items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/10">
                    <TrendingUp className="w-5 h-5 text-indigo-300" />
                 </div>
                 <div>
                    <CardTitle className="text-lg font-black tracking-tight">Xu hướng mượn sách</CardTitle>
                    <CardDescription className="text-indigo-300/60 font-bold text-[10px] uppercase tracking-wider">7 ngày gần nhất</CardDescription>
                 </div>
              </div>
              <div className="hidden md:flex gap-6">
                 <div className="text-right">
                    <div className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Tăng trưởng</div>
                    <div className="text-base font-black text-emerald-400">+12%</div>
                 </div>
                 <div className="text-right border-l border-white/10 pl-6">
                    <div className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Tổng mượn tuần</div>
                    <div className="text-base font-black">{stats?.totalBorrows || 0}</div>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 py-8 relative z-10">
              <div className="h-[300px] w-full">
                {isLoading ? (
                  <Skeleton className="w-full h-full rounded-2xl bg-white/5" />
                ) : stats?.loanTrends?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.loanTrends}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700 }} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
                        itemStyle={{ color: '#fff', fontWeight: 800, fontSize: '11px' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#6366f1" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorCount)" 
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-indigo-400/20 space-y-4">
                      <History className="w-16 h-16" />
                      <p className="font-black text-sm uppercase tracking-widest">No Trend Data Available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rating Distribution Chart */}
          <Card className="lg:col-span-2 border-2 border-slate-100 shadow-xl rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-50">
              <div className="flex flex-row items-center gap-4">
                 <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                    <StarIcon className="w-5 h-5" />
                 </div>
                 <div>
                    <CardTitle className="text-lg font-bold">Đánh giá hệ thống</CardTitle>
                    <CardDescription className="text-[10px] font-bold">Trung bình: <strong className="text-slate-900">{stats?.avgRating || 0} / 5</strong></CardDescription>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[250px] w-full">
                {isLoading ? (
                  <Skeleton className="w-full h-full rounded-xl" />
                ) : ratingData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ratingData} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                        {ratingData.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'][index % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-200">
                      <StarIcon className="w-12 h-12 opacity-10 mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No ratings found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Insights Cards */}
          <div className="space-y-4">
             <Card className="border-none shadow-xl rounded-2xl bg-indigo-600 text-white p-6 relative overflow-hidden group h-[180px]">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                   <Layers className="w-16 h-16" />
                </div>
                <div className="relative z-10">
                   <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Tổng tài nguyên</div>
                   <div className="text-4xl font-black mb-4">{stats?.totalBooks || 0}</div>
                   <div className="flex gap-6 pt-2 border-t border-white/10">
                      <div>
                         <div className="text-sm font-black">{stats?.totalAuthors || 0}</div>
                         <div className="text-[8px] uppercase font-bold opacity-60">Tác giả</div>
                      </div>
                      <div>
                         <div className="text-sm font-black">{stats?.totalCollections || 0}</div>
                         <div className="text-[8px] uppercase font-bold opacity-60">Thẻ loại</div>
                      </div>
                   </div>
                </div>
             </Card>

             <Card className="border-2 border-slate-100 shadow-xl rounded-2xl bg-slate-900 text-white p-6 group h-[180px]">
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-indigo-400" />
                   </div>
                   <div className="text-xs font-black uppercase tracking-wider">Cộng đồng</div>
                </div>
                <div className="space-y-3">
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Thành viên</span>
                      <span className="text-sm font-black">{stats?.totalMembers || 0}</span>
                   </div>
                   <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Đánh giá</span>
                      <span className="text-sm font-black">{stats?.totalRatings || 0}</span>
                   </div>
                   <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-indigo-500 h-full w-[65%]" />
                   </div>
                </div>
             </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Borrows */}
          <Card className="border-2 border-slate-100 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/80 p-5 border-b border-slate-100">
               <div className="flex items-center gap-3">
                 <History className="w-4 h-4 text-indigo-600" />
                 <CardTitle className="text-sm font-black uppercase tracking-tight">Mượn trả mới nhất</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="p-0">
               {stats?.recentLoans?.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {stats.recentLoans.map((loan: any) => (
                      <div key={loan.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs">
                             {loan.member_name?.charAt(0) || 'M'}
                          </div>
                          <div>
                             <div className="text-[12px] font-black text-slate-900 line-clamp-1">{loan.member_name}</div>
                             <div className="text-[9px] text-slate-500 font-medium line-clamp-1">{loan.book_title}</div>
                          </div>
                        </div>
                        <div className="text-right">
                           <div className={cn("text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full inline-block mb-1", 
                             loan.status === 'borrowing' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                           )}>
                             {loan.status === 'borrowing' ? 'Đang mượn' : 'Đã trả'}
                           </div>
                           <div className="text-[9px] text-slate-400 font-mono italic">{new Date(loan.loan_date || loan.created_at).toLocaleDateString('vi-VN')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
               ) : (
                 <div className="p-16 text-center text-slate-300 font-black text-[10px] uppercase tracking-widest">No Recent Transactions</div>
               )}
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card className="border-2 border-slate-100 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/80 p-5 border-b border-slate-100">
               <div className="flex items-center gap-3">
                 <MessageSquare className="w-4 h-4 text-indigo-600" />
                 <CardTitle className="text-sm font-black uppercase tracking-tight">Cộng đồng thảo luận</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="p-0">
               {stats?.recentReviews?.length > 0 ? (
                  <div className="divide-y divide-slate-50">
                    {stats.recentReviews.map((review: any) => (
                      <div key={review.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                             <span className="text-[11px] font-black text-slate-800">{review.user_name || review.guest_name || 'Khách'}</span>
                             <span className="text-[8px] text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-full font-black">
                                {review.rating || 0} ⭐
                             </span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono italic">{new Date(review.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold line-clamp-1 italic mb-1 opacity-70">"{review.book_title}"</p>
                        <p className="text-[12px] text-slate-700 line-clamp-1 font-medium">{review.content}</p>
                      </div>
                    ))}
                  </div>
               ) : (
                 <div className="p-16 text-center text-slate-300 font-black text-[10px] uppercase tracking-widest">No Recent Reviews</div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
