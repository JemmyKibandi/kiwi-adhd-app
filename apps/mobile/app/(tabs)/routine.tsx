import { useEffect, useState, useRef } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated'
import { routinesApi, type Routine, type RoutineStep } from '../../src/lib/api'
import { Loader } from '../../src/components/Loader'
import { COLORS } from '../../src/theme/colors'
import * as Haptics from 'expo-haptics'
import * as Speech from 'expo-speech'

const ROUTINE_TYPES = ['MORNING', 'AFTERNOON', 'EVENING', 'CUSTOM'] as const
const ROUTINE_EMOJIS: Record<string, string> = {
  MORNING: '🌅',
  AFTERNOON: '☀️',
  EVENING: '🌙',
  CUSTOM: '✨',
}

const STEP_ICONS = ['🧘', '🏃', '🍎', '📖', '💧', '🛁', '☕', '🎵', '📝', '🌿']

export default function RoutineScreen() {
  const [routines, setRoutines] = useState<Routine[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null)
  const [activeStepIdx, setActiveStepIdx] = useState(0)
  const [stepElapsed, setStepElapsed] = useState(0)
  const [scaffoldMode, setScaffoldMode] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'MORNING' | 'AFTERNOON' | 'EVENING' | 'CUSTOM'>('MORNING')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stepProgress = useSharedValue(0)

  useEffect(() => {
    loadRoutines()
  }, [])

  useEffect(() => {
    if (activeRoutine && scaffoldMode) {
      const step = activeRoutine.steps[activeStepIdx]
      if (!step) return
      stepProgress.value = 0
      setStepElapsed(0)

      if (scaffoldMode) {
        Speech.speak(`Time for ${step.name}. You have ${Math.floor(step.duration / 60)} minutes.`, {
          rate: 0.9,
          pitch: 1.1,
        })
      }

      intervalRef.current = setInterval(() => {
        setStepElapsed((prev) => {
          const next = prev + 1
          stepProgress.value = withTiming(next / step.duration)
          if (next >= step.duration) {
            handleNextStep()
          }
          return next
        })
      }, 1000)

      return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }
  }, [activeStepIdx, scaffoldMode, activeRoutine])

  const stepBarStyle = useAnimatedStyle(() => ({
    width: `${stepProgress.value * 100}%` as `${number}%`,
  }))

  const loadRoutines = async () => {
    try {
      const { routines } = await routinesApi.list()
      setRoutines(routines)
    } catch (e) {
      Alert.alert('Could not load routines', (e as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartRoutine = (routine: Routine, scaffold: boolean) => {
    if (routine.steps.length === 0) {
      Alert.alert('No steps', 'Add steps to this routine first.')
      return
    }
    setActiveRoutine(routine)
    setActiveStepIdx(0)
    setStepElapsed(0)
    setScaffoldMode(scaffold)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }

  const handleNextStep = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    if (!activeRoutine) return
    const nextIdx = activeStepIdx + 1

    if (nextIdx >= activeRoutine.steps.length) {
      // Routine complete!
      if (scaffoldMode) Speech.speak('Routine complete! Great work!')
      setActiveRoutine(null)
      setActiveStepIdx(0)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('Routine complete! 🎉', 'You did it. Every step counts.')
    } else {
      setActiveStepIdx(nextIdx)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      const { routine } = await routinesApi.create({
        name: newName.trim(),
        type: newType,
        steps: DEFAULT_STEPS[newType],
      })
      setRoutines((prev) => [routine, ...prev])
      setShowCreate(false)
      setNewName('')
    } catch (e) {
      Alert.alert('Error', (e as Error).message)
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.pale }}>
      {/* Active routine scaffold */}
      {activeRoutine && (
        <View style={{ position: 'absolute', inset: 0, backgroundColor: COLORS.white, zIndex: 50 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flex: 1, padding: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.text }}>{activeRoutine.name}</Text>
                <TouchableOpacity onPress={() => { if (intervalRef.current) clearInterval(intervalRef.current); setActiveRoutine(null) }}>
                  <Text style={{ color: COLORS.muted, fontSize: 15 }}>✕ Stop</Text>
                </TouchableOpacity>
              </View>

              {/* Steps overview */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 32, maxHeight: 60 }}>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  {activeRoutine.steps.map((step, i) => (
                    <View
                      key={step.id}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: i < activeStepIdx ? COLORS.primary : i === activeStepIdx ? COLORS.light : COLORS.pale,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: i === activeStepIdx ? 2 : 0,
                        borderColor: COLORS.primary,
                      }}
                    >
                      <Text style={{ fontSize: 20 }}>{step.icon ?? '✨'}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Current step */}
              {activeRoutine.steps[activeStepIdx] && (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 80 }}>{activeRoutine.steps[activeStepIdx].icon ?? '✨'}</Text>
                  <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.text, marginTop: 16, textAlign: 'center' }}>
                    {activeRoutine.steps[activeStepIdx].name}
                  </Text>
                  <Text style={{ fontSize: 48, fontWeight: '300', color: COLORS.primary, marginTop: 12 }}>
                    {formatTime(activeRoutine.steps[activeStepIdx].duration - stepElapsed)}
                  </Text>

                  {/* Progress bar */}
                  <View style={{ width: '100%', height: 6, backgroundColor: COLORS.light, borderRadius: 3, marginTop: 20, overflow: 'hidden' }}>
                    <Animated.View style={[stepBarStyle, { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 }]} />
                  </View>

                  <Text style={{ color: COLORS.muted, marginTop: 12 }}>
                    Step {activeStepIdx + 1} of {activeRoutine.steps.length}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleNextStep}
                style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: 16,
                  paddingVertical: 18,
                  alignItems: 'center',
                  marginTop: 24,
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.white }}>
                  {activeStepIdx >= activeRoutine.steps.length - 1 ? '✓ Complete' : 'Next step →'}
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      )}

      {/* Normal routine list */}
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.text }}>Routines</Text>
            <Text style={{ fontSize: 14, color: COLORS.muted }}>Build your structure</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCreate(true)}
            style={{ backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 }}
          >
            <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 14 }}>+ New</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <Loader type="waddle" />
        ) : routines.length === 0 ? (
          <View style={{ alignItems: 'center', padding: 32 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>No routines yet</Text>
            <Text style={{ fontSize: 13, color: COLORS.muted, marginTop: 4 }}>Create your first routine</Text>
          </View>
        ) : (
          routines.map((routine) => (
            <View
              key={routine.id}
              style={{
                backgroundColor: COLORS.white,
                borderRadius: 16,
                padding: 18,
                marginBottom: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 28 }}>{ROUTINE_EMOJIS[routine.type]}</Text>
                  <View>
                    <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.text }}>{routine.name}</Text>
                    <Text style={{ fontSize: 12, color: COLORS.muted }}>{routine.steps.length} steps • {Math.round(routine.steps.reduce((s, st) => s + st.duration, 0) / 60)} min</Text>
                  </View>
                </View>
              </View>

              {/* Step preview */}
              {routine.steps.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {routine.steps.map((step) => (
                      <View key={step.id} style={{ alignItems: 'center', width: 52 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.pale, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 18 }}>{step.icon ?? '✨'}</Text>
                        </View>
                        <Text style={{ fontSize: 9, color: COLORS.muted, marginTop: 3, textAlign: 'center' }} numberOfLines={1}>{step.name}</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              )}

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => handleStartRoutine(routine, false)}
                  style={{ flex: 1, backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 14 }}>▶ Start</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleStartRoutine(routine, true)}
                  style={{ flex: 1, backgroundColor: COLORS.light, borderRadius: 10, paddingVertical: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: COLORS.dark, fontWeight: '700', fontSize: 14 }}>🔊 Guided</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Create routine modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: COLORS.pale, padding: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text }}>New routine</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <Text style={{ color: COLORS.muted, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder="Routine name..."
            placeholderTextColor={COLORS.muted}
            autoFocus
            style={{ backgroundColor: COLORS.white, borderRadius: 12, padding: 16, fontSize: 16, color: COLORS.text, marginBottom: 16 }}
          />

          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.muted, marginBottom: 8 }}>TYPE</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {ROUTINE_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setNewType(type)}
                style={{
                  backgroundColor: newType === type ? COLORS.primary : COLORS.white,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 16 }}>{ROUTINE_EMOJIS[type]}</Text>
                <Text style={{ fontSize: 14, color: newType === type ? COLORS.white : COLORS.text, fontWeight: '600' }}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleCreate}
            disabled={!newName.trim()}
            style={{
              backgroundColor: newName.trim() ? COLORS.primary : COLORS.light,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: newName.trim() ? COLORS.white : COLORS.muted }}>
              Create routine
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const DEFAULT_STEPS: Record<string, Partial<RoutineStep>[]> = {
  MORNING: [
    { name: 'Wake up & stretch', icon: '🧘', duration: 300 },
    { name: 'Drink water', icon: '💧', duration: 60 },
    { name: 'Morning pages / journal', icon: '📝', duration: 600 },
    { name: 'Get dressed', icon: '👕', duration: 300 },
    { name: 'Breakfast', icon: '🍎', duration: 600 },
  ],
  AFTERNOON: [
    { name: 'Take a break', icon: '☕', duration: 300 },
    { name: 'Quick walk', icon: '🚶', duration: 600 },
    { name: 'Review tasks', icon: '📋', duration: 300 },
  ],
  EVENING: [
    { name: 'Plan tomorrow', icon: '📅', duration: 300 },
    { name: 'Wind down', icon: '🌙', duration: 600 },
    { name: 'Read', icon: '📖', duration: 1200 },
    { name: 'Lights out', icon: '💤', duration: 60 },
  ],
  CUSTOM: [],
}
