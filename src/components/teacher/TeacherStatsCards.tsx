import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, UserPlus, CheckCircle } from 'lucide-react';

interface StudentStats {
    totalStudents: number;
    activeStudents: number;
    recentAdditions: number;
}

interface ReviewOverview {
    unreviewed_count: number;
    reviewed_count: number;
    needs_revision_count: number;
    flagged_count: number;
    followups_due_this_week: number;
}

interface TeacherStatsCardsProps {
    studentStats: StudentStats;
    reviewOverview: ReviewOverview;
    t: (k: string) => string;
}

export default function TeacherStatsCards({ studentStats, reviewOverview, t }: TeacherStatsCardsProps) {
    return (
        <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-4">
                            <div className="order-2 sm:order-1">
                                <p className="text-blue-600 text-sm font-medium">{t('totalStudents')}</p>
                                <p className="text-3xl font-bold text-blue-800">{studentStats.totalStudents}</p>
                            </div>
                            <div className="order-1 sm:order-2 p-3 bg-blue-100/50 rounded-xl sm:bg-transparent sm:p-0">
                                <Users className="w-8 h-8 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-4">
                            <div className="order-2 sm:order-1">
                                <p className="text-green-600 text-sm font-medium">{t('activeStudents')}</p>
                                <p className="text-3xl font-bold text-green-800">{studentStats.activeStudents}</p>
                            </div>
                            <div className="order-1 sm:order-2 p-3 bg-green-100/50 rounded-xl sm:bg-transparent sm:p-0">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-4">
                            <div className="order-2 sm:order-1">
                                <p className="text-purple-600 text-sm font-medium">{t('recentAdditions')}</p>
                                <p className="text-3xl font-bold text-purple-800">{studentStats.recentAdditions}</p>
                            </div>
                            <div className="order-1 sm:order-2 p-3 bg-purple-100/50 rounded-xl sm:bg-transparent sm:p-0">
                                <UserPlus className="w-8 h-8 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Review Overview Counters */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-4 text-center">
                        <div className="text-sm text-gray-600">Unreviewed</div>
                        <div className="text-2xl font-bold text-gray-800">{reviewOverview.unreviewed_count}</div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-4 text-center">
                        <div className="text-sm text-gray-600">Reviewed</div>
                        <div className="text-2xl font-bold text-blue-700">{reviewOverview.reviewed_count}</div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-4 text-center">
                        <div className="text-sm text-gray-600">Needs Revision</div>
                        <div className="text-2xl font-bold text-yellow-600">{reviewOverview.needs_revision_count}</div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-4 text-center">
                        <div className="text-sm text-gray-600">Flagged</div>
                        <div className="text-2xl font-bold text-red-600">{reviewOverview.flagged_count}</div>
                    </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-4 text-center">
                        <div className="text-sm text-gray-600">Follow-ups Due This Week</div>
                        <div className="text-2xl font-bold text-rose-600">{reviewOverview.followups_due_this_week}</div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
