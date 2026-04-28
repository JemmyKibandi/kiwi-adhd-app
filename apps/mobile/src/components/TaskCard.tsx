import { View, Text, TouchableOpacity } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import * as Haptics from 'expo-haptics'
import { COLORS, CATEGORY_COLORS, ENERGY_COLORS } from '../theme/colors'
import type { Task } from '../lib/api'

interface TaskCardProps {
  task: Task
  onComplete: (id: string) => void
  onSnooze: (id: string) => void
  onPress: (task: Task) => void
}

const SWIPE_THRESHOLD = 80

const ENERGY_LABELS = { LOW: '🌱', MEDIUM: '⚡', HIGH: '🔥' }
const CATEGORY_LABELS = { WORK: 'Work', PERSONAL: 'Personal', HEALTH: 'Health', LEARNING: 'Learning' }

export function TaskCard({ task, onComplete, onSnooze, onPress }: TaskCardProps) {
  const translateX = useSharedValue(0)
  const opacity = useSharedValue(1)
  const cardScale = useSharedValue(1)

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        // Swipe right → complete
        translateX.value = withTiming(400, { duration: 250 }, () => {
          opacity.value = withTiming(0, { duration: 150 }, () => {
            runOnJS(onComplete)(task.id)
          })
        })
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success)
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        // Swipe left → snooze
        translateX.value = withTiming(-400, { duration: 250 }, () => {
          opacity.value = withTiming(0, { duration: 150 }, () => {
            runOnJS(onSnooze)(task.id)
          })
        })
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium)
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 200 })
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: cardScale.value }],
    opacity: opacity.value,
  }))

  const swipeHintLeft = useAnimatedStyle(() => ({
    opacity: Math.max(0, -translateX.value / SWIPE_THRESHOLD),
  }))

  const swipeHintRight = useAnimatedStyle(() => ({
    opacity: Math.max(0, translateX.value / SWIPE_THRESHOLD),
  }))

  const categoryColor = CATEGORY_COLORS[task.category]
  const energyEmoji = ENERGY_LABELS[task.energy]

  return (
    <View style={{ marginHorizontal: 16, marginVertical: 5 }}>
      {/* Swipe background hints */}
      <View style={{ position: 'absolute', inset: 0, borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}>
        <Animated.View style={[swipeHintRight, { alignItems: 'center' }]}>
          <Text style={{ fontSize: 28 }}>✅</Text>
          <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 2 }}>Done!</Text>
        </Animated.View>
        <Animated.View style={[swipeHintLeft, { alignItems: 'center' }]}>
          <Text style={{ fontSize: 28 }}>😴</Text>
          <Text style={{ fontSize: 11, color: COLORS.muted, fontWeight: '600', marginTop: 2 }}>Snooze</Text>
        </Animated.View>
      </View>

      <GestureDetector gesture={swipeGesture}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => onPress(task)}
            style={{
              backgroundColor: task.status === 'DONE' ? '#F5F5F5' : COLORS.white,
              borderRadius: 14,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: categoryColor,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 6,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              {/* Checkbox */}
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 2,
                  borderColor: task.status === 'DONE' ? COLORS.primary : COLORS.light,
                  backgroundColor: task.status === 'DONE' ? COLORS.primary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  marginTop: 1,
                }}
              >
                {task.status === 'DONE' && <Text style={{ color: 'white', fontSize: 12 }}>✓</Text>}
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: task.status === 'DONE' ? COLORS.muted : COLORS.text,
                    textDecorationLine: task.status === 'DONE' ? 'line-through' : 'none',
                  }}
                  numberOfLines={2}
                >
                  {task.title}
                </Text>

                {task.description && (
                  <Text
                    style={{ fontSize: 13, color: COLORS.muted, marginTop: 3 }}
                    numberOfLines={1}
                  >
                    {task.description}
                  </Text>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
                  {/* Category chip */}
                  <View
                    style={{
                      backgroundColor: categoryColor + '20',
                      borderRadius: 20,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Text style={{ fontSize: 11, color: categoryColor, fontWeight: '600' }}>
                      {CATEGORY_LABELS[task.category]}
                    </Text>
                  </View>

                  {/* Energy */}
                  <Text style={{ fontSize: 13 }}>{energyEmoji}</Text>

                  {/* Time estimate */}
                  {task.timeEstimate && (
                    <Text style={{ fontSize: 12, color: COLORS.muted }}>
                      ⏱ {task.timeEstimate}m
                    </Text>
                  )}

                  {/* Subtask count */}
                  {task.subtasks.length > 0 && (
                    <Text style={{ fontSize: 12, color: COLORS.muted }}>
                      📎 {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  )
}
