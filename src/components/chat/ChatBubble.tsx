import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLang } from '@/hooks/useLang';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Message {
  id: string;
  content: string;
  sender_user_id: string;
  created_at: string;
  sender?: {
    full_name: string;
    profile_picture_url?: string;
  };
}

interface ChatChannel {
  id: string;
  student_id: string;
  teacher_id: string;
  student?: {
    user?: {
      full_name: string;
      profile_picture_url?: string;
    };
  };
  teacher?: {
    user?: {
      full_name: string;
      profile_picture_url?: string;
    };
  };
}

interface ChatBubbleProps {
  role: 'student' | 'teacher';
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export default function ChatBubble({ role, isOpen: controlledIsOpen, onOpenChange, hideTrigger = false }: ChatBubbleProps) {
  const { userProfile, user } = useAuth();
  const { toast } = useToast();
  const { t, lang } = useLang();

  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Use controlled state if provided, otherwise internal state
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (open: boolean) => {
    if (!isControlled) {
      setInternalIsOpen(open);
    }
    onOpenChange?.(open);
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [otherPartyName, setOtherPartyName] = useState<string>('');
  const [otherPartyAvatar, setOtherPartyAvatar] = useState<string | undefined>();
  const [otherPartyUserId, setOtherPartyUserId] = useState<string | null>(null);
  const [noTeacherAssigned, setNoTeacherAssigned] = useState(false);

  // For teacher: student selection
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showStudentList, setShowStudentList] = useState(role === 'teacher');

  // Load students for teacher
  const loadStudents = async () => {
    if (role !== 'teacher' || !userProfile?.id) return;

    try {
      // Get teacher ID
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', userProfile.id)
        .single();

      if (!teacherData) return;

      // Get students assigned to this teacher
      const { data: studentsData } = await supabase
        .from('students')
        .select(`
          id,
          user:users(id, full_name, profile_picture_url)
        `)
        .eq('teacher_id', teacherData.id);

      setStudents(studentsData || []);
    } catch (error) {
      logger.error('Error loading students:', error);
    }
  };

  // Initialize chat channel
  const initializeChannel = async () => {
    if (!userProfile?.id) return;

    setLoading(true);
    try {
      if (role === 'student') {
        // Get student record
        const { data: studentData } = await supabase
          .from('students')
          .select('id, teacher_id, teachers:teacher_id(id, user_id, users:user_id(full_name, profile_picture_url))')
          .eq('user_id', userProfile.id)
          .single();

        if (!studentData || !studentData.teacher_id) {
          setNoTeacherAssigned(true);
          setLoading(false);
          return;
        }

        // Get or create channel
        const { data: channelData, error: channelError } = await supabase
          .rpc('get_or_create_chat_channel', {
            p_student_id: studentData.id,
            p_teacher_id: studentData.teacher_id,
          });

        if (channelError) throw channelError;

        setChannelId(channelData.id);
        const teacherInfo = studentData.teachers as any;
        setOtherPartyName(teacherInfo?.users?.full_name || 'Vidya Saathi');
        setOtherPartyAvatar(teacherInfo?.users?.profile_picture_url);
        setOtherPartyUserId(teacherInfo?.user_id || null);

        await loadMessages(channelData.id);
        await markAsRead(channelData.id, 'student');
      } else if (role === 'teacher' && selectedStudentId) {
        // Get teacher ID
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', userProfile.id)
          .single();

        if (!teacherData) return;

        // Get student info
        const selectedStudent = students.find(s => s.id === selectedStudentId);
        if (selectedStudent) {
          setOtherPartyName(selectedStudent.user?.full_name || 'Student');
          setOtherPartyAvatar(selectedStudent.user?.profile_picture_url);
          setOtherPartyUserId(selectedStudent.user?.id || null);
        }

        // Get or create channel
        const { data: channelData, error: channelError } = await supabase
          .rpc('get_or_create_chat_channel', {
            p_student_id: selectedStudentId,
            p_teacher_id: teacherData.id,
          });

        if (channelError) throw channelError;

        setChannelId(channelData.id);
        setShowStudentList(false);

        await loadMessages(channelData.id);
        await markAsRead(channelData.id, 'teacher');
      }
    } catch (error) {
      logger.error('Error initializing channel:', error);
      toast({
        title: lang === 'kn' ? "ದೋಷ" : lang === 'ta' ? "பிழை" : "Error",
        description: lang === 'kn'
          ? "ಚಾಟ್ ತೆರೆಯಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
          : lang === 'ta'
            ? "அரட்டை திறக்க முடியவில்லை. தயவு செய்து மீண்டும் முயற்சிக்கவும்."
            : "Failed to open chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Load messages
  const loadMessages = async (channelId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          sender_user_id,
          created_at,
          sender:users!sender_user_id(full_name, profile_picture_url)
        `)
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as any) || []);
    } catch (error) {
      logger.error('Error loading messages:', error);
    }
  };

  // Mark messages as read
  const markAsRead = async (channelId: string, userRole: 'student' | 'teacher') => {
    try {
      const field = userRole === 'student' ? 'student_last_read_at' : 'teacher_last_read_at';
      const { error } = await supabase
        .from('chat_channels')
        .update({ [field]: new Date().toISOString() })
        .eq('id', channelId);
      if (error) logger.error('Error updating read timestamp:', error);

      setUnreadCount(0);
    } catch (error) {
      logger.error('Error marking as read:', error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !channelId || !user?.id) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          channel_id: channelId,
          sender_user_id: user.id,
          content: newMessage.trim(),
        });

      if (error) throw error;

      // Update last_message_at
      const { error: updateError } = await supabase
        .from('chat_channels')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', channelId);
      if (updateError) logger.error('Error updating last_message_at:', updateError);

      // Fire-and-forget: notify the other party in their preferred language
      if (otherPartyUserId) {
        const senderName = userProfile?.full_name || (role === 'student' ? 'Student' : 'Teacher');
        void (async () => {
          try {
            const { data: recipientData } = await supabase
              .from('users')
              .select('preferred_language')
              .eq('id', otherPartyUserId)
              .maybeSingle();
            const rl = recipientData?.preferred_language || 'en';
            const notifTitle =
              rl === 'kn' ? 'ಹೊಸ ಸಂದೇಶ' :
              rl === 'ta' ? 'புதிய செய்தி' :
              rl === 'hi' ? 'नया संदेश' :
              'New message';
            const notifMessage =
              rl === 'kn' ? `${senderName} ನಿಮಗೆ ಒಂದು ಸಂದೇಶ ಕಳುಹಿಸಿದ್ದಾರೆ` :
              rl === 'ta' ? `${senderName} உங்களுக்கு ஒரு செய்தி அனுப்பியுள்ளார்` :
              rl === 'hi' ? `${senderName} ने आपको एक संदेश भेजा है` :
              `${senderName} sent you a message`;
            const { error: notifError } = await supabase.rpc('create_notification_secure', {
              p_user_id: otherPartyUserId,
              p_type: 'chat_message',
              p_title: notifTitle,
              p_message: notifMessage,
              p_link: '/student?openChat=true',
            });
            if (notifError) logger.error('Chat notification error:', notifError);
          } catch (err) {
            logger.warn('Non-fatal: chat notification failed', err);
          }
        })();
      }

      setNewMessage('');
      await loadMessages(channelId);
    } catch (error) {
      logger.error('Error sending message:', error);
      toast({
        title: lang === 'kn' ? "ದೋಷ" : lang === 'ta' ? "பிழை" : "Error",
        description: lang === 'kn'
          ? "ಸಂದೇಶವನ್ನು ಕಳುಹಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ."
          : lang === 'ta'
            ? "செய்தியை அனுப்ப முடியவில்லை. தயவு செய்து மீண்டும் முயற்சிக்கவும்."
            : "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // Load unread count
  const loadUnreadCount = async () => {
    if (!userProfile?.id) return;

    try {
      if (role === 'student') {
        const { data: studentData } = await supabase
          .from('students')
          .select('id, teacher_id')
          .eq('user_id', userProfile.id)
          .single();

        if (!studentData) return;

        const { data: channels } = await supabase
          .from('chat_channels')
          .select('id, last_message_at, student_last_read_at')
          .eq('student_id', studentData.id)
          .eq('teacher_id', studentData.teacher_id);

        if (channels && channels.length > 0) {
          const channel = channels[0];
          if (channel.last_message_at && (!channel.student_last_read_at ||
            new Date(channel.last_message_at) > new Date(channel.student_last_read_at))) {
            // Count unread messages
            const { count } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('channel_id', channel.id)
              .neq('sender_user_id', userProfile.id)
              .gt('created_at', channel.student_last_read_at || '1970-01-01');

            setUnreadCount(count || 0);
          }
        }
      } else if (role === 'teacher') {
        // For teacher, sum unread from all students
        const { data: teacherData } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', userProfile.id)
          .single();

        if (!teacherData) return;

        const { data: channels } = await supabase
          .from('chat_channels')
          .select('id, last_message_at, teacher_last_read_at')
          .eq('teacher_id', teacherData.id);

        let totalUnread = 0;
        for (const channel of channels || []) {
          if (channel.last_message_at && (!channel.teacher_last_read_at ||
            new Date(channel.last_message_at) > new Date(channel.teacher_last_read_at))) {
            const { count } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('channel_id', channel.id)
              .neq('sender_user_id', userProfile.id)
              .gt('created_at', channel.teacher_last_read_at || '1970-01-01');

            totalUnread += count || 0;
          }
        }
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      logger.error('Error loading unread count:', error);
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    if (!channelId) return;

    const subscription = supabase
      .channel(`chat:${channelId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `channel_id=eq.${channelId}`,
        },
        (payload) => {
          loadMessages(channelId);
          if (isOpen) {
            markAsRead(channelId, role);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channelId, isOpen]);

  // Load students when teacher opens chat
  useEffect(() => {
    if (isOpen && role === 'teacher') {
      loadStudents();
    }
  }, [isOpen, role]);

  // Initialize channel when opened
  useEffect(() => {
    if (isOpen && role === 'student') {
      initializeChannel();
    }
  }, [isOpen, role]);

  // Initialize channel when student is selected
  useEffect(() => {
    if (isOpen && role === 'teacher' && selectedStudentId) {
      initializeChannel();
    }
  }, [selectedStudentId]);

  // Load unread count periodically — only poll when chat is open
  useEffect(() => {
    loadUnreadCount();
    if (!isOpen) return;
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [userProfile, isOpen]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Bubble */}
      {!isOpen && !hideTrigger && (
        <div className="fixed bottom-20 sm:bottom-6 right-6 z-50">
          <Button
            size="lg"
            onClick={() => setIsOpen(true)}
            className="h-16 w-16 rounded-full shadow-2xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-110 border-2 border-white"
          >
            <MessageSquare className="h-7 w-7 text-white" />
            {unreadCount > 0 && (
              <Badge
                className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-red-500 text-white font-semibold text-xs shadow-lg animate-pulse"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col border-0 overflow-hidden" lang={lang} dir="auto">
          <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200 flex flex-row items-center justify-between space-y-0 pb-4 pt-4">
            <div className="flex items-center gap-3">
              {!showStudentList && otherPartyAvatar && (
                <Avatar className="h-10 w-10 border-2 border-blue-200 shadow-sm">
                  <AvatarImage src={otherPartyAvatar} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-semibold">
                    {otherPartyName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              {!showStudentList && !otherPartyAvatar && (
                <Avatar className="h-10 w-10 border-2 border-blue-200 shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-semibold">
                    {otherPartyName?.charAt(0) || 'V'}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <CardTitle className="text-lg text-gray-800 font-semibold">
                  {role === 'teacher' && showStudentList
                    ? (lang === 'kn' ? 'ವಿದ್ಯಾರ್ಥಿಗೆ ಸಂದೇಶ ಕಳುಹಿಸಿ' : 'Message a Student')
                    : role === 'student'
                      ? otherPartyName || (lang === 'kn' ? 'ವಿದ್ಯಾ ಸಾಥಿ' : 'Vidya Saathi')
                      : otherPartyName || (lang === 'kn' ? 'ವಿದ್ಯಾರ್ಥಿ' : 'Student')
                  }
                </CardTitle>
                {!showStudentList && (
                  <p className="text-xs text-blue-700">
                    {role === 'student'
                      ? (lang === 'kn' ? 'ನಿಮ್ಮ ವಿದ್ಯಾ ಸಾಥಿ' : 'Your Vidya Saathi')
                      : (lang === 'kn' ? 'ವಿದ್ಯಾರ್ಥಿ' : 'Student')
                    }
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {role === 'teacher' && !showStudentList && selectedStudentId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowStudentList(true);
                    setSelectedStudentId(null);
                    setChannelId(null);
                    setMessages([]);
                  }}
                  className="text-blue-700 hover:bg-blue-100 text-sm"
                >
                  {lang === 'kn' ? '← ಹಿಂದೆ' : lang === 'ta' ? '← பின் செல்ல' : '← Back'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsOpen(false);
                  // Only reset to student list for teachers
                  if (role === 'teacher') {
                    setShowStudentList(true);
                    setSelectedStudentId(null);
                  }
                  setChannelId(null);
                  setMessages([]);
                  setNoTeacherAssigned(false);
                }}
                className="text-gray-600 hover:bg-blue-100 p-1"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {loading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : noTeacherAssigned ? (
              <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-blue-50 to-white">
                <div className="text-center max-w-sm">
                  <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <MessageSquare className="h-12 w-12 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {lang === 'kn' ? 'ಇನ್ನೂ ವಿದ್ಯಾ ಸಾಥಿ ನಿಯೋಜಿಸಲಾಗಿಲ್ಲ' : lang === 'ta' ? 'இன்னும் ஆசிரியர் இணைக்கப்படவில்லை' : 'No Vidya Saathi Assigned Yet'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {lang === 'kn'
                      ? 'ನಿಮ್ಮ ಶಿಕ್ಷಕರನ್ನು ನಿಯೋಜಿಸಿದ ನಂತರ ನೀವು ನಿಮ್ಮ ವಿದ್ಯಾ ಸಾಥಿಗೆ ಸಂದೇಶ ಕಳುಹಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತದೆ.'
                      : lang === 'ta'
                        ? 'ஆசிரியர் இணைக்கப்பட்ட பிறகு நீங்கள் உங்கள் விட்யா சாதியை தொடர்பு கொள்ளலாம்.'
                        : "You'll be able to message your Vidya Saathi once your teacher is assigned."}
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      💡 {lang === 'kn'
                        ? 'ದಯವಿಟ್ಟು ಸಹಾಯಕ್ಕಾಗಿ ನಿಮ್ಮ ನಿರ್ವಾಹಕರನ್ನು ಸಂಪರ್ಕಿಸಿ.'
                        : lang === 'ta'
                          ? 'உதவி தேவை என்றால் நிர்வாகியை தொடர்பு கொள்ளவும்.'
                          : 'Please contact your administrator for assistance.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : showStudentList && role === 'teacher' ? (
              <ScrollArea className="flex-1 p-4 bg-gray-50">
                {students.length === 0 ? (
                  <div className="text-center text-gray-500 py-12">
                    <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-md">
                      <MessageSquare className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="font-medium text-gray-700">
                      {lang === 'kn' ? 'ಇನ್ನೂ ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ನಿಯೋಜಿಸಲಾಗಿಲ್ಲ' : lang === 'ta' ? 'இன்னும் மாணவர்கள் இணைக்கப்படவில்லை' : 'No students assigned yet'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {lang === 'kn'
                        ? 'ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ನಿಯೋಜಿಸಿದ ನಂತರ ಅವರು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತಾರೆ'
                        : lang === 'ta'
                          ? 'மாணவர்கள் இணைக்கப்பட்ட பிறகு அவர்கள் இங்கே தோன்றுவர்'
                          : 'Students will appear here once assigned'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {students.map((student) => (
                      <Button
                        key={student.id}
                        variant="outline"
                        className="w-full justify-start gap-3 h-auto py-3 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 border-gray-200 shadow-sm"
                        onClick={() => setSelectedStudentId(student.id)}
                      >
                        <Avatar className="h-10 w-10 border-2 border-blue-100 flex-shrink-0">
                          <AvatarImage src={student.user?.profile_picture_url} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700 font-semibold">
                            {student.user?.full_name?.charAt(0) || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-gray-700">{student.user?.full_name || 'Student'}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            ) : (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-gray-50 to-white">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-12">
                      <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-md">
                        <MessageSquare className="h-10 w-10 text-blue-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {lang === 'kn' ? 'ಇನ್ನೂ ಸಂದೇಶಗಳಿಲ್ಲ' : lang === 'ta' ? 'இன்னும் செய்தி இல்லை' : 'No messages yet'}
                      </p>
                      <p className="text-xs mt-1 text-gray-500">
                        {lang === 'kn' ? 'ಸಂಭಾಷಣೆಯನ್ನು ಪ್ರಾರಂಭಿಸಿ!' : lang === 'ta' ? 'பேச்சை தொடங்குங்கள்!' : 'Start the conversation!'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isOwn = message.sender_user_id === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${isOwn
                                ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md'
                                : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                                }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {message.content}
                              </p>
                              <p
                                className={`text-xs mt-1.5 ${isOwn ? 'text-blue-100' : 'text-gray-400'
                                  }`}
                              >
                                {new Date(message.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="flex gap-2">
                    <Input
                      lang={lang}
                      placeholder={
                        lang === 'kn'
                          ? 'ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಟೈಪ್ ಮಾಡಿ...'
                          : lang === 'ta'
                            ? 'உங்கள் செய்தியை எழுதுங்கள்...'
                            : 'Type your message...'
                      }
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={sending}
                      className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                    />
                    <Button
                      size="icon"
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}

