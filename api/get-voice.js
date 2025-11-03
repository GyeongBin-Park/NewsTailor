export default async function handler(request, response) {
  const API_KEY = process.env.SPEECHIFY_API_KEY;

  // 우리가 알아낸 Speechify의 '목소리 목록' 공식 주소
  const API_URL = "https://api.sws.speechify.com/v1/voices";

  if (!API_KEY) {
    console.error("Vercel 환경 변수 'SPEECHIFY_API_KEY'가 없습니다.");
    return response
      .status(500)
      .json({ error: "API 키가 서버에 설정되지 않았습니다." });
  }

  try {
    const apiResponse = await fetch(API_URL, {
      method: "GET", // 목록은 GET 방식
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(
        `Speechify API 에러 (${apiResponse.status}) at ${API_URL}: ${errorText}`
      );
      return response.status(apiResponse.status).json({
        error: "Speechify API에서 오류가 발생했습니다.",
        details: errorText,
      });
    }

    const data = await apiResponse.json();
    return response.status(200).json(data); // Vercel 방식 응답
  } catch (error) {
    console.error("Vercel 서버 함수 자체의 오류:", error);
    return response
      .status(500)
      .json({ error: "음성 목록을 가져오는 중 서버 오류 발생" });
  }
}
