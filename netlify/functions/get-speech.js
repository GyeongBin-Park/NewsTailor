export const handler = async (event, context) => {
  // 1. React에서 보낸 데이터(input, voice_id 등)를 event.body에서 꺼냅니다.
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { input, voice_id, model } = JSON.parse(event.body);

  if (!input || !voice_id || !model) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "input, voice_id, model은 필수입니다." }),
    };
  }

  const API_KEY = process.env.SPEECHIFY_API_KEY;
  const API_URL = "https://api.sws.speechify.com/v1/audio/speech"; // 실제 Speechify 주소

  if (!API_KEY) {
    console.error("Netlify 환경 변수 'SPEECHIFY_API_KEY'가 없습니다.");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API 키가 서버에 설정되지 않았습니다." }),
    };
  }

  try {
    const apiResponse = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      // 2. React에서 받은 데이터를 Speechify API로 그대로 전달합니다.
      body: JSON.stringify({ input, voice_id, model }),
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
      };
    }

    // 3. Speechify에서 받은 오디오 데이터를 React로 그대로 전달합니다.
    const data = await apiResponse.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error("Netlify 서버 함수 자체의 오류:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "음성 생성 중 서버 오류 발생" }),
    };
  }
};
