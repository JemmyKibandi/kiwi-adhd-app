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

export default function SignupScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const signup = useAuthStore((s) => s.signup)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'What should Kiwi call you?'
    if (!email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    else if (password.length < 8) e.password = 'At least 8 characters'
    if (password !== confirm) e.confirm = 'Passwords don\'t match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSignup = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await signup(email.trim().toLowerCase(), password, name.trim())
    } catch (err) {
      Alert.alert('Oops!', (err as Error).message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const field = (
    label: string,
    key: string,
    value: string,
    onChange: (v: string) => void,
    props: object = {}
  ) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholderTextColor={COLORS.muted}
        style={{
          backgroundColor: COLORS.white,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 16,
          color: COLORS.text,
          borderWidth: errors[key] ? 1.5 : 0,
          borderColor: COLORS.amber,
        }}
        {...props}
      />
      {errors[key] && (
        <Text style={{ color: COLORS.amber, fontSize: 12, marginTop: 4 }}>{errors[key]}</Text>
      )}
    </View>
  )

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: COLORS.pale }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 28 }}>
          <KiwiMascot mood="happy" size={100} />
          <Text style={{ fontSize: 26, fontWeight: '700', color: COLORS.text, marginTop: 14 }}>
            Meet your Kiwi!
          </Text>
          <Text style={{ fontSize: 15, color: COLORS.muted, marginTop: 4, textAlign: 'center' }}>
            No judgement, just support 💚
          </Text>
        </View>

        {field('Your name', 'name', name, setName, { placeholder: 'Alex', autoCapitalize: 'words' })}
        {field('Email', 'email', email, setEmail, {
          placeholder: 'you@example.com',
          autoCapitalize: 'none',
          keyboardType: 'email-address',
        })}
        {field('Password', 'password', password, setPassword, {
          placeholder: '8+ characters',
          secureTextEntry: true,
        })}
        {field('Confirm password', 'confirm', confirm, setConfirm, {
          placeholder: '••••••••',
          secureTextEntry: true,
        })}

        <TouchableOpacity
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.85}
          style={{
            backgroundColor: COLORS.primary,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: 'center',
            marginTop: 8,
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
              Start my journey 🥝
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
          <Text style={{ color: COLORS.muted, fontSize: 15 }}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={{ color: COLORS.primary, fontSize: 15, fontWeight: '600' }}>Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
