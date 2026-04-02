'use client';

import { LoanForm } from '@/components/admin/LoanForm';
import { ArrowLeft, BookOpen, Monitor, Star } from 'lucide-react';
import Link from 'next/link';

export default function NewLoanPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl animate-in fade-in duration-500">

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-400 mb-3">
            <Link href="/admin/book-loans"
              className="hover:text-indigo-600 transition-colors flex items-center gap-1 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-xs font-bold uppercase tracking-widest">Quay lại danh sách</span>
            </Link>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Tạo phiếu <span className="text-indigo-600">Mượn sách in</span>
          </h1>
          <p className="text-slate-500 font-medium">
            Đăng ký mượn bản sao vật lý cho bạn đọc tại quầy — Thủ thư xác nhận và bàn giao
          </p>
        </div>

        {/* ── Hướng dẫn luồng nghiệp vụ nhanh ── */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-4 shadow-sm min-w-[300px]">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">📚 Luồng truy cập tài liệu</p>
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-2 rounded-xl bg-emerald-50/50">
              <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <BookOpen className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-800">Sách in (Physical / Hybrid)</span>
                <p className="text-[10px] text-emerald-600">→ Mượn tại quầy • Form này</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2 rounded-xl bg-blue-50/50">
              <div className="w-6 h-6 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Monitor className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-800">Tài liệu số (Public / Internal)</span>
                <p className="text-[10px] text-blue-600">→ Đọc trực tiếp trên ứng dụng</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2 rounded-xl bg-purple-50/50">
              <div className="w-6 h-6 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Star className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <span className="text-xs font-bold text-purple-800">Tài liệu Premium (VIP)</span>
                <p className="text-[10px] text-purple-600">→ Yêu cầu tài khoản Premium</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FORM CHÍNH ── */}
      <LoanForm />
    </div>
  );
}
