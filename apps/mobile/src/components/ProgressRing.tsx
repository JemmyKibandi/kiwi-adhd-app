import { useEffect } from 'react'
import { View, Text } from 'react-native'
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { COLORS } from '../theme/colors'

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

interface ProgressRingProps {
  progress: number // 0–1
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  color?: string
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  color = COLORS.primary,
}: ProgressRingProps) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const cx = size / 2
  const cy = size / 2

  const animatedProgress = useSharedValue(0)

  useEffect(() => {
    animatedProgress.value = withTiming(Math.min(1, Math.max(0, progress)), {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    })
  }, [progress])

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }))

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={cx} cy={cy} r={radius}
          stroke={color + '25'}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={cx} cy={cy} r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90, ${cx}, ${cy})`}
        />
      </Svg>
      {label && (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text }}>{label}</Text>
          {sublabel && <Text style={{ fontSize: 11, color: COLORS.muted }}>{sublabel}</Text>}
        </View>
      )}
    </View>
  )
}
