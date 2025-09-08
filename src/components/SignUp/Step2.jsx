import { useState, useEffect } from "react";
import {useForm} from "react-hook-form";
import StepIndicator from "./StepIndicator";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

const Step2 = ({onNext}) => {
    const {
        register, 
        handleSubmit, 
        watch,
        formState: {errors, isValid},
    } = useForm({mode: "onChange"});

    
    const pwValue = watch("password");
    const username = watch("username");

    const [isActive, setIsActive] = useState(false);

    const [idValid, setIdValid] = useState(false);
    const [checking, setChecking] = useState(false);
    const [idError, setIdError] = useState("");

    useEffect(() => {
        setIsActive(isValid && idValid); // 아이디 중복 확인도 완료돼야 버튼 활성화
    }, [isValid, idValid]);

    const checkDuplicate = async () => {
        if (!username) return;

        try {
            setChecking(true);
            setIdError("");

            const res = await fetch(
                `${BACKEND}/api/auth/check-username?username=${encodeURIComponent(username)}`,
                {  method: "GET"  }
            );

            // const result = await res.json();

        //     if (res.status === 200) {
        //         setIdValid(true);
        //         alert("사용 가능한 아이디입니다!");
        //     } else if (res.status === 409) {
        //         setIdValid(false);
        //         setIdError("이미 사용 중인 아이디입니다.");
        //     } else {
        //         setIdValid(false);
        //         setIdError("알 수 없는 오류")
        //     }
        // } catch (err) {
        //     console.error("중복 확인 오류", err);
        //     setIdError("오류가 발생했습니다. 다시 시도해주세요.");
        // } finally {
        //     setChecking(false);
        // }

    //     if (res.status === 200) {
    //         const result = await res.json();
    //         if (result.success) {
    //             setIdValid(true);
    //             alert("사용 가능한 아이디입니다!");
    //         } else {
    //             setIdValid(false);
    //             setIdError("서버 응답 오류입니다.");
    //         }
    //     } else if (res.status === 409) {
    //         // JSON 파싱 안 함! 그냥 메시지만 출력
    //         setIdValid(false);
    //         setIdError("이미 사용 중인 아이디입니다.");
    //     } else {
    //         const text = await res.text(); // 혹시 어떤 에러인지 확인
    //         console.warn("예상치 못한 오류:", text);
    //         setIdValid(false);
    //         setIdError(`예상치 못한 오류 (code: ${res.status})`);
    //     }
    // } catch (err) {
    //     console.error("중복 확인 오류", err);
    //     setIdError("서버 오류가 발생했습니다. 다시 시도해주세요.");
    // } finally {
    //     setChecking(false);
    // }
    // };

    // 1) 200 응답일 때 JSON 파싱
    if (res.status === 200) {
        const result = await res.json(); // { available: boolean, message: string }
        if (result.available) {
          setIdValid(true);
          alert(result.message);
        } else {
          setIdValid(false);
          setIdError(result.message);
        }
  
      // 2) 그 외(4xx/5xx)
      } else {
        const text = await res.text();
        console.warn("API error:", text);
        setIdValid(false);
        setIdError(`예상치 못한 오류 (code: ${res.status})`);
      }
  
    } catch (err) {
      console.error("중복 확인 오류", err);
      setIdValid(false);
      setIdError("서버 오류가 발생했습니다. 다시 시도해주세요.");
  
    } finally {
      setChecking(false);
    }
  };

    
    const onSubmit = (data) => {
        
        console.log(data);
        setIsActive(isActive);
        onNext(data);
    };

    return (
        <div className="w-screen">
            <StepIndicator currentStep={1}/>
        <form onSubmit={handleSubmit(onSubmit)} className="w-[358px] mx-auto">
            <div className="font-medium font-display text-[28px] py-[10px]">
                <p>아이디와 비밀번호를</p>
                <p>입력해주세요</p>
            </div>
            <div className="mt-[37px]">
                <p className="mb-[4px]">아이디</p>
                <div className="relative w-[358px]">
                <input 
                    placeholder="아이디를 입력해주세요" 
                    {...register("username", {required:true})} 
                    className="w-full h-[51px] py-[16px] px-[15px] border rounded-md border-[#E6E6E6] relative"
                />
                <button
                type="button"
                className="absolute top-1/2 right-[10px] -translate-y-1/2 w-[58px] h-[26px] rounded-md bg-[#401E63] text-white text-[13px]"
                onClick={() => checkDuplicate(username)}
                >
                중복확인
                </button>
                {idError && (
                    <p className="text-sm">{idError}</p>
                )}
                </div>
            </div>

            <div className="mt-[38px] fixed">
                <p className="mb-[4px]">비밀번호</p>
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
                    className="w-[358px] h-[51px] py-[16px] px-[15px] border rounded-md border-[#E6E6E6]"
                />
                {errors.password && (
                    <p className="text-[#FF2655] text-sm">{errors.password.message}</p>
                )
                }
            </div>

            <div className="mt-[150px] fixed">
                <p className="mb-[4px]">비밀번호 확인</p>
                <input 
                    type="password"
                    placeholder="비밀번호를 한번 더 입력해주세요" 
                    autoComplete="off"
                    {...register("pw_valid", {
                        required:true,
                        validate: (value) => value === pwValue || "동일한 비밀번호를 입력해주세요.",
                    })} 
                    className="w-[358px] h-[51px] py-[16px] px-[15px] border rounded-md border-[#E6E6E6]"
                />
                {errors.pw_valid && (
                    <p className="text-[#FF2655] text-sm">{errors.pw_valid.message}</p>
                )}
            </div>

            <div className="absolute bottom-[34px]">
                <button 
                    type="submit"
                    disabled={!isActive}
                    className={`border border-box border-none w-[358px] h-[56px] rounded-md gap-[10px] text-lg text-[#C7C7C7] 
                    ${!isActive ? 'bg-[#F0F0F0] text-[#C7C7C7]' : 'bg-[#FF2655] text-white'}`}
                >
                    계속하기
                </button>
            </div>
        </form>
    </div>
    )

}

export default Step2;
