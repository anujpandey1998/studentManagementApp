import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
type TabName = 'Home' | 'Attendance' | 'Marks' | 'Fees';

const tabs: { name: TabName; icon: string }[] = [
  { name: 'Home', icon: '⌂' },
  { name: 'Attendance', icon: '▦' },
  { name: 'Marks', icon: '▤' },
  { name: 'Fees', icon: '₹' },
];

const HomeScreen = ({ navigation }: Props) => {
  const [activeTab, setActiveTab] = useState<TabName>('Home');

  const header = {
    Home: {
      eyebrow: 'Good morning',
      title: 'Aarav Sharma',
      detail: 'Class 9-B · Roll 14',
    },
    Attendance: {
      eyebrow: new Date().toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
      title: 'Attendance',
      detail: '',
    },
    Marks: { eyebrow: 'Unit Test 2', title: 'Marks', detail: '' },
    Fees: { eyebrow: 'Term 2', title: 'Fees', detail: '' },
  }[activeTab];

  return (
    <SafeAreaView style={styles.safeArea}>
      <Pressable
        style={styles.hero}
        onPress={() => {
          if (activeTab === 'Home') navigation.navigate('Profile');
        }}
        disabled={activeTab !== 'Home'}
        accessibilityRole={activeTab === 'Home' ? 'button' : undefined}
      >
        <Text style={styles.eyebrow}>{header.eyebrow}</Text>
        <Text style={styles.heroTitle}>{header.title}</Text>
        {!!header.detail && (
          <Text style={styles.heroDetail}>{header.detail}</Text>
        )}
      </Pressable>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Home' && (
          <Dashboard
            onOpenTimetable={() => navigation.navigate('Timetable')}
            onOpenNotices={() => navigation.navigate('Notices')}
          />
        )}
        {activeTab === 'Attendance' && <Attendance />}
        {activeTab === 'Marks' && (
          <Marks onViewStudents={() => navigation.navigate('StudentList')} />
        )}
        {activeTab === 'Fees' && <Fees />}
      </ScrollView>

      <View style={styles.tabBar}>
        {tabs.map(tab => {
          const selected = tab.name === activeTab;
          return (
            <Pressable
              key={tab.name}
              style={styles.tab}
              onPress={() => setActiveTab(tab.name)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <View
                style={[styles.tabIcon, selected && styles.selectedTabIcon]}
              >
                <Text
                  style={[styles.tabGlyph, selected && styles.selectedGlyph]}
                >
                  {tab.icon}
                </Text>
              </View>
              <Text style={[styles.tabLabel, selected && styles.selectedLabel]}>
                {tab.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

function Dashboard({
  onOpenTimetable,
  onOpenNotices,
}: {
  onOpenTimetable: () => void;
  onOpenNotices: () => void;
}) {
  return (
    <>
      <View style={styles.attendanceSummary}>
        <View style={styles.ring}>
          <View style={styles.ringCutout} />
        </View>
        <View style={styles.summaryText}>
          <Text style={styles.percentage}>92%</Text>
          <Text style={styles.muted}>Attendance this term</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today's classes</Text>
        <ClassRow
          time="8:30"
          subject="Maths"
          detail="Room 12 · Mrs. Gupta"
          status="Done"
        />
        <ClassRow
          time="9:20"
          subject="Science"
          detail="Lab 2 · Mr. Verma"
          status="Now"
        />
        <ClassRow
          time="10:10"
          subject="Hindi"
          detail="Room 12 · Mrs. Singh"
          status="Next"
          last
        />
      </View>

      <Pressable style={styles.studentLink} onPress={onOpenTimetable}>
        <Text style={styles.studentLinkText}>View timetable</Text>
      </Pressable>

      <Pressable style={styles.notice} onPress={onOpenNotices}>
        <Text style={styles.noticeTag}>PTM</Text>
        <Text style={styles.noticeText}>
          Parent-teacher meeting on Saturday at 10:00 AM. Parents are invited.
        </Text>
      </Pressable>
    </>
  );
}

function ClassRow({
  time,
  subject,
  detail,
  status,
  last = false,
}: {
  time: string;
  subject: string;
  detail: string;
  status: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.classRow, last && styles.lastClassRow]}>
      <Text style={styles.classTime}>{time}</Text>
      <View style={styles.classInfo}>
        <Text style={styles.classSubject}>{subject}</Text>
        <Text style={styles.classDetail}>{detail}</Text>
      </View>
      <View style={[styles.statusPill, status === 'Now' && styles.nowPill]}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </View>
  );
}

function Attendance() {
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(
    new Date().getDate(),
  );
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingDays = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === monthIndex;
  const absentDays = [9, 18];
  const calendarCells: (number | null)[] = [
    ...Array.from({ length: leadingDays }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const moveMonth = (amount: number) => {
    setMonth(
      current =>
        new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
    setSelectedDay(null);
  };
  const monthName = month.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const selectedIsWeekend = selectedDay
    ? [0, 6].includes(new Date(year, monthIndex, selectedDay).getDay())
    : false;
  const selectedDateLabel = selectedDay
    ? new Date(year, monthIndex, selectedDay).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <>
      <View style={styles.calendarCard}>
        <View style={styles.monthHeader}>
          <Pressable onPress={() => moveMonth(-1)} style={styles.monthArrow}>
            <Text style={styles.monthArrowText}>‹</Text>
          </Pressable>
          <Text style={styles.monthTitle}>{monthName}</Text>
          <Pressable onPress={() => moveMonth(1)} style={styles.monthArrow}>
            <Text style={styles.monthArrowText}>›</Text>
          </Pressable>
        </View>
        <View style={styles.calendarGrid}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
            <Text key={`${day}-${index}`} style={styles.weekday}>
              {day}
            </Text>
          ))}
          {calendarCells.map((day, index) => {
            if (day === null) {
              return (
                <View key={`blank-${index}`} style={styles.emptyDayCell} />
              );
            }
            const date = new Date(year, monthIndex, day);
            const weekend = [0, 6].includes(date.getDay());
            const absent = isCurrentMonth && absentDays.includes(day);
            const isToday =
              isCurrentMonth && date.getDate() === today.getDate();
            const selected = day === selectedDay;
            return (
              <Pressable
                key={day}
                onPress={() => setSelectedDay(day)}
                style={[
                  styles.dayCell,
                  absent && styles.absentDay,
                  weekend && styles.offDay,
                  isToday && styles.todayCell,
                  selected && styles.selectedDate,
                ]}
              >
                <Text style={[styles.dayText, absent && styles.absentDayText]}>
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.selectedDateStatus}>
          {selectedDateLabel
            ? `${selectedDateLabel}${selectedIsWeekend ? ' · Weekend' : ''}`
            : 'Select a date'}
        </Text>
        <View style={styles.legend}>
          <View style={styles.offLegendMark} />
          <Text style={styles.legendText}>Weekend</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>This month</Text>
        <View style={styles.monthStats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>18</Text>
            <Text style={styles.muted}>Present</Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statNumber, styles.absentNumber]}>2</Text>
            <Text style={styles.muted}>Absent</Text>
          </View>
        </View>
        <Pressable
          style={styles.actionButton}
          onPress={() =>
            Alert.alert(
              'Leave application',
              'Please contact your school office to apply for leave.',
            )
          }
        >
          <Text style={styles.actionButtonText}>Apply for leave</Text>
        </Pressable>
      </View>
    </>
  );
}

function Marks({ onViewStudents }: { onViewStudents: () => void }) {
  const subjects = [
    { name: 'Maths', marks: 46, color: '#2D7165' },
    { name: 'Science', marks: 43, color: '#2D7165' },
    { name: 'English', marks: 39, color: '#2D7165' },
    { name: 'Hindi', marks: 40, color: '#2D7165' },
    { name: 'Social Studies', marks: 29, color: '#EC5B53' },
  ];

  return (
    <>
      <View style={styles.overallCard}>
        <Text style={styles.overallPercent}>84%</Text>
        <Text style={styles.muted}>Overall · Rank 6 of 42</Text>
      </View>

      <View style={styles.card}>
        {subjects.map(subject => (
          <View key={subject.name} style={styles.subject}>
            <View style={styles.subjectHeading}>
              <Text style={styles.subjectName}>{subject.name}</Text>
              <Text style={styles.subjectScore}>{subject.marks}/50</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(subject.marks / 50) * 100}%`,
                    backgroundColor: subject.color,
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      <Pressable style={styles.studentLink} onPress={onViewStudents}>
        <Text style={styles.studentLinkText}>View students</Text>
      </Pressable>
      <View style={styles.notice}>
        <Text style={styles.marksNotice}>
          Focus on Social Studies. The next test is on October 14.
        </Text>
      </View>
    </>
  );
}

function Fees() {
  return (
    <>
      <View style={styles.feeHero}>
        <Text style={styles.feeDue}>Due by October 10</Text>
        <Text style={styles.feeAmount}>₹ 12,500</Text>
        <Pressable
          style={styles.payButton}
          onPress={() =>
            Alert.alert('Payment', 'Online payments are not set up yet.')
          }
        >
          <Text style={styles.payButtonText}>Pay now</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payment history</Text>
        <PaymentRow
          title="Term 1 tuition"
          date="April 12, 2026"
          amount="₹ 12,500 Paid"
        />
        <PaymentRow
          title="Transport"
          date="April 12, 2026"
          amount="₹ 3,200 Paid"
        />
        <PaymentRow
          title="Annual charges"
          date="April 2, 2026"
          amount="₹ 4,000 Paid"
          last
        />
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Pay by UPI, card, or online banking. Download your receipt from the
          app.
        </Text>
      </View>
    </>
  );
}

function PaymentRow({
  title,
  date,
  amount,
  last = false,
}: {
  title: string;
  date: string;
  amount: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.paymentRow, last && styles.lastPaymentRow]}>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentTitle}>{title}</Text>
        <Text style={styles.paymentDate}>{date}</Text>
      </View>
      <Text style={styles.paymentAmount}>{amount}</Text>
    </View>
  );
}

export default HomeScreen;

const GREEN = '#1F4D45';
const DARK = '#0F1A17';
const MUTED = '#73817D';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E8ECEB' },
  hero: {
    height: 160,
    backgroundColor: GREEN,
    paddingTop: 21,
    paddingHorizontal: 20,
  },
  eyebrow: { color: '#C7D7D3', fontSize: 12, fontWeight: '500' },
  heroTitle: { color: '#fff', fontSize: 23, fontWeight: '800', marginTop: 3 },
  heroDetail: { color: '#C7D7D3', fontSize: 12, marginTop: 3 },
  scroll: { flex: 1, marginTop: -45 },
  content: { paddingHorizontal: 16, paddingBottom: 16 },
  attendanceSummary: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E6E4',
    minHeight: 92,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ring: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 8,
    borderColor: '#2D7165',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  ringCutout: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
  },
  summaryText: { flex: 1 },
  percentage: { color: DARK, fontSize: 26, fontWeight: '800', lineHeight: 30 },
  muted: { color: MUTED, fontSize: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 17,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 10,
  },
  cardTitle: { color: DARK, fontSize: 14, fontWeight: '700', marginBottom: 6 },
  classRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E7E5',
  },
  lastClassRow: { borderBottomWidth: 0 },
  classTime: { color: MUTED, fontSize: 11, width: 52 },
  classInfo: { flex: 1 },
  classSubject: { color: DARK, fontSize: 13, fontWeight: '700' },
  classDetail: { color: MUTED, fontSize: 11 },
  statusPill: {
    minWidth: 41,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#DCEBF1',
    alignItems: 'center',
  },
  nowPill: { backgroundColor: '#F5B335' },
  statusText: { color: DARK, fontSize: 10, fontWeight: '600' },
  notice: {
    backgroundColor: '#F5B335',
    minHeight: 58,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeTag: {
    color: '#382800',
    fontSize: 12,
    fontWeight: '800',
    marginRight: 13,
  },
  noticeText: { color: '#382800', fontSize: 12, flex: 1, lineHeight: 17 },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 17,
    paddingHorizontal: 11,
    paddingTop: 11,
    paddingBottom: 10,
    marginBottom: 10,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthTitle: { color: DARK, fontSize: 14, fontWeight: '700' },
  monthArrow: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8ECEB',
  },
  monthArrowText: { color: GREEN, fontSize: 20, lineHeight: 23 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: {
    width: '14.285%',
    textAlign: 'center',
    color: MUTED,
    fontSize: 10,
    fontWeight: '600',
    paddingBottom: 5,
  },
  dayCell: {
    width: '13.5%',
    aspectRatio: 1,
    marginHorizontal: '0.39%',
    marginBottom: 4,
    borderRadius: 10,
    backgroundColor: '#DCEBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyDayCell: {
    width: '13.5%',
    aspectRatio: 1,
    marginHorizontal: '0.39%',
    marginBottom: 4,
  },
  offDay: {
    backgroundColor: '#F5F7F6',
    borderWidth: 1,
    borderColor: '#DCE2E0',
    borderStyle: 'dashed',
  },
  absentDay: { backgroundColor: '#EC5B53' },
  todayCell: { borderWidth: 1, borderColor: '#2D7165' },
  selectedDate: { borderWidth: 2, borderColor: GREEN },
  dayText: { color: '#233532', fontSize: 10 },
  absentDayText: { color: '#fff', fontWeight: '700' },
  selectedDateStatus: {
    color: MUTED,
    fontSize: 11,
    marginTop: 3,
    marginBottom: 6,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 5,
    paddingLeft: 2,
  },
  offLegendMark: {
    width: 9,
    height: 9,
    borderRadius: 3,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#AAB6B2',
    marginRight: 4,
  },
  legendText: { color: MUTED, fontSize: 10 },
  marksNotice: { color: '#382800', fontSize: 12, lineHeight: 17, flex: 1 },
  monthStats: { flexDirection: 'row', marginTop: 4, marginBottom: 10 },
  stat: { marginRight: 22 },
  statNumber: { color: DARK, fontSize: 24, lineHeight: 29, fontWeight: '800' },
  absentNumber: { color: '#EC5B53' },
  actionButton: {
    backgroundColor: GREEN,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 11,
  },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  overallCard: {
    backgroundColor: '#fff',
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  overallPercent: {
    color: DARK,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 30,
  },
  subject: { marginTop: 6, marginBottom: 4 },
  subjectHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  subjectName: { color: DARK, fontSize: 12, fontWeight: '600' },
  subjectScore: { color: DARK, fontSize: 12, fontWeight: '700' },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#DCE3E1',
    borderRadius: 5,
  },
  progressFill: { height: 8, borderRadius: 5 },
  feeHero: {
    backgroundColor: GREEN,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingTop: 13,
    paddingBottom: 12,
    marginBottom: 10,
  },
  feeDue: { color: '#C7D7D3', fontSize: 12, marginBottom: 1 },
  feeAmount: {
    color: '#F5B335',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 9,
  },
  payButton: {
    backgroundColor: '#F5B335',
    borderRadius: 11,
    alignItems: 'center',
    paddingVertical: 10,
  },
  payButtonText: { color: '#382800', fontSize: 13, fontWeight: '700' },
  paymentRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E7E5',
  },
  lastPaymentRow: { borderBottomWidth: 0 },
  paymentInfo: { flex: 1 },
  paymentTitle: { color: DARK, fontSize: 12 },
  paymentDate: { color: MUTED, fontSize: 11, marginTop: 1 },
  paymentAmount: { color: '#2D7165', fontSize: 11, fontWeight: '600' },
  studentLink: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  studentLinkText: { color: GREEN, fontSize: 12, fontWeight: '700' },
  infoCard: { backgroundColor: '#fff', borderRadius: 16, padding: 13 },
  infoText: { color: MUTED, fontSize: 12, lineHeight: 18 },
  tabBar: {
    minHeight: 58,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#DDE3E1',
    paddingHorizontal: 4,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#DDE5E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTabIcon: { backgroundColor: GREEN },
  tabGlyph: {
    color: '#788681',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '700',
  },
  selectedGlyph: { color: '#fff' },
  tabLabel: { color: MUTED, fontSize: 10, marginTop: 2 },
  selectedLabel: { color: GREEN, fontWeight: '700' },
});
