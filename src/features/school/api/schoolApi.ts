import type { AttendanceStatus, Role, UUID } from '../../../types/domain';
import { getSupabaseClient } from '../../../services/supabase/client';
import type { Asset } from 'react-native-image-picker';
import { createUuid } from '../../../utils/id';
import { summarizeAttendance, type AttendanceSummary } from '../utils/metrics';

export type SchoolFeature =
  | 'students'
  | 'attendance'
  | 'results'
  | 'timetable'
  | 'assignments'
  | 'fees'
  | 'notices';

export interface SchoolSection {
  id: UUID;
  name: string;
  class_id: UUID;
}

export interface SchoolSubject {
  id: UUID;
  name: string;
}

export interface ExamSubjectOption {
  exam_id: UUID;
  subject_id: UUID;
  exam_name: string;
  subject_name: string;
  max_marks: number;
}

export interface StudentRecord {
  id: UUID;
  section_id: UUID;
  full_name: string;
  admission_number: string;
  guardian_name: string | null;
  guardian_phone: string | null;
  active: boolean;
  photo_path: string | null;
  photo_url?: string;
}

export interface AttendanceEntry {
  id: UUID | null;
  student_id: UUID;
  full_name: string;
  admission_number: string;
  status: AttendanceStatus | null;
}

export interface SchoolRecord {
  id: UUID;
  [key: string]: unknown;
}

export interface StudentPage {
  students: StudentRecord[];
  nextOffset: number | undefined;
}

const PAGE_SIZE = 25;

function throwIfError(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message);
  }
}

export async function getSections(
  role: Role,
  userId: UUID,
  instituteId: UUID,
): Promise<SchoolSection[]> {
  const supabase = getSupabaseClient();
  if (role === 'student') {
    const { data, error } = await supabase
      .from('students')
      .select('section_id')
      .eq('user_id', userId)
      .maybeSingle();
    throwIfError(error);
    if (!data) {
      return [];
    }
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .select('id,name,class_id')
      .eq('id', data.section_id)
      .maybeSingle();
    throwIfError(sectionError);
    return section ? [section] : [];
  }

  if (role === 'teacher') {
    const { data: allocations, error: allocationError } = await supabase
      .from('teacher_allocations')
      .select('section_id')
      .eq('teacher_id', userId);
    throwIfError(allocationError);
    const sectionIds = [
      ...new Set((allocations ?? []).map(row => row.section_id)),
    ];
    if (sectionIds.length === 0) {
      return [];
    }
    const { data, error } = await supabase
      .from('sections')
      .select('id,name,class_id')
      .in('id', sectionIds)
      .order('name');
    throwIfError(error);
    return data ?? [];
  }

  const { data, error } = await supabase
    .from('sections')
    .select('id,name,class_id')
    .eq('institute_id', instituteId)
    .order('name');
  throwIfError(error);
  return data ?? [];
}

export async function getStudentsPage(
  instituteId: UUID,
  search: string,
  offset: number,
  sectionId?: UUID,
): Promise<StudentPage> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('students')
    .select(
      'id,section_id,full_name,admission_number,guardian_name,guardian_phone,active,photo_path',
    )
    .eq('institute_id', instituteId)
    .order('full_name')
    .order('id')
    .range(offset, offset + PAGE_SIZE - 1);
  const searchTerm = search
    .trim()
    .replace(/[,.():%"_*\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (searchTerm) {
    query = query.or(
      `full_name.ilike.%${searchTerm}%,admission_number.ilike.%${searchTerm}%`,
    );
  }
  if (sectionId) {
    query = query.eq('section_id', sectionId);
  }
  const { data, error } = await query;
  throwIfError(error);
  const students = await Promise.all(
    (data ?? []).map(async student => ({
      ...student,
      photo_url: student.photo_path
        ? await getPrivateImageUrl('student-photos', student.photo_path)
        : undefined,
    })),
  );
  return {
    students,
    nextOffset: students.length === PAGE_SIZE ? offset + PAGE_SIZE : undefined,
  };
}

export async function createStudent(input: {
  instituteId: UUID;
  sectionId: UUID;
  fullName: string;
  admissionNumber: string;
  guardianName: string;
  guardianPhone: string;
}): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('students')
    .insert({
      institute_id: input.instituteId,
      section_id: input.sectionId,
      full_name: input.fullName.trim(),
      admission_number: input.admissionNumber.trim(),
      guardian_name: input.guardianName.trim() || null,
      guardian_phone: input.guardianPhone.trim() || null,
    });
  throwIfError(error);
}

export async function updateStudent(input: {
  instituteId: UUID;
  studentId: UUID;
  fullName: string;
  admissionNumber: string;
  guardianName: string;
  guardianPhone: string;
}): Promise<void> {
  const { data, error } = await getSupabaseClient()
    .from('students')
    .update({
      full_name: input.fullName.trim(),
      admission_number: input.admissionNumber.trim(),
      guardian_name: input.guardianName.trim() || null,
      guardian_phone: input.guardianPhone.trim() || null,
    })
    .eq('institute_id', input.instituteId)
    .eq('id', input.studentId)
    .select('id')
    .maybeSingle();
  throwIfError(error);
  if (!data) {
    throw new Error('Student was not found or cannot be updated.');
  }
}

export async function uploadStudentPhoto(input: {
  instituteId: UUID;
  studentId: UUID;
  uri: string;
  mimeType: string;
}): Promise<string> {
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!input.uri || !allowedTypes.has(input.mimeType)) {
    throw new Error('Choose a JPEG, PNG, or WebP student photo.');
  }
  const response = await fetch(input.uri);
  if (!response.ok) {
    throw new Error('Unable to read the selected student photo.');
  }
  const blob = await response.blob();
  if (blob.size > 5 * 1024 * 1024) {
    throw new Error('Student photos must be 5 MB or smaller.');
  }
  const extension =
    input.mimeType === 'image/jpeg'
      ? 'jpg'
      : input.mimeType === 'image/png'
      ? 'png'
      : 'webp';
  const path = `${input.instituteId}/${
    input.studentId
  }/${createUuid()}.${extension}`;
  const supabase = getSupabaseClient();
  const { error: uploadError } = await supabase.storage
    .from('student-photos')
    .upload(path, blob, { contentType: input.mimeType, upsert: false });
  throwIfError(uploadError);
  const { data, error: updateError } = await supabase
    .from('students')
    .update({ photo_path: path })
    .eq('institute_id', input.instituteId)
    .eq('id', input.studentId)
    .select('id')
    .maybeSingle();
  if (updateError || !data) {
    const { error: cleanupError } = await supabase.storage
      .from('student-photos')
      .remove([path]);
    if (cleanupError) {
      throw new Error(
        `${
          updateError?.message ?? 'Student photo could not be saved.'
        } The uploaded photo could not be removed: ${cleanupError.message}`,
      );
    }
    throwIfError(updateError);
    throw new Error('Student was not found or cannot be updated.');
  }
  return path;
}

export async function uploadStudentPhotoAsset(
  instituteId: UUID,
  studentId: UUID,
  asset: Asset,
): Promise<void> {
  if (!asset.uri || !asset.type) {
    throw new Error('The selected photo cannot be read.');
  }
  await uploadStudentPhoto({
    instituteId,
    studentId,
    uri: asset.uri,
    mimeType: asset.type,
  });
}

export async function getPrivateImageUrl(
  bucket: 'student-photos' | 'assignment-files',
  path: string,
): Promise<string> {
  const { data, error } = await getSupabaseClient()
    .storage.from(bucket)
    .createSignedUrl(path, 60 * 5);
  throwIfError(error);
  if (!data) {
    throw new Error('Private image URL was not created.');
  }
  return data.signedUrl;
}

export async function createNotice(input: {
  instituteId: UUID;
  createdBy: UUID;
  title: string;
  body: string;
  sectionId: UUID | null;
}): Promise<{ notificationWarning?: string }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('notices')
    .insert({
      institute_id: input.instituteId,
      created_by: input.createdBy,
      title: input.title.trim(),
      body: input.body.trim(),
      section_id: input.sectionId,
    })
    .select('id')
    .single();
  throwIfError(error);
  if (!data) {
    throw new Error('Notice was not saved.');
  }
  const { data: notification, error: notificationError } =
    await supabase.functions.invoke('send-notice-push', {
      body: { noticeId: data.id },
    });
  if (notificationError) {
    return {
      notificationWarning: `Notice was published, but push delivery failed: ${notificationError.message}`,
    };
  }
  if (notification?.failed) {
    return {
      notificationWarning: `Notice was published; push delivery failed for ${notification.failed} device(s).`,
    };
  }
  if (notification?.error) {
    return {
      notificationWarning: `Notice was published, but push delivery failed: ${notification.error}`,
    };
  }
  return {};
}

export async function registerDeviceToken(input: {
  userId: UUID;
  instituteId: UUID;
  token: string;
  platform: 'ios' | 'android';
}): Promise<void> {
  const { error } = await getSupabaseClient().from('device_tokens').upsert(
    {
      user_id: input.userId,
      institute_id: input.instituteId,
      token: input.token,
      platform: input.platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' },
  );
  throwIfError(error);
}

export async function getSectionSubjects(
  role: Role,
  userId: UUID,
  instituteId: UUID,
  sectionId: UUID,
): Promise<SchoolSubject[]> {
  const supabase = getSupabaseClient();
  if (role === 'teacher') {
    const { data: allocations, error: allocationError } = await supabase
      .from('teacher_allocations')
      .select('subject_id')
      .eq('teacher_id', userId)
      .eq('section_id', sectionId);
    throwIfError(allocationError);
    const subjectIds = [
      ...new Set((allocations ?? []).map(row => row.subject_id)),
    ];
    if (!subjectIds.length) {
      return [];
    }
    const { data, error } = await supabase
      .from('subjects')
      .select('id,name')
      .eq('institute_id', instituteId)
      .in('id', subjectIds)
      .order('name');
    throwIfError(error);
    return data ?? [];
  }
  const { data, error } = await supabase
    .from('subjects')
    .select('id,name')
    .eq('institute_id', instituteId)
    .order('name');
  throwIfError(error);
  return data ?? [];
}

export async function createAssignment(input: {
  instituteId: UUID;
  sectionId: UUID;
  subjectId: UUID;
  createdBy: UUID;
  title: string;
  description: string;
  dueAt: string;
}): Promise<void> {
  const { error } = await getSupabaseClient().from('assignments').insert({
    institute_id: input.instituteId,
    section_id: input.sectionId,
    subject_id: input.subjectId,
    created_by: input.createdBy,
    title: input.title.trim(),
    description: input.description.trim(),
    due_at: input.dueAt,
  });
  throwIfError(error);
}

export async function submitAssignmentFile(input: {
  instituteId: UUID;
  studentId: UUID;
  assignmentId: UUID;
  uri: string;
  mimeType: string;
}): Promise<void> {
  if (!input.uri) {
    throw new Error('The selected file is not accessible on this device.');
  }
  const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
  if (!allowedTypes.has(input.mimeType)) {
    throw new Error('Choose a PDF, JPEG, or PNG file.');
  }
  const supabase = getSupabaseClient();
  const extension =
    input.mimeType === 'application/pdf'
      ? 'pdf'
      : input.mimeType === 'image/jpeg'
      ? 'jpg'
      : 'png';
  const filePath = `${input.instituteId}/${input.studentId}/${
    input.assignmentId
  }/${createUuid()}.${extension}`;
  const response = await fetch(input.uri);
  if (!response.ok) {
    throw new Error('Unable to read the selected assignment file.');
  }
  const file = await response.blob();
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Assignment files must be 10 MB or smaller.');
  }
  const { error: uploadError } = await supabase.storage
    .from('assignment-files')
    .upload(filePath, file, {
      contentType: input.mimeType,
      upsert: false,
    });
  throwIfError(uploadError);

  const { error: submissionError } = await supabase.rpc('submit_assignment', {
    target_assignment: input.assignmentId,
    submitted_file_path: filePath,
  });
  if (submissionError) {
    const { error: cleanupError } = await supabase.storage
      .from('assignment-files')
      .remove([filePath]);
    if (cleanupError) {
      throw new Error(
        `${submissionError.message} The uploaded file could not be removed: ${cleanupError.message}`,
      );
    }
    throw new Error(submissionError.message);
  }
}

export async function getOwnStudentId(userId: UUID): Promise<UUID> {
  const { data, error } = await getSupabaseClient()
    .from('students')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  throwIfError(error);
  if (!data) {
    throw new Error('No student profile is linked to this account.');
  }
  return data.id;
}

export async function simulateFeePayment(
  feeId: UUID,
  idempotencyKey: UUID,
): Promise<void> {
  const { data, error } = await getSupabaseClient().functions.invoke(
    'mock-payment',
    { body: { feeId, idempotencyKey } },
  );
  if (error) {
    throw new Error(error.message);
  }
  if (
    !data ||
    typeof data !== 'object' ||
    !('payment' in data) ||
    !data.payment ||
    typeof data.payment !== 'object' ||
    !('simulated' in data.payment) ||
    data.payment.simulated !== true
  ) {
    throw new Error('The payment function returned an invalid response.');
  }
}

export async function getExamSubjectOptions(
  instituteId: UUID,
  sectionId: UUID,
): Promise<ExamSubjectOption[]> {
  const { data, error } = await getSupabaseClient()
    .from('exam_subjects')
    .select('exam_id,subject_id,max_marks,exams(name),subjects(name)')
    .eq('institute_id', instituteId)
    .eq('section_id', sectionId)
    .order('exam_id', { ascending: false });
  throwIfError(error);
  return (data ?? []).map(row => ({
    exam_id: row.exam_id,
    subject_id: row.subject_id,
    exam_name: relationName(row.exams),
    subject_name: relationName(row.subjects),
    max_marks: Number(row.max_marks),
  }));
}

function relationName(value: unknown): string {
  const relation = Array.isArray(value) ? value[0] : value;
  if (relation && typeof relation === 'object') {
    const name = (relation as Record<string, unknown>).name;
    return typeof name === 'string' ? name : '';
  }
  return '';
}

export async function getSectionStudents(
  instituteId: UUID,
  sectionId: UUID,
): Promise<StudentRecord[]> {
  const { data, error } = await getSupabaseClient()
    .from('students')
    .select(
      'id,section_id,full_name,admission_number,guardian_name,guardian_phone,active,photo_path',
    )
    .eq('institute_id', instituteId)
    .eq('section_id', sectionId)
    .eq('active', true)
    .order('full_name')
    .limit(500);
  throwIfError(error);
  return data ?? [];
}

export async function getStudentSubmissions(assignmentId: UUID): Promise<
  {
    id: UUID;
    file_path: string;
    submitted_at: string;
    feedback: string | null;
    graded_at: string | null;
  }[]
> {
  const { data, error } = await getSupabaseClient()
    .from('submissions')
    .select('id,file_path,submitted_at,feedback,graded_at')
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false })
    .limit(1);
  throwIfError(error);
  return data ?? [];
}

export async function getStudentAssignmentSubmission(
  assignmentId: UUID,
  studentId: UUID,
): Promise<SchoolRecord | null> {
  const { data, error } = await getSupabaseClient()
    .from('submissions')
    .select('id,file_path,submitted_at,feedback,graded_at')
    .eq('assignment_id', assignmentId)
    .eq('student_id', studentId)
    .maybeSingle();
  throwIfError(error);
  return data;
}

export async function saveSubmissionFeedback(input: {
  submissionId: UUID;
  feedback: string;
}): Promise<void> {
  const { data, error } = await getSupabaseClient().rpc('grade_submission', {
    target_submission: input.submissionId,
    feedback_text: input.feedback.trim(),
  });
  throwIfError(error);
  if (!data) {
    throw new Error('Submission not found or cannot be graded.');
  }
}

export async function downloadSubmissionFile(
  filePath: string,
): Promise<string> {
  return getPrivateImageUrl('assignment-files', filePath);
}

export async function saveMark(input: {
  instituteId: UUID;
  sectionId: UUID;
  studentId: UUID;
  examId: UUID;
  subjectId: UUID;
  score: number;
}): Promise<void> {
  const { error } = await getSupabaseClient().from('marks').upsert(
    {
      institute_id: input.instituteId,
      section_id: input.sectionId,
      student_id: input.studentId,
      exam_id: input.examId,
      subject_id: input.subjectId,
      score: input.score,
    },
    { onConflict: 'student_id,exam_id,subject_id' },
  );
  throwIfError(error);
}

export async function getAttendance(
  instituteId: UUID,
  sectionId: UUID,
  date: string,
): Promise<AttendanceEntry[]> {
  const supabase = getSupabaseClient();
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id,full_name,admission_number')
    .eq('institute_id', instituteId)
    .eq('section_id', sectionId)
    .eq('active', true)
    .order('full_name');
  throwIfError(studentsError);
  if (!students?.length) {
    return [];
  }
  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance')
    .select('id,student_id,status')
    .eq('institute_id', instituteId)
    .eq('section_id', sectionId)
    .eq('attendance_date', date)
    .in(
      'student_id',
      students.map(student => student.id),
    );
  throwIfError(attendanceError);
  const attendanceByStudent = new Map(
    (attendance ?? []).map(record => [record.student_id, record]),
  );
  return students.map(student => {
    const record = attendanceByStudent.get(student.id);
    return {
      id: record?.id ?? null,
      student_id: student.id,
      full_name: student.full_name,
      admission_number: student.admission_number,
      status: record?.status ?? null,
    };
  });
}

export async function saveAttendance(input: {
  instituteId: UUID;
  sectionId: UUID;
  studentId: UUID;
  userId: UUID;
  date: string;
  status: AttendanceStatus;
}): Promise<void> {
  const { error } = await getSupabaseClient().from('attendance').upsert(
    {
      institute_id: input.instituteId,
      section_id: input.sectionId,
      student_id: input.studentId,
      recorded_by: input.userId,
      attendance_date: input.date,
      status: input.status,
    },
    { onConflict: 'student_id,attendance_date' },
  );
  throwIfError(error);
}

export async function getMonthlyAttendanceSummary(
  instituteId: UUID,
  sectionId: UUID,
  startDate: string,
  endDate: string,
): Promise<AttendanceSummary[]> {
  const supabase = getSupabaseClient();
  const records = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('attendance')
      .select('student_id,status')
      .eq('institute_id', instituteId)
      .eq('section_id', sectionId)
      .gte('attendance_date', startDate)
      .lte('attendance_date', endDate)
      .range(offset, offset + 999);
    throwIfError(error);
    records.push(...(data ?? []));
    if (!data || data.length < 1000) {
      break;
    }
    offset += 1000;
  }
  return summarizeAttendance(records);
}

export async function getFeatureRecords(
  feature: Exclude<SchoolFeature, 'students' | 'attendance'>,
  instituteId: UUID,
  sectionId?: UUID,
): Promise<SchoolRecord[]> {
  const supabase = getSupabaseClient();
  if (feature === 'results') {
    let query = supabase
      .from('marks')
      .select(
        'id,score,student_id,exam_id,subject_id,exams(name,exam_date),subjects(name),students(full_name,admission_number),exam_subjects(max_marks)',
      )
      .eq('institute_id', instituteId)
      .order('exam_id', { ascending: false })
      .limit(200);
    if (sectionId) {
      query = query.eq('section_id', sectionId);
    }
    const { data, error } = await query;
    throwIfError(error);
    return data ?? [];
  }
  if (feature === 'timetable') {
    let query = supabase
      .from('timetable')
      .select('id,weekday,starts_at,ends_at,room,sections(name),subjects(name)')
      .eq('institute_id', instituteId)
      .order('weekday')
      .order('starts_at')
      .limit(100);
    if (sectionId) {
      query = query.eq('section_id', sectionId);
    }
    const { data, error } = await query;
    throwIfError(error);
    return data ?? [];
  }
  if (feature === 'assignments') {
    let query = supabase
      .from('assignments')
      .select(
        'id,title,description,due_at,attachment_path,sections(name),subjects(name),submissions(id,student_id,submitted_at,feedback,file_path)',
      )
      .eq('institute_id', instituteId)
      .order('due_at')
      .limit(100);
    if (sectionId) {
      query = query.eq('section_id', sectionId);
    }
    const { data, error } = await query;
    throwIfError(error);
    return Promise.all(
      (data ?? []).map(async assignment => ({
        ...assignment,
        submissions: await Promise.all(
          (assignment.submissions ?? []).map(async submission => ({
            ...submission,
            assignment_id: assignment.id,
            file_url: await getPrivateImageUrl(
              'assignment-files',
              submission.file_path,
            ),
          })),
        ),
      })),
    );
  }
  if (feature === 'fees') {
    const { data, error } = await supabase
      .from('fees')
      .select(
        'id,student_id,structure_id,students(full_name,admission_number),fee_structures(name,amount_paise,due_date),payments(amount_paise,status,paid_at)',
      )
      .eq('institute_id', instituteId)
      .order('id')
      .limit(100);
    throwIfError(error);
    return data ?? [];
  }
  const { data, error } = await supabase
    .from('notices')
    .select('id,title,body,published_at,section_id')
    .eq('institute_id', instituteId)
    .order('published_at', { ascending: false })
    .limit(50);
  throwIfError(error);
  return data ?? [];
}
