import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Linking,
} from 'react-native';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useSelector } from 'react-redux';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  errorCodes,
  isErrorWithCode,
  keepLocalCopy,
  pick,
  types,
} from '@react-native-documents/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParams } from '../../../app/navigation/types';
import { AppModal } from '../../../components/AppModal';
import { AsyncState } from '../../../components/AsyncState';
import { Avatar, Badge, Button, Card, Input } from '../../../components/ui';
import type { RootState } from '../../../store';
import type { AttendanceStatus, UUID } from '../../../types/domain';
import { theme } from '../../../theme';
import { createUuid } from '../../../utils/id';
import {
  createNotice,
  createAssignment,
  createStudent,
  getAttendance,
  getExamSubjectOptions,
  getFeatureRecords,
  getMonthlyAttendanceSummary,
  getSectionStudents,
  getSections,
  getSectionSubjects,
  getStudentsPage,
  saveAttendance,
  saveMark,
  getOwnStudentId,
  downloadSubmissionFile,
  saveSubmissionFeedback,
  simulateFeePayment,
  submitAssignmentFile,
  uploadStudentPhoto,
  updateStudent,
  type AttendanceEntry,
  type ExamSubjectOption,
  type SchoolFeature,
  type SchoolRecord,
  type SchoolSection,
  type SchoolSubject,
  type StudentRecord,
} from '../api/schoolApi';
import {
  attendancePercentage,
  gradeForScore,
  type AttendanceSummary,
} from '../utils/metrics';

type Props = NativeStackScreenProps<RootStackParams, 'SchoolFeature'>;

const titles: Record<SchoolFeature, string> = {
  students: 'Students',
  attendance: 'Attendance',
  results: 'Marks & results',
  timetable: 'Timetable',
  assignments: 'Assignments',
  fees: 'Fees',
  notices: 'Notices',
};

const studentSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter the student name.').max(120),
  admissionNumber: z
    .string()
    .trim()
    .min(2, 'Enter an admission number.')
    .max(40),
  guardianName: z.string().trim().max(120),
  guardianPhone: z
    .string()
    .trim()
    .max(30)
    .refine(
      value => !value || /^\+?[0-9 ()-]{7,20}$/.test(value),
      'Enter a valid guardian phone number.',
    ),
});

const noticeSchema = z.object({
  title: z.string().trim().min(3, 'Enter a notice title.').max(120),
  body: z.string().trim().min(5, 'Enter a notice message.').max(4000),
});

const assignmentSchema = z.object({
  title: z.string().trim().min(3, 'Enter an assignment title.').max(160),
  description: z
    .string()
    .trim()
    .min(5, 'Enter assignment instructions.')
    .max(4000),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.')
    .refine(value => !Number.isNaN(Date.parse(`${value}T00:00:00`)), {
      message: 'Enter a valid due date.',
    }),
  subjectId: z.string().min(1, 'Choose a subject.'),
});

const markSchema = z.object({
  score: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a score with up to 2 decimals.')
    .transform(Number)
    .refine(Number.isFinite, 'Enter a valid score.')
    .refine(value => value >= 0, 'Score cannot be negative.'),
});

type StudentForm = z.infer<typeof studentSchema>;
type NoticeForm = z.infer<typeof noticeSchema>;
type AssignmentForm = z.infer<typeof assignmentSchema>;

const attendanceStatuses: AttendanceStatus[] = [
  'present',
  'absent',
  'late',
  'excused',
];
const weekdays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function currentWeekday(): number {
  return ((new Date().getDay() + 6) % 7) + 1;
}

function localDateString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function localMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0',
  )}-01`;
}

function relationName(value: unknown): string {
  if (Array.isArray(value)) {
    return relationName(value[0]);
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return typeof record.name === 'string' ? record.name : '';
  }
  return '';
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return String(value);
}

function nestedNumber(value: unknown, key: string): number | undefined {
  const relation = Array.isArray(value) ? value[0] : value;
  if (!relation || typeof relation !== 'object') {
    return undefined;
  }
  const raw = (relation as Record<string, unknown>)[key];
  const number = Number(raw);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function StudentRow({
  item,
  onEdit,
  onPhoto,
}: {
  item: StudentRecord;
  onEdit?: (student: StudentRecord) => void;
  onPhoto?: (student: StudentRecord) => void;
}) {
  return (
    <Card>
      <View style={styles.row}>
        <Avatar name={item.full_name} uri={item.photo_url} />
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{item.full_name}</Text>
          <Text style={styles.rowSubtitle}>
            Admission no. {item.admission_number}
          </Text>
          <Text style={styles.rowSubtitle}>
            {item.guardian_name || 'Guardian details not added'}
          </Text>
        </View>
        <Badge label={item.active ? 'Active' : 'Inactive'} />
      </View>
      {onEdit ? (
        <View style={styles.rowActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Edit ${item.full_name}`}
            onPress={() => onEdit(item)}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Edit details</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Upload ${item.full_name} photo`}
            onPress={() => onPhoto?.(item)}
            style={styles.editButton}
          >
            <Text style={styles.editButtonText}>Change photo</Text>
          </Pressable>
        </View>
      ) : null}
    </Card>
  );
}

const MemoStudentRow = memo(StudentRow);

function studentKeyExtractor(item: StudentRecord): string {
  return item.id;
}

function AttendanceRow({
  entry,
  monthlySummary,
  disabled,
  onSetStatus,
}: {
  entry: AttendanceEntry;
  monthlySummary?: AttendanceSummary;
  disabled: boolean;
  onSetStatus: (studentId: UUID, status: AttendanceStatus) => void;
}) {
  return (
    <Card>
      <View style={styles.attendanceHeader}>
        <View style={styles.rowBody}>
          <Text style={styles.rowTitle}>{entry.full_name}</Text>
          <Text style={styles.rowSubtitle}>{entry.admission_number}</Text>
        </View>
        <Text style={styles.statusText}>
          {entry.status ? entry.status.toUpperCase() : 'NOT MARKED'}
        </Text>
      </View>
      {monthlySummary ? (
        <Text style={styles.rowSubtitle}>
          This month:{' '}
          {attendancePercentage(
            monthlySummary.attended_days,
            monthlySummary.recorded_days,
          )}
          % ({monthlySummary.attended_days}/{monthlySummary.recorded_days} days
          attended)
        </Text>
      ) : null}
      <View style={styles.statusChoices}>
        {attendanceStatuses.map(status => (
          <Pressable
            key={status}
            accessibilityRole="button"
            accessibilityLabel={`${entry.full_name}: mark ${status}`}
            accessibilityState={{
              selected: entry.status === status,
              disabled,
            }}
            disabled={disabled}
            onPress={() => onSetStatus(entry.student_id, status)}
            style={[
              styles.statusChoice,
              entry.status === status && styles.statusChoiceSelected,
            ]}
          >
            <Text
              style={[
                styles.statusChoiceText,
                entry.status === status && styles.statusChoiceTextSelected,
              ]}
            >
              {status}
            </Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

function RecordCard({
  feature,
  record,
  onPay,
  isPaying,
  isGrading,
  onSubmit,
  onOpenFile,
  onGrade,
  isSubmitting,
}: {
  feature: SchoolFeature;
  record: SchoolRecord;
  onPay?: (feeId: UUID) => void;
  isPaying?: boolean;
  onSubmit?: (assignment: SchoolRecord) => void;
  onOpenFile?: (filePath: string) => void;
  onGrade?: (submission: SchoolRecord) => void;
  isSubmitting?: boolean;
  isGrading?: boolean;
}) {
  const title =
    feature === 'results'
      ? relationName(record.students) || 'Result'
      : feature === 'timetable'
      ? relationName(record.subjects) || 'Class'
      : feature === 'assignments'
      ? displayValue(record.title)
      : feature === 'fees'
      ? relationName(record.students) || 'Fee invoice'
      : displayValue(record.title);

  let details: string[] = [];
  let paymentDue = false;
  let resultPercentage: number | undefined;
  let resultGrade: string | undefined;
  if (feature === 'results') {
    const score = Number(record.score);
    const maxMarks = nestedNumber(record.exam_subjects, 'max_marks');
    if (Number.isFinite(score) && maxMarks && score >= 0 && score <= maxMarks) {
      resultGrade = gradeForScore(score, maxMarks) ?? undefined;
      if (resultGrade) {
        resultPercentage = (score / maxMarks) * 100;
      }
    }
    details = [
      relationName(record.exams),
      relationName(record.subjects),
      `Score: ${displayValue(record.score)} / ${displayValue(maxMarks)}`,
      resultGrade ? `Grade: ${resultGrade}` : 'Grade unavailable',
    ];
  } else if (feature === 'timetable') {
    const weekday = Number(record.weekday);
    details = [
      weekdays[weekday - 1] ?? 'Unknown weekday',
      `${displayValue(record.starts_at)}–${displayValue(record.ends_at)}`,
      relationName(record.sections),
      displayValue(record.room),
    ];
  } else if (feature === 'assignments') {
    const submissions = Array.isArray(record.submissions)
      ? (record.submissions as SchoolRecord[])
      : [];
    details = [
      relationName(record.subjects),
      `Due ${displayValue(record.due_at)}`,
      displayValue(record.description),
      ...(submissions.map(
        submission =>
          `Submitted ${displayValue(submission.submitted_at)}${
            submission.feedback ? ` · Feedback: ${submission.feedback}` : ''
          }`,
      ) ?? []),
    ];
  } else if (feature === 'fees') {
    const structure = Array.isArray(record.fee_structures)
      ? record.fee_structures[0]
      : record.fee_structures;
    const structureRecord =
      structure && typeof structure === 'object'
        ? (structure as Record<string, unknown>)
        : {};
    const payments = Array.isArray(record.payments) ? record.payments : [];
    const amountPaid = payments.reduce((total: number, payment) => {
      if (!payment || typeof payment !== 'object') {
        return total;
      }
      const paymentRecord = payment as Record<string, unknown>;
      return paymentRecord.status === 'succeeded'
        ? total + Number(paymentRecord.amount_paise ?? 0)
        : total;
    }, 0);
    const amountDue = Math.max(
      0,
      Number(structureRecord.amount_paise ?? 0) - amountPaid,
    );
    paymentDue = amountDue > 0;
    details = [
      displayValue(structureRecord.name),
      `Due: ₹${(amountDue / 100).toFixed(2)}`,
      `Due date: ${displayValue(structureRecord.due_date)}`,
      amountDue === 0 ? 'Paid' : 'Payment status: pending',
    ];
  } else {
    details = [displayValue(record.published_at), displayValue(record.body)];
  }

  return (
    <Card>
      <Text style={styles.rowTitle}>{title}</Text>
      {details
        .filter(detail => detail && detail !== '—')
        .map((detail, index) => (
          <Text key={`${index}:${detail}`} style={styles.rowSubtitle}>
            {detail}
          </Text>
        ))}
      {resultPercentage !== undefined ? (
        <View
          accessibilityLabel={`Result ${Math.round(resultPercentage)} percent`}
          style={styles.resultTrack}
        >
          <View
            style={[
              styles.resultFill,
              { width: `${Math.min(100, resultPercentage)}%` },
            ]}
          />
        </View>
      ) : null}
      {feature === 'fees' && onPay && paymentDue ? (
        <Button
          title="Simulate sandbox payment"
          onPress={() => onPay(record.id)}
          loading={isPaying}
        />
      ) : null}
      {feature === 'assignments' && onSubmit ? (
        <Button
          title={
            Array.isArray(record.submissions) && record.submissions.length > 0
              ? 'Replace submission file'
              : 'Submit assignment file'
          }
          onPress={() => onSubmit(record)}
          loading={isSubmitting}
        />
      ) : null}
      {feature === 'assignments' &&
        Array.isArray(record.submissions) &&
        record.submissions.map((submission: SchoolRecord) => (
          <View key={submission.id} style={styles.submissionActions}>
            {typeof submission.file_path === 'string' && onOpenFile ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open submitted file"
                onPress={() => onOpenFile(submission.file_path as string)}
              >
                <Text style={styles.editButtonText}>Open submitted file</Text>
              </Pressable>
            ) : null}
            {onGrade ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add submission feedback"
                onPress={() => onGrade(submission)}
                disabled={isGrading}
              >
                <Text style={styles.editButtonText}>
                  {submission.graded_at
                    ? 'Update feedback'
                    : 'Review submission'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ))}
    </Card>
  );
}

export function SchoolFeatureScreen({ route, navigation }: Props) {
  const { feature } = route.params;
  const user = useSelector((state: RootState) => state.auth.user);
  const queryClient = useQueryClient();
  const paymentKeys = useRef(new Map<UUID, UUID>());
  const [search, setSearch] = useState('');
  const [sectionId, setSectionId] = useState<UUID | undefined>();
  const [addStudentVisible, setAddStudentVisible] = useState(false);
  const [noticeVisible, setNoticeVisible] = useState(false);
  const [noticeDeliveryWarning, setNoticeDeliveryWarning] = useState<
    string | null
  >(null);
  const [assignmentVisible, setAssignmentVisible] = useState(false);
  const [markEntryVisible, setMarkEntryVisible] = useState(false);
  const [schoolWideNotice, setSchoolWideNotice] = useState(false);
  const [selectedExamSubject, setSelectedExamSubject] =
    useState<ExamSubjectOption | null>(null);
  const [selectedMarkStudent, setSelectedMarkStudent] =
    useState<StudentRecord | null>(null);
  const [markValidationError, setMarkValidationError] = useState<string | null>(
    null,
  );
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [feedbackTarget, setFeedbackTarget] = useState<SchoolRecord | null>(
    null,
  );
  const [feedbackValue, setFeedbackValue] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [timetableWeekday, setTimetableWeekday] = useState<number | null>(
    currentWeekday,
  );
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(
    null,
  );
  const sectionsQuery = useQuery({
    queryKey: ['school', 'sections', user?.id, user?.role, user?.instituteId],
    queryFn: () => getSections(user!.role, user!.id, user!.instituteId),
    enabled: Boolean(
      user &&
        (feature === 'students' ||
          feature === 'attendance' ||
          (feature === 'results' && user.role !== 'student') ||
          ((feature === 'assignments' || feature === 'timetable') &&
            user.role !== 'student') ||
          (feature === 'notices' && user.role !== 'student')),
    ),
  });

  useEffect(() => {
    if (!sectionId && sectionsQuery.data?.length) {
      setSectionId(sectionsQuery.data[0].id);
    }
  }, [sectionId, sectionsQuery.data]);

  const studentPages = useInfiniteQuery({
    queryKey: [
      'school',
      'students',
      user?.id,
      user?.role,
      user?.instituteId,
      search.trim(),
      sectionId,
    ],
    queryFn: ({ pageParam }) =>
      getStudentsPage(user!.instituteId, search, pageParam, sectionId),
    initialPageParam: 0,
    getNextPageParam: page => page.nextOffset,
    enabled: Boolean(user && feature === 'students'),
  });

  const attendanceDate = useMemo(localDateString, []);
  const attendanceQuery = useQuery({
    queryKey: [
      'school',
      'attendance',
      user?.id,
      user?.role,
      user?.instituteId,
      sectionId,
      attendanceDate,
    ],
    queryFn: () => getAttendance(user!.instituteId, sectionId!, attendanceDate),
    enabled: Boolean(
      user && sectionId && (feature === 'attendance' || feature === 'students'),
    ),
  });
  const monthlyAttendanceQuery = useQuery({
    queryKey: [
      'school',
      'attendance-month',
      user?.id,
      user?.role,
      user?.instituteId,
      sectionId,
      localMonthStart(),
      attendanceDate,
    ],
    queryFn: () =>
      getMonthlyAttendanceSummary(
        user!.instituteId,
        sectionId!,
        localMonthStart(),
        attendanceDate,
      ),
    enabled: Boolean(user && sectionId && feature === 'attendance'),
  });
  const ownStudentIdQuery = useQuery({
    queryKey: ['school', 'own-student-id', user?.id],
    queryFn: () => getOwnStudentId(user!.id),
    enabled: Boolean(user?.role === 'student' && feature === 'assignments'),
  });

  const recordsQuery = useQuery({
    queryKey: [
      'school',
      feature,
      user?.id,
      user?.role,
      user?.instituteId,
      sectionId,
    ],
    queryFn: () =>
      getFeatureRecords(
        feature as Exclude<SchoolFeature, 'students' | 'attendance'>,
        user!.instituteId,
        sectionId,
      ),
    enabled: Boolean(
      user && feature !== 'students' && feature !== 'attendance',
    ),
  });
  const subjectsQuery = useQuery({
    queryKey: [
      'school',
      'subjects',
      user?.id,
      user?.role,
      user?.instituteId,
      sectionId,
    ],
    queryFn: () =>
      getSectionSubjects(user!.role, user!.id, user!.instituteId, sectionId!),
    enabled: Boolean(
      user && sectionId && feature === 'assignments' && user.role !== 'student',
    ),
  });
  const examSubjectQuery = useQuery({
    queryKey: [
      'school',
      'exam-subjects',
      user?.id,
      user?.instituteId,
      sectionId,
    ],
    queryFn: () => getExamSubjectOptions(user!.instituteId, sectionId!),
    enabled: Boolean(
      user && sectionId && feature === 'results' && user.role !== 'student',
    ),
  });
  const sectionStudentsQuery = useQuery({
    queryKey: [
      'school',
      'section-students',
      user?.id,
      user?.instituteId,
      sectionId,
    ],
    queryFn: () => getSectionStudents(user!.instituteId, sectionId!),
    enabled: Boolean(
      user && sectionId && feature === 'results' && user.role !== 'student',
    ),
  });

  const addStudentForm = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      fullName: '',
      admissionNumber: '',
      guardianName: '',
      guardianPhone: '',
    },
  });
  const noticeForm = useForm<NoticeForm>({
    resolver: zodResolver(noticeSchema),
    defaultValues: { title: '', body: '' },
  });
  const assignmentForm = useForm<AssignmentForm>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: localDateString(),
      subjectId: '',
    },
  });
  const markForm = useForm<
    z.input<typeof markSchema>,
    unknown,
    z.output<typeof markSchema>
  >({
    resolver: zodResolver(markSchema),
    defaultValues: { score: '0' },
  });
  const addStudentMutation = useMutation({
    mutationFn: (values: StudentForm) =>
      createStudent({
        instituteId: user!.instituteId,
        sectionId: sectionId!,
        ...values,
      }),
    onSuccess: async () => {
      setAddStudentVisible(false);
      addStudentForm.reset();
      await queryClient.invalidateQueries({ queryKey: ['school', 'students'] });
    },
  });
  const updateStudentMutation = useMutation({
    mutationFn: (values: StudentForm) =>
      updateStudent({
        instituteId: user!.instituteId,
        studentId: editingStudent!.id,
        ...values,
      }),
    onSuccess: async () => {
      setAddStudentVisible(false);
      setEditingStudent(null);
      addStudentForm.reset();
      await queryClient.invalidateQueries({ queryKey: ['school', 'students'] });
    },
  });
  const noticeMutation = useMutation({
    mutationFn: (values: NoticeForm) =>
      createNotice({
        instituteId: user!.instituteId,
        createdBy: user!.id,
        title: values.title,
        body: values.body,
        sectionId:
          user?.role === 'admin' && schoolWideNotice ? null : sectionId ?? null,
      }),
    onSuccess: async result => {
      setNoticeVisible(false);
      setSchoolWideNotice(false);
      noticeForm.reset();
      setNoticeDeliveryWarning(result.notificationWarning ?? null);
      await queryClient.invalidateQueries({ queryKey: ['school', 'notices'] });
    },
  });
  const assignmentMutation = useMutation({
    mutationFn: (values: AssignmentForm) =>
      createAssignment({
        instituteId: user!.instituteId,
        sectionId: sectionId!,
        subjectId: values.subjectId,
        createdBy: user!.id,
        title: values.title,
        description: values.description,
        dueAt: new Date(`${values.dueDate}T18:00:00`).toISOString(),
      }),
    onSuccess: async () => {
      setAssignmentVisible(false);
      assignmentForm.reset({
        title: '',
        description: '',
        dueDate: localDateString(),
        subjectId: '',
      });
      await queryClient.invalidateQueries({
        queryKey: ['school', 'assignments'],
      });
    },
  });
  const markMutation = useMutation({
    mutationFn: (score: number) => {
      if (!selectedExamSubject || !selectedMarkStudent) {
        throw new Error('Choose an exam, subject, and student.');
      }
      if (score > selectedExamSubject.max_marks) {
        throw new Error(
          `Score cannot exceed ${selectedExamSubject.max_marks} marks.`,
        );
      }
      return saveMark({
        instituteId: user!.instituteId,
        sectionId: sectionId!,
        studentId: selectedMarkStudent.id,
        examId: selectedExamSubject.exam_id,
        subjectId: selectedExamSubject.subject_id,
        score,
      });
    },
    onSuccess: async () => {
      setMarkEntryVisible(false);
      setMarkValidationError(null);
      markForm.reset({ score: '0' });
      await queryClient.invalidateQueries({ queryKey: ['school', 'results'] });
    },
    onError: error => setMarkValidationError(error.message),
  });
  const paymentMutation = useMutation({
    mutationFn: ({
      feeId,
      idempotencyKey,
    }: {
      feeId: UUID;
      idempotencyKey: UUID;
    }) => simulateFeePayment(feeId, idempotencyKey),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['school', 'fees'] });
    },
  });
  const photoMutation = useMutation({
    mutationFn: ({
      student,
      uri,
      mimeType,
    }: {
      student: StudentRecord;
      uri: string;
      mimeType: string;
    }) =>
      uploadStudentPhoto({
        instituteId: user!.instituteId,
        studentId: student.id,
        uri,
        mimeType,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['school', 'students'] });
    },
  });
  const assignmentSubmissionMutation = useMutation({
    mutationFn: ({
      assignment,
      uri,
      mimeType,
    }: {
      assignment: SchoolRecord;
      uri: string;
      mimeType: string;
    }) => {
      if (!ownStudentIdQuery.data) {
        throw new Error('No student profile is linked to this account.');
      }
      return submitAssignmentFile({
        instituteId: user!.instituteId,
        studentId: ownStudentIdQuery.data,
        assignmentId: assignment.id,
        uri,
        mimeType,
      });
    },
    onSuccess: async () => {
      setSubmissionError(null);
      await queryClient.invalidateQueries({
        queryKey: ['school', 'assignments'],
      });
    },
    onError: error => setSubmissionError(error.message),
  });
  const feedbackMutation = useMutation({
    mutationFn: ({
      submissionId,
      feedback,
    }: {
      submissionId: UUID;
      feedback: string;
    }) => saveSubmissionFeedback({ submissionId, feedback }),
    onSuccess: async () => {
      setFeedbackTarget(null);
      setFeedbackValue('');
      setFeedbackError(null);
      await queryClient.invalidateQueries({
        queryKey: ['school', 'assignments'],
      });
    },
    onError: error => setFeedbackError(error.message),
  });
  const attendanceMutation = useMutation({
    mutationFn: ({
      studentId,
      status,
    }: {
      studentId: UUID;
      status: AttendanceStatus;
    }) =>
      saveAttendance({
        instituteId: user!.instituteId,
        sectionId: sectionId!,
        studentId,
        userId: user!.id,
        date: attendanceDate,
        status,
      }),
    onMutate: async ({ studentId, status }) => {
      const queryKey = [
        'school',
        'attendance',
        user?.id,
        user?.role,
        user?.instituteId,
        sectionId,
        attendanceDate,
      ];
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<AttendanceEntry[]>(queryKey);
      queryClient.setQueryData<AttendanceEntry[]>(queryKey, current =>
        current?.map(entry =>
          entry.student_id === studentId ? { ...entry, status } : entry,
        ),
      );
      return { previous, queryKey };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previous);
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ['school', 'attendance'] }),
  });

  const students =
    studentPages.data?.pages.flatMap(page => page.students) ?? [];
  const attendance = attendanceQuery.data ?? [];
  const records = recordsQuery.data ?? [];
  const visibleRecords =
    feature === 'timetable' && timetableWeekday !== null
      ? records.filter(record => Number(record.weekday) === timetableWeekday)
      : records;
  const monthlyAttendance = new Map(
    (monthlyAttendanceQuery.data ?? []).map(row => [row.student_id, row]),
  );
  const selectedSection = sectionsQuery.data?.find(
    section => section.id === sectionId,
  );
  const hasNextStudentPage = Boolean(
    studentPages.hasNextPage && !studentPages.isFetchingNextPage,
  );

  const isStudent = user?.role === 'student';
  const canManageStudents = user?.role === 'admin';
  const canRecordAttendance =
    user?.role === 'admin' || user?.role === 'teacher';
  const isRecordFeature = feature !== 'students' && feature !== 'attendance';
  const needsSections =
    feature === 'students' ||
    feature === 'attendance' ||
    (feature === 'results' && user?.role !== 'student') ||
    ((feature === 'assignments' ||
      feature === 'timetable' ||
      feature === 'notices') &&
      user?.role !== 'student');

  const onRefresh = async () => {
    if (feature === 'students') {
      await Promise.all([studentPages.refetch(), attendanceQuery.refetch()]);
    } else if (feature === 'attendance') {
      await Promise.all([
        attendanceQuery.refetch(),
        monthlyAttendanceQuery.refetch(),
      ]);
    } else {
      await recordsQuery.refetch();
    }
  };

  const resetStudentForm = addStudentForm.reset;
  const resetAddStudentMutation = addStudentMutation.reset;
  const resetUpdateStudentMutation = updateStudentMutation.reset;
  const openEditStudent = useCallback(
    (student: StudentRecord) => {
      setEditingStudent(student);
      resetStudentForm({
        fullName: student.full_name,
        admissionNumber: student.admission_number,
        guardianName: student.guardian_name ?? '',
        guardianPhone: student.guardian_phone ?? '',
      });
      setAddStudentVisible(true);
      resetAddStudentMutation();
      resetUpdateStudentMutation();
    },
    [resetAddStudentMutation, resetStudentForm, resetUpdateStudentMutation],
  );
  const pickStudentPhoto = useCallback(
    async (student: StudentRecord) => {
      try {
        const result = await launchImageLibrary({
          mediaType: 'photo',
          selectionLimit: 1,
          quality: 0.8,
        });
        if (result.didCancel) {
          return;
        }
        const asset = result.assets?.[0];
        if (!asset?.uri || !asset.type) {
          throw new Error(
            result.errorMessage ?? 'The image picker returned no photo.',
          );
        }
        photoMutation.mutate({
          student,
          uri: asset.uri,
          mimeType: asset.type,
        });
      } catch (error) {
        setSubmissionError(
          error instanceof Error ? error.message : 'Unable to select a photo.',
        );
      }
    },
    [photoMutation],
  );
  const renderStudent = useCallback(
    ({ item }: { item: StudentRecord }) => (
      <MemoStudentRow
        item={item}
        onEdit={canManageStudents ? openEditStudent : undefined}
        onPhoto={canManageStudents ? pickStudentPhoto : undefined}
      />
    ),
    [canManageStudents, openEditStudent, pickStudentPhoto],
  );
  const startMockPayment = useCallback(
    (feeId: UUID) => {
      if (paymentMutation.isPending) {
        return;
      }
      let idempotencyKey = paymentKeys.current.get(feeId);
      if (!idempotencyKey) {
        idempotencyKey = createUuid();
        paymentKeys.current.set(feeId, idempotencyKey);
      }
      paymentMutation.mutate({ feeId, idempotencyKey });
    },
    [paymentMutation],
  );
  const pickAssignmentFile = useCallback(
    async (assignment: SchoolRecord) => {
      setSubmissionError(null);
      if (!ownStudentIdQuery.data) {
        throw new Error('No student profile is linked to this account.');
      }
      const [file] = await pick({
        type: [types.pdf, types.images],
        allowMultiSelection: false,
        mode: 'import',
      });
      if (!file.uri || !file.type || !file.name) {
        throw new Error('Choose a PDF, JPEG, or PNG file with a filename.');
      }
      if (file.size !== null && file.size > 10 * 1024 * 1024) {
        throw new Error('Assignment files must be 10 MB or smaller.');
      }
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        throw new Error('Choose a PDF, JPEG, or PNG file.');
      }
      const [copy] = await keepLocalCopy({
        files: [{ uri: file.uri, fileName: file.name }],
        destination: 'cachesDirectory',
      });
      if (copy.status !== 'success') {
        throw new Error(copy.copyError);
      }
      assignmentSubmissionMutation.mutate({
        assignment,
        uri: copy.localUri,
        mimeType: file.type,
      });
    },
    [assignmentSubmissionMutation, ownStudentIdQuery.data],
  );
  const renderRecord = useCallback(
    ({ item }: { item: SchoolRecord }) => (
      <RecordCard
        feature={feature}
        record={item}
        onPay={isStudent ? startMockPayment : undefined}
        isPaying={paymentMutation.isPending}
        onSubmit={
          isStudent
            ? assignment =>
                pickAssignmentFile(assignment).catch(error => {
                  if (
                    isErrorWithCode(error) &&
                    error.code === errorCodes.OPERATION_CANCELED
                  ) {
                    return;
                  }
                  setSubmissionError(
                    error instanceof Error
                      ? error.message
                      : 'Unable to submit the assignment file.',
                  );
                })
            : undefined
        }
        isSubmitting={assignmentSubmissionMutation.isPending}
        onOpenFile={filePath =>
          downloadSubmissionFile(filePath)
            .then(url => Linking.openURL(url))
            .catch(error =>
              setSubmissionError(
                error instanceof Error
                  ? error.message
                  : 'Unable to open the private file.',
              ),
            )
        }
        onGrade={
          user?.role === 'teacher'
            ? submission => {
                setFeedbackTarget(submission);
                setFeedbackValue(
                  typeof submission.feedback === 'string'
                    ? submission.feedback
                    : '',
                );
                setFeedbackError(null);
                feedbackMutation.reset();
              }
            : undefined
        }
        isGrading={feedbackMutation.isPending}
      />
    ),
    [
      feature,
      isStudent,
      user?.role,
      paymentMutation.isPending,
      startMockPayment,
      assignmentSubmissionMutation.isPending,
      feedbackMutation,
      pickAssignmentFile,
    ],
  );

  const queryError =
    feature === 'students'
      ? studentPages.error ?? sectionsQuery.error
      : feature === 'attendance'
      ? attendanceQuery.error ??
        monthlyAttendanceQuery.error ??
        sectionsQuery.error
      : recordsQuery.error ??
        (needsSections ? sectionsQuery.error : null) ??
        (feature === 'results'
          ? examSubjectQuery.error ?? sectionStudentsQuery.error
          : null);
  const queryLoading =
    feature === 'students'
      ? studentPages.isLoading || sectionsQuery.isLoading
      : feature === 'attendance'
      ? attendanceQuery.isLoading ||
        monthlyAttendanceQuery.isLoading ||
        sectionsQuery.isLoading
      : recordsQuery.isLoading ||
        (needsSections && sectionsQuery.isLoading) ||
        (feature === 'results' &&
          user?.role !== 'student' &&
          (examSubjectQuery.isLoading || sectionStudentsQuery.isLoading));
  const retry = async () => {
    await onRefresh();
    if (needsSections) {
      await sectionsQuery.refetch();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <View style={styles.headerBody}>
          <Text accessibilityRole="header" style={styles.title}>
            {titles[feature]}
          </Text>
          <Text style={styles.subtitle}>
            {user?.fullName} · {user?.role}
          </Text>
        </View>
      </View>

      {feature === 'students' && !isStudent ? (
        <View style={styles.searchWrap}>
          <Input
            label="Search students"
            value={search}
            onChangeText={setSearch}
            placeholder="Name or admission number"
            returnKeyType="search"
          />
        </View>
      ) : null}

      {feature === 'students' ||
      feature === 'attendance' ||
      (feature === 'results' && user?.role !== 'student') ||
      ((feature === 'assignments' || feature === 'timetable') &&
        user?.role !== 'student') ||
      (feature === 'notices' && user?.role !== 'student') ? (
        sectionsQuery.data?.length ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sectionPicker}
          >
            {sectionsQuery.data.map((section: SchoolSection) => (
              <Pressable
                key={section.id}
                accessibilityRole="button"
                accessibilityState={{ selected: section.id === sectionId }}
                onPress={() => setSectionId(section.id)}
                style={[
                  styles.sectionChip,
                  section.id === sectionId && styles.sectionChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.sectionChipText,
                    section.id === sectionId && styles.sectionChipTextSelected,
                  ]}
                >
                  {section.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null
      ) : null}

      {feature === 'students' && canManageStudents ? (
        <View style={styles.action}>
          <Button
            title={editingStudent ? 'Update student' : 'Add student'}
            onPress={() => {
              setEditingStudent(null);
              addStudentForm.reset();
              setAddStudentVisible(true);
              addStudentMutation.reset();
              updateStudentMutation.reset();
            }}
            disabled={!sectionId}
          />
        </View>
      ) : null}
      {feature === 'notices' &&
      (user?.role === 'admin' || user?.role === 'teacher') ? (
        <View style={styles.action}>
          <Button
            title="Write a notice"
            onPress={() => {
              noticeForm.reset();
              noticeMutation.reset();
              setNoticeVisible(true);
            }}
            disabled={user.role === 'teacher' && !sectionId}
          />
        </View>
      ) : null}
      {feature === 'assignments' &&
      (user?.role === 'admin' || user?.role === 'teacher') ? (
        <View style={styles.action}>
          <Button
            title="Create assignment"
            onPress={() => {
              assignmentForm.reset({
                title: '',
                description: '',
                dueDate: localDateString(),
                subjectId: '',
              });
              assignmentMutation.reset();
              setAssignmentVisible(true);
            }}
            disabled={!sectionId || subjectsQuery.isLoading}
          />
        </View>
      ) : null}

      {feature === 'attendance' && canRecordAttendance ? (
        <View style={styles.dateLabel}>
          <Text style={styles.rowSubtitle}>
            Attendance for {attendanceDate}
          </Text>
          {selectedSection ? (
            <Text style={styles.rowSubtitle}>
              Section {selectedSection.name}
            </Text>
          ) : null}
        </View>
      ) : null}

      {feature === 'results' &&
      (user?.role === 'admin' || user?.role === 'teacher') ? (
        <View style={styles.action}>
          <Button
            title="Enter marks"
            onPress={() => {
              setSelectedExamSubject(null);
              setSelectedMarkStudent(null);
              setMarkValidationError(null);
              markForm.reset({ score: '0' });
              markMutation.reset();
              setMarkEntryVisible(true);
            }}
            disabled={!sectionId}
          />
        </View>
      ) : null}

      {feature === 'timetable' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sectionPicker}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: timetableWeekday === null }}
            onPress={() => setTimetableWeekday(null)}
            style={[
              styles.sectionChip,
              timetableWeekday === null && styles.sectionChipSelected,
            ]}
          >
            <Text
              style={[
                styles.sectionChipText,
                timetableWeekday === null && styles.sectionChipTextSelected,
              ]}
            >
              Week
            </Text>
          </Pressable>
          {weekdays.map((day, index) => (
            <Pressable
              key={day}
              accessibilityRole="button"
              accessibilityState={{ selected: timetableWeekday === index + 1 }}
              onPress={() => setTimetableWeekday(index + 1)}
              style={[
                styles.sectionChip,
                timetableWeekday === index + 1 && styles.sectionChipSelected,
              ]}
            >
              <Text
                style={[
                  styles.sectionChipText,
                  timetableWeekday === index + 1 &&
                    styles.sectionChipTextSelected,
                ]}
              >
                {day.slice(0, 3)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {queryLoading ? (
        <View style={styles.loading}>
          <AsyncState loading onRetry={retry}>
            {null}
          </AsyncState>
        </View>
      ) : queryError ? (
        <View style={styles.message}>
          <AsyncState
            error={
              queryError instanceof Error
                ? queryError.message
                : 'Could not load this section.'
            }
            onRetry={retry}
          >
            {null}
          </AsyncState>
        </View>
      ) : feature === 'students' ? (
        <FlatList
          data={students}
          keyExtractor={studentKeyExtractor}
          renderItem={renderStudent}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
          refreshControl={
            <RefreshControl
              refreshing={studentPages.isRefetching}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          onEndReached={() => {
            if (hasNextStudentPage) {
              studentPages.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <AsyncState empty onRetry={retry}>
              {null}
            </AsyncState>
          }
          ListFooterComponent={
            studentPages.isFetchingNextPage ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : undefined
          }
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={7}
        />
      ) : feature === 'attendance' ? (
        <FlatList
          data={attendance}
          keyExtractor={item => item.student_id}
          renderItem={({ item }) => (
            <AttendanceRow
              entry={item}
              monthlySummary={monthlyAttendance.get(item.student_id)}
              disabled={!canRecordAttendance || attendanceMutation.isPending}
              onSetStatus={(studentId, status) =>
                attendanceMutation.mutate({ studentId, status })
              }
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
          refreshControl={
            <RefreshControl
              refreshing={attendanceQuery.isRefetching}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <AsyncState empty onRetry={retry}>
              {null}
            </AsyncState>
          }
        />
      ) : isRecordFeature ? (
        <FlatList
          data={visibleRecords}
          keyExtractor={item => item.id}
          renderItem={renderRecord}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
          refreshControl={
            <RefreshControl
              refreshing={recordsQuery.isRefetching}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
          ListEmptyComponent={
            <AsyncState empty onRetry={retry}>
              {null}
            </AsyncState>
          }
        />
      ) : (
        <View style={styles.message}>
          <Card>
            <Text style={styles.rowTitle}>
              This account has no student record yet.
            </Text>
          </Card>
        </View>
      )}

      {studentPages.isError && !queryLoading && !queryError ? (
        <Text accessibilityRole="alert" style={styles.inlineError}>
          {studentPages.error.message}
        </Text>
      ) : null}
      {attendanceMutation.isError ? (
        <Text accessibilityRole="alert" style={styles.inlineError}>
          {attendanceMutation.error.message}
        </Text>
      ) : null}
      {photoMutation.isError ||
      submissionError ||
      assignmentSubmissionMutation.isError ? (
        <Text accessibilityRole="alert" style={styles.inlineError}>
          {submissionError ??
            photoMutation.error?.message ??
            assignmentSubmissionMutation.error?.message}
        </Text>
      ) : null}
      {ownStudentIdQuery.error ? (
        <Text accessibilityRole="alert" style={styles.inlineError}>
          {ownStudentIdQuery.error.message}
        </Text>
      ) : null}
      {paymentMutation.isError ? (
        <Text accessibilityRole="alert" style={styles.inlineError}>
          {paymentMutation.error.message}
        </Text>
      ) : null}
      {noticeDeliveryWarning ? (
        <Text accessibilityRole="alert" style={styles.inlineError}>
          {noticeDeliveryWarning}
        </Text>
      ) : null}

      <AppModal
        visible={addStudentVisible}
        title={editingStudent ? 'Edit student' : 'Add student'}
        onClose={() => {
          setAddStudentVisible(false);
          setEditingStudent(null);
          addStudentMutation.reset();
          updateStudentMutation.reset();
        }}
      >
        <Input
          label="Full name"
          value={addStudentForm.watch('fullName')}
          onChangeText={value =>
            addStudentForm.setValue('fullName', value, { shouldValidate: true })
          }
          error={addStudentForm.formState.errors.fullName?.message}
          autoCapitalize="words"
        />
        <Input
          label="Admission number"
          value={addStudentForm.watch('admissionNumber')}
          onChangeText={value =>
            addStudentForm.setValue('admissionNumber', value, {
              shouldValidate: true,
            })
          }
          error={addStudentForm.formState.errors.admissionNumber?.message}
          autoCapitalize="characters"
        />
        <Input
          label="Guardian name (optional)"
          value={addStudentForm.watch('guardianName')}
          onChangeText={value =>
            addStudentForm.setValue('guardianName', value, {
              shouldValidate: true,
            })
          }
          error={addStudentForm.formState.errors.guardianName?.message}
          autoCapitalize="words"
        />
        <Input
          label="Guardian phone (optional)"
          value={addStudentForm.watch('guardianPhone')}
          onChangeText={value =>
            addStudentForm.setValue('guardianPhone', value, {
              shouldValidate: true,
            })
          }
          error={addStudentForm.formState.errors.guardianPhone?.message}
          keyboardType="phone-pad"
        />
        {addStudentMutation.isError || updateStudentMutation.isError ? (
          <Text accessibilityRole="alert" style={styles.inlineError}>
            {(addStudentMutation.error ?? updateStudentMutation.error)?.message}
          </Text>
        ) : null}
        <Button
          title={editingStudent ? 'Save changes' : 'Save student'}
          loading={
            addStudentMutation.isPending || updateStudentMutation.isPending
          }
          onPress={addStudentForm.handleSubmit(values =>
            editingStudent
              ? updateStudentMutation.mutate(values)
              : addStudentMutation.mutate(values),
          )}
        />
      </AppModal>
      <AppModal
        visible={Boolean(feedbackTarget)}
        title="Submission feedback"
        onClose={() => {
          setFeedbackTarget(null);
          setFeedbackError(null);
          feedbackMutation.reset();
        }}
      >
        <Input
          label="Feedback"
          value={feedbackValue}
          onChangeText={setFeedbackValue}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          maxLength={4000}
        />
        {feedbackError || feedbackMutation.isError ? (
          <Text accessibilityRole="alert" style={styles.inlineError}>
            {feedbackError ?? feedbackMutation.error?.message}
          </Text>
        ) : null}
        <Button
          title="Save feedback"
          loading={feedbackMutation.isPending}
          onPress={() => {
            const validated = z
              .string()
              .trim()
              .min(1, 'Enter feedback.')
              .max(4000, 'Feedback must be 4000 characters or less.')
              .safeParse(feedbackValue);
            if (!validated.success) {
              setFeedbackError(
                validated.error.issues[0]?.message ?? 'Invalid feedback.',
              );
              return;
            }
            if (typeof feedbackTarget?.id !== 'string') {
              setFeedbackError('Submission not found.');
              return;
            }
            setFeedbackError(null);
            feedbackMutation.mutate({
              submissionId: feedbackTarget.id,
              feedback: validated.data,
            });
          }}
        />
      </AppModal>
      <AppModal
        visible={markEntryVisible}
        title="Enter marks"
        onClose={() => {
          setMarkEntryVisible(false);
          markMutation.reset();
          setMarkValidationError(null);
        }}
      >
        <Text style={styles.formLabel}>Exam · subject</Text>
        <ScrollView style={styles.optionList} nestedScrollEnabled>
          {(examSubjectQuery.data ?? []).map(option => (
            <Pressable
              key={`${option.exam_id}:${option.subject_id}`}
              accessibilityRole="radio"
              accessibilityState={{
                checked:
                  selectedExamSubject?.exam_id === option.exam_id &&
                  selectedExamSubject.subject_id === option.subject_id,
              }}
              onPress={() => {
                setSelectedExamSubject(option);
                setMarkValidationError(null);
              }}
              style={[
                styles.optionRow,
                selectedExamSubject?.exam_id === option.exam_id &&
                  selectedExamSubject.subject_id === option.subject_id &&
                  styles.optionSelected,
              ]}
            >
              <Text style={styles.rowTitle}>
                {option.exam_name} · {option.subject_name}
              </Text>
              <Text style={styles.rowSubtitle}>
                Maximum {option.max_marks} marks
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.formLabel}>Student</Text>
        <ScrollView style={styles.optionList} nestedScrollEnabled>
          {(sectionStudentsQuery.data ?? []).map(student => (
            <Pressable
              key={student.id}
              accessibilityRole="radio"
              accessibilityState={{
                checked: selectedMarkStudent?.id === student.id,
              }}
              onPress={() => setSelectedMarkStudent(student)}
              style={[
                styles.optionRow,
                selectedMarkStudent?.id === student.id && styles.optionSelected,
              ]}
            >
              <Text style={styles.rowTitle}>{student.full_name}</Text>
              <Text style={styles.rowSubtitle}>{student.admission_number}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Input
          label={`Score${
            selectedExamSubject ? ` (max ${selectedExamSubject.max_marks})` : ''
          }`}
          value={String(markForm.watch('score'))}
          onChangeText={value => {
            markForm.setValue('score', value, {
              shouldValidate: true,
            });
            setMarkValidationError(null);
          }}
          error={markForm.formState.errors.score?.message}
          keyboardType="decimal-pad"
        />
        {markValidationError ? (
          <Text accessibilityRole="alert" style={styles.inlineError}>
            {markValidationError}
          </Text>
        ) : null}
        <Button
          title="Save marks"
          loading={markMutation.isPending}
          disabled={!selectedExamSubject || !selectedMarkStudent}
          onPress={markForm.handleSubmit(values => {
            setMarkValidationError(null);
            markMutation.mutate(values.score);
          })}
        />
      </AppModal>
      <AppModal
        visible={assignmentVisible}
        title="New assignment"
        onClose={() => {
          setAssignmentVisible(false);
          assignmentMutation.reset();
        }}
      >
        <Text style={styles.formLabel}>Subject</Text>
        <View style={styles.subjectPicker}>
          {(subjectsQuery.data ?? []).map((subject: SchoolSubject) => (
            <Pressable
              key={subject.id}
              accessibilityRole="radio"
              accessibilityState={{
                checked: assignmentForm.watch('subjectId') === subject.id,
              }}
              onPress={() =>
                assignmentForm.setValue('subjectId', subject.id, {
                  shouldValidate: true,
                })
              }
              style={[
                styles.sectionChip,
                assignmentForm.watch('subjectId') === subject.id &&
                  styles.sectionChipSelected,
              ]}
            >
              <Text style={styles.sectionChipText}>{subject.name}</Text>
            </Pressable>
          ))}
        </View>
        {assignmentForm.formState.errors.subjectId ? (
          <Text accessibilityRole="alert" style={styles.inlineError}>
            {assignmentForm.formState.errors.subjectId.message}
          </Text>
        ) : null}
        <Input
          label="Title"
          value={assignmentForm.watch('title')}
          onChangeText={value =>
            assignmentForm.setValue('title', value, { shouldValidate: true })
          }
          error={assignmentForm.formState.errors.title?.message}
          maxLength={160}
        />
        <Input
          label="Instructions"
          value={assignmentForm.watch('description')}
          onChangeText={value =>
            assignmentForm.setValue('description', value, {
              shouldValidate: true,
            })
          }
          error={assignmentForm.formState.errors.description?.message}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          maxLength={4000}
        />
        <Input
          label="Due date (YYYY-MM-DD)"
          value={assignmentForm.watch('dueDate')}
          onChangeText={value =>
            assignmentForm.setValue('dueDate', value, {
              shouldValidate: true,
            })
          }
          error={assignmentForm.formState.errors.dueDate?.message}
          placeholder="2026-10-30"
        />
        {subjectsQuery.error ? (
          <Text accessibilityRole="alert" style={styles.inlineError}>
            {subjectsQuery.error.message}
          </Text>
        ) : null}
        {assignmentMutation.isError ? (
          <Text accessibilityRole="alert" style={styles.inlineError}>
            {assignmentMutation.error.message}
          </Text>
        ) : null}
        <Button
          title="Publish assignment"
          loading={assignmentMutation.isPending}
          onPress={assignmentForm.handleSubmit(values =>
            assignmentMutation.mutate(values),
          )}
        />
      </AppModal>
      <AppModal
        visible={noticeVisible}
        title="New notice"
        onClose={() => {
          setNoticeVisible(false);
          noticeMutation.reset();
        }}
      >
        {user?.role === 'admin' ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: schoolWideNotice }}
            onPress={() => setSchoolWideNotice(current => !current)}
            style={styles.checkboxRow}
          >
            <Text style={styles.checkbox}>
              {schoolWideNotice ? '☑' : '☐'} School-wide notice
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.rowSubtitle}>
            This notice will be shared with your selected class.
          </Text>
        )}
        <Input
          label="Title"
          value={noticeForm.watch('title')}
          onChangeText={value =>
            noticeForm.setValue('title', value, { shouldValidate: true })
          }
          error={noticeForm.formState.errors.title?.message}
          maxLength={120}
        />
        <Input
          label="Message"
          value={noticeForm.watch('body')}
          onChangeText={value =>
            noticeForm.setValue('body', value, { shouldValidate: true })
          }
          error={noticeForm.formState.errors.body?.message}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          maxLength={4000}
        />
        {noticeMutation.isError ? (
          <Text accessibilityRole="alert" style={styles.inlineError}>
            {noticeMutation.error.message}
          </Text>
        ) : null}
        <Button
          title="Publish notice"
          loading={noticeMutation.isPending}
          onPress={noticeForm.handleSubmit(values =>
            noticeMutation.mutate(values),
          )}
        />
      </AppModal>
    </SafeAreaView>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    minHeight: 84,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 44,
    height: 48,
    justifyContent: 'center',
  },
  backText: { color: theme.colors.primary, fontSize: 36, lineHeight: 40 },
  headerBody: { flex: 1 },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: '700' },
  subtitle: { color: theme.colors.muted, fontSize: 13, marginTop: 2 },
  searchWrap: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
  },
  sectionPicker: { padding: theme.spacing.md, gap: theme.spacing.sm },
  sectionChip: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  sectionChipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.accent,
  },
  sectionChipText: { color: theme.colors.muted, fontWeight: '600' },
  sectionChipTextSelected: { color: theme.colors.primary },
  action: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  dateLabel: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  list: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  separator: { height: theme.spacing.sm },
  row: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center' },
  rowBody: { flex: 1, gap: 4 },
  rowTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  rowSubtitle: { color: theme.colors.muted, fontSize: 13, lineHeight: 19 },
  resultTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
  },
  resultFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  editButton: { alignSelf: 'flex-end', paddingTop: theme.spacing.sm },
  editButtonText: { color: theme.colors.primary, fontWeight: '700' },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.md,
    flexWrap: 'wrap',
  },
  submissionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  checkboxRow: { paddingVertical: theme.spacing.sm },
  checkbox: { color: theme.colors.text, fontWeight: '600' },
  formLabel: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  subjectPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  optionList: { maxHeight: 180 },
  optionRow: {
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionSelected: { backgroundColor: theme.colors.accent },
  attendanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  statusText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 11,
  },
  statusChoices: { flexDirection: 'row', gap: 6, marginTop: theme.spacing.sm },
  statusChoice: {
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  statusChoiceSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  statusChoiceText: {
    color: theme.colors.muted,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  statusChoiceTextSelected: { color: theme.colors.surface, fontWeight: '700' },
  loading: { padding: theme.spacing.md },
  message: { padding: theme.spacing.md },
  inlineError: {
    color: theme.colors.danger,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
});
