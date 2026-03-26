import React from "react";
import "./AvailableOn.scss";
import amazonLogo from "../../../assets/images/home/amazon.png";

const AvailableOn = () => {
  const items = new Array(8).fill({
    // text: "Available on",
    logo: amazonLogo
  });

  return (
    <div className="available">
      <div className="available__wrapper">
        <div className="available__track">
          {[...items, ...items].map((item, index) => (
            <div className="available__item" key={index}>
              <img src={item.logo} alt="amazon" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AvailableOn;