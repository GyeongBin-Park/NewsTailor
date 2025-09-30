const StepIndicator = ({ currentStep }) => {
    return (
        <div className="flex justify-center pt-[30px] pb-[30px]">
        <div className="flex items-center">
            {[0, 1, 2, 3].map((step, index) => (
                <div key={index} className="flex items-center"> 
                    <div className="relative w-2 h-">
                        {currentStep === step && (
                            <div className="absolute inset-[-8px] bg-[rgba(57,35,92,0.27)] rounded-full z-0"/>
                        )}
                        <div 
                            className={`relative w-2 h-2 rounded-full z-10
                                ${currentStep >= step ? 'bg-[#39235C]' : 'bg-[#C7C7C7]'}`}
                        />
                    </div>
                    
                    {index < 3 && (
                        <div 
                            className={`w-6 h-[2px]
                                ${currentStep > step ? 'bg-[#39235C]' : 'bg-[#C7C7C7]'}`}
                        />
                    )}
                </div>
            ))}
        </div>
        </div>
    )
}


export default StepIndicator;