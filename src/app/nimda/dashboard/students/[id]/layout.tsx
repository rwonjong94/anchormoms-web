'use client';

import AdminLayout from '@/components/admin/AdminLayout';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  // 상단 공통 탭
  // children에는 각 탭 페이지가 렌더링됨
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </AdminLayout>
  );
}








