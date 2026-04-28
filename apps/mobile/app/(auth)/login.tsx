import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Link } from 'expo-router'
import { useAuthStore } from '../../src/store/authStore'
import { KiwiMascot } from '../../src/components/KiwiMascot'
import { COLORS } from '../../src/theme/colors'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const login = useAuthStore((s) => s.login)

  const validate = () => {
    const e: typeof errors = {}
    if (!email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password)
    } catch (err) {
      Alert.alert('Hmm, that didn\'t work', (err as Error).message ?? 'Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: COLORS.pale }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mascot */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <KiwiMascot mood="idle" size={120} />
          <Text style={{ fontSize: 28, fontWeight: '700', color: COLORS.text, marginTop: 16 }}>
            Welcome back!
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.muted, marginTop: 4 }}>
            Kiwi missed you 🥝
          </Text>
        </View>

        {/* Email */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 }}>
            Email
          </Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: COLORS.text,
              borderWidth: errors.email ? 1.5 : 0,
              borderColor: COLORS.amber,
            }}
          />
          {errors.email && (
            <Text style={{ color: COLORS.amber, fontSize: 12, marginTop: 4 }}>{errors.email}</Text>
          )}
        </View>

        {/* Password */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 }}>
            Password
          </Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={COLORS.muted}
            secureTextEntry
            autoComplete="current-password"
            style={{
              backgroundColor: COLORS.white,
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 16,
              color: COLORS.text,
              borderWidth: errors.password ? 1.5 : 0,
              borderColor: COLORS.amber,
            }}
          />
          {errors.password && (
            <Text style={{ color: COLORS.amber, fontSize: 12, marginTop: 4 }}>{errors.password}</Text>
          )}
        </View>

        {/* Login button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            shadowColor: COLORS.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={{ color: COLORS.white, fontSize: 17, fontWeight: '700' }}>
              Let's go!
            </Text>
          )}
        </TouchableOpacity>

        {/* Sign up link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Text style={{ color: COLORS.muted, fontSize: 15 }}>New here? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity>
              <Text style={{ color: COLORS.primary, fontSize: 15, fontWeight: '600' }}>
                Create account
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
