import { redirect } from 'next/navigation';

export default function StoresPage() {
  // 자료 메인 페이지에서 문제지 탭으로 자동 리다이렉트
  redirect('/nimda/dashboard/stores/exam-papers');
}