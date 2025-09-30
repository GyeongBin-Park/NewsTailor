import "./Step.css";
import { useState } from "react";
import {useNavigate} from "react-router-dom";
import Header from "../Header";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Step4 from "./Step4";
import closeImg from "../../icons/close.svg";
import prevImg from "../../icons/prevImg.svg";

const Step = () => {
    const BACKEND = import.meta.env.VITE_BACKEND_URL;
    const nav = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        phoneNumber: "",
        nickname: "",
        password: "",
        pw_valid: "",
        interests: [],
        interestIds: [],
        service_agree: true,
    });

    const submitToBackend = async (data) => {
        const payload = {
            username: data.username,
            password: data.password,
            nickname: data.name, // name을 nickname으로 사용
            interestIds: data.interestIds, // 백엔드 API 형식에 맞게 수정
        };

        try {
            const response = await fetch(`${BACKEND}/api/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const contentType = response.headers.get("content-type");
            
            if (response.ok) {
                if (contentType && contentType.includes("application/json")) {
                    const result = await response.json();
                    if (result.success) {
                        alert("🎉 회원가입 성공!");
                        setStep(4); // Step4로 이동
                    } else {
                        alert("❌ 실패: " + result.reason);
                    }
                } else {
                    // JSON이 아닌 응답인 경우 (예: "회원가입 성공" 텍스트)
                    const text = await response.text();
                    console.log("서버 응답:", text);
                    alert("🎉 회원가입 성공!");
                    setStep(4); // Step4로 이동
                }
            } else {
                // 에러 응답 처리
                if (contentType && contentType.includes("application/json")) {
                    const errorResult = await response.json();
                    alert("❌ 실패: " + (errorResult.reason || errorResult.message || "알 수 없는 오류"));
                } else {
                    const errorText = await response.text();
                    alert("❌ 실패: " + errorText);
                }
            }
        } 
        
        catch (error) {
            console.error("❗ 서버 오류:", error);
            alert("⚠️ 서버와 연결에 실패했습니다.");
        }
    };

    const updateFromData = (data) => {
        const updated = { ...formData, ...data };
        setFormData(updated);

        if (step === 3) {
            submitToBackend(updated); // 마지막 단계 → 서버에 전송
        } else {
            setStep(prev => prev + 1);
        }
    };

    const closeFunction = () => { nav("/login");}
    const prevFuntion = () => { setStep(prev => Math.max(prev - 1, 1));}

    const currentImg = step === 1 ? closeImg : prevImg;
    const headerText = "회원가입";
    const currentFuntion = step === 1 ? closeFunction : prevFuntion;

    return (
        <div>
            <Header text={headerText} left_img={currentImg} onClick={currentFuntion} />

            {step === 1 && <Step1 onNext={updateFromData} />}
            {step === 2 && <Step2 onNext={updateFromData} />}
            {step === 3 && <Step3 onNext={updateFromData} />}
            {step === 4 && <Step4 data={formData}/>}
        </div>
    )
}

export default Step;