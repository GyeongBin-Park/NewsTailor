import { useEffect, useState } from "react";
import {useForm} from "react-hook-form";
import StepIndicator from "./StepIndicator";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

const Step1 = ({onNext}) => {
    const {
        register, 
        handleSubmit, 
        watch,
        formState: {errors, isValid},
    } = useForm({mode: "onChange"});

    const [isActive, setIsActive] = useState(false);
    const [idValid, setIdValid] = useState(false);
    const [checking, setChecking] = useState(false);
    const [idError, setIdError] = useState("");
    const [idSuccess, setIdSuccess] = useState("");

    const nameValue = watch("name");
    const pwValue = watch("password");
    const username = watch("username");

    useEffect(() => {
        setIsActive(!!nameValue && isValid && idValid);
    }, [nameValue, isValid, idValid]);

    const checkDuplicate = async () => {
        if (!username) return;

        // 타임아웃 설정 (10초)
        const controller = new AbortController();
        let timeoutId = null;

        try {
            setChecking(true);
            setIdError("");
            setIdSuccess("");

            if (!BACKEND) {
                setIdError("백엔드 서버 주소가 설정되지 않았습니다.");
                console.error("VITE_BACKEND_URL 환경 변수가 설정되지 않았습니다.");
                return;
            }

            timeoutId = setTimeout(() => controller.abort(), 10000);

            // CORS 및 ngrok 문제 해결을 위한 헤더 추가
            const res = await fetch(
                `${BACKEND}/api/auth/check-username?username=${encodeURIComponent(username)}`,
                {  
                    method: "GET",
                    mode: 'cors',
                    headers: {
                        'ngrok-skip-browser-warning': 'true',
                        'User-Agent': 'Mozilla/5.0 (compatible; API-Client/1.0)',
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    signal: controller.signal,
                }
            );

            if (timeoutId) clearTimeout(timeoutId);

            // Content-Type 확인
            const contentType = res.headers.get("content-type");
            
            if (res.status === 200) {
                if (contentType && contentType.includes("application/json")) {
                    const result = await res.json();
                    if (result.available) {
                      setIdValid(true);
                      setIdSuccess("사용 가능한 아이디입니다.");
                      setIdError("");
                    } else {
                      setIdValid(false);
                      setIdError(result.message || "이미 사용 중인 아이디입니다.");
                      setIdSuccess("");
                    }
                } else {
                    // JSON이 아닌 응답인 경우 (ngrok 경고 페이지 등)
                    const text = await res.text();
                    console.warn("서버가 JSON이 아닌 응답을 반환했습니다:", text);
                    
                    // ngrok 경고 페이지인지 확인
                    if (text.includes("ngrok") || text.includes("You are about to visit") || text.includes("ERR_NGROK")) {
                        setIdValid(false);
                        setIdError("ngrok 경고 페이지가 표시되었습니다. 브라우저에서 서버 URL을 직접 방문하여 'Visit Site' 버튼을 클릭한 후 다시 시도해주세요.");
                        setIdSuccess("");
                    } else {
                        setIdValid(false);
                        setIdError("서버 응답 형식 오류");
                        setIdSuccess("");
                    }
                }
            } else {
                const text = await res.text();
                console.warn("API error:", text);
                setIdValid(false);
                setIdError(`예상치 못한 오류 (code: ${res.status})`);
                setIdSuccess("");
            }
      
        } catch (err) {
          if (timeoutId) clearTimeout(timeoutId);
          
          console.error("중복 확인 오류", err);
          setIdValid(false);
          setIdSuccess("");
          
          // 타임아웃 에러 확인 (AbortError는 타임아웃이나 수동 중단 시 발생)
          if (err.name === 'AbortError' || 
              err.name === 'TimeoutError' || 
              err.message?.includes('aborted')) {
            setIdError("서버 연결 시간이 초과되었습니다. 서버 상태를 확인해주세요.");
            console.error("타임아웃 발생 - 백엔드 URL:", BACKEND);
          } else if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
            setIdError("서버에 연결할 수 없습니다. 네트워크 연결과 서버 주소를 확인해주세요.");
            console.error("네트워크 오류 - 백엔드 URL:", BACKEND);
          } else if (err.message?.includes('CORS') || err.message?.includes('Access-Control-Allow-Origin')) {
            setIdError("CORS 정책 오류: 서버에서 CORS 헤더를 설정해야 합니다.");
          } else {
            setIdError("서버 오류가 발생했습니다: " + (err.message || '알 수 없는 오류'));
          }
      
        } finally {
          setChecking(false);
        }
    };

    const onSubmit = (data) => {
        console.log(data);
        onNext(data);
    };


    return (
        <div className="w-screen">
            <StepIndicator currentStep={0}/>
            <form onSubmit={handleSubmit(onSubmit)} className="w-[358px] mx-auto">
                
                <div className="mt-[37px]">
                    <p className="mb-[4px] ml-[5px]">이름</p>
                    <input 
                        placeholder="사용자의 이름을 입력해주세요" 
                        {...register("name", {required:true})} 
                        className="w-[358px] h-[51px] py-[16px] px-[15px] border rounded-md border-[#E6E6E6] caret-[#39235C]"
                    />
                </div>

                <div className="mt-[37px]">
                    <p className="mb-[4px] ml-[5px]">아이디</p>
                    <div className="relative w-[358px] overflow-hidden">
                    <input 
                        placeholder="아이디를 입력해주세요" 
                        {...register("username", {required:true})} 
                        className="w-full h-[51px] py-[16px] px-[15px] pr-[75px] border rounded-md border-[#E6E6E6] relative caret-[#39235C]"
                    />
                    <button
                    type="button"
                    className="absolute top-[12.5px] right-[10px] w-[58px] h-[26px] rounded-md bg-[#39235C] text-white text-[13px] outline-none border-none focus:outline-none active:bg-[#39235C] active:outline-none"
                    onClick={() => checkDuplicate(username)}
                    >
                    중복확인
                    </button>
                    </div>
                    <div className="h-[20px]">
                        {idError && (
                            <p className="text-[#FF2655] text-sm ml-[5px]">{idError}</p>
                        )}
                        {idSuccess && (
                            <p className="text-[#10B981] text-sm ml-[5px]">{idSuccess}</p>
                        )}
                    </div>
                </div>

                <div className="mt-[37px]">
                    <p className="mb-[4px] ml-[5px]">비밀번호</p>
                    <input 
                        type="password"
                        placeholder="비밀번호를 입력해주세요" 
                        autoComplete="off"
                        {...register("password", {
                            required:true,
                            minLength: {
                                value: 8,
                                message: "최소 8자 이상으로 입력해주세요.",
                            },
                            pattern: {
                                value: /^(?=.*[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]).{6,}$/,
                                message: "특수 문자를 1개 이상 포함해서 입력해주세요.",
                            }
                        })} 
                        className="w-[358px] h-[51px] py-[16px] px-[15px] border rounded-md border-[#E6E6E6] caret-[#39235C]"
                    />
                    <div className="h-[20px]">
                        {errors.password && (
                            <p className="text-[#FF2655] text-sm ml-[5px]">{errors.password.message}</p>
                        )}
                    </div>
                </div>

                <div className="mt-[37px]">
                    <p className="mb-[4px] ml-[5px]">비밀번호 확인</p>
                    <input 
                        type="password"
                        placeholder="비밀번호를 한번 더 입력해주세요" 
                        autoComplete="off"
                        {...register("pw_valid", {
                            required:true,
                            validate: (value) => value === pwValue || "동일한 비밀번호를 입력해주세요.",
                        })} 
                        className="w-[358px] h-[51px] py-[16px] px-[15px] border rounded-md border-[#E6E6E6] caret-[#39235C]"
                    />
                    <div className="h-[20px]">
                        {errors.pw_valid && (
                            <p className="text-[#FF2655] text-sm ml-[5px]">{errors.pw_valid.message}</p>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-[34px]">
                    <button 
                        type="submit"
                        disabled={!isActive}
                        className={`border border-box border-none w-[358px] h-[56px] rounded-md gap-[10px] text-lg
                        ${!isActive ? 'bg-[#F0F0F0] text-[#C7C7C7]' : 'bg-[#39235C] text-white'}`}
                    >
                        계속하기
                    </button>
                </div>
            </form>
        </div>
    )
}

export default Step1;