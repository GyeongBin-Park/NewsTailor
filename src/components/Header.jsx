import "./Header.css";

const Header = ({left_img, text, onClick}) => {
    return (
        <div className="header">
            <div className="img_wrapper" onClick={onClick}>
                <img 
                    src={left_img} 
                    alt="back" 
                />
            </div>

            <div className="text_wrapper">
                {text}
            </div>
        </div>
    )
}

export default Header;