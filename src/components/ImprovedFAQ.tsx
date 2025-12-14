'use client';

import { useState } from 'react';

interface FAQItem {
  id: string;
  category: '시험' | '결제' | '칼럼' | '해설';
  question: string;
  answer: string;
}

export default function ImprovedFAQ() {
  const [selectedCategory, setSelectedCategory] = useState<'전체' | '시험' | '결제' | '칼럼' | '해설'>('전체');
  const [openItems, setOpenItems] = useState<string[]>([]);

  const faqData: FAQItem[] = [
    // 시험 관련
    {
      id: '1',
      category: '시험',
      question: '모의고사는 얼마나 자주 업데이트되나요?',
      answer: '매주 토요일마다 새로운 모의고사가 업데이트됩니다. 풀 모고, 하프 모고, 비기너 모고 3가지 유형으로 제공되며, 각 학년별 교육과정에 맞춘 문제들로 구성되어 있습니다.'
    },
    {
      id: '2',
      category: '시험',
      question: '시험 시간은 얼마나 걸리나요?',
      answer: '풀 모고는 90분, 하프 모고는 45분, 비기너 모고는 30분으로 설정되어 있습니다. 타이머 기능을 통해 실제 시험과 같은 환경에서 응시할 수 있습니다.'
    },
    {
      id: '3',
      category: '시험',
      question: '시험 중에 나갔다가 다시 들어올 수 있나요?',
      answer: '시험 응시 중에는 나갔다가 다시 들어올 수 없습니다. 안정적인 시험 환경을 위해 한 번 시작하면 완료할 때까지 페이지를 벗어날 수 없도록 설정되어 있습니다.'
    },
    // 결제 관련
    {
      id: '4',
      category: '결제',
      question: '정말 무료로 이용할 수 있나요?',
      answer: '네, 1개월간 모든 기능을 무료로 체험하실 수 있습니다. 모의고사, 해설, 성적 분석까지 모든 서비스를 제한 없이 이용하세요. 무료 체험 후에는 합리적인 가격의 구독 서비스로 이용하실 수 있습니다.'
    },
    {
      id: '5',
      category: '결제',
      question: '구독을 취소하려면 어떻게 해야 하나요?',
      answer: '설정 페이지에서 언제든지 구독을 취소하실 수 있습니다. 구독 취소 시에도 현재 결제 기간 동안은 계속 서비스를 이용하실 수 있습니다.'
    },
    // 칼럼 관련
    {
      id: '6',
      category: '칼럼',
      question: '학습 가이드는 어떤 내용인가요?',
      answer: '학습 방법, 시험 정보, 진학 상담, 교재 분석 등 다양한 주제의 칼럼을 제공합니다. 전문가들이 직접 작성한 고품질 콘텐츠로 학습에 도움이 되는 유용한 정보를 얻으실 수 있습니다.'
    },
    {
      id: '7',
      category: '칼럼',
      question: '칼럼은 얼마나 자주 업데이트되나요?',
      answer: '주 2-3회 새로운 칼럼이 업데이트됩니다. 시즌별 특별 주제나 학부모님들의 관심사에 따른 맞춤형 콘텐츠도 정기적으로 제공됩니다.'
    },
    // 해설 관련
    {
      id: '8',
      category: '해설',
      question: '해설은 어떤 형태로 제공되나요?',
      answer: 'PDF 형태의 상세한 해설지와 문제별 영상 해설을 모두 제공합니다. 텍스트로 이해하기 어려운 부분은 영상으로 단계별 풀이 과정을 확인하실 수 있습니다.'
    },
    {
      id: '9',
      category: '해설',
      question: '영상 해설은 모든 문제에 제공되나요?',
      answer: '대부분의 문제에 영상 해설이 제공되며, 특히 난이도가 높거나 자주 틀리는 문제들에 대해서는 더 상세한 영상 해설을 제공합니다.'
    }
  ];

  const categories = ['전체', '시험', '결제', '칼럼', '해설'] as const;

  const filteredFAQ = selectedCategory === '전체' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getCategoryColor = (category: typeof selectedCategory) => {
    const colors = {
      '전체': 'bg-blue-600 dark:bg-blue-700 text-white dark:text-gray-100',
      '시험': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      '결제': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      '칼럼': 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      '해설': 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200'
    };
    return colors[category];
  };

  return (
    <div className="bg-card dark:bg-card rounded-xl shadow-sm border border-default">
      <div className="px-6 py-4 border-b border-default">
        <h2 className="text-2xl font-bold text-title mb-4">자주 묻는 질문</h2>
        
        {/* 카테고리 필터 */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? getCategoryColor(category)
                  : 'bg-muted dark:bg-hover text-body hover:bg-hover dark:hover:bg-muted'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="divide-y divide-border">
        {filteredFAQ.map((item) => (
          <div key={item.id} className="transition-colors">
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full px-6 py-4 text-left hover:bg-muted dark:hover:bg-hover transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-medium text-title text-left">
                    {item.question}
                  </h3>
                </div>
                <div className="ml-4">
                  <svg 
                    className={`w-5 h-5 text-muted transition-transform duration-200 ${
                      openItems.includes(item.id) ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>
            
            {/* 아코디언 내용 */}
            <div className={`overflow-hidden transition-all duration-300 ${
              openItems.includes(item.id) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="px-6 pb-4">
                <div className="bg-muted dark:bg-hover rounded-lg p-4">
                  <p className="text-body leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFAQ.length === 0 && (
        <div className="px-6 py-8 text-center text-muted">
          해당 카테고리에 질문이 없습니다.
        </div>
      )}
    </div>
  );
} 