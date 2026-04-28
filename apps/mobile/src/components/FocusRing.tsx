import { useEffect } from 'react'
import { View, Text } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { COLORS } from '../theme/colors'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface FocusRingProps {
  progress: number // 0–1
  size?: number
  strokeWidth?: number
  elapsed: number // seconds
  total: number // seconds
  isRunning: boolean
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function FocusRing({
  progress,
  size = 260,
  strokeWidth = 14,
  elapsed,
  total,
  isRunning,
}: FocusRingProps) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const cx = size / 2
  const cy = size / 2

  const animatedProgress = useSharedValue(progress)
  const pulseScale = useSharedValue(1)

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 800,
      easing: Easing.out(Easing.quad),
    })
  }, [progress])

  useEffect(() => {
    if (isRunning) {
      pulseScale.value = withTiming(1.02, { duration: 1000, easing: Easing.inOut(Easing.sin) })
    } else {
      pulseScale.value = withTiming(1, { duration: 300 })
    }
  }, [isRunning])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }))

  const remaining = total - elapsed
  const displayTime = remaining >= 0 ? remaining : 0

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Background track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={COLORS.light}
          strokeWidth={strokeWidth}
          fill="none"
          opacity={0.4}
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={COLORS.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90, ${cx}, ${cy})`}
        />
      </Svg>

      {/* Center content */}
      <View style={{ alignItems: 'center' }}>
        <Text
          style={{
            fontSize: 52,
            fontWeight: '700',
            color: COLORS.text,
            fontVariant: ['tabular-nums'],
            letterSpacing: -1,
          }}
        >
          {formatTime(displayTime)}
        </Text>
        <Text style={{ fontSize: 13, color: COLORS.muted, marginTop: 4, letterSpacing: 0.5 }}>
          {isRunning ? 'FOCUSING' : elapsed === 0 ? 'READY' : 'PAUSED'}
        </Text>
      </View>
    </View>
  )
}
