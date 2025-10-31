// 이 파일은 Node.js 환경에서 실행됩니다 (브라우저 X)

export default async function handler(request, response) {
  const API_KEY = process.env.SPEECHIFY_API_KEY;
  const API_URL = "https://api.sws.speechify.com"; // 예시: 실제 Speechify API 주소

  if (!API_KEY) {
    return response
      .status(500)
      .json({ error: "API 키가 설정되지 않았습니다." });
  }

  try {
    const apiResponse = await fetch(API_URL, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    if (!apiResponse.ok) {
      // API 서버로부터의 오류를 클라이언트에 전달
      const errorData = await apiResponse.json();
      return response.status(apiResponse.status).json(errorData);
    }

    const data = await apiResponse.json();

    // 성공 시 클라이언트에 데이터 전송
    response.status(200).json(data);
  } catch (error) {
    response.status(500).json({ error: "서버에서 오류가 발생했습니다." });
  }
}
