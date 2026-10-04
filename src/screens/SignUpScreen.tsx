import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

const SignUpScreen = ({ navigation }: Props) => {
  const [name, setName] = useState('Aarav Sharma');
  const [section, setSection] = useState('9-B');
  const [admissionNumber, setAdmissionNumber] = useState('VID-2026-0142');
  const [parentMobile, setParentMobile] = useState('+91 98•••• ••210');
  const [password, setPassword] = useState('school12');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [showSections, setShowSections] = useState(false);

  const canCreateAccount =
    name.trim().length > 0 &&
    section.trim().length > 0 &&
    admissionNumber.trim().length > 0 &&
    parentMobile.trim().length > 0 &&
    password.length > 0 &&
    acceptedTerms;

  const handleCreateAccount = () => {
    if (canCreateAccount) {
      navigation.replace('Home');
    }
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
          <Text style={styles.title}>Create an account</Text>
          <Text style={styles.subtitle}>
            Enter the details provided by your school
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>Student name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Class and section</Text>
            <Pressable
              style={styles.select}
              onPress={() => setShowSections(open => !open)}
              accessibilityRole="button"
              accessibilityLabel={`Class and section, ${section}`}
            >
              <Text style={styles.input}>{section}</Text>
              <Text style={styles.chevron}>▾</Text>
            </Pressable>
            {showSections && (
              <View style={styles.options}>
                {['9-A', '9-B', '9-C'].map(option => (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setSection(option);
                      setShowSections(false);
                    }}
                    style={styles.option}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Admission number</Text>
            <TextInput
              style={styles.input}
              value={admissionNumber}
              onChangeText={setAdmissionNumber}
              autoCapitalize="characters"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Parent's mobile number</Text>
            <TextInput
              style={styles.input}
              value={parentMobile}
              onChangeText={setParentMobile}
              keyboardType="phone-pad"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleCreateAccount}
            />
          </View>

          <Pressable
            style={styles.termsRow}
            onPress={() => setAcceptedTerms(accepted => !accepted)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedTerms }}
          >
            <View style={[styles.checkbox, acceptedTerms && styles.checked]}>
              {acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.termsText}>
              I agree to the Terms and Privacy Policy
            </Text>
          </Pressable>

          <Pressable
            style={[styles.primaryBtn, !canCreateAccount && styles.disabled]}
            onPress={handleCreateAccount}
            disabled={!canCreateAccount}
          >
            <Text style={styles.primaryBtnText}>Create account</Text>
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Log in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUpScreen;

const GREEN = '#1F4D45';
const DARK = '#0F1A17';

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#E8ECEB' },
  container: { paddingHorizontal: 24, paddingTop: 26, paddingBottom: 28 },
  title: { fontSize: 27, fontWeight: '800', color: DARK },
  subtitle: { fontSize: 14, color: '#5B6B67', marginTop: 3, marginBottom: 15 },
  field: {
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DDE3E1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 9,
    minHeight: 54,
    justifyContent: 'center',
  },
  label: { fontSize: 12, color: '#71807C' },
  input: {
    fontSize: 15,
    fontWeight: '600',
    color: DARK,
    padding: 0,
    marginTop: 1,
  },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chevron: { fontSize: 15, color: '#71807C', paddingHorizontal: 3 },
  options: {
    position: 'absolute',
    top: 53,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDE3E1',
    zIndex: 2,
    elevation: 4,
  },
  option: { paddingHorizontal: 14, paddingVertical: 10 },
  optionText: { color: DARK, fontSize: 15, fontWeight: '600' },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
    marginBottom: 11,
    minHeight: 30,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#8C9A96',
    marginRight: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { backgroundColor: GREEN, borderColor: GREEN },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '800', lineHeight: 14 },
  termsText: { color: '#71807C', fontSize: 12, flex: 1 },
  primaryBtn: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 14 },
  footerText: { fontSize: 14, color: '#71807C' },
  link: { fontSize: 14, fontWeight: '700', color: GREEN },
});
