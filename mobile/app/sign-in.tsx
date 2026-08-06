import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useAuth } from '@/contexts/auth'
import { PrimaryButton } from '@/components/ui'
import { theme } from '@/lib/theme'

export default function SignIn() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  async function submit() {
    setLoading(true); setError('')
    try { await signIn(email, password) } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível entrar.') }
    finally { setLoading(false) }
  }
  return <View style={styles.root}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.center}>
      <View style={styles.brand}><View style={styles.logo}><MaterialCommunityIcons name="gift-outline" size={32} color="#fff" /></View><Text style={styles.brandName}>Cestas & Carinho</Text><Text style={styles.brandSub}>Gestão do seu negócio</Text></View>
      <View style={styles.card}><Text style={styles.title}>Bem-vindo</Text><Text style={styles.subtitle}>Entre com sua conta administrativa</Text>
        <Text style={styles.label}>E-mail</Text><TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="admin@exemplo.com" />
        <Text style={styles.label}>Senha</Text><TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" placeholder="Sua senha" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton title="Entrar" onPress={submit} loading={loading} disabled={!email || !password} />
      </View>
      <Text style={styles.security}>Acesso protegido pelo Supabase</Text>
    </KeyboardAvoidingView>
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F7F3FF' }, center: { flex: 1, justifyContent: 'center', padding: 24 },
  brand: { alignItems: 'center', marginBottom: 28 }, logo: { width: 64, height: 64, borderRadius: 20, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  brandName: { fontSize: 25, fontWeight: '800', color: theme.colors.text }, brandSub: { color: theme.colors.muted, marginTop: 3 },
  card: { backgroundColor: '#fff', padding: 22, borderRadius: 24, borderWidth: 1, borderColor: theme.colors.border },
  title: { fontSize: 24, fontWeight: '800', color: theme.colors.text }, subtitle: { color: theme.colors.muted, marginTop: 4, marginBottom: 22 },
  label: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: 7 }, input: { height: 50, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 12, paddingHorizontal: 14, marginBottom: 16, backgroundColor: '#FAFAFA' },
  error: { color: theme.colors.danger, marginBottom: 14 }, security: { textAlign: 'center', color: theme.colors.muted, fontSize: 12, marginTop: 20 },
})
