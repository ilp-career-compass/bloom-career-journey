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
}

export default function ChatBubble({ role }: ChatBubbleProps) {
  const { userProfile, user } = useAuth();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [otherPartyName, setOtherPartyName] = useState<string>('');
  const [otherPartyAvatar, setOtherPartyAvatar] = useState<string | undefined>();
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
          user:users(full_name, profile_picture_url)
        `)
        .eq('teacher_id', teacherData.id);

      setStudents(studentsData || []);
    } catch (error) {
      console.error('Error loading students:', error);
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
          .select('id, teacher_id, teachers:teacher_id(id, users:user_id(full_name, profile_picture_url))')
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
        setOtherPartyName(studentData.teachers?.users?.full_name || 'Vidya Saathi');
        setOtherPartyAvatar(studentData.teachers?.users?.profile_picture_url);
        
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
      console.error('Error initializing channel:', error);
      toast({
        title: "Error",
        description: "Failed to open chat. Please try again.",
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
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Mark messages as read
  const markAsRead = async (channelId: string, userRole: 'student' | 'teacher') => {
    try {
      const field = userRole === 'student' ? 'student_last_read_at' : 'teacher_last_read_at';
      await supabase
        .from('chat_channels')
        .update({ [field]: new Date().toISOString() })
        .eq('id', channelId);
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking as read:', error);
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
      await supabase
        .from('chat_channels')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', channelId);

      setNewMessage('');
      await loadMessages(channelId);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
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
      console.error('Error loading unread count:', error);
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

  // Load unread count periodically
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [userProfile]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Bubble */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
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
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col border-0 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-row items-center justify-between space-y-0 pb-4 pt-4">
            <div className="flex items-center gap-3">
              {!showStudentList && otherPartyAvatar && (
                <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                  <AvatarImage src={otherPartyAvatar} />
                  <AvatarFallback className="bg-white text-blue-600 font-semibold">
                    {otherPartyName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <CardTitle className="text-lg">
                  {role === 'teacher' && showStudentList 
                    ? 'Message a Student' 
                    : role === 'student' 
                      ? otherPartyName || 'Vidya Saathi'
                      : otherPartyName || 'Student'
                  }
                </CardTitle>
                {!showStudentList && (
                  <p className="text-xs text-blue-100">
                    {role === 'student' ? 'Your Vidya Saathi' : 'Student'}
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
                  className="text-white hover:bg-white/20 text-sm"
                >
                  ← Back
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
                className="text-white hover:bg-white/20 p-1"
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
                    No Vidya Saathi Assigned Yet
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    You'll be able to message your Vidya Saathi once your teacher is assigned.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700">
                      💡 Please contact your administrator for assistance.
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
                    <p className="font-medium text-gray-700">No students assigned yet</p>
                    <p className="text-sm text-gray-500 mt-1">Students will appear here once assigned</p>
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
                        <Avatar className="h-10 w-10 border-2 border-blue-100">
                          <AvatarImage src={student.user?.profile_picture_url} />
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
                      <p className="text-sm font-medium text-gray-700">No messages yet</p>
                      <p className="text-xs mt-1 text-gray-500">Start the conversation!</p>
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
                              className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                                isOwn
                                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md'
                                  : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {message.content}
                              </p>
                              <p
                                className={`text-xs mt-1.5 ${
                                  isOwn ? 'text-blue-100' : 'text-gray-400'
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
                      placeholder="Type your message..."
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

