import React from 'react';
import { useToast } from '@/hooks/use-toast';
import HollandCodeTest from '@/components/HollandCodeTest';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function HollandTest() {
  const { toast } = useToast();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header with Back Button - matching assessment pages */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/student')}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-blue-800 mb-2">🧭 Psychometric Tests – Holland Code Assessment</h1>
            <p className="text-blue-600 text-lg">Answer all questions honestly to discover your Holland Code profile.</p>
            <p className="text-gray-600 mt-2">Select activities you enjoy across each group to reveal your RIASEC type.</p>
          </div>
          <div className="w-20"></div>
        </div>
        <HollandCodeTest onCompleted={(code)=> toast({ title: 'Holland Code Saved', description: `Your code: ${code}` })} />
      </div>
    </div>
  );
}


