import "./Step.css";
import { useState } from "react";
import {useNavigate} from "react-router-dom";
import Header from "../Header";
import Step1 from "./Step1";
import Step2 from "./Step2";
import Step3 from "./Step3";
import Step4 from "./Step4";
import StepResult from "./StepResult";
import closeImg from "../../icons/close.svg";
import prevImg from "../../icons/prevImg.svg";

const Step = () => {
    const BACKEND = import.meta.env.VITE_BACKEND_URL;
    const nav = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        username: "",
        phoneNumber: "",
        nickname: "",
        password: "",
        pw_valid: "",
        service_agree: true,
    });

    const submitToBackend = async (data) => {
        const payload = {
            username: data.username,
            phoneNumber: data.phoneNumber,
            nickname: data.nickname,
            password: data.password,
        };

        try {
            const response = await fetch(`${BACKEND}/api/signup`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.success) {
                alert("🎉 회원가입 성공!");
                setStep(5); // StepResult로 이동
            } 
            
            else {
                alert("❌ 실패: " + result.reason);
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

        if (step === 4) {
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
            {step === 4 && <Step4 onNext={updateFromData} />}
            {step === 5 && <StepResult data={formData}/>}
        </div>
    )
}

export default Step;