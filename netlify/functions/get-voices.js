// 파일 경로: netlify/functions/get-voices.js
// (Vercel과 코드는 동일)

export default async function handler(request, response) {
  // 1. Netlify에 설정할 환경 변수 이름
  const API_KEY = process.env.SPEECHIFY_API_KEY;
  const API_URL = "https://api.sws.speechify.com";

  if (!API_KEY) {
    console.error("Netlify 환경 변수 'SPEECHIFY_API_KEY'가 없습니다.");
    return response
      .status(500)
      .json({ error: "API 키가 서버에 설정되지 않았습니다." });
  }

  try {
    const apiResponse = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    // 2. API 응답이 정상이 아닐 경우 (401, 403, 500 등)
    if (!apiResponse.ok) {
      // .json() 대신 .text()로 안전하게 에러 메시지를 읽습니다.
      const errorText = await apiResponse.text();

      console.error(`Speechify API 에러 (${apiResponse.status}): ${errorText}`);

      return response.status(apiResponse.status).json({
        error: "Speechify API에서 오류가 발생했습니다.",
        details: errorText, // 에러 텍스트를 그대로 전달
      });
    }

    // 3. API 응답이 정상일 경우 (200 OK)
    const data = await apiResponse.json();
    response.status(200).json(data);
  } catch (error) {
    // 4. fetch 자체의 실패(네트워크 오류 등)
    console.error("Netlify 서버 함수 자체의 오류:", error);
    response
      .status(500)
      .json({ error: "음성 목록을 가져오는 중 서버 오류 발생" });
  }
}
