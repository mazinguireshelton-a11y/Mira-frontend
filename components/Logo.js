"use client";

export default function Logo({ size = 40, showText = true, animated = true }) {
  return (
    <div
      className={`flex items-center gap-2 ${animated ? "animate-logo-in" : ""}`}
      style={{ lineHeight: 0 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className={animated ? "animate-logo-arrow" : ""}
      >
        <path d="M65 62 L138 88 L102 100 L88 136 Z" fill="#2F81F7" />
      </svg>
      {showText && (
        <span
          className="font-bold text-texto"
          style={{
            fontSize: size * 0.5,
            letterSpacing: "0.08em",
          }}
        >
          MIRA
        </span>
      )}
    </div>
  );
}
