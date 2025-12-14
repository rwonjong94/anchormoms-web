import { redirect } from 'next/navigation';

export default function AdminDashboard() {
  // 서버 사이드에서 즉시 기본 탭으로 리다이렉트 (깜빡임 제거)
  redirect('/nimda/dashboard/exams');
}