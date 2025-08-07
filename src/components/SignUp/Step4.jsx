import {useForm} from "react-hook-form";
import StepIndicator from "./StepIndicator";
import { useState } from "react";
import checkImg from "../../icons/checked.svg";
import noCheckImg from "../../icons/not_checked.svg";

const Step4 = ({onNext}) => {
    const {handleSubmit} = useForm();

    const [checkboxes, setCheckboxes] = useState({
        option1: false,
        option2: false,
    });

    const [allChecked, setAllChecked] = useState(false);

    const handleAllCheckboxChange = (e) => {
        const isChecked = e.target.checked;
        setAllChecked(isChecked);
        setCheckboxes({
            option1: isChecked,
            option2: isChecked,
        });
    };

    const handleCheckboxChange = (e) => {
        const {name, checked} = e.target;
        setCheckboxes((prevCheckboxes) => {
            const updatedCheckboxes = {
                ...prevCheckboxes,
                [name]: checked,
            };

            const allCheckStatus = Object.values(updatedCheckboxes).every(Boolean);
            setAllChecked(allCheckStatus);
            return updatedCheckboxes;
        });
    };

    const toggleCheckbox = (name) => {
        const updated = {
            ...checkboxes,
            [name]: !checkboxes[name],
        };
        setCheckboxes(updated);
        setAllChecked(Object.values(updated).every(Boolean));
    };

    
    const onSubmit = (data) => {
        console.log(data);
        onNext({service_agree: allChecked});
    };

    return (
        <div className="w-screen">
            <StepIndicator currentStep={3}/>
            <form onSubmit={handleSubmit(onSubmit)} className="w-[358px] mx-auto">
                <div className="font-medium font-display text-[28px] py-[10px]">
                    <p>뉴스테일러 서비스 이용약관에</p>
                    <p>동의해주세요</p>
                </div>
        
                <div className="absolute bottom-[117px] left-1/2 -translate-x-1/2">
                    <article className={`border border-box w-[358px] h-[60px] rounded-md text-lg px-[19px] flex flex-row-reverse items-center justify-between
                                        ${!allChecked ? 'border-[#E6E6E6]' : 'text-[#FF2655] border-[#FF2655]'}`}>
                        <input 
                            type="checkbox"
                            checked={allChecked}
                            onChange={handleAllCheckboxChange}
                            className="hidden"
                            
                        />
                        
                        <img 
                            src={allChecked ? checkImg : noCheckImg}
                            alt={allChecked ? "checked" : "not checked"}
                            className="w-5 h-5"
                            onClick={() => {
                                const newValue = !checkboxes.option1;
                                setAllChecked(newValue);
                                setCheckboxes({
                                    option1: newValue,
                                    option2: newValue,
                                });
                            }}
                        />

                        <label htmlFor="all" className="cursor-pointer">약관 전체 동의</label>
                    </article>
                    <ul>
                        <li className="border border-box border-none w-[358px] h-[25px] rounded-md text-[#5C5C5C] px-[19px] my-[12px]">
                            <div className="flex flex-row-reverse justify-between">
                                <input 
                                    type="checkbox" 
                                    name="option1"
                                    checked={checkboxes.option1}
                                    onChange={handleCheckboxChange}
                                    className="hidden"
                                />
                                <img 
                                    src={checkboxes.option1 ? checkImg : noCheckImg}
                                    alt={checkboxes.option1 ? "checked" : "not checked"}
                                    className="w-5 h-5"
                                    onClick={() => {
                                        toggleCheckbox('option1')
                                    }}
                                />
                                <label htmlFor="agree1">
                                    (필수) 이용약관 동의
                                </label>
                            </div>
                        </li>
                        <li className="border border-box border-none w-[358px] h-[25px] rounded-md text-[#5C5C5C] px-[19px]">
                            <div className="flex flex-row-reverse justify-between">
                                <input 
                                    type="checkbox" 
                                    name="option2"
                                    checked={checkboxes.option2}
                                    onChange={handleCheckboxChange}
                                    className="hidden"
                                />
                                <img 
                                    src={checkboxes.option2 ? checkImg : noCheckImg}
                                    alt={checkboxes.option2 ? "checked" : "not checked"}
                                    className="w-5 h-5"
                                    onClick={() => {
                                        toggleCheckbox('option2')
                                    }}
                                />
                                <label htmlFor="agree2">
                                    (필수) 개인정보 수집 및 이용 동의
                                </label>
                            </div>
                        </li>
                    </ul>
                </div>

                <div className="absolute bottom-[34px] left-1/2 -translate-x-1/2">
                    <button 
                        type="submit"
                        disabled={!allChecked}
                        className={`border border-box border-none w-[358px] h-[56px] rounded-md gap-[10px] text-lg
                        ${!allChecked ? 'bg-[#F0F0F0] text-[#C7C7C7]' : 'bg-[#401E63] text-white'}`}
                    >
                        계속하기
                    </button>
                </div>
            </form>
        </div>
    )  
}

export default Step4;