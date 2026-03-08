import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { StudentLang } from './studentStrings';

interface AssessmentStatus {
    status: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
    iconColor: string;
    textColor: string;
    descriptionColor: string;
}

export interface AssessmentCardData {
    key: string;
    number: number;
    titleKey: string;
    descriptionEn: string;
    descriptionKn: string;
    descriptionTa: string;
    assessmentStatus: AssessmentStatus;
    isCompleted: boolean;
    isUnlocked: boolean;
    hasProgress: boolean; // for inspiration only — shows in_progress badge
}

interface AssessmentGridProps {
    cards: AssessmentCardData[];
    resolvedLang: StudentLang;
    t: (k: string) => string;
    onStartAssessment: (key: string) => void;
}

export default function AssessmentGrid({ cards, resolvedLang, t, onStartAssessment }: AssessmentGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card) => {
                const desc =
                    resolvedLang === 'kn' ? card.descriptionKn :
                        resolvedLang === 'ta' ? card.descriptionTa :
                            card.descriptionEn;

                return (
                    <Card
                        key={card.key}
                        className={card.assessmentStatus.className}
                        onClick={() => onStartAssessment(card.key)}
                    >
                        <CardContent className="p-6 text-center">
                            {React.createElement(card.assessmentStatus.icon, {
                                className: `w-12 h-12 ${card.assessmentStatus.iconColor} mx-auto mb-3`
                            })}
                            <h3 className={`font-semibold ${card.assessmentStatus.textColor} mb-2`}>
                                {card.number}. {t(card.titleKey)}
                            </h3>
                            <p className={`text-sm ${card.assessmentStatus.descriptionColor} mb-2`}>
                                {desc}
                            </p>
                            {card.isCompleted && (
                                <Badge variant="default" className="mt-2 bg-green-600">{t('completed')}</Badge>
                            )}
                            {!card.isCompleted && card.key === 'inspiration' && card.hasProgress && (
                                <Badge variant="outline" className="mt-2 border-yellow-500 text-yellow-600">{t('in_progress')}</Badge>
                            )}
                            {!card.isCompleted && card.key === 'inspiration' && !card.hasProgress && (
                                <Badge variant="secondary" className="mt-2">{t('start_here')}</Badge>
                            )}
                            {!card.isCompleted && card.key !== 'inspiration' && card.isUnlocked && (
                                <Badge variant="secondary" className="mt-2">{t('available')}</Badge>
                            )}
                            {!card.isCompleted && card.key !== 'inspiration' && !card.isUnlocked && (
                                <Badge variant="outline" className="mt-2">{t('locked')}</Badge>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
