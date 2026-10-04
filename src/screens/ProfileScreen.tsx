import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;
const GREEN = '#1F4D45';

const ProfileScreen = ({ navigation }: Props) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.hero}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Profile</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>A</Text>
        </View>
        <Text style={styles.studentName}>Aarav Sharma</Text>
        <Text style={styles.studentClass}>Class 9-B · Roll 14</Text>

        <View style={styles.detailsCard}>
          <ProfileRow label="Admission number" value="VID-2026-0142" />
          <ProfileRow label="Class teacher" value="Mrs. Gupta" />
          <ProfileRow label="Parent mobile" value="+91 98•••• ••210" />
          <ProfileRow label="Bus route" value="R-7" last />
        </View>

        <Pressable
          style={styles.logout}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

function ProfileRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.lastRow]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default ProfileScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E8ECEB' },
  hero: {
    height: 120,
    backgroundColor: GREEN,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  back: { color: '#C7D7D3', fontSize: 13, marginBottom: 2 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 16 },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#F5B335',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -34,
  },
  avatarLetter: { color: '#382800', fontSize: 26, fontWeight: '700' },
  studentName: {
    color: '#0F1A17',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  studentClass: {
    color: '#71807C',
    fontSize: 12,
    marginTop: 1,
    marginBottom: 14,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  row: {
    minHeight: 37,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E7E5',
  },
  lastRow: { borderBottomWidth: 0 },
  rowLabel: { color: '#71807C', fontSize: 12 },
  rowValue: { color: '#0F1A17', fontSize: 12, fontWeight: '500' },
  logout: {
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EC5B53',
    borderRadius: 13,
    paddingVertical: 11,
    marginTop: 10,
  },
  logoutText: { color: '#EC5B53', fontSize: 14, fontWeight: '700' },
});
