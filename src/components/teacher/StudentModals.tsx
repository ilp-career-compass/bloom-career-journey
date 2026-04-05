import React from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Compass } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { Student } from './StudentsTab';
import type { SchoolClass } from '@/integrations/supabase/types';

function getStatusColor(status: string) {
    switch (status) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'inactive': return 'bg-gray-100 text-gray-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'graduated': return 'bg-blue-100 text-blue-800';
        case 'transferred': return 'bg-purple-100 text-purple-800';
        case 'completed': return 'bg-green-100 text-green-800';
        case 'unlocked': return 'bg-blue-100 text-blue-800';
        case 'locked': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// ─── Add Student Modal ──────────────────────────────────────────────
const LANG_LABELS: Record<string, string> = { en: 'English', kn: 'ಕನ್ನಡ', ta: 'தமிழ்', hi: 'हिन्दी' };

interface AddStudentModalProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    newStudent: { fullName: string; phone: string; grade: string; stateId?: string; preferredLanguage?: string };
    setNewStudent: React.Dispatch<React.SetStateAction<{ fullName: string; phone: string; grade: string; stateId?: string; preferredLanguage?: string }>>;
    onSubmit: () => void;
}

function isValidPhone(phone: string): boolean {
    if (!phone) return true; // empty is not an error (just not submittable)
    return /^\+\d{10,15}$/.test(phone);
}

export function AddStudentModal({ open, onOpenChange, newStudent, setNewStudent, onSubmit }: AddStudentModalProps) {
    const phoneError = newStudent.phone && !isValidPhone(newStudent.phone)
        ? 'Phone must be in E.164 format (e.g. +919876543210)'
        : '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-gray-800">Add New Student</DialogTitle>
                    <DialogDescription>
                        Enroll a new student and create their account. They will receive login credentials.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Student Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name *</Label>
                                <Input
                                    id="fullName"
                                    value={newStudent.fullName}
                                    onChange={(e) => setNewStudent(prev => ({ ...prev, fullName: e.target.value }))}
                                    placeholder="Enter student's full name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Mobile Number *</Label>
                                <Input
                                    id="phone"
                                    value={newStudent.phone}
                                    onChange={(e) => setNewStudent(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="+91XXXXXXXXXX"
                                    className={phoneError ? 'border-red-400' : ''}
                                />
                                {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="grade">Grade *</Label>
                                <Select value={newStudent.grade} onValueChange={(value) => setNewStudent(prev => ({ ...prev, grade: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Grade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="8">Grade 8</SelectItem>
                                        <SelectItem value="9">Grade 9</SelectItem>
                                        <SelectItem value="10">Grade 10</SelectItem>
                                        <SelectItem value="11">Grade 11</SelectItem>
                                        <SelectItem value="12">Grade 12</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="language">Preferred Language</Label>
                                <Select value={newStudent.preferredLanguage || 'en'} onValueChange={(value) => setNewStudent(prev => ({ ...prev, preferredLanguage: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(LANG_LABELS).map(([code, label]) => (
                                            <SelectItem key={code} value={code}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={onSubmit}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={!newStudent.fullName || !newStudent.phone || !newStudent.grade || !!phoneError}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Student
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Student Details Modal ──────────────────────────────────────────
interface StudentDetailsModalProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    selectedStudent: Student | null;
    activityTimeline: Array<{ id: string; title: string; seq: number; status: string; completed_at?: string }>;
}

export function StudentDetailsModal({ open, onOpenChange, selectedStudent, activityTimeline }: StudentDetailsModalProps) {
    const navigate = useNavigate();
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">{selectedStudent?.user?.full_name || 'Student Details'}</DialogTitle>
                    <DialogDescription>Basic profile and current status</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <div className="text-gray-500">Name</div>
                            <div className="font-medium">{selectedStudent?.user?.full_name}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">Mobile</div>
                            <div className="font-medium">{selectedStudent?.user?.mobile || '—'}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">Email</div>
                            <div className="font-medium">{selectedStudent?.user?.email || '—'}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">Class</div>
                            <div className="font-medium">{selectedStudent?.class?.name || '—'}</div>
                        </div>
                        <div>
                            <div className="text-gray-500">Status</div>
                            <div><Badge className={getStatusColor(selectedStudent?.enrollment_status || 'pending')}>{selectedStudent?.enrollment_status}</Badge></div>
                        </div>
                    </div>
                    {/* Activity timeline */}
                    <div className="pt-2">
                        <div className="text-sm font-medium mb-2">Activities</div>
                        {activityTimeline.length === 0 ? (
                            <div className="text-sm text-gray-500">No activity data yet.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-2 pr-2">Sequence</th>
                                            <th className="text-left py-2 pr-2">Title</th>
                                            <th className="text-left py-2 pr-2">Status</th>
                                            <th className="text-left py-2">Completed</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activityTimeline.map(a => (
                                            <tr key={a.id} className="border-b border-gray-100">
                                                <td className="py-2 pr-2">{a.seq}</td>
                                                <td className="py-2 pr-2">{a.title}</td>
                                                <td className="py-2 pr-2">
                                                    <Badge className={getStatusColor(a.status)}>{a.status}</Badge>
                                                </td>
                                                <td className="py-2">{a.completed_at ? new Date(a.completed_at).toLocaleString() : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    {selectedStudent?.id && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                onOpenChange(false);
                                navigate(`/teacher/student-profile-card/${selectedStudent.id}`);
                            }}
                        >
                            <Compass className="w-4 h-4 mr-2" />
                            View Profile Card
                        </Button>
                    )}
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── View Progress Modal ────────────────────────────────────────────
interface ViewProgressModalProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    selectedStudent: Student | null;
    progressSummary: { [k: string]: { count: number; last?: string } };
}

export function ViewProgressModal({ open, onOpenChange, selectedStudent, progressSummary }: ViewProgressModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="text-xl">{selectedStudent?.user?.full_name || 'Student'} – Progress</DialogTitle>
                    <DialogDescription>Latest assessment status and counts</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {['inspiration', 'about_me', 'dreams', 'school_learning', 'hobbies', 'role_models'].map((t) => (
                            <Card key={t} className="border shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base capitalize">{t.replace('_', ' ')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-gray-600">Submissions: <span className="font-medium">{progressSummary[t]?.count || 0}</span></div>
                                    <div className="text-sm text-gray-600">Last completed: <span className="font-medium">{progressSummary[t]?.last ? new Date(progressSummary[t]!.last!).toLocaleString() : '—'}</span></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => window.print()}>Print</Button>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Assessment Answers Modal ───────────────────────────────────────
interface AssessmentAnswersModalProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    selectedStudent: Student | null;
    assessmentAnswers: any[];
    renderReadableAnswers: (assessmentType: string, responses: any) => React.ReactNode;
}

export function AssessmentAnswersModal({ open, onOpenChange, selectedStudent, assessmentAnswers, renderReadableAnswers }: AssessmentAnswersModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" data-print-content>
                <DialogHeader>
                    <DialogTitle className="text-xl">{selectedStudent?.user?.full_name || 'Student'} – Assessment Answers</DialogTitle>
                    <DialogDescription>Latest submissions across all assessments</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    {assessmentAnswers.length === 0 ? (
                        <div className="text-sm text-gray-500">No assessment submissions yet.</div>
                    ) : (
                        assessmentAnswers.map((r: any) => (
                            <Card key={`${r.assessment_type}-${r.completed_at || r.updated_at}`} className="border shadow-sm" data-assessment-card>
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        <span className="capitalize">{r.assessment_type.replace('_', ' ')}</span> – {r.assessment_title}
                                        {r.completed_at && (
                                            <span className="ml-2 text-sm text-gray-500">{new Date(r.completed_at).toLocaleString()}</span>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {renderReadableAnswers(r.assessment_type, r.responses)}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
                <div className="flex justify-end gap-2 print:hidden">
                    <Button variant="outline" onClick={() => window.print()}>Print</Button>
                    <Button onClick={() => onOpenChange(false)}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Add Existing Student Modal ─────────────────────────────────────
interface AddExistingStudentModalProps {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    existingQuery: string;
    setExistingQuery: (v: string) => void;
    existingResults: any[];
    enrollTarget: { userId: string; name: string } | null;
    setEnrollTarget: (v: { userId: string; name: string } | null) => void;
    enrollClassId: string;
    setEnrollClassId: (v: string) => void;
    isClassLocked: boolean;
    setIsClassLocked: (v: boolean) => void;
    enrolling: boolean;
    classes: SchoolClass[];
    userId?: string;
    onSearch: () => void;
    onEnroll: () => void;
}

export function AddExistingStudentModal({
    open, onOpenChange, existingQuery, setExistingQuery,
    existingResults, enrollTarget, setEnrollTarget,
    enrollClassId, setEnrollClassId, isClassLocked, setIsClassLocked,
    enrolling, classes, onSearch, onEnroll,
}: AddExistingStudentModalProps) {
    return (
        <Dialog open={open} onOpenChange={(v) => {
            onOpenChange(v);
            if (!v) {
                setEnrollTarget(null);
            }
        }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-gray-800">Add Existing Student</DialogTitle>
                    <DialogDescription>
                        Search by mobile, email, or name and enroll the student into your class.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="flex gap-2">
                        <Input placeholder="Enter student mobile / email / name" value={existingQuery} onChange={(e) => setExistingQuery(e.target.value)} />
                        <Button onClick={onSearch}>
                            <Search className="w-4 h-4 mr-2" /> Search
                        </Button>
                    </div>

                    {existingResults.length === 0 ? (
                        <div className="text-sm text-gray-500">No student found. You can create a new one instead.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-2 px-3">Name</th>
                                        <th className="text-left py-2 px-3">Mobile / Email</th>
                                        <th className="text-left py-2 px-3">Language</th>
                                        <th className="text-left py-2 px-3">Current Class</th>
                                        <th className="text-left py-2 px-3">Mentor</th>
                                        <th className="text-left py-2 px-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {existingResults.map((row: any) => {
                                        const isDefault = row.is_default_mentor ||
                                            !row.mentor_name ||
                                            (row.mentor_name && row.mentor_name.includes('ILP Mentor'));

                                        return (
                                            <tr key={row.student_user_id} className="border-b border-gray-100">
                                                <td className="py-2 px-3">{row.full_name}</td>
                                                <td className="py-2 px-3">{row.mobile || row.email}</td>
                                                <td className="py-2 px-3">{LANG_LABELS[row.preferred_language] || row.preferred_language || '—'}</td>
                                                <td className="py-2 px-3">{row.current_class || '—'}</td>
                                                <td className="py-2 px-3">
                                                    <Badge variant={isDefault ? "secondary" : "outline"} className="text-[10px]">
                                                        {row.mentor_name}
                                                    </Badge>
                                                </td>
                                                <td className="py-2 px-3">
                                                    <Button
                                                        size="sm"
                                                        variant={isDefault ? "outline" : "ghost"}
                                                        disabled={!isDefault && row.mentor_name !== 'None'}
                                                        onClick={() => {
                                                            setEnrollTarget({ userId: row.student_user_id, name: row.full_name });
                                                            const matchedClass = classes.find((c: any) => (c.name || c.class_name) === row.current_class);
                                                            if (matchedClass) {
                                                                setEnrollClassId((matchedClass as any).id || (matchedClass as any).class_id);
                                                                setIsClassLocked(true);
                                                            } else {
                                                                setEnrollClassId('');
                                                                setIsClassLocked(false);
                                                            }
                                                        }}
                                                    >
                                                        {row.mentor_name !== 'None' && !isDefault ? 'Already Mentored' : 'Enroll'}
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {enrollTarget && (
                        <div className="mt-4 space-y-3 rounded-md border p-3 bg-white">
                            <div className="text-sm text-gray-700">Enroll <span className="font-medium">{enrollTarget.name}</span></div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                                <div className="space-y-1 md:col-span-2">
                                    <div className="text-sm text-gray-600">Select Class (required)</div>
                                    <Select value={enrollClassId} onValueChange={setEnrollClassId} disabled={isClassLocked}>
                                        <SelectTrigger className={isClassLocked ? "bg-gray-100" : ""}>
                                            <SelectValue placeholder={classes.length ? 'Choose class' : 'No classes available'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {classes.map((c: any) => (
                                                <SelectItem key={c.id || c.class_id} value={(c.id || c.class_id) as string}>{c.name || c.class_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex gap-2 justify-end md:justify-start">
                                    <Button disabled={enrolling || !enrollClassId} onClick={onEnroll}>
                                        Confirm Enroll
                                    </Button>
                                    <Button variant="ghost" onClick={() => setEnrollTarget(null)}>Cancel</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
