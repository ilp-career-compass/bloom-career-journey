import React from 'react';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Sparkles, RefreshCw } from 'lucide-react';
import type { AssessmentSummary } from '@/types/assessmentSummary';
import type { StudentLang } from './studentStrings';

export interface ProgressRowData {
    number: number;
    titleKey: string;
    assessmentType: string;
    bgColor: string;
    textColor: string;
    isCompleted: boolean;
    previousCompleted: boolean; // whether previous assessment is completed (for available/locked badge)
    summary: AssessmentSummary | null;
    assessmentResponseId: string | null;
    fetchSummary: ((id: string) => Promise<void>) | null;
    setSummaryNull: (() => void) | null;
}

interface ProgressSectionProps {
    rows: ProgressRowData[];
    resolvedLang: StudentLang;
    t: (k: string) => string;
    onViewSummary: (type: string) => void;
    // Extra rows for holland_code and career_guidance (no summaries)
    hollandCodeCompleted: boolean;
    roleModelsCompleted: boolean;
    careerGuidanceToolsCompleted: boolean;
    hollandCodeCompleted2: boolean;
}

export default function ProgressSection({
    rows,
    resolvedLang,
    t,
    onViewSummary,
    hollandCodeCompleted,
    roleModelsCompleted,
    careerGuidanceToolsCompleted,
    hollandCodeCompleted2,
}: ProgressSectionProps) {
    return (
        <Card className="border-0 shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl text-gray-800">{t('progress_summary_title')}</CardTitle>
                <CardDescription>{t('progress_summary_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {rows.map((row) => (
                        <div key={row.assessmentType} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 ${row.bgColor} rounded-lg gap-2 sm:gap-0`}>
                            <div className="flex items-center gap-3">
                                <span className={`font-medium ${row.textColor}`}>{row.number}. {t(row.titleKey)}</span>
                                {row.summary && row.summary.approval_status === 'approved' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => { e.stopPropagation(); onViewSummary(row.assessmentType); }}
                                        className="h-7 text-xs"
                                    >
                                        <FileText className="h-3 w-3 mr-1" />
                                        {t('view_summary')}
                                    </Button>
                                )}
                                {row.summary && row.summary.approval_status === 'pending_approval' && (
                                    <Badge variant="secondary" className="text-xs">
                                        <Sparkles className="h-3 w-3 mr-1" />
                                        {t('summary_pending')}
                                    </Badge>
                                )}
                                {row.summary && row.summary.approval_status !== 'approved' && row.summary.approval_status !== 'pending_approval' && (
                                    <Badge variant="outline" className="text-xs">
                                        {resolvedLang === 'kn' ? 'ಸ್ಥಿತಿ:' : resolvedLang === 'ta' ? 'நிலை:' : 'Status:'}{' '}
                                        {row.summary.approval_status}
                                    </Badge>
                                )}
                                {row.assessmentResponseId && row.fetchSummary && row.setSummaryNull && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            logger.log(`🔄 Manual refresh triggered for ${row.assessmentType} summary`);
                                            row.setSummaryNull!();
                                            await new Promise(resolve => setTimeout(resolve, 100));
                                            if (row.assessmentResponseId) {
                                                await row.fetchSummary!(row.assessmentResponseId);
                                            }
                                        }}
                                        className="h-7 text-xs"
                                        title="Refresh summary status"
                                    >
                                        <RefreshCw className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                            <Badge variant={row.isCompleted ? "default" : (row.previousCompleted ? "secondary" : "outline")}>
                                {row.isCompleted ? t('completed') : (row.previousCompleted ? t('available') : t('locked'))}
                            </Badge>
                        </div>
                    ))}
                    {/* 7. Holland Code */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-teal-50 rounded-lg gap-2 sm:gap-0">
                        <span className="font-medium text-teal-800">7. {t('assessment_holland_code')}</span>
                        <Badge variant={hollandCodeCompleted ? "default" : (roleModelsCompleted ? "secondary" : "outline")}>
                            {hollandCodeCompleted ? t('completed') : (roleModelsCompleted ? t('available') : t('locked'))}
                        </Badge>
                    </div>
                    {/* 8. Career Guidance */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-indigo-50 rounded-lg gap-2 sm:gap-0">
                        <span className="font-medium text-indigo-800">8. {t('assessment_career_guidance')}</span>
                        <Badge variant={careerGuidanceToolsCompleted ? "default" : (hollandCodeCompleted2 ? "secondary" : "outline")}>
                            {careerGuidanceToolsCompleted ? t('completed') : (hollandCodeCompleted2 ? t('available') : t('locked'))}
                        </Badge>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
