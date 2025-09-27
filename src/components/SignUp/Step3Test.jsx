import Step3 from "./Step3";

const Step3Test = () => {
    const handleNext = (data) => {
        console.log("Step3 데이터:", data);
        alert(`선택된 관심 분야: ${data.interests.join(', ')}`);
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="pt-16">
                <Step3 onNext={handleNext} />
            </div>
        </div>
    );
};

export default Step3Test;
