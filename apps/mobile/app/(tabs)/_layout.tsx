import { Tabs } from 'expo-router'
import { View, Text } from 'react-native'
import { COLORS } from '../../src/theme/colors'

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
      <Text
        style={{
          fontSize: 10,
          fontWeight: focused ? '700' : '400',
          color: focused ? COLORS.primary : COLORS.muted,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.cream,
          borderTopColor: COLORS.light,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="focus"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="⏱️" label="Focus" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="✅" label="Tasks" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="routine"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Routine" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="kiwi"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🥝" label="Kiwi" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
