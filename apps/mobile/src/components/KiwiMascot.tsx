import { useEffect } from 'react'
import { View, TouchableOpacity } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  cancelAnimation,
  runOnJS,
} from 'react-native-reanimated'
import Svg, { Circle, Ellipse, Path, Rect, G } from 'react-native-svg'
import { useKiwiStore, type KiwiMood } from '../store/kiwiStore'

interface KiwiMascotProps {
  mood?: KiwiMood
  size?: number
  onPress?: () => void
  autoAnimate?: boolean
}

// The kiwi bird SVG — round brown body, long beak, expressive eyes
function KiwiBird({ size, mood, outfit }: { size: number; mood: KiwiMood; outfit: string }) {
  const s = size / 100

  const eyeScale = mood === 'focused' ? 0.7 : mood === 'sleepy' ? 0.4 : 1
  const beakAngle = mood === 'focused' ? -5 : mood === 'happy' ? 5 : mood === 'celebrating' ? 10 : 0

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {/* Shadow */}
      <Ellipse cx={50} cy={92} rx={28} ry={5} fill="rgba(0,0,0,0.08)" />

      {/* Legs */}
      <Path d="M42 80 L40 90 L37 92" stroke="#D4A056" strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M40 90 L36 91" stroke="#D4A056" strokeWidth={2} strokeLinecap="round" />
      <Path d="M58 80 L60 90 L63 92" stroke="#D4A056" strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M60 90 L64 91" stroke="#D4A056" strokeWidth={2} strokeLinecap="round" />

      {/* Body */}
      <Circle cx={50} cy={58} r={30} fill="#8B5E3C" />
      {/* Body texture stripes */}
      <Path d="M30 50 Q50 45 70 50" stroke="#7A5232" strokeWidth={1} fill="none" opacity={0.5} />
      <Path d="M28 58 Q50 53 72 58" stroke="#7A5232" strokeWidth={1} fill="none" opacity={0.5} />
      <Path d="M30 66 Q50 61 70 66" stroke="#7A5232" strokeWidth={1} fill="none" opacity={0.5} />

      {/* Belly */}
      <Ellipse cx={50} cy={62} rx={14} ry={16} fill="#A67850" opacity={0.6} />

      {/* Stubby wings */}
      <Ellipse cx={24} cy={58} rx={8} ry={12} fill="#7A5232" transform="rotate(-15, 24, 58)" />
      <Ellipse cx={76} cy={58} rx={8} ry={12} fill="#7A5232" transform="rotate(15, 76, 58)" />

      {/* Head */}
      <Circle cx={50} cy={30} r={22} fill="#8B5E3C" />

      {/* Outfit accessories */}
      {outfit === 'focus-hat' && (
        <G>
          <Rect x={34} y={6} width={32} height={4} rx={2} fill="#2D2D2D" />
          <Rect x={38} y={2} width={24} height={8} rx={3} fill="#2D2D2D" />
        </G>
      )}
      {outfit === 'cozy-scarf' && (
        <G>
          <Path d="M30 45 Q50 48 70 45" stroke="#E74C3C" strokeWidth={5} strokeLinecap="round" />
          <Path d="M30 48 Q35 52 32 60" stroke="#E74C3C" strokeWidth={5} strokeLinecap="round" />
        </G>
      )}
      {outfit === 'party-crown' && (
        <G>
          <Path d="M34 12 L38 4 L45 10 L50 2 L55 10 L62 4 L66 12 Z" fill="#FFD700" />
          <Circle cx={38} cy={5} r={2} fill="#E74C3C" />
          <Circle cx={50} cy={3} r={2} fill="#3498DB" />
          <Circle cx={62} cy={5} r={2} fill="#E74C3C" />
        </G>
      )}
      {outfit === 'explorer-vest' && (
        <G>
          <Rect x={33} y={44} width={34} height={18} rx={2} fill="#8B4513" opacity={0.8} />
          <Rect x={47} y={44} width={6} height={18} fill="#A0522D" opacity={0.6} />
        </G>
      )}

      {/* Eyes */}
      {/* Left eye */}
      <Circle cx={41} cy={27} r={7 * eyeScale} fill="white" />
      <Circle cx={41} cy={27} r={4 * eyeScale} fill="#1A1A1A" />
      <Circle cx={43} cy={25} r={1.5} fill="white" /> {/* shine */}
      {/* Right eye */}
      <Circle cx={59} cy={27} r={7 * eyeScale} fill="white" />
      <Circle cx={59} cy={27} r={4 * eyeScale} fill="#1A1A1A" />
      <Circle cx={61} cy={25} r={1.5} fill="white" /> {/* shine */}

      {/* Sleepy eyelids */}
      {mood === 'sleepy' && (
        <G>
          <Path d="M34 24 Q41 22 48 24" stroke="#8B5E3C" strokeWidth={3} strokeLinecap="round" fill="none" />
          <Path d="M52 24 Q59 22 66 24" stroke="#8B5E3C" strokeWidth={3} strokeLinecap="round" fill="none" />
        </G>
      )}

      {/* Focused brow */}
      {mood === 'focused' && (
        <G>
          <Path d="M35 21 Q41 18 47 21" stroke="#5C3D1E" strokeWidth={2.5} strokeLinecap="round" fill="none" />
          <Path d="M53 21 Q59 18 65 21" stroke="#5C3D1E" strokeWidth={2.5} strokeLinecap="round" fill="none" />
        </G>
      )}

      {/* Beak */}
      <G transform={`rotate(${beakAngle}, 50, 35)`}>
        <Path d="M50 35 Q72 30 78 35 Q72 40 50 38 Z" fill="#D4A056" />
        <Path d="M50 36 Q72 33 78 35" stroke="#B8860B" strokeWidth={0.8} fill="none" />
      </G>

      {/* Happy mouth */}
      {(mood === 'happy' || mood === 'celebrating') && (
        <Path d="M44 40 Q50 45 56 40" stroke="#5C3D1E" strokeWidth={1.5} strokeLinecap="round" fill="none" />
      )}

      {/* Celebrating sparkles */}
      {mood === 'celebrating' && (
        <G>
          <Path d="M15 20 L17 14 L19 20 L25 18 L19 22 L17 28 L15 22 L9 18 Z" fill="#FFD700" />
          <Path d="M78 10 L79 6 L80 10 L84 9 L80 11 L79 15 L78 11 L74 9 Z" fill="#7CB518" />
          <Circle cx={88} cy={40} r={3} fill="#FFD700" />
          <Circle cx={12} cy={45} r={2} fill="#7CB518" />
        </G>
      )}

      {/* Thought bubbles for focused mode */}
      {mood === 'focused' && (
        <G opacity={0.7}>
          <Circle cx={78} cy={15} r={3} fill={KIWI_PRIMARY} />
          <Circle cx={84} cy={10} r={4} fill={KIWI_PRIMARY} />
          <Circle cx={90} cy={5} r={5} fill={KIWI_PRIMARY} />
        </G>
      )}
    </Svg>
  )
}

const KIWI_PRIMARY = '#7CB518'

export function KiwiMascot({ mood: propMood, size = 100, onPress, autoAnimate = true }: KiwiMascotProps) {
  const storeMood = useKiwiStore((s) => s.mood)
  const mood = propMood ?? storeMood
  const outfit = useKiwiStore((s) => s.outfit)

  // Animation values
  const translateY = useSharedValue(0)
  const rotate = useSharedValue(0)
  const scale = useSharedValue(1)

  useEffect(() => {
    cancelAnimation(translateY)
    cancelAnimation(rotate)
    cancelAnimation(scale)

    if (!autoAnimate) return

    switch (mood) {
      case 'idle':
        // Gentle bob
        translateY.value = withRepeat(
          withTiming(-6, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
          -1,
          true
        )
        break

      case 'happy':
        // Jump
        translateY.value = withSequence(
          withSpring(-20, { damping: 6, stiffness: 200 }),
          withSpring(0, { damping: 8, stiffness: 180 }),
          withSpring(-10, { damping: 8 }),
          withSpring(0, { damping: 10 })
        )
        scale.value = withSequence(
          withTiming(1.15, { duration: 150 }),
          withTiming(0.95, { duration: 100 }),
          withTiming(1, { duration: 150 })
        )
        break

      case 'focused':
        // Subtle lean forward
        translateY.value = withTiming(-4, { duration: 400 })
        scale.value = withTiming(1.02, { duration: 400 })
        break

      case 'sleepy':
        // Slow dip
        translateY.value = withRepeat(
          withTiming(4, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
          -1,
          true
        )
        scale.value = withTiming(0.96, { duration: 500 })
        break

      case 'celebrating':
        // Spin + bounce
        rotate.value = withSequence(
          withTiming(360, { duration: 600, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 })
        )
        scale.value = withSequence(
          withSpring(1.3, { damping: 5, stiffness: 200 }),
          withSpring(1, { damping: 8 })
        )
        translateY.value = withSequence(
          withSpring(-30, { damping: 5 }),
          withSpring(0, { damping: 8 })
        )
        break
    }
  }, [mood, autoAnimate])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }))

  const content = (
    <Animated.View style={animatedStyle}>
      <KiwiBird size={size} mood={mood} outfit={outfit} />
    </Animated.View>
  )

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        {content}
      </TouchableOpacity>
    )
  }

  return content
}
