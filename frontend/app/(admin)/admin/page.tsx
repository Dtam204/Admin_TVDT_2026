"use client";

import {
  TrendingUp,
  Users,
  Newspaper,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    title: "Tổng người dùng",
    value: "12,345",
    change: "+12.5%",
    trend: "up" as const,
    icon: Users,
    color: "from-blue-600 to-indigo-600",
  },
  {
    title: "Tổng bài viết",
    value: "1,234",
    change: "+8.2%",
    trend: "up" as const,
    icon: Newspaper,
    color: "from-purple-600 to-pink-600",
  },
  {
    title: "Lượt xem",
    value: "456,789",
    change: "+23.1%",
    trend: "up" as const,
    icon: Eye,
    color: "from-green-600 to-emerald-600",
  },
  {
    title: "Tỷ lệ tương tác",
    value: "68.5%",
    change: "-3.2%",
    trend: "down" as const,
    icon: TrendingUp,
    color: "from-orange-600 to-red-600",
  },
];

const chartData = [
  { name: "T1", views: 4000, users: 2400, posts: 240 },
  { name: "T2", views: 3000, users: 1398, posts: 221 },
  { name: "T3", views: 2000, users: 9800, posts: 229 },
  { name: "T4", views: 2780, users: 3908, posts: 200 },
  { name: "T5", views: 1890, users: 4800, posts: 218 },
  { name: "T6", views: 2390, users: 3800, posts: 250 },
  { name: "T7", views: 3490, users: 4300, posts: 210 },
];

const pieData = [
  { name: "Công nghệ", value: 400 },
  { name: "Kinh doanh", value: 300 },
  { name: "Giải trí", value: 300 },
  { name: "Thể thao", value: 200 },
];

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"];

const recentPosts = [
  {
    title: "10 xu hướng công nghệ năm 2025",
    category: "Công nghệ",
    views: 1234,
    status: "published",
  },
  {
    title: "Hướng dẫn Marketing hiệu quả",
    category: "Kinh doanh",
    views: 987,
    status: "published",
  },
  {
    title: "Review phim hot tháng 12",
    category: "Giải trí",
    views: 2341,
    status: "draft",
  },
  {
    title: "Kết quả bóng đá cuối tuần",
    category: "Thể thao",
    views: 3456,
    status: "published",
  },
  {
    title: "Công thức nấu ăn ngon",
    category: "Ẩm thực",
    views: 876,
    status: "published",
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Tổng quan về hệ thống của bạn</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon =
            stat.trend === "up" ? ArrowUpRight : ArrowDownRight;

          return (
            <Card
              // biome-ignore lint/suspicious/noArrayIndexKey:
              key={index}
              className="border-0 shadow-lg hover:shadow-xl transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <h3 className="text-3xl mt-2 text-gray-900">
                      {stat.value}
                    </h3>
                    <div
                      className={`flex items-center gap-1 mt-2 text-sm ${
                        stat.trend === "up"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      <TrendIcon className="w-4 h-4" />
                      <span>{stat.change}</span>
                    </div>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Thống kê lượt xem</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="#3b82f6"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="#3b82f6"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorViews)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Bài viết theo danh mục</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      // biome-ignore lint/suspicious/noArrayIndexKey:
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Hoạt động theo tháng</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar
                dataKey="users"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="posts"
                fill="#8b5cf6"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Posts */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Bài viết gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentPosts.map((post, index) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey:
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <h4 className="text-gray-900">{post.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{post.category}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">
                      {post.views.toLocaleString()}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      post.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {post.status === "published"
                      ? "Đã xuất bản"
                      : "Bản nháp"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
