export default async function handler(request, response) {
  const API_KEY = process.env.SPEECHIFY_API_KEY;
  const API_URL = "https://api.sws.speechify.com";

  if (!API_KEY) {
    return response
      .status(500)
      .json({ error: "API 키가 서버에 설정되지 않았습니다." });
  }
  try {
    const apiResponse = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return response.status(apiResponse.status).json(errorData);
    }
    const data = await apiResponse.json();
    response.status(200).json(data);
  } catch (error) {
    console.error(error);
    response
      .status(500)
      .json({ error: "음성 목록을 가져오는 중 서버 오류 발생" });
  }
}
