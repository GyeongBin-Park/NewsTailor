import { useEffect, useState } from "react";
import "./Info.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const Info = () => {

    const BACKEND = import.meta.env.VITE_BACKEND_URL;

const login = async (username, password) => {
  const payload = { username, password };

  // 타임아웃 설정 (10초)
  const controller = new AbortController();
  let timeoutId = null;

  try {
    if (!BACKEND) {
      toast.error("백엔드 서버 주소가 설정되지 않았습니다.");
      console.error("VITE_BACKEND_URL 환경 변수가 설정되지 않았습니다.");
      return;
    }

    timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`${BACKEND}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    const contentType = res.headers.get("content-type");
    
    if (res.ok) {
      let accessToken = null;
      
      if (contentType && contentType.includes("application/json")) {
        const result = await res.json();
        if (result.accessToken) {
          accessToken = result.accessToken;
        } else {
          toast.error("로그인 실패: 토큰을 받지 못했습니다.");
          return;
        }
      } else {
        // JSON이 아닌 응답인 경우
        const text = await res.text();
        console.log("서버 응답:", text);
        // 임시로 진행 (실제 환경에서는 토큰이 필요)
      }

      // 토큰과 username 저장
      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
      }
      localStorage.setItem("username", username);

      // 사용자 정보 가져오기
      try {
        const userInfoRes = await fetch(`${BACKEND}/api/member`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            "User-Agent": "NewsTailor"
          }
        });

        if (userInfoRes.ok) {
          const userInfoContentType = userInfoRes.headers.get("content-type");
          
          if (userInfoContentType && userInfoContentType.includes("application/json")) {
            const userInfo = await userInfoRes.json();
            // nickname과 interests 저장
            if (userInfo.nickname) {
              localStorage.setItem("nickname", userInfo.nickname);
            }
            if (userInfo.interestIds) {
              localStorage.setItem("interests", JSON.stringify(userInfo.interestIds));
            }
          } else {
            console.warn("사용자 정보 API가 JSON을 반환하지 않았습니다.");
          }
        } else {
          console.warn("사용자 정보 가져오기 실패:", userInfoRes.status);
        }
      } catch (error) {
        console.error("사용자 정보 가져오기 실패:", error);
        // 정보 가져오기 실패해도 로그인은 성공으로 처리
      }

      toast.success("로그인 성공!");
      nav("/");
    } else {
      // 에러 응답 처리
      if (contentType && contentType.includes("application/json")) {
        const errorResult = await res.json();
        toast.error("로그인 실패: " + (errorResult.reason || errorResult.message || "알 수 없는 오류"));
      } else {
        const errorText = await res.text();
        toast.error("로그인 실패: " + errorText);
      }
    }
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    
    console.error("로그인 오류:", err);
    
    if (err.name === 'AbortError' || err.name === 'TimeoutError') {
      toast.error("서버 연결 시간이 초과되었습니다. 서버 상태를 확인해주세요.");
    } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
      toast.error("서버에 연결할 수 없습니다. 네트워크 연결과 서버 주소를 확인해주세요.");
      console.error("백엔드 URL:", BACKEND);
    } else {
      toast.error("로그인 중 오류가 발생했습니다: " + err.message);
    }
  }
};

    const nav = useNavigate();

    const [active, setActive]= useState(false);
   
    const [inputs, setInputs] = useState({
        id: '',
        pw: ''
    });

    const {id, pw} = inputs;

    const onChange = (e) => {
        const {name, value} = e.target;

        const nextInputs = {
            ...inputs,
            [name] : value,
        }
        setInputs(nextInputs);
    };

    useEffect(()=>{
        const isActive = id && pw;
        setActive(isActive);
    }, [id, pw]);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        await login(inputs.id, inputs.pw);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && active) {
            handleLogin(e);
        }
    };

    return (
        <>
        <div className="wrapper">
            <div  className="header_wrapper">
                <h1>로그인</h1>
                <p>NEWS TAILOR 오늘의 뉴스 보러가기</p>
            </div>

            <div className="main_wrapper">
                <div>
                    <form className="info_wrapper" onSubmit={handleLogin}>
                    <input 
                        type="id" 
                        name="id"
                        value={id}
                        onChange={onChange}
                        placeholder="아이디를 입력해주세요"
                        onKeyPress={handleKeyPress}
                    />
                    <input 
                        type="password"
                        name="pw"
                        value={pw}
                        onChange={onChange}
                        autoComplete="off"
                        placeholder="비밀번호를 입력해주세요"
                        onKeyPress={handleKeyPress}
                    />
                    </form>
                </div>

                <div className="check_wrapper">
                    
                    <input type="checkbox" className="login_checkbox"/>
                    <div className="label_box">
                        <label htmlFor="" className="check_text">로그인 상태 유지</label>
                    </div>
                    
                </div>
            </div>

                <div className="buttons_wrapper">
                    <button>아이디 찾기</button> |
                    <button>비밀번호 찾기</button> |
                    <button onClick={() => nav("/signup")}>회원가입</button>
                </div>

            </div>

            <div className="footer_wrapper">
                <button 
                    onClick={handleLogin}
                    disabled={!active}
                    className={!active ? 'ach_login_button' : 'rej_login_button'}
                >
                    로그인
                </button>
            </div>
        </>
    )
}

export default Info;