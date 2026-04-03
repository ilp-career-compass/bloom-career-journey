import React from 'react';
import { logger } from '@/lib/logger';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Users,
    Search,
    Eye,
    Plus,
    Upload,
    MoreHorizontal,
    Activity,
    FileText,
    Map,
    Heart,
    User,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface Student {
    id: string;
    user_id: string;
    class_id: string;
    teacher_id: string;
    enrollment_date: string;
    enrollment_status: string;
    previous_state?: string;
    special_needs?: string;
    parent_guardian_name?: string;
    parent_guardian_phone?: string;
    parent_guardian_email?: string;
    parent_guardian_occupation?: string;
    family_income_range?: string;
    academic_performance?: string;
    attendance_percentage?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    user?: {
        full_name: string;
        email: string;
        mobile?: string;
        preferred_language?: string;
    };
    class?: {
        name: string;
    };
    teacher?: {
        users?: {
            full_name: string;
        };
    };
}

interface StudentsTabProps {
    students: Student[];
    filteredStudents: Student[];
    studentReviewMap: Record<string, { reviewed: number; total: number }>;
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    selectedGrade: string;
    setSelectedGrade: (v: string) => void;
    selectedStatus: string;
    setSelectedStatus: (v: string) => void;
    t: (k: string) => string;
    onAddStudent: () => void;
    onAddExisting: () => void;
    onImportCsv: () => void;
    onViewDetails: (student: Student) => void;
    onViewProgress: (student: Student) => void;
    onUnenroll: (student: Student) => void;
    loadStudents: () => void;
}

function getStatusColor(status: string) {
    switch (status) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'inactive': return 'bg-gray-100 text-gray-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'graduated': return 'bg-blue-100 text-blue-800';
        case 'transferred': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

export default function StudentsTab({
    students,
    filteredStudents,
    studentReviewMap,
    searchTerm,
    setSearchTerm,
    selectedGrade,
    setSelectedGrade,
    selectedStatus,
    setSelectedStatus,
    t,
    onAddStudent,
    onAddExisting,
    onImportCsv,
    onViewDetails,
    onViewProgress,
    onUnenroll,
}: StudentsTabProps) {
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search students by name, email, or parent..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Select Grade" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Grades</SelectItem>
                                    <SelectItem value="8">Grade 8</SelectItem>
                                    <SelectItem value="9">Grade 9</SelectItem>
                                    <SelectItem value="10">Grade 10</SelectItem>
                                    <SelectItem value="11">Grade 11</SelectItem>
                                    <SelectItem value="12">Grade 12</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="graduated">Graduated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <Button onClick={onAddStudent} className="bg-green-600 hover:bg-green-700">
                            <Plus className="w-4 h-4 mr-2" />
                            {t('addStudent')}
                        </Button>
                        <Button onClick={onAddExisting} variant="outline">
                            <Search className="w-4 h-4 mr-2" />
                            {t('addExisting')}
                        </Button>
                        <Button onClick={onImportCsv} variant="outline">
                            <Upload className="w-4 h-4 mr-2" />
                            {t('importCsv')}
                        </Button>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">{t('temporaryPassword')} <span className="font-semibold">temporary123</span></div>
                </CardContent>
            </Card>

            {/* Students List */}
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-xl text-gray-800">{t('studentManagement')}</CardTitle>
                    <CardDescription>
                        Manage your enrolled students and track their progress
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredStudents.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('studentListEmpty')}</h3>
                            <p className="text-gray-500 mb-4">
                                {searchTerm || selectedGrade !== 'all' || selectedStatus !== 'all'
                                    ? t('tryAdjustFilters')
                                    : t('getStartedAdding')
                                }
                            </p>
                            {!searchTerm && selectedGrade === 'all' && selectedStatus === 'all' && (
                                <Button onClick={onAddStudent} className="bg-green-600 hover:bg-green-700">
                                    <Plus className="w-4 h-4 mr-2" />
                                    {t('startFirstStudent')}
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Student</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Grade</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Language</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Mentor</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Enrolled</th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-4 px-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">{student.user?.full_name}</p>
                                                    <p className="text-sm text-gray-500">{student.user?.email}</p>
                                                    <div className="mt-1">
                                                        <Badge variant="outline">
                                                            {studentReviewMap[student.id]?.reviewed || 0}/{studentReviewMap[student.id]?.total || 0} {t('reviewedLabel')}
                                                        </Badge>
                                                    </div>
                                                    {student.parent_guardian_name && (
                                                        <p className="text-xs text-gray-400">Parent: {student.parent_guardian_name}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge variant="outline">{student.class?.name}</Badge>
                                            </td>
                                            <td className="py-4 px-4">
                                                <Badge className={getStatusColor(student.enrollment_status)}>
                                                    {student.enrollment_status}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm text-gray-700">
                                                    {student.user?.preferred_language === 'kn' ? 'ಕನ್ನಡ'
                                                        : student.user?.preferred_language === 'ta' ? 'தமிழ்'
                                                        : student.user?.preferred_language === 'hi' ? 'हिन्दी'
                                                        : 'English'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-sm text-gray-700">
                                                    {student.teacher?.users?.full_name || 'No Mentor'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="text-sm text-gray-600">
                                                    {new Date(student.enrollment_date).toLocaleDateString()}
                                                </p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex space-x-2">
                                                    <Button variant="ghost" size="sm" onClick={() => onViewDetails(student)}>
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <DropdownMenuItem onClick={() => navigate(`/student/${student.id}/summary`)}>
                                                                <FileText className="w-4 h-4 mr-2" />
                                                                View Summary
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => onViewProgress(student)}>
                                                                <Activity className="w-4 h-4 mr-2" />
                                                                View Progress
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => navigate(`/teacher/student-profile-card/${student.id}`)}>
                                                                <User className="w-4 h-4 mr-2" />
                                                                Review Profile Card
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => navigate(`/teacher/student-roadmap/${student.id}`)}>
                                                                <Map className="w-4 h-4 mr-2" />
                                                                View Career Roadmap
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => navigate(`/teacher/student-interests/${student.id}`)}>
                                                                <Heart className="w-4 h-4 mr-2" />
                                                                View Interests
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => onUnenroll(student)}
                                                            >
                                                                Remove / Unenroll
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
