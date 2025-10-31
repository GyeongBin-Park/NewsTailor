export const handler = async (event, context) => {
  const API_KEY = process.env.SPEECHIFY_API_KEY;
  const API_URL = "https://api.sws.speechify.com/v1/audio/speech";

  if (!API_KEY) {
    console.error("Netlify 환경 변수 'SPEECHIFY_API_KEY'가 없습니다.");
    // Netlify는 "return { statusCode, body }" 객체 형태로 응답해야 합니다.
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API 키가 서버에 설정되지 않았습니다." }),
      headers: { "Content-Type": "application/json" },
    };
  }

  try {
    const apiResponse = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`Speechify API 에러 (${apiResponse.status}): ${errorText}`);

      return {
        statusCode: apiResponse.status,
        body: JSON.stringify({
          error: "Speechify API에서 오류가 발생했습니다.",
          details: errorText,
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // 성공 시
    const data = await apiResponse.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data), // body는 반드시 문자열이어야 합니다.
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    console.error("Netlify 서버 함수 자체의 오류:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "음성 목록을 가져오는 중 서버 오류 발생" }),
      headers: { "Content-Type": "application/json" },
    };
  }
};
