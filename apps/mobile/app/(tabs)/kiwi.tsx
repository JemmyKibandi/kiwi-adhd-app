import { useEffect, useState } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import { KiwiMascot } from '../../src/components/KiwiMascot'
import { ProgressRing } from '../../src/components/ProgressRing'
import { Loader } from '../../src/components/Loader'
import { useKiwiStore } from '../../src/store/kiwiStore'
import { useAuthStore } from '../../src/store/authStore'
import { moodApi, kiwiApi } from '../../src/lib/api'
import { COLORS } from '../../src/theme/colors'
import * as Haptics from 'expo-haptics'

const MOOD_OPTIONS = [
  { value: 1, emoji: '😔', label: 'Tough day' },
  { value: 2, emoji: '😕', label: 'A bit low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Pretty good' },
  { value: 5, emoji: '😄', label: 'Great!' },
]

const OUTFIT_INFO: Record<string, { emoji: string; description: string }> = {
  default: { emoji: '🥝', description: 'Classic Kiwi look' },
  'focus-hat': { emoji: '🎓', description: 'For serious focus sessions' },
  'cozy-scarf': { emoji: '🧣', description: 'Cozy vibes only' },
  'party-crown': { emoji: '👑', description: 'For celebrations' },
  'explorer-vest': { emoji: '🗺️', description: 'Adventure awaits' },
}

const ENCOURAGEMENTS = [
  'Every small step is real progress 🌱',
  'You showed up today — that matters 💚',
  'Rest is productive too 🌙',
  'Your brain is doing its best 🧠',
  'Progress over perfection, always ✨',
  'You are more capable than you know 🥝',
]

export default function KiwiScreen() {
  const { xp, level, outfit, xpProgress, xpForNextLevel, unlockedOutfits, mood, setMood, fetchState, equipOutfit } = useKiwiStore()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [showOutfits, setShowOutfits] = useState(false)
  const [allOutfits, setAllOutfits] = useState<{ name: string; unlocked: boolean; equipped: boolean; unlockLevel: number }[]>([])
  const [todayMood, setTodayMood] = useState<number | null>(null)
  const [insights, setInsights] = useState<{ averageMood: number; bestHour: number; totalLogs: number } | null>(null)
  const [encouragement] = useState(() => ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)])
  const [tapCount, setTapCount] = useState(0)

  const kiwiScale = useSharedValue(1)

  useEffect(() => {
    fetchState()
    loadInsights()
    loadOutfits()
  }, [])

  const loadInsights = async () => {
    try {
      const { insights } = await moodApi.insights()
      setInsights(insights)
    } catch {}
  }

  const loadOutfits = async () => {
    try {
      const { outfits } = await kiwiApi.outfits()
      setAllOutfits(outfits)
    } catch {}
  }

  const handleKiwiTap = () => {
    const newCount = tapCount + 1
    setTapCount(newCount)
    kiwiScale.value = withSpring(1.2, { damping: 5 }, () => {
      kiwiScale.value = withSpring(1)
    })
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    if (newCount === 5) {
      setMood('celebrating')
      setTimeout(() => setMood('idle'), 2500)
      setTapCount(0)
    } else if (newCount === 3) {
      setMood('happy')
      setTimeout(() => setMood('idle'), 1500)
    }
  }

  const handleMoodLog = async (moodValue: number) => {
    try {
      await moodApi.log({ mood: moodValue })
      setTodayMood(moodValue)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      if (moodValue >= 4) {
        setMood('happy')
        setTimeout(() => setMood('idle'), 2000)
      }
    } catch (e) {
      Alert.alert('Could not save mood', (e as Error).message)
    }
  }

  const handleEquipOutfit = async (outfitName: string) => {
    try {
      await equipOutfit(outfitName)
      setShowOutfits(false)
      setMood('celebrating')
      setTimeout(() => setMood('idle'), 2000)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      loadOutfits()
    } catch (e) {
      Alert.alert('Cannot equip', (e as Error).message)
    }
  }

  const kiwiAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: kiwiScale.value }],
  }))

  const bestHourLabel = insights?.bestHour != null
    ? `${insights.bestHour}:00–${insights.bestHour + 1}:00`
    : null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.pale }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.text }}>Your Kiwi</Text>
            <TouchableOpacity
              onPress={() => Alert.alert('Sign out?', 'See you soon!', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign out', style: 'destructive', onPress: logout },
              ])}
            >
              <Text style={{ color: COLORS.muted, fontSize: 14 }}>Sign out</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 14, color: COLORS.muted }}>Hi, {user?.name ?? 'friend'} 👋</Text>
        </View>

        {/* Kiwi display */}
        <View style={{ alignItems: 'center', paddingVertical: 24, backgroundColor: COLORS.cream, marginHorizontal: 20, borderRadius: 24, marginBottom: 16 }}>
          <Animated.View style={kiwiAnimStyle}>
            <KiwiMascot mood={mood} size={150} onPress={handleKiwiTap} autoAnimate />
          </Animated.View>
          <Text style={{ fontSize: 13, color: COLORS.muted, marginTop: 8 }}>Tap Kiwi to say hi!</Text>

          {/* XP bar */}
          <View style={{ width: '80%', marginTop: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.primary }}>Level {level}</Text>
              <Text style={{ fontSize: 12, color: COLORS.muted }}>{xpProgress}/{xpForNextLevel} XP</Text>
            </View>
            <View style={{ height: 8, backgroundColor: COLORS.light, borderRadius: 4, overflow: 'hidden' }}>
              <Animated.View
                style={{
                  height: '100%',
                  width: `${(xpProgress / xpForNextLevel) * 100}%`,
                  backgroundColor: COLORS.primary,
                  borderRadius: 4,
                }}
              />
            </View>
          </View>

          {/* Outfit button */}
          <TouchableOpacity
            onPress={() => setShowOutfits(true)}
            style={{ marginTop: 14, backgroundColor: COLORS.light, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
          >
            <Text style={{ fontSize: 16 }}>{OUTFIT_INFO[outfit]?.emoji ?? '🥝'}</Text>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.dark }}>Change outfit</Text>
          </TouchableOpacity>
        </View>

        {/* Mood check-in */}
        <View style={{ marginHorizontal: 20, backgroundColor: COLORS.white, borderRadius: 20, padding: 18, marginBottom: 16 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 4 }}>How are you feeling?</Text>
          <Text style={{ fontSize: 13, color: COLORS.muted, marginBottom: 14 }}>No pressure — just check in with yourself</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {MOOD_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => handleMoodLog(opt.value)}
                style={{
                  alignItems: 'center',
                  padding: 8,
                  borderRadius: 12,
                  backgroundColor: todayMood === opt.value ? COLORS.primary + '20' : 'transparent',
                  borderWidth: todayMood === opt.value ? 1.5 : 0,
                  borderColor: COLORS.primary,
                }}
              >
                <Text style={{ fontSize: 28 }}>{opt.emoji}</Text>
                <Text style={{ fontSize: 10, color: COLORS.muted, marginTop: 3, textAlign: 'center' }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Insight cards */}
        {insights && (
          <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 10 }}>Weekly insights</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {bestHourLabel && (
                <View style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 16 }}>
                  <Text style={{ fontSize: 24 }}>⏰</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 6 }}>Best focus time</Text>
                  <Text style={{ fontSize: 15, color: COLORS.primary, fontWeight: '700', marginTop: 2 }}>{bestHourLabel}</Text>
                </View>
              )}
              <View style={{ flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 16 }}>
                <Text style={{ fontSize: 24 }}>🌡️</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text, marginTop: 6 }}>Avg. mood</Text>
                <Text style={{ fontSize: 15, color: COLORS.primary, fontWeight: '700', marginTop: 2 }}>
                  {insights.averageMood}/5
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Encouragement */}
        <View style={{ marginHorizontal: 20, backgroundColor: COLORS.primary + '15', borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Text style={{ fontSize: 32 }}>💚</Text>
          <Text style={{ flex: 1, fontSize: 15, color: COLORS.dark, fontWeight: '500', lineHeight: 22 }}>
            {encouragement}
          </Text>
        </View>
      </ScrollView>

      {/* Outfit picker modal */}
      <Modal visible={showOutfits} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: COLORS.pale, padding: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text }}>Kiwi outfits</Text>
            <TouchableOpacity onPress={() => setShowOutfits(false)}>
              <Text style={{ color: COLORS.muted, fontSize: 16 }}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {allOutfits.map((o) => (
              <TouchableOpacity
                key={o.name}
                onPress={() => o.unlocked ? handleEquipOutfit(o.name) : null}
                style={{
                  width: '46%',
                  backgroundColor: o.equipped ? COLORS.primary + '15' : COLORS.white,
                  borderRadius: 16,
                  padding: 16,
                  alignItems: 'center',
                  borderWidth: o.equipped ? 2 : 0,
                  borderColor: COLORS.primary,
                  opacity: o.unlocked ? 1 : 0.5,
                }}
              >
                <Text style={{ fontSize: 36 }}>{OUTFIT_INFO[o.name]?.emoji ?? '🥝'}</Text>
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginTop: 8 }}>{o.name.replace('-', ' ')}</Text>
                <Text style={{ fontSize: 12, color: COLORS.muted, marginTop: 2, textAlign: 'center' }}>
                  {OUTFIT_INFO[o.name]?.description ?? ''}
                </Text>
                {!o.unlocked && (
                  <View style={{ marginTop: 8, backgroundColor: COLORS.pale, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, color: COLORS.muted }}>🔒 Level {o.unlockLevel}</Text>
                  </View>
                )}
                {o.equipped && (
                  <View style={{ marginTop: 8, backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 11, color: COLORS.white, fontWeight: '700' }}>Equipped ✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
