import { useEffect } from 'react'
import { View, Text, Dimensions } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated'
import { KiwiMascot } from './KiwiMascot'
import { COLORS } from '../theme/colors'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

type LoaderType = 'waddle' | 'thinking' | 'saving' | 'hatch'

interface LoaderProps {
  type?: LoaderType
  message?: string
}

const MESSAGES: Record<LoaderType, string> = {
  waddle: 'Loading...',
  thinking: 'Kiwi is thinking...',
  saving: 'Tucking that away...',
  hatch: 'Getting ready...',
}

function WaddleLoader({ message }: { message: string }) {
  const posX = useSharedValue(0)
  const rotate = useSharedValue(0)

  useEffect(() => {
    posX.value = withRepeat(
      withSequence(
        withTiming(SCREEN_WIDTH - 120, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    )
    rotate.value = withRepeat(
      withSequence(
        withTiming(15, { duration: 300 }),
        withTiming(-15, { duration: 300 }),
        withTiming(15, { duration: 300 }),
        withTiming(0, { duration: 300 })
      ),
      -1,
      true
    )
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: posX.value },
      { rotate: `${rotate.value}deg` },
    ],
  }))

  return (
    <View style={{ alignItems: 'flex-start', justifyContent: 'center', height: 80 }}>
      <Animated.View style={animatedStyle}>
        <KiwiMascot mood="idle" size={60} autoAnimate={false} />
      </Animated.View>
      <Text style={{ color: COLORS.muted, fontSize: 14, textAlign: 'center', width: '100%', marginTop: 8 }}>
        {message}
      </Text>
    </View>
  )
}

function ThinkingLoader({ message }: { message: string }) {
  const tilt = useSharedValue(0)
  const bubble1 = useSharedValue(0)
  const bubble2 = useSharedValue(0)
  const bubble3 = useSharedValue(0)

  useEffect(() => {
    tilt.value = withRepeat(
      withSequence(
        withTiming(12, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        withTiming(-12, { duration: 600, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    )
    bubble1.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1, true)
    bubble2.value = withRepeat(withSequence(withTiming(0.3, { duration: 400 }), withTiming(1, { duration: 400, easing: Easing.inOut(Easing.quad) })), -1, true)
    bubble3.value = withRepeat(withSequence(withTiming(0.3, { duration: 600 }), withTiming(1, { duration: 600 })), -1, true)
  }, [])

  const tiltStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${tilt.value}deg` }] }))
  const b1Style = useAnimatedStyle(() => ({ opacity: bubble1.value }))
  const b2Style = useAnimatedStyle(() => ({ opacity: bubble2.value }))
  const b3Style = useAnimatedStyle(() => ({ opacity: bubble3.value }))

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 }}>
        <Animated.View style={tiltStyle}>
          <KiwiMascot mood="focused" size={80} autoAnimate={false} />
        </Animated.View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginLeft: 8, marginBottom: 24, gap: 4 }}>
          {[b1Style, b2Style, b3Style].map((s, i) => (
            <Animated.View
              key={i}
              style={[s, {
                width: 8 + i * 3,
                height: 8 + i * 3,
                borderRadius: (8 + i * 3) / 2,
                backgroundColor: COLORS.primary,
              }]}
            />
          ))}
        </View>
      </View>
      <Text style={{ color: COLORS.muted, fontSize: 14 }}>{message}</Text>
    </View>
  )
}

function SavingLoader({ message }: { message: string }) {
  const translateY = useSharedValue(0)
  const opacity = useSharedValue(1)

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 400 }),
        withTiming(0, { duration: 600, easing: Easing.bounce })
      ),
      -1,
      false
    )
    opacity.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 400 }), withTiming(1, { duration: 600 })),
      -1,
      false
    )
  }, [])

  const leafStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }))

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ position: 'relative', width: 80, height: 80, alignItems: 'center', justifyContent: 'center' }}>
        <KiwiMascot mood="happy" size={70} autoAnimate={false} />
        <Animated.Text style={[leafStyle, { position: 'absolute', top: -10, right: 0, fontSize: 20 }]}>
          🍃
        </Animated.Text>
      </View>
      <Text style={{ color: COLORS.muted, fontSize: 14, marginTop: 8 }}>{message}</Text>
    </View>
  )
}

function HatchLoader({ message }: { message: string }) {
  const shake = useSharedValue(0)
  const crack = useSharedValue(0)

  useEffect(() => {
    shake.value = withRepeat(
      withSequence(
        withTiming(8, { duration: 150 }),
        withTiming(-8, { duration: 150 }),
        withTiming(4, { duration: 100 }),
        withTiming(0, { duration: 100 }),
        withTiming(0, { duration: 800 }) // pause
      ),
      -1,
      false
    )
    crack.value = withRepeat(
      withSequence(withTiming(0, { duration: 1200 }), withTiming(1, { duration: 100 }), withTiming(0, { duration: 200 })),
      -1,
      false
    )
  }, [])

  const eggStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${shake.value}deg` }] }))

  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.Text style={[eggStyle, { fontSize: 64, marginBottom: 8 }]}>🥚</Animated.Text>
      <Text style={{ color: COLORS.muted, fontSize: 14 }}>{message}</Text>
    </View>
  )
}

export function Loader({ type = 'waddle', message }: LoaderProps) {
  const msg = message ?? MESSAGES[type]

  return (
    <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
      {type === 'waddle' && <WaddleLoader message={msg} />}
      {type === 'thinking' && <ThinkingLoader message={msg} />}
      {type === 'saving' && <SavingLoader message={msg} />}
      {type === 'hatch' && <HatchLoader message={msg} />}
    </View>
  )
}
