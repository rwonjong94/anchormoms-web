// next-auth 미사용: 임시 no-op 구현으로 타입 에러 방지
import type { NextRequest } from 'next/server';

export const authOptions: any = {};

export async function getSession(): Promise<{ user?: { id: string } } | null> { return null; }

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth(request: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('인증이 필요합니다.');
  }

  return user;
}

export async function requireOwnership(request: NextRequest, userId: string) {
  const user = await requireAuth(request);
  
  if (user.id !== userId) {
    throw new Error('접근 권한이 없습니다.');
  }

  return user;
} 