'use client'

import { motion } from 'framer-motion'
import { 
  Mic, MicOff, 
  Video, VideoOff, 
  Monitor, 
  MessageSquare, 
  PhoneOff, 
  Users, 
  Link as LinkIcon,
  Hand,
  Volume2
} from 'lucide-react'

interface ControlBarProps {
  isMuted: boolean
  isCameraOff: boolean
  isChatOpen: boolean
  isParticipantsOpen: boolean
  isSignToAudioEnabled: boolean
  isAudioToSignEnabled: boolean
  onToggleMic: () => void
  onToggleCamera: () => void
  onToggleScreenShare: () => void
  onToggleChat: () => void
  onToggleParticipants: () => void
  onToggleSignToAudio: () => void
  onToggleAudioToSign: () => void
  onLeave: () => void
  onCopyLink: () => void
}

export function ControlBar({
  isMuted,
  isCameraOff,
  isChatOpen,
  isParticipantsOpen,
  isSignToAudioEnabled,
  isAudioToSignEnabled,
  onToggleMic,
  onToggleCamera,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onToggleSignToAudio,
  onToggleAudioToSign,
  onLeave,
  onCopyLink
}: ControlBarProps) {
  return (
    <div className="fixed bottom-0 left-0 w-full p-6 flex items-center justify-center z-50 pointer-events-none">
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-zinc-900/90 backdrop-blur-2xl border border-white/10 px-8 py-3 rounded-[32px] flex items-center gap-6 shadow-2xl pointer-events-auto"
      >
        <ControlButton 
          onClick={onToggleMic} 
          active={!isMuted} 
          icon={isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />} 
          danger={isMuted}
          label={isMuted ? 'Unmute' : 'Mute'}
        />
        <ControlButton 
          onClick={onToggleCamera} 
          active={!isCameraOff} 
          icon={isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />} 
          danger={isCameraOff}
          label={isCameraOff ? 'Start Camera' : 'Stop Camera'}
        />
        <div className="w-px h-8 bg-white/10 mx-2" />
        <ControlButton 
          onClick={onToggleScreenShare} 
          icon={<Monitor className="w-6 h-6" />} 
          label="Share Screen"
        />
        <ControlButton 
          onClick={onToggleChat} 
          active={isChatOpen}
          icon={<MessageSquare className="w-6 h-6" />} 
          label="Chat"
        />
        <ControlButton 
          onClick={onToggleParticipants} 
          active={isParticipantsOpen}
          icon={<Users className="w-6 h-6" />} 
          label="Participants"
        />
        <ControlButton 
          onClick={onCopyLink} 
          icon={<LinkIcon className="w-6 h-6" />} 
          label="Copy Link"
        />
        <div className="w-px h-8 bg-white/10 mx-2" />

        {/* Sign → Audio: Camera detects hand signs → speaks aloud */}
        <ControlButton 
          onClick={onToggleSignToAudio} 
          active={isSignToAudioEnabled}
          icon={<Hand className="w-6 h-6" />} 
          label={isSignToAudioEnabled ? 'Disable Sign → Audio' : 'Enable Sign → Audio'}
          highlight={isSignToAudioEnabled}
          highlightColor="emerald"
        />

        {/* Audio → Sign: Spoken audio → avatar sign language */}
        <ControlButton 
          onClick={onToggleAudioToSign} 
          active={isAudioToSignEnabled}
          icon={<Volume2 className="w-6 h-6" />} 
          label={isAudioToSignEnabled ? 'Disable Audio → Sign' : 'Enable Audio → Sign'}
          highlight={isAudioToSignEnabled}
          highlightColor="indigo"
        />

        <div className="w-px h-8 bg-white/10 mx-2" />
        <ControlButton 
          onClick={onLeave} 
          danger 
          icon={<PhoneOff className="w-6 h-6 fill-current" />} 
          label="Leave Meeting"
        />
      </motion.div>
    </div>
  )
}

function ControlButton({ 
  icon, 
  onClick, 
  danger = false, 
  active = false,
  highlight = false,
  highlightColor = 'indigo',
  label
}: { 
  icon: React.ReactNode, 
  onClick: () => void, 
  danger?: boolean,
  active?: boolean,
  highlight?: boolean,
  highlightColor?: 'indigo' | 'emerald',
  label: string
}) {
  const highlightStyles = highlightColor === 'emerald'
    ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
    : 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]'

  const pingColor = highlightColor === 'emerald'
    ? 'bg-emerald-500/30'
    : 'bg-indigo-500/30'

  return (
    <button
      onClick={onClick}
      title={label}
      className={`
        relative group w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300
        ${danger 
          ? 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white' 
          : highlight
            ? highlightStyles
            : active 
              ? 'bg-white text-black hover:bg-zinc-200' 
              : 'bg-white/5 text-white hover:bg-white/10'}
      `}
    >
      {icon}
      {/* Tooltip */}
      <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1 bg-black text-white text-[10px] font-mono uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none mb-2">
        {label}
      </span>
      {/* Active glow */}
      {highlight && (
        <span className={`absolute inset-0 rounded-2xl animate-ping ${pingColor} pointer-events-none`} style={{ animationDuration: '2s' }} />
      )}
    </button>
  )
}
