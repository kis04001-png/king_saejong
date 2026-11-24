const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { imageBase64, mimeType, studentName, imagePath } = await req.json();
    if (!imageBase64 || !mimeType || !imagePath) throw new Error("필수 정보가 없습니다.");
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!apiKey || !serviceKey) throw new Error("서버 비밀키 설정이 필요합니다.");

    const prompt = `너는 조선 시대의 세종대왕이 되어 초등학생에게 직접 답장을 쓰는 따뜻한 역사 체험 도우미다.
첨부 사진은 '세종대왕 방 꾸미기' 활동지다. 활동지의 문장 완성 부분과 학생이 직접 쓴 설명을 먼저 꼼꼼히 읽어라.
학생 이름 또는 번호: ${String(studentName || "학생").slice(0,20)}
반드시 다음 순서로 답하라.
1) 학생이 활동지에서 선택한 물건이 무엇인지, 그 물건을 어떻게 쓰겠다고 했는지 읽히는 범위에서 구체적으로 언급한다.
2) 그 생각 중 인상적인 부분을 짚어 개인에게 맞춘 칭찬을 한다. 모든 학생에게 똑같이 적용되는 막연한 칭찬만 하지 않는다.
3) 세종대왕의 입장에서 학생의 생각에 따뜻하게 답하고, 마지막에 생각을 더 넓힐 수 있는 짧은 질문 하나를 덧붙인다.
사진에 없는 내용이나 흐릿한 손글씨를 추측해서 만들어내지 마라. 읽기 어려운 부분은 정확히 읽기 어렵다고 솔직히 밝히고, 확실히 읽힌 내용만 활용한다.
역사적 사실을 임의로 만들어내지 말고, 어린이가 이해하기 쉬운 자연스러운 한국어로 4~6문장 이내에 답하라. 지나치게 옛말을 쓰지 말고, 세종대왕다운 존중과 따뜻함을 담아라.`;
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [{ role: "user", content: [
          { type: "input_text", text: prompt },
          { type: "input_image", image_url: `data:${mimeType};base64,${imageBase64}` }
        ] }]
      })
    });
    if (!response.ok) throw new Error("AI 답장 생성에 실패했습니다.");
    const result = await response.json();
    const reply = (result.output || []).flatMap((o:any) => o.content || []).filter((c:any)=>c.type==="output_text").map((c:any)=>c.text).join("\n").trim();
    if (!reply) throw new Error("답장 내용이 비어 있습니다.");

    const save = await fetch(`${supabaseUrl}/rest/v1/submissions`, {
      method: "POST",
      headers: { "apikey": serviceKey, "Authorization": `Bearer ${serviceKey}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
      body: JSON.stringify({ student_name: String(studentName || "이름 없음").slice(0,20), image_path: imagePath, reply })
    });
    if (!save.ok) throw new Error("제출 결과 저장에 실패했습니다.");
    return new Response(JSON.stringify({ reply }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: "처리 중 오류가 발생했습니다." }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
  }
});