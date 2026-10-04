import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const [identifier, setIdentifier] = useState('VID-2026-0142');
  const [password, setPassword] = useState('school12');
  const [showPassword, setShowPassword] = useState(false);

  const canSubmit = identifier.trim().length > 0 && password.length > 0;

  const handleLogin = () => {
    if (!canSubmit) return;
    // TODO: Connect this to the authentication API.
    // Replace the route so the back button does not return to Login.
    navigation.replace('Home');
  };

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logo}>
            <Text style={styles.logoText}>📖</Text>
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Log in to your school account</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Admission number or mobile</Text>
            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, styles.flex]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <Pressable onPress={() => setShowPassword(p => !p)} hitSlop={10}>
                <Text style={styles.showText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.forgot}>
            <Text style={styles.linkText}>Forgot password?</Text>
          </Pressable>

          <Pressable
            style={[styles.primaryBtn, !canSubmit && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={!canSubmit}
          >
            <Text style={styles.primaryBtnText}>Log in</Text>
          </Pressable>

          <Text style={styles.or}>or</Text>

          <Pressable style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>
              Log in with a one-time code
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New here? </Text>
            <Pressable onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.linkText}>Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const GREEN = '#1F4D45';
const DARK = '#0F1A17';

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#E8ECEB' },
  container: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 28 },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#F5B335',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { fontSize: 27, color: '#4A3500' },
  title: { fontSize: 27, fontWeight: '800', color: DARK },
  subtitle: { fontSize: 15, color: '#5B6B67', marginTop: 5, marginBottom: 16 },
  field: {
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DDE3E1',
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 11,
    minHeight: 55,
    justifyContent: 'center',
  },
  label: { fontSize: 12, color: '#71807C' },
  input: {
    fontSize: 16,
    fontWeight: '600',
    color: DARK,
    padding: 0,
    marginTop: 1,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  showText: { fontSize: 14, fontWeight: '700', color: '#5B6B67' },
  forgot: { alignSelf: 'flex-end', marginBottom: 10, marginTop: 1 },
  linkText: { fontSize: 14, fontWeight: '700', color: GREEN },
  primaryBtn: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  or: {
    textAlign: 'center',
    color: '#71807C',
    marginVertical: 8,
    fontSize: 13,
  },
  outlineBtn: {
    borderRadius: 14,
    borderWidth: 1.3,
    borderColor: GREEN,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineBtnText: { color: GREEN, fontSize: 15, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  footerText: { fontSize: 14, color: '#71807C' },
});
