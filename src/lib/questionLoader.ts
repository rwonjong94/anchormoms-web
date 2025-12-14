import { Question } from '@/types/exam';

export async function loadQuestions(examType: string, examNum: string): Promise<Question[]> {
  try {
    const response = await fetch(`/api/exam/${examType}/${examNum}/questions`);
    
    if (!response.ok) {
      throw new Error(`Failed to load questions: ${response.statusText}`);
    }

    const data = await response.json();
    return data.questions || [];
  } catch (error) {
    console.error('Error loading questions:', error);
    
    // Fallback to mock data if API fails
    return generateMockQuestions(examType, examNum);
  }
}

function generateMockQuestions(examType: string, examNum: string): Question[] {
  const questions: Question[] = [];
  
  // 실제 존재하는 이미지 파일들
  const availableImages = [
    'problem01.png', 'problem02.png', 'problem03.png', 'problem04.png', 
    'problem06.png', 'problem07.png', 'problem11.png', 'problem12.png',
    'problem14.png', 'problem16.png', 'problem17.png', 'problem21.png',
    'problem22.png', 'problem33.png', 'problem39.png', 'problem40.png'
  ];
  
  for (let i = 1; i <= 40; i++) {
    const paddedNum = i.toString().padStart(2, '0');
    const imageName = `problem${paddedNum}.png`;
    const hasImage = availableImages.includes(imageName);
    
    questions.push({
      id: String(i),
      questionNumber: i,
      content: `문제 ${i}번: 다음 식을 계산하시오.`,
      condition: `조건: 소수점 둘째 자리까지 계산하시오.`,
      imageUrls: hasImage ? [`/assets/full-03/figures/${imageName}`] : [],
      examType,
      examNum,
    });
  }
  
  console.log('Fallback 데이터 사용 중 - 첫 번째 문제 이미지들:', questions[0]?.imageUrls);
  return questions;
}

export function convertLatexToHtml(latex: string): string {
  // Basic LaTeX to HTML conversion with markdown support
  // In a real implementation, you might use a library like KaTeX or MathJax
  return latex
    // LaTeX 처리
    .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\$([^$]+)\$/g, '<span class="math-inline">$1</span>')
    .replace(/\\\\/g, '<br>')
    .replace(/\\begin\{center\}([\s\S]*?)\\end\{center\}/g, '<div class="text-center">$1</div>')
    .replace(/\\item/g, '•')
    .replace(/\\begin\{itemize\}/g, '<ul>')
    .replace(/\\end\{itemize\}/g, '</ul>')
    .replace(/\\begin\{enumerate\}/g, '<ol>')
    .replace(/\\end\{enumerate\}/g, '</ol>')
    // 마크다운 처리
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')  // **굵은 글씨**
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')              // *기울임*
    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')  // `코드`
    // 마크다운 인용문 처리
    .replace(/^>\s*(.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 py-2 my-4 bg-gray-50 italic text-gray-700">$1</blockquote>')
    // 연속된 인용문 처리
    .replace(/<\/blockquote>\s*<blockquote[^>]*>/g, '<br>');
} 