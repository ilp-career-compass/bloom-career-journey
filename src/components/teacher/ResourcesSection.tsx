import { useMemo } from 'react';
import { CAREER_PLANNER, COURSE_GUIDANCE_CHART, CAREER_DETAILS } from '@/data/resources';
import { buildDrivePreviewUrl, buildDriveViewUrl, buildDriveDownloadUrl } from '@/utils/driveLinks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Download, BookOpen, Map, FileText } from 'lucide-react';

type Item = { id: string; label: string; fileId?: string; externalUrl?: string };

const ResourceList = ({ title, description, items }: { title: string; description: string; items: Item[] }) => {
  const hasConfiguredLinks = useMemo(() => items.every(i => !!i.fileId || !!i.externalUrl), [items]);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
          {title.includes('Career Planner') ? <BookOpen className="w-5 h-5 text-indigo-600" /> : 
           title.includes('Career Details') ? <FileText className="w-5 h-5 text-blue-600" /> : 
           <Map className="w-5 h-5 text-emerald-600" />}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasConfiguredLinks && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded">
            Drive file IDs are not configured yet. Paste them in <code className="font-mono">src/data/resources.ts</code>.
          </div>
        )}
        <ul className="space-y-2">
          {items.map(item => (
            <li key={item.id} className="flex items-center justify-between border rounded-md bg-white px-3 py-2">
              <div className="text-blue-700">
                {item.label}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild disabled={!item.fileId && !item.externalUrl}>
                  <a href={item.fileId ? buildDriveViewUrl(item.fileId) : (item.externalUrl || '#')} target="_blank" rel="noreferrer">
                    <ExternalLink className="w-4 h-4 mr-1" /> Open
                  </a>
                </Button>
                <Button size="sm" asChild disabled={!item.fileId}>
                  <a href={item.fileId ? buildDriveDownloadUrl(item.fileId) : '#'} target="_blank" rel="noreferrer">
                    <Download className="w-4 h-4 mr-1" /> Download
                  </a>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default function ResourcesSection() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="career" className="space-y-6">
        <TabsList className="bg-white shadow-sm">
          <TabsTrigger value="career">Career Planner</TabsTrigger>
          <TabsTrigger value="details">Career Details</TabsTrigger>
          <TabsTrigger value="course">Course Guidance Chart</TabsTrigger>
        </TabsList>
        <TabsContent value="career" className="space-y-4">
          <ResourceList
            title="Career Planner"
            description="Comprehensive booklet containing detailed information about different careers, including educational requirements, job prospects, and industry trends to guide student career planning."
            items={CAREER_PLANNER}
          />
        </TabsContent>
        <TabsContent value="details" className="space-y-4">
          <ResourceList
            title="Career Details"
            description="Detailed document outlining specific career information in tabular format, including occupation names, fields, educational qualifications, work environment, and job opportunities."
            items={CAREER_DETAILS}
          />
        </TabsContent>
        <TabsContent value="course" className="space-y-4">
          <ResourceList
            title="Course Guidance Chart"
            description="Visual reference chart displaying all available course options and pathways for students after completing their 10th and 12th grade examinations."
            items={COURSE_GUIDANCE_CHART}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}


