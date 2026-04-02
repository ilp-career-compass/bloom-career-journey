import React from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import NotificationBell from '@/components/NotificationBell';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    GraduationCap,
    User,
    LogOut,
    ChevronDown,
    LifeBuoy,
} from 'lucide-react';

interface TeacherDashboardHeaderProps {
    userProfile: any;
    t: (k: string) => string;
    onLogout: () => void;
    onOpenProfile: () => void;
    onOpenContact: () => void;
}

export default function TeacherDashboardHeader({
    userProfile,
    t,
    onLogout,
    onOpenProfile,
    onOpenContact,
}: TeacherDashboardHeaderProps) {
    return (
        <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <img src="/logo/ILP-new-logo.jpeg" alt="ILP" className="h-8 w-8 rounded-sm object-contain hidden sm:block" />
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 leading-tight">{t('brand')}</h1>
                            <p className="text-sm text-gray-500 leading-tight hidden sm:block">an <span className="font-semibold">India Literacy Project</span> initiative</p>
                        </div>
                    </div>

                    {/* Notifications + Profile */}
                    <div className="flex items-center gap-2">
                        {userProfile?.id && <NotificationBell userId={userProfile.id} />}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
                                    {userProfile?.profile_picture_url ? (
                                        <img
                                            src={userProfile.profile_picture_url}
                                            alt={userProfile?.full_name || 'Teacher'}
                                            className="w-12 h-12 rounded-full object-cover"
                                            onError={(e) => {
                                                logger.log('❌ Image failed to load:', userProfile.profile_picture_url);
                                                e.currentTarget.style.display = 'none';
                                            }}
                                            onLoad={() => logger.log('✅ Image loaded successfully:', userProfile.profile_picture_url)}
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-semibold text-lg">
                                                {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'T'}
                                            </span>
                                        </div>
                                    )}
                                    <span className="text-gray-700 font-medium hidden md:inline-block">{userProfile?.full_name || 'Teacher'}</span>
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end">
                                <DropdownMenuItem onClick={onOpenProfile}>
                                    <User className="w-4 h-4 mr-2" />
                                    {t('myProfile')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onOpenContact}>
                                    <LifeBuoy className="w-4 h-4 mr-2" />
                                    {t('contactIlp')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    {t('logout')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div>
    );
}
