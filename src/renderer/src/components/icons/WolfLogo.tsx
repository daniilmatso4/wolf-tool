interface WolfLogoProps {
  size?: number
  className?: string
}

export default function WolfLogo({ size = 24, className = '' }: WolfLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left ear */}
      <path
        d="M10 8L18 28L8 22Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Right ear */}
      <path
        d="M54 8L46 28L56 22Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Head shape */}
      <path
        d="M12 24C12 24 14 38 20 44L26 50L32 54L38 50L44 44C50 38 52 24 52 24L46 28C46 28 44 18 42 14L38 20L32 12L26 20L22 14C20 18 18 28 18 28L12 24Z"
        fill="currentColor"
      />
      {/* Left eye */}
      <path d="M22 30L26 28L28 32L24 34Z" fill="black" opacity="0.6" />
      {/* Right eye */}
      <path d="M42 30L38 28L36 32L40 34Z" fill="black" opacity="0.6" />
      {/* Snout */}
      <path
        d="M28 38L32 36L36 38L34 42L32 44L30 42Z"
        fill="currentColor"
        opacity="0.8"
      />
      {/* Nose */}
      <path d="M30 38L32 36L34 38L32 40Z" fill="black" opacity="0.5" />
    </svg>
  )
}
