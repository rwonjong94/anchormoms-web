// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

type OcrParsed = {
  prob_text?: string;
  prob_rate?: number | null;
  exam_info?: string;
  prob_num?: number;
};

async function extractTextWithCloudVision(imageBase64: string): Promise<OcrParsed> {
  const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_CLOUD_API_KEY가 설정되지 않았습니다.');
  }

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  const requestData = {
    requests: [
      {
        image: {
          content: imageBase64
        },
        features: [
          {
            type: 'DOCUMENT_TEXT_DETECTION'
          }
        ]
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`Cloud Vision API 호출 실패: ${response.status}`);
    }

    const result = await response.json();
    
    // OCR 텍스트 추출
    let ocrText = '';
    if (result.responses && result.responses[0] && result.responses[0].fullTextAnnotation) {
      ocrText = result.responses[0].fullTextAnnotation.text || '';
    }

    // 점수 표시 제거
    const cleanedText = ocrText.replace(/\[\d+점\]/g, '').trim();
    
    // 간단한 파싱 (Python 도구의 로직을 간소화)
    const parseProblemInfo = (text: string) => {
      if (!text) return {};
      
      // 문제 번호 추출 (앞의 숫자)
      const probNumMatch = text.match(/^\s*(\d{1,3})\b/);
      const prob_num = probNumMatch ? parseInt(probNumMatch[1], 10) : undefined;
      
      // 문제 번호 제거
      let prob_text = text.replace(/^\s*\d+\s*[\.)]?\s*/, '').trim();
      
      // 시험 정보 추출
      const examMatch = text.match(/(성대경시\s+제\d+회|KMC\s+인증시험\s+제\d+회)/);
      const exam_info = examMatch ? examMatch[1] : undefined;
      
      return {
        prob_text: prob_text || undefined,
        prob_num,
        exam_info,
        prob_rate: null
      };
    };

    const parsed = parseProblemInfo(cleanedText);
    
    return {
      prob_text: parsed.prob_text,
      prob_rate: parsed.prob_rate,
      exam_info: parsed.exam_info,
      prob_num: parsed.prob_num,
    };

  } catch (error) {
    console.error('Cloud Vision API 호출 실패:', error);
    throw new Error(`Cloud Vision API 호출 실패: ${error.message}`);
  }
}

async function extractTextWithGemini(imageBase64: string): Promise<OcrParsed> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
이 수학 문제 이미지에서 다음 정보를 정확히 추출해주세요:

1. 문제 텍스트 (prob_text): 문제의 본문을 정확히 추출
2. 문제 번호 (prob_num): 문제 번호가 있다면 숫자로 추출
3. 난이도 (prob_rate): 별표(★) 개수나 난이도 표시가 있다면 1-5 사이 숫자로 추출
4. 시험 정보 (exam_info): 시험명, 학년, 학기 등의 정보가 있다면 추출

다음 JSON 형식으로 응답해주세요:
{
  "prob_text": "문제 텍스트",
  "prob_num": 문제번호,
  "prob_rate": 난이도,
  "exam_info": "시험 정보"
}

주의사항:
- 수학 기호와 수식을 정확히 인식해주세요
- 분수, 제곱근, 지수 등의 표현을 텍스트로 명확히 변환해주세요
- [2점], [3점], [4점] 등의 점수 표시는 제외하고 추출해주세요
- 정보가 없는 필드는 null로 설정해주세요
- JSON 형식만 응답하고 다른 설명은 생략해주세요
`;

  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType: 'image/jpeg'
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    const text = response.text();

    // JSON 응답 파싱
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // 점수 표시 제거 함수
        const cleanText = (text) => {
          if (!text) return undefined;
          return text.replace(/\[\d+점\]/g, '').trim() || undefined;
        };

        return {
          prob_text: cleanText(parsed.prob_text),
          prob_rate: typeof parsed.prob_rate === 'number' ? parsed.prob_rate : null,
          exam_info: cleanText(parsed.exam_info),
          prob_num: typeof parsed.prob_num === 'number' ? parsed.prob_num : undefined,
        };
      }
    } catch (parseError) {
      console.error('Gemini 응답 파싱 실패:', parseError);
    }

    // JSON 파싱 실패 시 텍스트에서 직접 추출 시도
    const cleanedText = text.trim().replace(/\[\d+점\]/g, '').trim();
    return {
      prob_text: cleanedText || undefined,
      prob_rate: null,
      exam_info: undefined,
      prob_num: undefined,
    };

  } catch (error) {
    console.error('Gemini Vision API 호출 실패:', error);
    throw new Error(`Gemini Vision API 호출 실패: ${error.message}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const imageBase64 = String(body?.imageBase64 || '');
    const ocrEngine = String(body?.ocrEngine || 'gemini'); // 기본값: gemini
    
    if (!imageBase64) {
      return NextResponse.json({ error: 'imageBase64 필수' }, { status: 400 });
    }

    // 1순위: 외부 OCR 연동이 설정되어 있으면 프록시
    const ocrUrl = process.env.OCR_API_URL || '';
    const ocrKey = process.env.OCR_API_KEY || '';
    if (ocrUrl) {
      try {
        const resp = await fetch(ocrUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(ocrKey ? { 'Authorization': `Bearer ${ocrKey}` } : {}),
          },
          body: JSON.stringify({ imageBase64, ocrEngine }),
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(data?.error || `외부 OCR 실패(${resp.status})`);
        }
        // 점수 표시 제거 함수
        const cleanText = (text) => {
          if (!text) return undefined;
          return text.replace(/\[\d+점\]/g, '').trim() || undefined;
        };

        const parsed: OcrParsed = {
          prob_text: cleanText(data?.prob_text ?? data?.parsed?.prob_text),
          prob_rate: data?.prob_rate ?? data?.parsed?.prob_rate ?? null,
          exam_info: cleanText(data?.exam_info ?? data?.parsed?.exam_info),
          prob_num: typeof (data?.prob_num ?? data?.parsed?.prob_num) === 'number' ? (data?.prob_num ?? data?.parsed?.prob_num) : undefined,
        };
        return NextResponse.json({ parsed, engine: 'external' });
      } catch (e: any) {
        console.error('외부 OCR API 실패, 다른 엔진으로 fallback:', e.message);
        // 외부 OCR 실패 시 선택된 엔진으로 fallback
      }
    }

    // 선택된 OCR 엔진 사용
    try {
      let parsed: OcrParsed;
      let engineUsed: string;

      if (ocrEngine === 'cloud-vision') {
        // Cloud Vision API 사용
        const cloudVisionApiKey = process.env.GOOGLE_CLOUD_API_KEY;
        if (cloudVisionApiKey) {
          parsed = await extractTextWithCloudVision(imageBase64);
          engineUsed = 'cloud-vision';
        } else {
          throw new Error('GOOGLE_CLOUD_API_KEY가 설정되지 않았습니다.');
        }
      } else {
        // Gemini Vision API 사용 (기본값)
        const geminiApiKey = process.env.GEMINI_API_KEY;
        if (geminiApiKey) {
          parsed = await extractTextWithGemini(imageBase64);
          engineUsed = 'gemini';
        } else {
          throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');
        }
      }

      return NextResponse.json({ parsed, engine: engineUsed });
    } catch (e: any) {
      console.error(`${ocrEngine} OCR 엔진 실패:`, e.message);
      
      // 실패한 엔진과 다른 엔진으로 fallback 시도
      try {
        let fallbackParsed: OcrParsed;
        let fallbackEngine: string;

        if (ocrEngine === 'cloud-vision') {
          // Cloud Vision 실패 시 Gemini로 fallback
          const geminiApiKey = process.env.GEMINI_API_KEY;
          if (geminiApiKey) {
            fallbackParsed = await extractTextWithGemini(imageBase64);
            fallbackEngine = 'gemini';
          } else {
            throw new Error('Gemini fallback도 불가능: GEMINI_API_KEY 없음');
          }
        } else {
          // Gemini 실패 시 Cloud Vision으로 fallback
          const cloudVisionApiKey = process.env.GOOGLE_CLOUD_API_KEY;
          if (cloudVisionApiKey) {
            fallbackParsed = await extractTextWithCloudVision(imageBase64);
            fallbackEngine = 'cloud-vision';
          } else {
            throw new Error('Cloud Vision fallback도 불가능: GOOGLE_CLOUD_API_KEY 없음');
          }
        }

        return NextResponse.json({ parsed: fallbackParsed, engine: fallbackEngine, fallback: true });
      } catch (fallbackError: any) {
        console.error('Fallback도 실패:', fallbackError.message);
        return NextResponse.json({ error: `모든 OCR 엔진 실패: ${e.message}` }, { status: 502 });
      }
    }

  } catch (err: any) {
    console.error('OCR API 전체 실패:', err);
    return NextResponse.json({ error: err?.message || 'OCR 실패' }, { status: 500 });
  }
}


