export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-title">문제 관리</h1>
          <p className="text-muted mt-2">등록된 문제들을 조회하고 관리할 수 있습니다.</p>
        </div>
        <div className="bg-card border border-default rounded-lg p-6">
          <div className="text-muted">문제 목록을 불러오는 중...</div>
        </div>
      </div>
    </div>
  );
}