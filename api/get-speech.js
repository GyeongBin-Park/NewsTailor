export default async function handler(request, response) {
  const { input, voice_id, model } = request.body;

  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  if (!input || !voice_id || !model) {
    return response.status(400).json({
      error: "input, voice_id, model은 필수입니다.",
    });
  }

  const API_KEY = process.env.SPEECHIFY_API_KEY;

  // Speechify의 '음성 생성' 공식 주소
  const API_URL = "https://api.sws.speechify.com/v1/audio/speech";

  if (!API_KEY) {
    console.error("Vercel 환경 변수 'SPEECHIFY_API_KEY'가 없습니다.");
    return response
      .status(500)
      .json({ error: "API 키가 서버에 설정되지 않았습니다." });
  }

  try {
    const apiResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input, voice_id, model }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`Speechify API 에러 (${apiResponse.status}): ${errorText}`);
      return response.status(apiResponse.status).json({
        error: "Speechify API에서 오류가 발생했습니다.",
        details: errorText,
      });
    }

    const data = await apiResponse.json();
    return response.status(200).json(data);
  } catch (error) {
    console.error("Vercel 서버 함수 자체의 오류:", error);
    return response.status(500).json({ error: "음성 생성 중 서버 오류 발생" });
  }
}
