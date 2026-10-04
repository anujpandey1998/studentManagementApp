import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Notices'>;
const GREEN = '#1F4D45';

const notices = [
  {
    category: 'Event',
    title: 'Parent-Teacher Meeting',
    detail: 'Saturday, October 10 · 10:00 AM',
    tone: 'yellow',
  },
  {
    category: 'Exam',
    title: 'Unit Test 3 Schedule',
    detail: 'Starts October 14 · syllabus attached',
    tone: 'red',
  },
  {
    category: 'Holiday',
    title: 'Dussehra Holiday',
    detail: 'School will be closed on October 20',
    tone: 'blue',
  },
  {
    category: 'Fees',
    title: 'Term 2 Fee Reminder',
    detail: 'Please pay by October 10',
    tone: 'blue',
  },
  {
    category: 'Event',
    title: 'Annual Sports Day',
    detail: 'Registration opens October 5',
    tone: 'yellow',
  },
];

const NoticesScreen = ({ navigation }: Props) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Notices</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {notices.map((notice, index) => (
            <View
              key={notice.title}
              style={[
                styles.notice,
                index === notices.length - 1 && styles.lastNotice,
              ]}
            >
              <View
                style={[
                  styles.category,
                  notice.tone === 'red' && styles.redCategory,
                  notice.tone === 'blue' && styles.blueCategory,
                ]}
              >
                <Text style={styles.categoryText}>{notice.category}</Text>
              </View>
              <Text style={styles.noticeTitle}>{notice.title}</Text>
              <Text style={styles.noticeDetail}>{notice.detail}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default NoticesScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E8ECEB' },
  header: {
    height: 96,
    backgroundColor: GREEN,
    paddingHorizontal: 18,
    paddingTop: 14,
  },
  back: { color: '#C7D7D3', fontSize: 13, marginBottom: 2 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  notice: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E7E5',
  },
  lastNotice: { borderBottomWidth: 0 },
  category: {
    alignSelf: 'flex-start',
    backgroundColor: '#F5B335',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginBottom: 3,
  },
  redCategory: { backgroundColor: '#EC5B53' },
  blueCategory: { backgroundColor: '#DCEBF1' },
  categoryText: { color: '#17322E', fontSize: 10, fontWeight: '700' },
  noticeTitle: { color: '#0F1A17', fontSize: 13, fontWeight: '700' },
  noticeDetail: { color: '#71807C', fontSize: 11, marginTop: 2 },
});
