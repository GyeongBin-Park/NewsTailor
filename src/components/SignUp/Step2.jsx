import {useForm} from "react-hook-form";
import StepIndicator from "./StepIndicator";
import { useState } from "react";

import politicsX from "../../icons/politics_x.svg";
import politicsO from "../../icons/politics_o.svg";
import economyX from "../../icons/economy_x.svg";
import economyO from "../../icons/economy_o.svg";
import societyX from "../../icons/society_x.svg";
import societyO from "../../icons/society_o.svg";
import lifestyleX from "../../icons/lifestyle_x.svg";
import lifestyleO from "../../icons/lifestyle_o.svg";
import worldX from "../../icons/world_x.svg";
import worldO from "../../icons/world_o.svg";
import scienceX from "../../icons/science_x.svg";
import scienceO from "../../icons/science_o.svg";

const Step2 = ({onNext}) => {
    const {handleSubmit} = useForm();

    const [selectedCategories, setSelectedCategories] = useState([]);

    const categories = [
        { id: 'politics', name: '정치', iconX: politicsX, iconO: politicsO, backendId: 100 },
        { id: 'economy', name: '경제', iconX: economyX, iconO: economyO, backendId: 101 },
        { id: 'society', name: '사회', iconX: societyX, iconO: societyO, backendId: 102 },
        { id: 'lifestyle', name: '생활/문화', iconX: lifestyleX, iconO: lifestyleO, backendId: 103 },
        { id: 'world', name: '세계', iconX: worldX, iconO: worldO, backendId: 104 },
        { id: 'science', name: 'IT/과학', iconX: scienceX, iconO: scienceO, backendId: 105 }
    ];

    const toggleCategory = (categoryId) => {
        setSelectedCategories(prev => {
            if (prev.includes(categoryId)) {
                return prev.filter(id => id !== categoryId);
            } else if (prev.length < 3) {
                return [...prev, categoryId];
            }
            return prev;
        });
    };

    const onSubmit = async (data) => {
        try {
            // 선택된 카테고리를 백엔드 ID로 변환
            const interestIds = selectedCategories.map(categoryId => {
                const category = categories.find(cat => cat.id === categoryId);
                return category ? category.backendId : null;
            }).filter(id => id !== null);

            console.log('Selected interest IDs:', interestIds);
            onNext({interests: selectedCategories, interestIds: interestIds});
        } catch (error) {
            console.error('관심분야 처리 오류:', error);
        }
    };

    return (
        <div className="w-screen">
            <StepIndicator currentStep={1}/>
            <form onSubmit={handleSubmit(onSubmit)} className="w-[358px] mx-auto">
                <div className="font-medium font-display text-[22px] py-[10px] ml-[19px]">
                    <p>관심 분야를 선택해주세요 (3개)</p>
                </div>

                <div className="mt-[10px] justify-items-center pb-[20px]">
                    <div className="grid grid-cols-2 gap-x-0 gap-y-[7px] justify-items-center w-[326px] mx-auto">
                        {categories.map((category) => {
                            const isSelected = selectedCategories.includes(category.id);
                            return (
                                <div key={category.id} className="flex flex-col items-center">
                                    <div
                                        onClick={() => toggleCategory(category.id)}
                                        className={`w-[128px] h-[128px] rounded-[28px] flex items-center justify-center cursor-pointer transition-all duration-200 ${
                                            isSelected 
                                                ? 'bg-[#F1C40F]' 
                                                : 'bg-[#F1F1F1] hover:bg-[#E8E8E8]'
                                        }`}
                                    >
                                        <img
                                            src={isSelected ? category.iconO : category.iconX}
                                            alt={category.name}
                                            className="w-[100px] h-[100px]"
                                        />
                                    </div>
                                    <span className="text-sm font-medium mt-2 text-center">
                                        {category.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </form>

            <div className="fixed bottom-[34px] left-1/2 -translate-x-1/2 w-[358px]">
                <button 
                    type="button"
                    onClick={handleSubmit(onSubmit)}
                    disabled={selectedCategories.length !== 3}
                    className={`border border-box border-none w-full h-[56px] rounded-md gap-[10px] text-lg
                    ${selectedCategories.length !== 3 ? 'bg-[#F0F0F0] text-[#C7C7C7]' : 'bg-[#39235C] text-white'}`}
                >
                    계속하기
                </button>
            </div>
        </div>
    )

}

export default Step2;
