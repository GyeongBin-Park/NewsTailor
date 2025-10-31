export default async function handler(request, response) {
  const API_KEY = process.env.SPEECHIFY_API_KEY;
  const API_URL = "https://api.sws.speechify.com/v1/voices";

  if (!API_KEY) {
    console.error("Vercel 환경 변수 'SPEECHIFY_API_KEY'가 없습니다.");
    return response.status(500).json({ error: "API 키가 서버에 설정되지 않았습니다." });
  }

  try {
    const apiResponse = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    // --- 이 부분이 핵심입니다 ---
    // API 응답이 정상이 아닐 경우 (401, 403, 500 등)
    if (!apiResponse.ok) {
      // .json() 대신 .text()로 안전하게 에러 메시지를 읽습니다.
      const errorText = await apiResponse.text();
      
      // Vercel 로그에 실제 에러 내용(텍스트)을 기록합니다.
      console.error(`Speechify API 에러 (${apiResponse.status}): ${errorText}`);

      // 클라이언트(브라우저)에게도 실제 에러 상태와 메시지를 전달합니다.
      // 이렇게 하면 500 에러 대신 401, 403 등의 에러가 브라우저에 표시됩니다.
      return response.status(apiResponse.status).json({
        error: "Speechify API에서 오류가 발생했습니다.",
        details: errorText, // 에러 텍스트를 그대로 전달
      });
    }
    // --- 여기까지 ---

    // API 응답이 정상일 경우 (200 OK)
    const data = await apiResponse.json();
    response.status(200).json(data);

  } catch (error) {
    // try...catch는 fetch 자체의 실패(네트워크 오류 등)를 잡습니다.
    console.error("Vercel 서버 함수 자체의 오류:", error);
    response.status(500).json({ error: "음성 목록을 가져오는 중 서버 오류 발생" });
  }
}