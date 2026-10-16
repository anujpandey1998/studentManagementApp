import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar, Badge, Card } from '../../../components/ui';
import { theme } from '../../../theme';

export function OverviewScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <View>
            <Text style={styles.eyebrow}>VIDYA / STUDENT MANAGEMENT</Text>
            <Text style={styles.title}>A better school day.</Text>
          </View>
          <Avatar name="Vidya Academy" />
        </View>
        <Text style={styles.subtitle}>
          One place for your school community.
        </Text>
        <Badge label="Phase 1 · Foundation preview" />
        <Card>
          <Text style={styles.heading}>Your workspace is taking shape</Text>
          <Text style={styles.body}>
            Attendance, learning and school updates — connected in one secure
            workspace.
          </Text>
          <Text style={styles.caption}>
            This preview uses no live student data. Sign-in and role-specific
            dashboards arrive in Phase 2.
          </Text>
        </Card>
        <Text style={styles.heading}>Built around your day</Text>
        {[
          [
            '01',
            'People & classrooms',
            'Student profiles, class groups and daily attendance.',
          ],
          [
            '02',
            'Learning & progress',
            'Results, weekly timetable and assignment submissions.',
          ],
          [
            '03',
            'School essentials',
            'Fee history, announcements and account preferences.',
          ],
        ].map(([number, title, description]) => (
          <Card key={number}>
            <Text style={styles.eyebrow}>{number}</Text>
            <Text style={styles.heading}>{title}</Text>
            <Text style={styles.body}>{description}</Text>
          </Card>
        ))}
        <Text style={styles.caption}>
          Designed for administrators, teachers and students.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 24, gap: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 12,
  },
  subtitle: { fontSize: 16, color: theme.colors.muted },
  heading: { fontSize: 20, fontWeight: '600', color: theme.colors.text },
  body: { fontSize: 16, lineHeight: 24, color: theme.colors.muted },
  caption: { fontSize: 13, lineHeight: 20, color: theme.colors.muted },
});
