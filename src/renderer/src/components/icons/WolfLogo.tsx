import wolfLogo from '../../assets/wolf-logo.png'

interface WolfLogoProps {
  size?: number
  className?: string
}

export default function WolfLogo({ size = 24, className = '' }: WolfLogoProps) {
  return (
    <img
      src={wolfLogo}
      alt="Wolf Tool"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  )
}
