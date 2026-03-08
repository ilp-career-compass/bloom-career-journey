import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsTab() {
    return (
        <Card className="border-0 shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl text-gray-800">Student Analytics</CardTitle>
                <CardDescription>
                    View detailed insights and progress reports
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-12">
                    <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
                    <p className="text-gray-500">
                        Analytics and reporting system will be implemented in the next phase
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
