import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Timetable'>;
const GREEN = '#1F4D45';
const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const classes = [
  { time: '8:30', subject: 'Maths', place: 'Room 12', duration: '45m' },
  { time: '9:20', subject: 'Science', place: 'Lab 2', duration: 'Now' },
  { time: '10:10', subject: 'Hindi', place: 'Room 12', duration: '45m' },
  { time: '11:00', subject: 'Break', place: 'Canteen', duration: '20m' },
  { time: '11:20', subject: 'English', place: 'Room 12', duration: '45m' },
  { time: '12:10', subject: 'Computer', place: 'IT Lab', duration: '45m' },
  { time: '1:00', subject: 'Games', place: 'Ground', duration: '45m' },
];

const TimetableScreen = ({ navigation }: Props) => {
  const [selectedDay, setSelectedDay] = useState('Wed');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Timetable</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.days}>
          {weekdays.map(day => {
            const selected = day === selectedDay;
            return (
              <Pressable
                key={day}
                style={[styles.dayButton, selected && styles.selectedDay]}
                onPress={() => setSelectedDay(day)}
              >
                <Text
                  style={[styles.dayLabel, selected && styles.selectedDayLabel]}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.card}>
          {classes.map((item, index) => (
            <View
              key={item.time}
              style={[
                styles.classRow,
                index === classes.length - 1 && styles.lastRow,
              ]}
            >
              <Text style={styles.time}>{item.time}</Text>
              <View style={styles.classInfo}>
                <Text style={styles.subject}>{item.subject}</Text>
                <Text style={styles.place}>{item.place}</Text>
              </View>
              <View
                style={[styles.duration, item.duration === 'Now' && styles.now]}
              >
                <Text style={styles.durationText}>{item.duration}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TimetableScreen;

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
  days: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayButton: {
    minWidth: 39,
    height: 30,
    borderRadius: 12,
    paddingHorizontal: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDay: { backgroundColor: '#F5B335' },
  dayLabel: { color: '#586A66', fontSize: 11 },
  selectedDayLabel: { color: '#382800', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 13 },
  classRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E7E5',
  },
  lastRow: { borderBottomWidth: 0 },
  time: { width: 55, color: '#71807C', fontSize: 11 },
  classInfo: { flex: 1 },
  subject: { color: '#0F1A17', fontSize: 13, fontWeight: '700' },
  place: { color: '#71807C', fontSize: 11 },
  duration: {
    minWidth: 42,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 11,
    alignItems: 'center',
    backgroundColor: '#DCEBF1',
  },
  now: { backgroundColor: '#F5B335' },
  durationText: { color: '#19332E', fontSize: 10, fontWeight: '600' },
});
