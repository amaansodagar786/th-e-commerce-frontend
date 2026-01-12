import React from "react";

const ImagesSection = () => {
  /* 🔥 CANDLE IMAGES FROM PUBLIC FOLDER */
  const images = [
    "/candles/candle1.png",
    "/candles/candle2.png",
    "/candles/candle3.png",
    "/candles/candle4.png",
    "/candles/candle5.png",
  ];

  const platforms = [
    {
      name: "Zomato",
      img: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90'><rect rx='22' width='100%' height='100%' fill='%23e23744'/><text x='50%' y='58%' text-anchor='middle' fill='white' font-size='18' font-weight='bold'>zomato</text></svg>",
    },
    {
      name: "Blinkit",
      img: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90'><rect rx='22' width='100%' height='100%' fill='%23f9d74c'/><text x='50%' y='58%' text-anchor='middle' fill='black' font-size='18' font-weight='bold'>blinkit</text></svg>",
    },
    {
      name: "Flipkart",
      img: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90'><rect rx='22' width='100%' height='100%' fill='%23ffee3b'/><text x='50%' y='62%' text-anchor='middle' fill='%230047ff' font-size='34' font-weight='bold'>F</text></svg>",
    },
    {
      name: "Zepto",
      img: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90'><rect rx='22' width='100%' height='100%' fill='%234a0072'/><text x='50%' y='58%' text-anchor='middle' fill='%23ff4d8d' font-size='18' font-weight='bold'>zepto</text></svg>",
    },
  ];

  return (
    <>
      <style>{`
        @keyframes slideLogos {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        @media (max-width: 768px) {
          .imageRow { overflow: hidden; }
          .imageTrack {
            width: max-content;
            animation: slideLogos 18s linear infinite;
          }
        }

        .logoOuter {
          max-width: 420px;
          margin: 0 auto;
          overflow: hidden;
        }

        .logoInner {
          display: flex;
          gap: 32px;
          width: max-content;
          animation: slideLogos 16s linear infinite;
        }
      `}</style>

      {/* 🔥 IMAGES */}
      <div
        className="imageRow"
        style={{ padding: "40px 20px", marginBottom: "90px" }}
      >
        <div
          className="imageTrack"
          style={{ display: "flex", gap: 24, justifyContent: "center" }}
        >
          {images.map((img, i) => (
            <div
              key={i}
              style={{
                width: 220,
                height: 340,
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <img
                src={img}
                alt="candle"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 🔥 TEXT + LOGOS */}
      <div style={{ textAlign: "center", padding: "0 20px 80px" }}>
        <h2 style={{ fontSize: "clamp(28px,4vw,44px)", marginBottom: 14 }}>
          We are also available here
        </h2>

        <p
          style={{
            fontSize: "clamp(14px,2vw,18px)",
            color: "#555",
            marginBottom: 40,
          }}
        >
          Order your favorite candles effortlessly from apps you already trust.
        </p>

        <div className="logoOuter">
          <div className="logoInner">
            {[...platforms, ...platforms].map((item, i) => (
              <div key={i} style={{ width: 90, height: 90 }}>
                <img
                  src={item.img}
                  alt={item.name}
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ImagesSection;
