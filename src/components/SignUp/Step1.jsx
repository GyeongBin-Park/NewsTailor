import { useEffect, useState } from "react";
import {useForm} from "react-hook-form";
import StepIndicator from "./StepIndicator";

const Step1 = ({onNext}) => {
    const {register, handleSubmit, watch} = useForm();
    const [isActive, setIsActive] = useState(false);

    const nameValue = watch("username");

    useEffect(() => {
        setIsActive(!!nameValue);
    }, [nameValue]);

    const onSubmit = (data) => {
        console.log(data);
        onNext(data);
    };


    return (
        <div className="w-screen">
            <StepIndicator currentStep={0}/>
            <form onSubmit={handleSubmit(onSubmit)} className="w-[358px] mx-auto">
                <div className="font-medium font-display text-[28px] py-[10px]">
                    <p>반가워요!</p>
                    <p>먼저 이름을 입력해주세요</p>
                </div>
                <div className="py-[10px]">
                    <input 
                        placeholder="사용자의 이름을 입력해주세요" 
                        {...register("username", {required:true})} 
                        className="w-[358px] h-[51px] py-[16px] px-[15px] border rounded-md border-[#E6E6E6]"
                    />
                </div>

                <div className="absolute bottom-[34px]">
                    <button 
                        type="submit"
                        disabled={!isActive}
                        className={`border border-box border-none w-[358px] h-[56px] rounded-md gap-[10px] text-lg
                        ${!isActive ? 'bg-[#F0F0F0] text-[#C7C7C7]' : 'bg-[#FF2655] text-white'}`}
                    >
                        계속하기
                    </button>
                </div>
            </form>
        </div>
    )
}

export default Step1;