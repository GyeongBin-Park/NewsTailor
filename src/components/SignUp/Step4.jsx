import { useNavigate } from "react-router-dom";
import JoinIcon from "../../icons/join.svg";

const Step4 = ({data}) => {
    const nav = useNavigate();
    return(
        <div className="w-screen">
            <form className="w-[358px] mx-auto">
                {/* 타이틀 */}
                <div className="font-medium font-display text-center text-[28px] pt-[108px]">
                    <div>가입이 완료되었습니다</div>
                </div>
                {/* 타이틀 아래 아이콘 */}
                <div className="flex justify-center mb-[20px]">
                    <img
                     src={JoinIcon}
                     alt="가입 완료 아이콘"
                     className="w-[370px] h-[370px]"
                    />
                 </div>
                 {/* 회원 정보
                <div>
                    <p>{data.username}</p>
                    <p>{data.nickname}</p>
                    <p>{data.password}</p>
                    <p>{data.phoneNumber}</p>
                    <p>{data.service_agree}</p>
                </div> */}

                <div className="absolute bottom-[34px] left-1/2 -translate-x-1/2">
                    <button 
                        className={"border border-box border-none w-[358px] h-[56px] rounded-md gap-[10px] text-lg bg-[#39235C] text-white"}
                        onClick={() => nav("/login")}
                    >
                        로그인 하고 시작하기
                    </button>
                </div>
            </form>
        </div>
    )
}

export default Step4;