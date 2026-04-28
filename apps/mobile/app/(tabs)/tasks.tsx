import { useEffect, useState } from 'react'
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useTaskStore } from '../../src/store/taskStore'
import { useKiwiStore } from '../../src/store/kiwiStore'
import { TaskCard } from '../../src/components/TaskCard'
import { Loader } from '../../src/components/Loader'
import { COLORS, CATEGORY_COLORS } from '../../src/theme/colors'
import type { Task } from '../../src/lib/api'
import * as Haptics from 'expo-haptics'

type KanbanStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
type Category = 'WORK' | 'PERSONAL' | 'HEALTH' | 'LEARNING'
type Energy = 'LOW' | 'MEDIUM' | 'HIGH'

const STATUS_LABELS: Record<KanbanStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
}

const CATEGORY_EMOJIS: Record<Category, string> = {
  WORK: '💼',
  PERSONAL: '💜',
  HEALTH: '💚',
  LEARNING: '📚',
}

const ENERGY_LABELS: Record<Energy, string> = { LOW: '🌱 Low', MEDIUM: '⚡ Medium', HIGH: '🔥 High' }

export default function TasksScreen() {
  const { tasks, fetchTasks, createTask, updateTask, deleteTask, completeTask, snoozeTask, isLoading } = useTaskStore()
  const { setMood } = useKiwiStore()
  const [activeTab, setActiveTab] = useState<KanbanStatus>('TODO')
  const [showAdd, setShowAdd] = useState(false)

  // New task form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('PERSONAL')
  const [energy, setEnergy] = useState<Energy>('MEDIUM')
  const [timeEstimate, setTimeEstimate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchTasks()
  }, [])

  const filtered = tasks.filter((t) => {
    if (activeTab === 'DONE') return t.status === 'DONE'
    return t.status === activeTab || (activeTab === 'TODO' && t.status === 'SNOOZED')
  })

  const handleAdd = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        energy,
        timeEstimate: timeEstimate ? parseInt(timeEstimate) : undefined,
      })
      setShowAdd(false)
      resetForm()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (e) {
      Alert.alert('Oops', (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setCategory('PERSONAL')
    setEnergy('MEDIUM')
    setTimeEstimate('')
  }

  const handleComplete = async (id: string) => {
    await completeTask(id)
    setMood('happy')
    setTimeout(() => setMood('idle'), 2500)
  }

  const handleDelete = (task: Task) => {
    Alert.alert('Remove task?', `"${task.title}" will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteTask(task.id) },
    ])
  }

  const tabCounts = {
    TODO: tasks.filter((t) => t.status === 'TODO' || t.status === 'SNOOZED').length,
    IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    DONE: tasks.filter((t) => t.status === 'DONE').length,
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.pale }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: COLORS.text }}>Tasks</Text>
        <Text style={{ fontSize: 14, color: COLORS.muted }}>
          {tasks.length === 0 ? 'Nothing yet — add your first task!' : `${tasks.filter(t => t.status !== 'DONE').length} active tasks`}
        </Text>
      </View>

      {/* Kanban tabs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 12 }}>
        {(Object.entries(STATUS_LABELS) as [KanbanStatus, string][]).map(([status, label]) => (
          <TouchableOpacity
            key={status}
            onPress={() => setActiveTab(status)}
            style={{
              flex: 1,
              backgroundColor: activeTab === status ? COLORS.primary : COLORS.white,
              borderRadius: 10,
              paddingVertical: 10,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: activeTab === status ? COLORS.white : COLORS.muted }}>
              {label}
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: activeTab === status ? COLORS.white : COLORS.text, marginTop: 2 }}>
              {tabCounts[status]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task list */}
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {isLoading ? (
          <Loader type="waddle" message="Loading tasks..." />
        ) : filtered.length === 0 ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>
              {activeTab === 'TODO' ? '🌱' : activeTab === 'IN_PROGRESS' ? '⚡' : '🎉'}
            </Text>
            <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text, textAlign: 'center' }}>
              {activeTab === 'TODO'
                ? 'Nothing here yet'
                : activeTab === 'IN_PROGRESS'
                ? 'Nothing in progress'
                : 'No completed tasks yet'}
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.muted, marginTop: 4, textAlign: 'center' }}>
              {activeTab === 'DONE' ? 'Complete a task to see it here' : 'Tap + to add something'}
            </Text>
          </View>
        ) : (
          filtered.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={handleComplete}
              onSnooze={snoozeTask}
              onPress={() => handleDelete(task)}
            />
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => setShowAdd(true)}
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

      {/* Add task modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: COLORS.pale }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: COLORS.light }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: COLORS.text }}>New task</Text>
              <TouchableOpacity onPress={() => { setShowAdd(false); resetForm() }}>
                <Text style={{ fontSize: 16, color: COLORS.muted }}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
              {/* Title */}
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What needs to happen?"
                placeholderTextColor={COLORS.muted}
                autoFocus
                style={{ backgroundColor: COLORS.white, borderRadius: 12, padding: 16, fontSize: 16, color: COLORS.text }}
              />

              {/* Description */}
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Any details? (optional)"
                placeholderTextColor={COLORS.muted}
                multiline
                numberOfLines={3}
                style={{ backgroundColor: COLORS.white, borderRadius: 12, padding: 16, fontSize: 15, color: COLORS.text, textAlignVertical: 'top', minHeight: 80 }}
              />

              {/* Category */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.muted, marginBottom: 8 }}>CATEGORY</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {(Object.entries(CATEGORY_EMOJIS) as [Category, string][]).map(([cat, emoji]) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: category === cat ? CATEGORY_COLORS[cat] + '20' : COLORS.white,
                        borderRadius: 20,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderWidth: category === cat ? 1.5 : 0,
                        borderColor: CATEGORY_COLORS[cat],
                        gap: 6,
                      }}
                    >
                      <Text style={{ fontSize: 15 }}>{emoji}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: category === cat ? CATEGORY_COLORS[cat] : COLORS.text }}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Energy */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.muted, marginBottom: 8 }}>ENERGY NEEDED</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {(Object.entries(ENERGY_LABELS) as [Energy, string][]).map(([e, label]) => (
                    <TouchableOpacity
                      key={e}
                      onPress={() => setEnergy(e)}
                      style={{
                        flex: 1,
                        backgroundColor: energy === e ? COLORS.primary + '15' : COLORS.white,
                        borderRadius: 10,
                        padding: 10,
                        alignItems: 'center',
                        borderWidth: energy === e ? 1.5 : 0,
                        borderColor: COLORS.primary,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: energy === e ? COLORS.primary : COLORS.text, fontWeight: energy === e ? '700' : '400' }}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Time estimate */}
              <View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.muted, marginBottom: 8 }}>TIME ESTIMATE (minutes)</Text>
                <TextInput
                  value={timeEstimate}
                  onChangeText={setTimeEstimate}
                  placeholder="e.g. 30"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="number-pad"
                  style={{ backgroundColor: COLORS.white, borderRadius: 12, padding: 16, fontSize: 16, color: COLORS.text }}
                />
              </View>

              <TouchableOpacity
                onPress={handleAdd}
                disabled={!title.trim() || saving}
                style={{
                  backgroundColor: title.trim() ? COLORS.primary : COLORS.light,
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginTop: 8,
                }}
              >
                <Text style={{ fontSize: 17, fontWeight: '700', color: title.trim() ? COLORS.white : COLORS.muted }}>
                  {saving ? 'Saving...' : 'Add task'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}
