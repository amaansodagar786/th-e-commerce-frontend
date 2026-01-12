import React from "react";

const CandleShowcase = () => {
  return (
    <div
      style={{
        width: "100%",
        overflowX: "hidden", // ✅ SCROLL FIX
      }}
    >
      <div
        className="showcaseGrid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0px",
          width: "100%",
        }}
      >
        {/* LEFT IMAGE */}
        <img
          src="/showcase/left-candle.png"
          alt="Left candle"
          style={{
            width: "100%",
            height: "380px",
            objectFit: "cover",
            display: "block",
          }}
        />

        {/* RIGHT IMAGE */}
        <img
          src="/showcase/right-candle.png"
          alt="Right candle"
          style={{
            width: "100%",
            height: "380px",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .showcaseGrid {
            grid-template-columns: 1fr;
          }

          .showcaseGrid img {
            height: 280px;
          }
        }
      `}</style>
    </div>
  );
};

export default CandleShowcase;
