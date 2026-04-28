import { useEffect, useRef, useState } from 'react'
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native'
import { FocusRing } from '../../src/components/FocusRing'
import { KiwiMascot } from '../../src/components/KiwiMascot'
import { useSessionStore } from '../../src/store/sessionStore'
import { useKiwiStore } from '../../src/store/kiwiStore'
import { COLORS } from '../../src/theme/colors'
import * as Haptics from 'expo-haptics'

type SessionType = 'DEEP_WORK' | 'QUICK_TASK' | 'BREAK'
type AmbientSound = 'none' | 'rain' | 'whitenoise' | 'forest'

const SESSION_CONFIGS: Record<SessionType, { label: string; emoji: string; duration: number; description: string }> = {
  DEEP_WORK: { label: 'Deep Work', emoji: '🧠', duration: 25 * 60, description: '25 minutes of focused work' },
  QUICK_TASK: { label: 'Quick Task', emoji: '⚡', duration: 10 * 60, description: '10-minute burst' },
  BREAK: { label: 'Break', emoji: '☕', duration: 5 * 60, description: '5-minute refresh' },
}

const AMBIENT_SOUNDS: Record<AmbientSound, { label: string; emoji: string }> = {
  none: { label: 'Silent', emoji: '🔇' },
  rain: { label: 'Rain', emoji: '🌧️' },
  whitenoise: { label: 'White Noise', emoji: '🌊' },
  forest: { label: 'Forest', emoji: '🌲' },
}

export default function FocusScreen() {
  const [sessionType, setSessionType] = useState<SessionType>('DEEP_WORK')
  const [ambientSound, setAmbientSound] = useState<AmbientSound>('none')
  const [isRunning, setIsRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { activeSession, startSession, updateElapsed, completeSession, cancelSession } = useSessionStore()
  const { setMood, fetchState } = useKiwiStore()

  const config = SESSION_CONFIGS[sessionType]
  const progress = elapsed / config.duration

  useEffect(() => {
    if (isRunning) {
      setMood('focused')
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1
          if (next % 10 === 0 && activeSession) {
            updateElapsed(next)
          }
          if (next >= config.duration) {
            handleComplete(next)
          }
          return next
        })
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (!isRunning && elapsed === 0) setMood('idle')
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning])

  const handleStart = async () => {
    await startSession(sessionType, config.duration)
    setIsRunning(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }

  const handlePause = () => {
    setIsRunning(false)
    setMood('idle')
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  const handleResume = () => {
    setIsRunning(true)
    setMood('focused')
  }

  const handleComplete = async (finalElapsed?: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRunning(false)
    setMood('celebrating')
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

    if (activeSession) {
      await updateElapsed(finalElapsed ?? elapsed)
      await completeSession()
    }

    await fetchState()
    setTimeout(() => setMood('idle'), 3000)
    setElapsed(0)
  }

  const handleCancel = () => {
    Alert.alert(
      'End session?',
      'Your progress will be saved.',
      [
        { text: 'Keep going', style: 'cancel' },
        {
          text: 'End it',
          onPress: async () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
            setIsRunning(false)
            if (activeSession && elapsed > 0) {
              await updateElapsed(elapsed)
              await completeSession()
            } else {
              cancelSession()
            }
            setElapsed(0)
            setMood('idle')
          },
        },
      ]
    )
  }

  const kiwiMood = isRunning
    ? elapsed > config.duration * 0.75
      ? 'celebrating'
      : 'focused'
    : elapsed > 0
    ? 'happy'
    : 'idle'

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.pale }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.text }}>Focus Timer</Text>
          <Text style={{ fontSize: 14, color: COLORS.muted, marginTop: 2 }}>
            One thing at a time 🌿
          </Text>
        </View>

        {/* Session type picker */}
        {!isRunning && elapsed === 0 && (
          <View style={{ flexDirection: 'row', paddingHorizontal: 20, marginTop: 16, gap: 8 }}>
            {(Object.entries(SESSION_CONFIGS) as [SessionType, typeof SESSION_CONFIGS[SessionType]][]).map(([type, cfg]) => (
              <TouchableOpacity
                key={type}
                onPress={() => setSessionType(type)}
                style={{
                  flex: 1,
                  backgroundColor: sessionType === type ? COLORS.primary : COLORS.white,
                  borderRadius: 12,
                  padding: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 22 }}>{cfg.emoji}</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: sessionType === type ? COLORS.white : COLORS.text, marginTop: 4 }}>
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Main timer area */}
        <View style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 16 }}>
          {/* Kiwi mascot */}
          <KiwiMascot mood={kiwiMood} size={100} />

          {/* Focus ring */}
          <View style={{ marginTop: 20 }}>
            <FocusRing
              progress={progress}
              elapsed={elapsed}
              total={config.duration}
              isRunning={isRunning}
              size={280}
            />
          </View>

          {/* Session label */}
          <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.muted, marginTop: 8 }}>
            {config.emoji} {config.label}
          </Text>
        </View>

        {/* Controls */}
        <View style={{ paddingHorizontal: 40, gap: 12 }}>
          {!isRunning && elapsed === 0 && (
            <TouchableOpacity
              onPress={handleStart}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 16,
                paddingVertical: 18,
                alignItems: 'center',
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>
                Start focusing ▶
              </Text>
            </TouchableOpacity>
          )}

          {isRunning && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={handlePause}
                style={{ flex: 1, backgroundColor: COLORS.light, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.dark }}>⏸ Pause</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancel}
                style={{ flex: 1, backgroundColor: COLORS.cream, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 17, fontWeight: '600', color: COLORS.muted }}>End</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isRunning && elapsed > 0 && (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={handleResume}
                style={{ flex: 2, backgroundColor: COLORS.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.white }}>▶ Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleComplete()}
                style={{ flex: 1, backgroundColor: COLORS.light, borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
              >
                <Text style={{ fontSize: 17, fontWeight: '600', color: COLORS.dark }}>Done ✓</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Ambient sound */}
        {!isRunning && elapsed === 0 && (
          <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.muted, marginBottom: 10 }}>
              AMBIENT SOUND
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(Object.entries(AMBIENT_SOUNDS) as [AmbientSound, typeof AMBIENT_SOUNDS[AmbientSound]][]).map(([sound, cfg]) => (
                <TouchableOpacity
                  key={sound}
                  onPress={() => setAmbientSound(sound)}
                  style={{
                    flex: 1,
                    backgroundColor: ambientSound === sound ? COLORS.primary + '20' : COLORS.white,
                    borderRadius: 12,
                    padding: 10,
                    alignItems: 'center',
                    borderWidth: ambientSound === sound ? 1.5 : 0,
                    borderColor: COLORS.primary,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{cfg.emoji}</Text>
                  <Text style={{ fontSize: 11, color: ambientSound === sound ? COLORS.primary : COLORS.muted, marginTop: 3, fontWeight: ambientSound === sound ? '700' : '400' }}>
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Streak banner */}
        <View style={{ marginHorizontal: 20, marginTop: 20, backgroundColor: COLORS.cream, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 28, marginRight: 10 }}>🥝</Text>
          <View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>Your focus pattern</Text>
            <Text style={{ fontSize: 13, color: COLORS.muted }}>Every session shapes your habit</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
