import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, CheckCircle, Clock, AlertTriangle, Compass } from 'lucide-react';

interface ReviewOverview {
    unreviewed_count: number;
    reviewed_count: number;
    needs_revision_count: number;
    flagged_count: number;
    followups_due_this_week: number;
}

interface TeacherStatsCardsProps {
    totalStudents: number;
    reviewOverview: ReviewOverview;
    pendingProfileCardMap: Record<string, number>;
    onTabChange: (tab: string) => void;
}

export default function TeacherStatsCards({ totalStudents, reviewOverview, pendingProfileCardMap, onTabChange }: TeacherStatsCardsProps) {
    const totalSubmitted =
        reviewOverview.reviewed_count +
        reviewOverview.unreviewed_count +
        reviewOverview.needs_revision_count +
        reviewOverview.flagged_count;

    const needsAttention = reviewOverview.needs_revision_count + reviewOverview.flagged_count;

    const pendingProfileCards = Object.values(pendingProfileCardMap).reduce((sum, n) => sum + n, 0);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {/* Total Students — not clickable */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-600 text-sm font-medium">Total Students</p>
                            <p className="text-3xl font-bold text-blue-800">{totalStudents}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    </div>
                </CardContent>
            </Card>

            {/* Assessments Reviewed X/Y */}
            <Card
                className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => onTabChange('reviews')}
            >
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-600 text-sm font-medium">Assessments Reviewed</p>
                            <p className="text-3xl font-bold text-green-800">
                                {reviewOverview.reviewed_count}
                                <span className="text-lg font-medium text-green-600"> / {totalSubmitted}</span>
                            </p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                    </div>
                </CardContent>
            </Card>

            {/* Awaiting Review */}
            <Card
                className="border-0 shadow-lg bg-gradient-to-br from-sky-50 to-sky-100 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => onTabChange('reviews')}
            >
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sky-600 text-sm font-medium">Awaiting Review</p>
                            <p className="text-3xl font-bold text-sky-800">{reviewOverview.unreviewed_count}</p>
                        </div>
                        <Clock className="w-8 h-8 text-sky-600 flex-shrink-0" />
                    </div>
                </CardContent>
            </Card>

            {/* Needs Attention (needs_revision + flagged) */}
            <Card
                className={`border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${needsAttention > 0 ? 'bg-gradient-to-br from-amber-50 to-amber-100' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}
                onClick={() => onTabChange('reviews')}
            >
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${needsAttention > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                                Needs Attention
                            </p>
                            <p className={`text-3xl font-bold ${needsAttention > 0 ? 'text-amber-800' : 'text-gray-600'}`}>
                                {needsAttention}
                            </p>
                            {needsAttention > 0 && (
                                <p className="text-xs text-amber-600 mt-1">
                                    Needs Revision: {reviewOverview.needs_revision_count} · Flagged: {reviewOverview.flagged_count}
                                </p>
                            )}
                        </div>
                        <AlertTriangle className={`w-8 h-8 flex-shrink-0 ${needsAttention > 0 ? 'text-amber-500' : 'text-gray-400'}`} />
                    </div>
                </CardContent>
            </Card>

            {/* Profile Cards Pending */}
            <Card
                className={`border-0 shadow-lg cursor-pointer hover:shadow-xl transition-shadow ${pendingProfileCards > 0 ? 'bg-gradient-to-br from-purple-50 to-purple-100' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}
                onClick={() => onTabChange('reviews')}
            >
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`text-sm font-medium ${pendingProfileCards > 0 ? 'text-purple-600' : 'text-gray-500'}`}>
                                Profile Cards Pending
                            </p>
                            <p className={`text-3xl font-bold ${pendingProfileCards > 0 ? 'text-purple-800' : 'text-gray-600'}`}>
                                {pendingProfileCards}
                            </p>
                        </div>
                        <Compass className={`w-8 h-8 flex-shrink-0 ${pendingProfileCards > 0 ? 'text-purple-600' : 'text-gray-400'}`} />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
