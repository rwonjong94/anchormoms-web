'use client';

import { useState, useEffect } from 'react';

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateName: string, templateContent: string) => void;
  currentTemplate: string;
}

interface Template {
  id?: string;
  name: string;
  content: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function TemplateSelectionModal({
  isOpen,
  onClose,
  onSelect,
  currentTemplate
}: TemplateSelectionModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [customContent, setCustomContent] = useState('');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [saving, setSaving] = useState(false);

  // 토스트 알림 상태
  const [toast, setToast] = useState<{
    isVisible: boolean;
    message: string;
    type: 'success' | 'info' | 'error';
  }>({
    isVisible: false,
    message: '',
    type: 'success'
  });

  // 토스트 표시 함수
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ isVisible: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  // 템플릿 목록을 API에서 가져오기
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/nimda/summary-templates', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        console.error('Failed to fetch templates');
        // 오류 발생 시 기본 템플릿 사용
        setTemplates(getDefaultTemplates());
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      // 오류 발생 시 기본 템플릿 사용
      setTemplates(getDefaultTemplates());
    } finally {
      setLoading(false);
    }
  };

  // 새 템플릿 저장 API 호출
  const saveNewTemplate = async () => {
    if (!newTemplateName.trim() || !customContent.trim()) {
      showToast('템플릿 이름과 내용을 모두 입력해주세요.', 'error');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/nimda/summary-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTemplateName.trim(),
          content: customContent.trim(),
          isDefault: false
        }),
      });

      if (response.ok) {
        const newTemplate = await response.json();
        
        // 템플릿 목록 새로고침
        await fetchTemplates();
        
        // 새로 생성된 템플릿을 선택
        setSelectedTemplate(newTemplate);
        setIsCreatingNew(false);
        setNewTemplateName('');
        
        showToast('템플릿이 성공적으로 저장되었습니다.', 'success');
      } else {
        const errorData = await response.json();
        showToast(`템플릿 저장에 실패했습니다: ${errorData.message || '알 수 없는 오류'}`, 'error');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      showToast('템플릿 저장 중 오류가 발생했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 기존 템플릿 업데이트 API 호출
  const updateTemplate = async () => {
    if (!selectedTemplate || !customContent.trim()) {
      showToast('템플릿 내용을 입력해주세요.', 'error');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/nimda/summary-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: selectedTemplate.name,
          content: customContent.trim(),
        }),
      });

      if (response.ok) {
        // 템플릿 목록 새로고침
        await fetchTemplates();
        
        // 수정 모드 해제
        setIsEditingTemplate(false);
        
        showToast('템플릿이 성공적으로 수정되었습니다.', 'success');
      } else {
        const errorData = await response.json();
        showToast(`템플릿 수정에 실패했습니다: ${errorData.message || '알 수 없는 오류'}`, 'error');
      }
    } catch (error) {
      console.error('Error updating template:', error);
      showToast('템플릿 수정 중 오류가 발생했습니다.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 기본 템플릿 목록 (fallback용)
  const getDefaultTemplates = (): Template[] => [
    {
      name: '기본 상담 요약',
      content: `## 상담 요약

### 1. 기본 정보
- 상담 일시: 
- 참석자: 
- 상담 시간: 

### 2. 상담 목적 및 주요 이슈

### 3. 논의 내용
- 학습 현황:
- 진로 관련:
- 기타 사항:

### 4. 향후 계획 및 과제

### 5. 특이사항 및 참고사항`,
      isDefault: true
    }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  useEffect(() => {
    if (templates.length > 0) {
      // 현재 선택된 템플릿 찾기
      const currentTemplateData = templates.find(t => t.name === currentTemplate);
      if (currentTemplateData) {
        setSelectedTemplate(currentTemplateData);
        setCustomContent(currentTemplateData.content);
      }
    }
  }, [templates, currentTemplate]);

  const handleTemplateClick = (template: Template) => {
    setSelectedTemplate(template);
    setCustomContent(template.content);
    setIsCreatingNew(false); // 기존 템플릿 선택 시 새 템플릿 모드 해제
    setIsEditingTemplate(false); // 기존 템플릿 선택 시 편집 모드 해제
  };

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setIsEditingTemplate(false);
    setSelectedTemplate(null);
    setNewTemplateName('새 템플릿'); // 기본값 설정
    setCustomContent(`## 상담 요약

### 1. 기본 정보
- 상담 일시: 
- 참석자: 
- 상담 시간: 

### 2. 상담 목적 및 주요 이슈

### 3. 논의 내용
- 학습 현황:
- 진로 관련:
- 기타 사항:

### 4. 향후 계획 및 과제

### 5. 특이사항 및 참고사항`);
  };

  const handleEditTemplate = () => {
    setIsEditingTemplate(true);
  };

  const handleCancelEdit = () => {
    setIsEditingTemplate(false);
    // 원래 템플릿 내용으로 복원
    if (selectedTemplate) {
      setCustomContent(selectedTemplate.content);
    }
  };

  const handleCancelNewTemplate = () => {
    setIsCreatingNew(false);
    setNewTemplateName('');
    setSelectedTemplate(null);
    setCustomContent('');
  };

  const handleSave = () => {
    if (isCreatingNew) {
      // 새 템플릿 저장
      saveNewTemplate();
    } else if (isEditingTemplate && selectedTemplate) {
      // 기존 템플릿 수정
      updateTemplate();
    } else if (selectedTemplate) {
      // 기존 템플릿 선택
      onSelect(selectedTemplate.name, customContent);
      onClose();
    }
  };

  const handleCancel = () => {
    if (isCreatingNew) {
      handleCancelNewTemplate();
    } else if (isEditingTemplate) {
      handleCancelEdit();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleCancel} />
      
      {/* 모달 컨텐츠 */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 h-5/6">
        <div className="flex flex-col h-full">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">요약 템플릿 선택</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 메인 컨텐츠 - 1:2 비율 */}
          <div className="flex-1 flex overflow-hidden">
            {/* 왼쪽: 템플릿 리스트 (1/3) */}
            <div className="w-1/3 bg-gray-50 border-r border-gray-200 overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">템플릿 목록</h3>
                  <button
                    onClick={handleCreateNew}
                    className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                  >
                    + 새 템플릿
                  </button>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="text-sm text-gray-500">템플릿 로딩 중...</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div
                        key={template.id || template.name}
                        onClick={() => handleTemplateClick(template)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedTemplate?.name === template.name && !isCreatingNew
                            ? 'bg-indigo-100 border-2 border-indigo-500'
                            : 'bg-white border border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="font-medium text-sm text-gray-800 mb-1">
                          {template.name}
                          {template.isDefault && (
                            <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                              기본
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          {template.createdAt ? new Date(template.createdAt).toLocaleDateString('ko-KR') : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 오른쪽: 템플릿 편집 영역 (2/3) */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                {/* 상태 표시를 맨 위로 이동 */}
                {isCreatingNew && (
                  <p className="text-xs text-yellow-600 mb-2">새 템플릿을 생성하고 있습니다</p>
                )}
                {selectedTemplate && !isCreatingNew && isEditingTemplate && (
                  <p className="text-xs text-blue-600 mb-2">템플릿을 수정하고 있습니다</p>
                )}
                
                <div className="flex items-center justify-between">
                  {/* 템플릿 제목 - 새 템플릿 생성 시에는 입력 가능 */}
                  {isCreatingNew ? (
                    <input
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="템플릿 이름을 입력하세요"
                      className="text-sm font-medium text-gray-700 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-yellow-500 rounded px-2 py-1 flex-1"
                    />
                  ) : (
                    <h3 className="text-sm font-medium text-gray-700">
                      {selectedTemplate ? selectedTemplate.name : '템플릿을 선택하세요'}
                    </h3>
                  )}
                  
                  {/* 수정 버튼 - 기존 템플릿이 선택되었고 새 생성 모드가 아닐 때만 표시 */}
                  {selectedTemplate && !isCreatingNew && !selectedTemplate.isDefault && (
                    <div className="flex items-center space-x-2">
                      {!isEditingTemplate ? (
                        <button
                          onClick={handleEditTemplate}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          수정
                        </button>
                      ) : (
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        >
                          취소
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 p-4">
                {(selectedTemplate || isCreatingNew) ? (
                  <textarea
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    readOnly={!!(selectedTemplate && !isCreatingNew && !isEditingTemplate)}
                    className={`w-full h-full border rounded-lg p-3 text-sm font-mono resize-none focus:outline-none ${
                      selectedTemplate && !isCreatingNew && !isEditingTemplate
                        ? 'border-gray-200 bg-gray-50 text-gray-700 cursor-default'
                        : 'border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                    }`}
                    placeholder={
                      selectedTemplate && !isCreatingNew && !isEditingTemplate 
                        ? "템플릿 내용 (읽기 전용)" 
                        : "템플릿 내용을 편집하세요..."
                    }
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-center">
                      <p className="mb-2">템플릿을 선택하거나 새로 생성하세요</p>
                      <button
                        onClick={handleCreateNew}
                        className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                      >
                        새 템플릿 만들기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 푸터 버튼 */}
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isCreatingNew ? '취소' : '닫기'}
            </button>
            <button
              onClick={handleSave}
              disabled={
                isCreatingNew 
                  ? (!newTemplateName.trim() || !customContent.trim() || saving) 
                  : isEditingTemplate 
                    ? (!customContent.trim() || saving)
                    : (!selectedTemplate || saving)
              }
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isCreatingNew ? '저장 중...' : isEditingTemplate ? '수정 중...' : '처리 중...'}
                </div>
              ) : isCreatingNew ? (
                '저장'
              ) : isEditingTemplate ? (
                '수정 저장'
              ) : (
                '선택'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 토스트 알림 */}
      {toast.isVisible && (
        <div className="fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out">
          <div className={`px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 max-w-md ${
            toast.type === 'success' ? 'bg-green-500 text-white' :
            toast.type === 'info' ? 'bg-blue-500 text-white' :
            'bg-red-500 text-white'
          }`}>
            {/* 아이콘 */}
            <div className="flex-shrink-0">
              {toast.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : toast.type === 'info' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            
            {/* 메시지 */}
            <p className="text-sm font-medium">{toast.message}</p>
            
            {/* 닫기 버튼 */}
            <button
              onClick={() => setToast(prev => ({ ...prev, isVisible: false }))}
              className="flex-shrink-0 ml-auto hover:bg-white hover:bg-opacity-20 rounded p-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}