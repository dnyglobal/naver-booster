export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { keyword, tone, notes } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  let persona = "";
  if (tone === "mom") {
    persona = "네이버 대표 육아/살림 인플루언서. 친근하고 진솔하며, 직접 겪은 경험담 느낌(~했답니다, ~하더라고요, 내돈내산 꿀팁 분위기).";
  } else if (tone === "review") {
    persona = "전문 IT/리빙 제품 분석 블로거. 장단점을 객관적이면서도 보기 편하게 전달하는 전문가.";
  } else {
    persona = "실생활 꿀팁 및 정보성 파워블로거. 핵심을 일목요연하게 짚어주는 신뢰감 있는 문체.";
  }

  const prompt = `
당신은 네이버 블로그 알고리즘(DIA+ 및 C-Rank)에 최적화된 콘텐츠 에디터입니다.

[요구사항]
1. 화자 설정: ${persona}
2. 핵심 타겟 키워드: "${keyword}" (글 전체에 걸쳐 아주 자연스럽게 4~6회 녹여낼 것)
3. 원본 소재 및 메모:
"${notes}"

[네이버 모바일 가독성 및 알고리즘 준수 규칙]
1. 절대로 '종합적으로', '요약하자면', '결론적으로' 같은 전형적인 AI 어투를 쓰지 마세요.
2. 한 문단은 모바일 가독성을 위해 **최대 2~3줄**을 넘지 않게 줄바꿈(<p></p>)을 풍부하게 넣으세요.
3. 중간중간 강조 포인트는 <span style="background-color: #fff3bf; padding: 2px 4px; font-weight: bold;">(형광펜 효과)</span>를 적용하세요.
4. 요약이나 꿀팁 구간은 가독성을 위해 테두리 박스 <div style="background-color: #f8fafc; border-left: 4px solid #03c75a; padding: 12px; margin: 16px 0;"></div> 로 감싸주세요.
5. 글 맨 하단에는 네이버 검색용 고효율 해시태그 5~7개를 #형태로 추가하세요.

[출력 형식]
마크다운(\`\`\`) 기호 없이, 네이버 스마트에디터에 바로 렌더링될 수 있는 순수 HTML 코드만 출력하세요. <h1>, <h2>, <p>, <div>, <span> 태그를 활용해 시각적으로 완성도 높은 형태여야 합니다.
`;

  try {
    const apiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await apiRes.json();
    if (data.error) {
      return res.status(500).json({ message: "Google API 오류: " + data.error.message });
    }

    let generatedHtml = data.candidates[0].content.parts[0].text;
    
    // 혹시 마크다운 블록(```html)이 포함되어 반환될 경우 제거
    generatedHtml = generatedHtml.replace(/```html/g, '').replace(/```/g, '').trim();

    return res.status(200).json({ html: generatedHtml });
  } catch (err) {
    return res.status(500).json({ message: "서버 예외: " + err.message });
  }
}
