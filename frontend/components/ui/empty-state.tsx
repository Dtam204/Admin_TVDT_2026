import { FileQuestion, Inbox } from "lucide-react";
import { Button } from "./button";
import Link from "next/link";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({
  title = "Không có dữ liệu",
  description = "Hiện tại chưa có dữ liệu để hiển thị. Vui lòng quay lại sau.",
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex flex-col items-center space-y-4 text-center">
        {icon || (
          <div className="rounded-full bg-gray-100 p-6">
            <Inbox className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 max-w-md">{description}</p>
        </div>
        {action && (
          <Button asChild variant="outline">
            <Link href={action.href}>{action.label}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

