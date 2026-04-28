import { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuthStore } from '../../src/store/authStore'
import { useTaskStore } from '../../src/store/taskStore'
import { useSessionStore } from '../../src/store/sessionStore'
import { useKiwiStore } from '../../src/store/kiwiStore'
import { KiwiMascot } from '../../src/components/KiwiMascot'
import { ProgressRing } from '../../src/components/ProgressRing'
import { TaskCard } from '../../src/components/TaskCard'
import { Loader } from '../../src/components/Loader'
import { COLORS, CATEGORY_COLORS } from '../../src/theme/colors'

function timeOfDayGreeting(): { greeting: string; message: string } {
  const hour = new Date().getHours()
  if (hour < 6) return { greeting: 'Up late?', message: 'Rest matters too 🌙' }
  if (hour < 12) return { greeting: 'Good morning', message: 'Let\'s ease into the day ☀️' }
  if (hour < 17) return { greeting: 'Afternoon focus', message: 'You\'re doing great 💪' }
  if (hour < 21) return { greeting: 'Evening wind-down', message: 'Time to wrap up gently 🌅' }
  return { greeting: 'Good night', message: 'Reflect on today\'s wins 🌙' }
}

export default function HomeScreen() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const { tasks, fetchTasks, completeTask, snoozeTask, isLoading } = useTaskStore()
  const stats = useSessionStore((s) => s.stats)
  const fetchStats = useSessionStore((s) => s.fetchStats)
  const { mood, setMood, fetchState } = useKiwiStore()
  const [refreshing, setRefreshing] = useState(false)

  const todayStr = new Date().toISOString().split('T')[0]
  const { greeting, message } = timeOfDayGreeting()

  useEffect(() => {
    fetchTasks({ date: todayStr })
    fetchStats()
    fetchState()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchTasks({ date: todayStr }), fetchStats(), fetchState()])
    setRefreshing(false)
  }

  const todayTasks = tasks.filter((t) => t.status !== 'DONE')
  const doneTasks = tasks.filter((t) => t.status === 'DONE')
  const progress = tasks.length > 0 ? doneTasks.length / tasks.length : 0

  const handleComplete = async (id: string) => {
    await completeTask(id)
    setMood('happy')
    setTimeout(() => setMood('idle'), 2500)
  }

  const nowTask = todayTasks.find((t) => t.status === 'IN_PROGRESS') ?? todayTasks[0]

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.pale }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text }}>
                {greeting}, {user?.name?.split(' ')[0] ?? 'friend'}!
              </Text>
              <Text style={{ fontSize: 14, color: COLORS.muted, marginTop: 2 }}>{message}</Text>
            </View>
            <KiwiMascot mood={mood} size={72} onPress={() => router.push('/(tabs)/kiwi')} />
          </View>
        </View>

        {/* Progress card */}
        <View
          style={{
            marginHorizontal: 20,
            marginVertical: 12,
            backgroundColor: COLORS.white,
            borderRadius: 20,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <ProgressRing
            progress={progress}
            size={90}
            strokeWidth={9}
            label={`${doneTasks.length}/${tasks.length}`}
            sublabel="tasks"
          />
          <View style={{ flex: 1, marginLeft: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text }}>
              Today's progress
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.muted, marginTop: 4 }}>
              {doneTasks.length === 0
                ? 'Every small step counts 🌱'
                : doneTasks.length === tasks.length
                ? 'All done! Amazing work! 🎉'
                : `${tasks.length - doneTasks.length} tasks to go`}
            </Text>
            {stats && (
              <View style={{ flexDirection: 'row', marginTop: 10, gap: 12 }}>
                <View style={{ backgroundColor: COLORS.pale, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ fontSize: 11, color: COLORS.muted }}>Focus sessions</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primary }}>{stats.todaySessions}</Text>
                </View>
                <View style={{ backgroundColor: COLORS.pale, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ fontSize: 11, color: COLORS.muted }}>Focus time</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.primary }}>{stats.totalFocusMinutes}m</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Now task */}
        {nowTask && (
          <View style={{ marginHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.muted, marginBottom: 8, letterSpacing: 0.5 }}>
              NOW
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/focus')}
              activeOpacity={0.9}
              style={{
                backgroundColor: COLORS.primary,
                borderRadius: 16,
                padding: 18,
                shadowColor: COLORS.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600' }}>
                      {nowTask.category}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: COLORS.white }}>{nowTask.title}</Text>
                  {nowTask.timeEstimate && (
                    <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
                      ⏱ ~{nowTask.timeEstimate} min
                    </Text>
                  )}
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 30, padding: 12, marginLeft: 12 }}>
                  <Text style={{ fontSize: 22 }}>▶️</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Today's task list */}
        <View style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.muted, letterSpacing: 0.5 }}>
              TODAY
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
              <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '600' }}>See all →</Text>
            </TouchableOpacity>
          </View>

          {isLoading && !refreshing ? (
            <Loader type="waddle" message="Loading your tasks..." />
          ) : todayTasks.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>🌿</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>Nothing scheduled yet</Text>
              <Text style={{ fontSize: 13, color: COLORS.muted, marginTop: 4 }}>Tap + to add something</Text>
            </View>
          ) : (
            todayTasks.slice(0, 5).map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={handleComplete}
                onSnooze={snoozeTask}
                onPress={() => router.push('/(tabs)/tasks')}
              />
            ))
          )}
        </View>

        {/* Quick add */}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/tasks')}
        style={{
          position: 'absolute',
          bottom: 90,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: COLORS.primary,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: COLORS.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Text style={{ fontSize: 28, color: COLORS.white, lineHeight: 32 }}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}
