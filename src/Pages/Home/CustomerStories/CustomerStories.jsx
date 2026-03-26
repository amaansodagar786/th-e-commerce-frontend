import React, { useRef, useEffect, useCallback } from "react";
import "./CustomerStories.scss";
import customerImage from "../../../assets/images/home/customer.png";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { FaArrowLeftLong , FaArrowRightLong } from "react-icons/fa6";


const CARD_GAP = 30;

const CustomerStories = () => {
    const scrollRef = useRef(null);
    const wrapperRef = useRef(null);
    const cardWidthRef = useRef(0);
    const isAnimating = useRef(false);

    const images = [
        { id: 1, src: customerImage, alt: "Customer Story" },
        { id: 2, src: customerImage, alt: "Customer Story" },
        { id: 3, src: customerImage, alt: "Customer Story" },
        { id: 4, src: customerImage, alt: "Customer Story" },
        { id: 5, src: customerImage, alt: "Customer Story" },
        { id: 6, src: customerImage, alt: "Customer Story" },
    ];

    const TOTAL = images.length;
    const allImages = [...images, ...images, ...images];

    const recalculate = useCallback(() => {
        const wrapper = wrapperRef.current;
        const container = scrollRef.current;
        if (!wrapper || !container) return;

        const W = wrapper.offsetWidth;
        const mobile = window.innerWidth <= 768;

        // DESKTOP layout: [half][gap][full][gap][full][gap][full][gap][full][gap][half]
        //   visible = 5*cw + 5*gap = W
        //   cw = (W - 5*gap) / 5
        //
        // MOBILE layout:  [half][gap][full][gap][half]
        //   visible = 2*cw + 2*gap = W
        //   cw = (W - 2*gap) / 2
        const cw = mobile
            ? Math.floor((W - 2 * CARD_GAP) / 2)
            : Math.floor((W - 5 * CARD_GAP) / 5);

        cardWidthRef.current = cw;

        // Set card widths directly on DOM nodes — no React state, no flicker
        const cards = container.querySelectorAll(".story-card");
        cards.forEach((card) => {
            card.style.width = `${cw}px`;
        });

        // Scroll position: card[TOTAL] is first card of middle set.
        // Shift left by (cw/2 + gap/2) so left half === right half === cw/2
        const cardStep = cw + CARD_GAP;
        const scrollLeft = TOTAL * cardStep - Math.floor(cw / 2) - Math.floor(CARD_GAP / 2);
        container.scrollLeft = scrollLeft;
    }, [TOTAL]);

    useEffect(() => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                recalculate();
            });
        });

        let resizeTimer;
        const onResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(recalculate, 120);
        };

        window.addEventListener("resize", onResize);
        return () => {
            window.removeEventListener("resize", onResize);
            clearTimeout(resizeTimer);
        };
    }, [recalculate]);

    const scroll = (direction) => {
        if (isAnimating.current) return;
        const container = scrollRef.current;
        const cw = cardWidthRef.current;
        if (!container || !cw) return;

        isAnimating.current = true;

        const cardStep = cw + CARD_GAP;
        container.scrollBy({
            left: direction === "right" ? cardStep : -cardStep,
            behavior: "smooth",
        });

        setTimeout(() => {
            const totalSetWidth = TOTAL * cardStep;
            const base = TOTAL * cardStep - Math.floor(cw / 2) - Math.floor(CARD_GAP / 2);

            if (container.scrollLeft >= base + totalSetWidth) {
                container.scrollLeft -= totalSetWidth;
            } else if (container.scrollLeft < base - totalSetWidth) {
                container.scrollLeft += totalSetWidth;
            }

            isAnimating.current = false;
        }, 450);
    };

    return (
        <section className="customer-stories">
            <div className="stories-container">
                <h2 className="stories-heading">Customer Stories</h2>

                <div className="stories-scroll-wrapper" ref={wrapperRef}>
                    <div className="stories-scroll-container" ref={scrollRef}>
                        {allImages.map((image, index) => (
                            <div key={`${image.id}-${index}`} className="story-card">
                                <img src={image.src} alt={image.alt} className="story-image" />
                            </div>
                        ))}
                    </div>

                    <div className="scroll-buttons">
                        <button onClick={() => scroll("left")} aria-label="Previous">
                            <FaArrowLeftLong />
                        </button>
                        <button onClick={() => scroll("right")} aria-label="Next">
                            <FaArrowRightLong />
                        </button>
                    </div>
                </div>

                <div className="stories-content">
                    <div className="quote-text">
                        "FROM <span className="extra-bold">OUR</span> KITCHEN{" "}
                        <span className="extra-bold">TO</span> YOURS."
                    </div>
                    <p className="stories-description">
                        Loved by thousands of families who cook healthier every day with Satvsar Oil.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default CustomerStories;