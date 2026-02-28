import {
  PhoneCall, Phone, Flame, Trophy, Mail, Send, Inbox,
  DollarSign, Banknote, CircleDollarSign, Zap, Dumbbell,
  Handshake, Globe, Search, Target, Gem, BarChart3,
  ClipboardList, Bot, Award, Settings, Pause, Brain,
  MessageSquarePlus, Rocket, CheckCircle, AlertTriangle,
  PenLine, ArrowRightLeft, Circle, Lock
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import WolfLogo from './WolfLogo'

const lucideMap: Record<string, LucideIcon> = {
  PhoneCall,
  Phone,
  Flame,
  Trophy,
  Mail,
  Send,
  Inbox,
  DollarSign,
  Banknote,
  CircleDollarSign,
  Zap,
  Dumbbell,
  Handshake,
  Globe,
  Search,
  Target,
  Gem,
  BarChart3,
  ClipboardList,
  Bot,
  Award,
  Settings,
  Pause,
  Brain,
  MessageSquarePlus,
  Rocket,
  CheckCircle,
  AlertTriangle,
  PenLine,
  ArrowRightLeft,
  Circle,
  Lock,
}

interface IconRendererProps {
  name: string
  size?: number
  className?: string
}

export default function IconRenderer({ name, size = 20, className = '' }: IconRendererProps) {
  if (name === 'WolfLogo') {
    return <WolfLogo size={size} className={className} />
  }

  const LucideIcon = lucideMap[name]
  if (!LucideIcon) return null

  return <LucideIcon size={size} className={className} />
}
