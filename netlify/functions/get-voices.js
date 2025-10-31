// 파일 경로: netlify/functions/get-voices.js

export const handler = async (event, context) => {
  const API_KEY = process.env.SPEECHIFY_API_KEY;
  // 👇 여기를 수정했습니다! ( .../v1/audio/voices 로 변경)
  const API_URL = "https://api.sws.speechify.com/v1/audio/voices";

  if (!API_KEY) {
    console.error("Netlify 환경 변수 'SPEECHIFY_API_KEY'가 없습니다.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API 키가 서버에 설정되지 않았습니다." }),
      headers: { "Content-Type": "application/json" },
    };
  }

  try {
    const apiResponse = await fetch(API_URL, {
      method: "GET", // 👈 'POST'에서 'GET'으로 되돌렸습니다.
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
      // body는 GET 요청이므로 삭제
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(
        `Speechify API 에러 (${apiResponse.status}) at ${API_URL}: ${errorText}`
      );

      return {
        statusCode: apiResponse.status,
        body: JSON.stringify({
          error: "Speechify API에서 오류가 발생했습니다.",
          details: errorText,
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // 성공!
    const data = await apiResponse.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
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
