import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  Modal,
  AppState,
  Switch
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import {
  ChevronLeft,
  RefreshCcw,
  MapPin,
  Briefcase,
  PhoneCall,
  Clock,
  MessageCircle,
  X,
  Send,
  Calendar,
  Flame,
  Sun,
  Snowflake,
  Copy,
  Check,
  CircleCheck,
  Mail,
  ChevronDown,
  ChevronUp,
  Tag,
  Pencil,
  Zap,
  TriangleAlert,
  Share2,
  Globe,
  HelpCircle,
  CheckCircle2,
  ListFilter,
  Paperclip,
  FileText,
  Upload,
  ExternalLink,
  Play,
  Square,
  Volume2,
  Award,
  Ban
} from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import OfflineBanner from '../../components/OfflineBanner';
import CallModal, { PRIMARY_STATUSES, CALL_DISPOSITIONS, QUICK_REMARK_TAGS } from '../../components/CallModal';
import SimpleCalendarModal from '../../components/SimpleCalendarModal';
import { useAuthStore } from '../../store/authStore';

// Safe local date formatting utilities (immune to UTC date-shift bugs)
const formatLocalDate = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatLocalTime = (d) => {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

export default function LeadDetails() {
  const { id, powerQueue } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  // Screen Form State (The 1-Screen Workbench)
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDisposition, setSelectedDisposition] = useState('');
  const [remarks, setRemarks] = useState('');
  const [durationSec, setDurationSec] = useState('0');
  const [scheduleFollowup, setScheduleFollowup] = useState(false);
  const [followupDate, setFollowupDate] = useState('');
  const [followupTime, setFollowupTime] = useState('');
  const [followupPriority, setFollowupPriority] = useState('Medium');
  const [selectedTags, setSelectedTags] = useState([]);
  const [formError, setFormError] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedAltNumber, setCopiedAltNumber] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // UI Accordion / Modals
  const [showMetadataDetails, setShowMetadataDetails] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState('ALL'); // 'ALL' | 'CALLS' | 'FOLLOWUPS'
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [callModalFallbackVisible, setCallModalFallbackVisible] = useState(false);

  // Lead Edit Form State
  const [editForm, setEditForm] = useState({
    name: '',
    mobile: '',
    alternate_mobile: '',
    email: '',
    city: '',
    state: '',
    business_type: '',
    product_interest: '',
    priority: 'Normal'
  });

  // Call tracking refs
  const callStartedAtRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const scrollViewRef = useRef(null);
  const remarksInputRef = useRef(null);
  const soundRef = useRef(null);
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null);

  // Audio Playback Handler for Call Recordings (Requirement 5)
  const handleToggleAudioPlayback = async (recordingUrl) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
        if (playingAudioUrl === recordingUrl) {
          setPlayingAudioUrl(null);
          return;
        }
      }

      if (!recordingUrl) return;
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      } catch {}
      const fullUrl = getDocumentFullUrl(recordingUrl);
      setPlayingAudioUrl(recordingUrl);
      const { sound } = await Audio.Sound.createAsync(
        { uri: fullUrl },
        { shouldPlay: true }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingAudioUrl(null);
          soundRef.current = null;
        }
      });
    } catch (e) {
      console.log('Audio playback error:', e.message);
      setPlayingAudioUrl(null);
      Alert.alert('Playback Notice', 'Audio recording could not be streamed.');
    }
  };

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Fetch Lead Details
  const { data: leadData, isLoading, refetch } = useQuery({
    queryKey: ['leadDetails', id],
    queryFn: async () => {
      const response = await api.get(`/leads/${id}`);
      return response.data;
    }
  });

  const lead = leadData?.lead || {};
  const calls = leadData?.calls || [];
  const followups = leadData?.followups || [];
  const timeline = leadData?.timeline || [];
  const agentName = user?.name || 'Sales Executive';

  // Sync initial lead data into form
  useEffect(() => {
    if (lead && (lead.id || lead._id)) {
      if (!selectedStatus) {
        setSelectedStatus(lead.status || 'Contacted');
      }
      if (!selectedDisposition) {
        setSelectedDisposition(lead.call_disposition || '');
      }
      if (!remarks && lead.remarks) {
        setRemarks(lead.remarks);
      }
      if (lead.tags && Array.isArray(lead.tags) && selectedTags.length === 0) {
        setSelectedTags(lead.tags);
      }
    }
  }, [lead]);

  // Listen for return from Phone Dialer to auto-calculate call duration
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        callStartedAtRef.current
      ) {
        const elapsedSec = Math.max(5, Math.round((Date.now() - callStartedAtRef.current) / 1000));
        callStartedAtRef.current = null;
        setDurationSec(String(elapsedSec));
        // If status was 'New' or 'Fresh Lead', auto-advance to Contacted
        if (selectedStatus === 'New' || selectedStatus === 'Fresh Lead' || !selectedStatus) {
          setSelectedStatus('Contacted');
        }
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, [selectedStatus]);

  // Mutation: Save Call Log, Status, Disposition, Remarks, and Followup
  const saveCallMutation = useMutation({
    mutationFn: (payload) => api.post('/calls', payload),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['leadDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['telecallerDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['telecallerLeadsList'] });
      queryClient.invalidateQueries({ queryKey: ['powerQueue'] });
      queryClient.invalidateQueries({ queryKey: ['telecallerFollowups'] });

      // Power queue progression
      if (powerQueue === '1') {
        try {
          const qRes = await api.get('/leads/power-queue');
          const nextLead = qRes.data?.queue?.find((item) => String(item.id || item._id) !== String(id));
          if (nextLead) {
            Alert.alert(
              '⚡ Call Logged! Power Queue Ready',
              `Next contact: ${nextLead.name} (${nextLead.queueReason || 'Next in queue'})`,
              [
                { text: 'Finish Queue', style: 'cancel', onPress: () => router.back() },
                { text: 'Call Next Lead →', onPress: () => router.replace(`/lead/${nextLead.id || nextLead._id}?powerQueue=1`) }
              ]
            );
            return;
          }
        } catch {}
      }

      Alert.alert('✅ Saved Successfully', 'Call disposition, remarks & next follow-up saved in 1 tap!', [
        { text: 'Stay on Lead', onPress: () => refetch() },
        { text: 'Back to Leads', style: 'default', onPress: () => router.back() }
      ]);
    },
    onError: (err) => {
      Alert.alert('Error', err?.response?.data?.error || err.message || 'Failed to save call disposition');
    }
  });

  // Mutation: Edit Lead Profile
  const editLeadMutation = useMutation({
    mutationFn: (payload) => api.put(`/leads/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['telecallerLeadsList'] });
      setEditModalVisible(false);
      Alert.alert('Updated', 'Lead profile updated successfully.');
    },
    onError: (err) => {
      Alert.alert('Update Failed', err?.response?.data?.error || err.message);
    }
  });

  // Mutation: Quick Priority Toggle
  const updatePriorityMutation = useMutation({
    mutationFn: (newPriority) => api.put(`/leads/${id}`, { priority: newPriority }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadDetails', id] });
    }
  });

  // Mutation: Mark Invalid / Fake / Wrong Number (Requirement 9)
  const markInvalidMutation = useMutation({
    mutationFn: (reason) => api.patch(`/leads/${id}/mark-invalid`, { reason, remarks: `Marked by ${agentName}` }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['leadDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['telecallerLeadsList'] });
      Alert.alert('Status Updated', res.data?.message || 'Lead marked as invalid.');
    }
  });

  // Handle 1-Click Phone Call
  const handleStartPhoneCall = (phoneNumber) => {
    if (!phoneNumber) {
      Alert.alert('Error', 'Mobile number not available for this lead.');
      return;
    }
    const cleanNumber = String(phoneNumber).replace(/\D/g, '').slice(-10);
    if (!cleanNumber || cleanNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please check mobile number format (must be 10 digits).');
      return;
    }
    callStartedAtRef.current = Date.now();
    Linking.openURL(`tel:${cleanNumber}`).catch(() => {
      setDurationSec('45');
      Alert.alert('Notice', 'Dialer could not be launched directly (simulator/test device). Duration set to 45s.');
    });
  };

  // Document Helpers & Upload via Multipart (Requirement 2)
  const getDocumentFullUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    const baseUrl = api.defaults.baseURL || '';
    const rootHost = baseUrl.replace(/\/api\/?$/, '');
    return `${rootHost}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const handlePickAndUploadDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true
      });
      if (res.canceled || !res.assets || res.assets.length === 0) return;
      const asset = res.assets[0];
      setUploadingDoc(true);

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name || `doc_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg'
      });
      formData.append('name', asset.name || 'Document');

      await api.post(`/leads/${id}/upload-file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await refetch();
      Alert.alert('✅ Document Uploaded', `${asset.name || 'Document'} attached to lead successfully.`);
    } catch (err) {
      Alert.alert('Upload Error', err?.response?.data?.error || err.message || 'Failed to upload document');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Handle 1-Click WhatsApp with Native Deep-link & Web Fallback
  const handleSendWhatsApp = (customTemplate, targetNumber) => {
    const rawNumber = targetNumber || lead.mobile;
    const cleanPhone = String(rawNumber || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert('Invalid Phone', 'Lead does not have a valid 10-digit mobile number.');
      return;
    }

    const defaultMsg = `Namaste ${lead.name || 'Sir/Madam'} ji! KisanConnect me inquiry karne ke liye dhanyawad (${lead.product_interest || 'Products'}). Main ${agentName} bol raha hoon. Aapko details aur rate list bhej raha hoon.`;
    const msgToSend = customTemplate || defaultMsg;
    const encoded = encodeURIComponent(msgToSend);

    const nativeUrl = `whatsapp://send?phone=91${cleanPhone}&text=${encoded}`;
    const webUrl = `https://wa.me/91${cleanPhone}?text=${encoded}`;

    Linking.canOpenURL(nativeUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(nativeUrl);
        } else {
          return Linking.openURL(webUrl);
        }
      })
      .catch(() => {
        Linking.openURL(webUrl).catch(() => {
          Alert.alert('Error', 'Could not open WhatsApp on this device.');
        });
      });
  };

  // Quick WhatsApp Templates (Pre-filled, Personalized)
  const quickTemplates = [
    {
      title: 'Welcome & Rates',
      text: `Namaste ${lead.name || 'Sir/Madam'} ji! KisanConnect me inquiry ke liye dhanyawad (${lead.product_interest || 'Product'}). Main ${agentName} bol raha hoon. Rate list bhej raha hoon.`
    },
    {
      title: 'Call Not Connected',
      text: `Namaste ${lead.name || 'Sir/Madam'} ji, humne aapko KisanConnect inquiry ke liye call kiya tha par sampark nahi ho paya. Kripya free hokar call back karein. - ${agentName}`
    },
    {
      title: 'Catalog & Margin',
      text: `Namaste ${lead.name || 'Sir/Madam'} ji! ${lead.city || 'Aapke shehar'} ke liye KisanConnect margin sheet aur catalog share kar raha hoon. - ${agentName}`
    },
    {
      title: 'Follow-up & Order',
      text: `Hello ${lead.name || 'Sir/Madam'} ji, jaisa humari baat hui, aapki requirement note kar li gayi hai. Kisi bhi sahayata ke liye batayein. - ${agentName}`
    },
    {
      title: 'Distributor Proposal',
      text: `Namaste ${lead.name || 'Sir/Madam'} ji, KisanConnect Distributorship ke bare me discussion ke liye details share ki ja rahi hain. - ${agentName}`
    }
  ];

  // Status selection handler
  const handleSelectStatus = (statusObj) => {
    setSelectedStatus(statusObj.value);
    setFormError('');
    if (statusObj.triggersFollowup) {
      setScheduleFollowup(true);
      if (!followupDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFollowupDate(formatLocalDate(tomorrow));
      }
      if (!followupTime) {
        setFollowupTime('11:00');
      }
    }
  };

  // Disposition selection handler
  const handleSelectDisposition = (disp) => {
    setSelectedDisposition(disp);
    setFormError('');
    if (disp === 'Callback requested' || disp === 'Call back requested') {
      setScheduleFollowup(true);
      if (!followupDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFollowupDate(formatLocalDate(tomorrow));
      }
      if (!followupTime) {
        setFollowupTime('11:00');
      }
    }
  };

  // Quick remark chip click
  const handleQuickRemarkChip = (chipText) => {
    setFormError('');
    if (!remarks.trim()) {
      setRemarks(chipText);
    } else if (!remarks.includes(chipText)) {
      setRemarks(`${remarks.trim()}, ${chipText}`);
    }
  };

  // Quick date chips
  const handleQuickDate = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setFollowupDate(formatLocalDate(d));
  };

  // Quick time chips
  const handleQuickTime = (minutesToAdd) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutesToAdd);
    if (!followupDate) {
      setFollowupDate(formatLocalDate(d));
    }
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    setFollowupTime(`${hours}:${minutes}`);
  };

  const handleSetSpecificTime = (timeStr) => {
    setFollowupTime(timeStr);
    if (!followupDate) {
      setFollowupDate(formatLocalDate(new Date()));
    }
  };

  // 1-Tap Save & Complete Action
  const handleSaveAndComplete = async () => {
    setFormError('');

    if (!selectedStatus) {
      setFormError('Please select a Primary Status before saving.');
      return;
    }

    if (!remarks.trim()) {
      setFormError('Remarks are mandatory! Please type a brief note or tap a quick chip above.');
      remarksInputRef.current?.focus();
      return;
    }

    if (scheduleFollowup && (!followupDate || !followupTime)) {
      setFormError('Please select Date & Time for the scheduled follow-up.');
      return;
    }

    const parsedDuration = Math.max(0, parseInt(durationSec, 10) || 0);
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - parsedDuration * 1000);

    const payload = {
      lead_id: lead?.id || lead?._id,
      status: selectedStatus,
      disposition: selectedDisposition,
      remarks: remarks.trim(),
      notes: remarks.trim(),
      duration: parsedDuration,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      tags: selectedTags,
      followupDate: scheduleFollowup ? followupDate : null,
      followupTime: scheduleFollowup ? followupTime : null,
      followupReason: selectedDisposition || selectedStatus || 'Scheduled follow-up',
      followupPriority,
      followupNotes: scheduleFollowup ? (remarks.trim() || `Follow-up on ${selectedStatus}`) : null
    };

    saveCallMutation.mutate(payload);
  };

  // Copy Phone Number
  const copyPhoneNumber = (num, isAlt = false) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(num).catch(() => {});
    }
    if (isAlt) {
      setCopiedAltNumber(true);
      setTimeout(() => setCopiedAltNumber(false), 2000);
    } else {
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 2000);
    }
  };

  // Open Edit Modal
  const openEditModal = () => {
    setEditForm({
      name: lead.name || '',
      mobile: lead.mobile || '',
      alternate_mobile: lead.alternate_mobile || '',
      email: lead.email || '',
      city: lead.city || '',
      state: lead.state || '',
      business_type: lead.business_type || '',
      product_interest: lead.product_interest || '',
      priority: lead.priority || 'Normal'
    });
    setEditModalVisible(true);
  };

  const getInitials = (name) => {
    if (!name) return 'L';
    const parts = name.trim().split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  const formatDuration = (sec) => {
    const mins = Math.floor((sec || 0) / 60);
    const rem = (sec || 0) % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  // Priority Visuals
  const getPriorityStyle = (priorityStr) => {
    const p = String(priorityStr || '').toLowerCase();
    if (p.includes('hot') || p.includes('vip') || p.includes('high')) {
      return {
        label: 'HOT LEAD',
        icon: Flame,
        color: '#DC2626',
        bg: '#FEE2E2',
        border: '#FCA5A5'
      };
    }
    if (p.includes('cold') || p.includes('low')) {
      return {
        label: 'COLD LEAD',
        icon: Snowflake,
        color: '#475569',
        bg: '#F1F5F9',
        border: '#CBD5E1'
      };
    }
    return {
      label: 'WARM LEAD',
      icon: Sun,
      color: '#D97706',
      bg: '#FEF3C7',
      border: '#FCD34D'
    };
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-3 text-slate-500 font-bold text-xs">Loading Lead Command Screen...</Text>
      </View>
    );
  }

  const priorityStyle = getPriorityStyle(lead.priority);
  const PriorityIcon = priorityStyle.icon;

  // Meta Custom Questions parsing
  let customFieldsEntries = [];
  if (lead.custom_fields) {
    if (typeof lead.custom_fields === 'object' && !Array.isArray(lead.custom_fields)) {
      customFieldsEntries = Object.entries(lead.custom_fields);
    } else if (typeof lead.custom_fields === 'string') {
      try {
        const parsed = JSON.parse(lead.custom_fields);
        if (parsed && typeof parsed === 'object') {
          customFieldsEntries = Object.entries(parsed);
        }
      } catch {}
    }
  }

  // Cleaned phone numbers for dialing & deep links
  const cleanMobile = String(lead.mobile || '').replace(/\D/g, '').slice(-10);
  const cleanAltMobile = String(lead.alternate_mobile || '').replace(/\D/g, '').slice(-10);
  const displayMobile = cleanMobile ? `+91 ${cleanMobile}` : (lead.mobile || 'No Mobile');
  const displayAltMobile = cleanAltMobile ? `+91 ${cleanAltMobile}` : lead.alternate_mobile;

  // Filter timeline items
  const filteredTimeline = timeline.filter((item) => {
    if (timelineFilter === 'CALLS') return item.type === 'CALL';
    if (timelineFilter === 'FOLLOWUPS') return item.type === 'FOLLOWUP';
    return true;
  });

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <OfflineBanner />

      {/* TOP COMPACT HEADER */}
      <View className="bg-indigo-600 pt-14 pb-3 z-10 px-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-2">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
              <ChevronLeft color="#ffffff" size={26} />
            </TouchableOpacity>
            <Image
              source={require('../../../assets/images/logo-3d.png')}
              style={{ width: 30, height: 30, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#334155' }}
              resizeMode="cover"
            />
            <View className="flex-1">
              <View className="flex-row items-center">
                <Text className="text-white text-[17px] font-bold tracking-tight" numberOfLines={1}>
                  {lead.name || 'Lead Details'}
                </Text>
                {lead.lead_id && (
                  <View className="ml-2 bg-white/20 px-2 py-0.5 rounded-md">
                    <Text className="text-white text-[10px] font-bold">{lead.lead_id}</Text>
                  </View>
                )}
              </View>
              {powerQueue === '1' && (
                <Text className="text-[#FFB703] text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  ⚡ Power Dialer Mode Active
                </Text>
              )}
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={() => refetch()} className="p-2 bg-white/10 rounded-full">
              <RefreshCcw color="#ffffff" size={16} />
            </TouchableOpacity>
            <View className="w-8 h-8 rounded-full bg-[#FFB703] justify-center items-center">
              <Text className="text-indigo-950 font-bold text-[12px]">{getInitials(agentName)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* MAIN SCROLLABLE CONTENT (1-SCREEN MINIMUM-CLICKS WORKBENCH) */}
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ padding: 14, paddingBottom: 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================================== */}
        {/* CARD 1: IMMEDIATE ACTION CARD WITH BIG CALL & WHATSAPP     */}
        {/* ========================================================== */}
        <View className="bg-white rounded-3xl p-4 mb-3.5 shadow-sm border border-slate-100 relative">
          {/* Header Row with Badges */}
          <View className="flex-row items-start justify-between mb-3">
            <View className="flex-row items-center flex-1 pr-3">
              <Image 
                source={require('../../../assets/images/avatar-customer.png')}
                style={{ width: 44, height: 44, borderRadius: 22, marginRight: 10, borderWidth: 1.5, borderColor: '#CBD5E1' }}
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text className="text-[18px] font-bold text-indigo-950 leading-tight">{lead.name}</Text>
                <View className="flex-row items-center mt-1 flex-wrap gap-1.5">
                  <View className="flex-row items-center">
                    <MapPin size={12} color="#64748B" />
                    <Text className="text-[12px] font-semibold text-slate-500 ml-1">
                      {lead.city ? `${lead.city}${lead.state ? `, ${lead.state}` : ''}` : 'Location N/A'}
                    </Text>
                  </View>
                  <Text className="text-slate-300">•</Text>
                  <Text className="text-[12px] font-bold text-slate-700">
                    {lead.product_interest || lead.course_interest || 'Inquiry'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Quick Priority Toggle, Score & Edit Button */}
            <View className="flex-row items-center gap-1.5">
              <View className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200 flex-row items-center">
                <Award size={11} color="#4F46E5" />
                <Text className="text-[10px] font-bold text-slate-800 ml-1">Score: {lead.quality_score || 50}</Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  const nextP = lead.priority === 'Hot' ? 'Warm' : lead.priority === 'Warm' ? 'Cold' : 'Hot';
                  updatePriorityMutation.mutate(nextP);
                }}
                className="px-2.5 py-1 rounded-full flex-row items-center border"
                style={{ backgroundColor: priorityStyle.bg, borderColor: priorityStyle.border }}
              >
                <PriorityIcon size={12} color={priorityStyle.color} />
                <Text className="text-[10px] font-bold ml-1 uppercase" style={{ color: priorityStyle.color }}>
                  {priorityStyle.label}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={openEditModal}
                className="p-1.5 bg-slate-100 rounded-full"
              >
                <Pencil size={13} color="#4F46E5" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Mark Lead as Invalid',
                    'Choose invalidity category:',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Wrong Number', onPress: () => markInvalidMutation.mutate('Wrong Number') },
                      { text: 'Fake / Invalid Lead', onPress: () => markInvalidMutation.mutate('Invalid Lead') }
                    ]
                  );
                }}
                className="p-1.5 bg-red-50 rounded-full border border-red-100"
              >
                <Ban size={13} color="#DC2626" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Quick Phone & Alt Phone Bar */}
          <View className="bg-slate-50 rounded-2xl p-2.5 mb-3 border border-slate-100 flex-row justify-between items-center">
            <View className="flex-row items-center flex-1">
              <PhoneCall size={13} color="#4F46E5" />
              <Text className="text-[13px] font-bold text-indigo-950 ml-1.5">{displayMobile}</Text>
              <TouchableOpacity onPress={() => copyPhoneNumber(cleanMobile || lead.mobile, false)} className="ml-1.5 p-1">
                {copiedNumber ? <Check size={14} color="#16A34A" /> : <Copy size={12} color="#64748B" />}
              </TouchableOpacity>
              {copiedNumber && <Text className="text-[10px] font-bold text-emerald-600 ml-1">Copied!</Text>}
            </View>

            <View className="flex-row items-center gap-1.5">
              <View className="bg-slate-200/80 px-2 py-0.5 rounded-md">
                <Text className="text-[10px] font-bold text-slate-700">
                  Attempt #{lead.call_attempts || calls.length || 0}
                </Text>
              </View>

              {cleanAltMobile ? (
                <View className="flex-row items-center gap-1">
                  <TouchableOpacity
                    onPress={() => handleStartPhoneCall(cleanAltMobile)}
                    className="bg-sky-100 px-2 py-0.5 rounded-md flex-row items-center border border-sky-200"
                  >
                    <PhoneCall size={10} color="#0284C7" />
                    <Text className="text-[10px] font-bold text-sky-800 ml-1">Alt: {cleanAltMobile}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleSendWhatsApp(null, cleanAltMobile)}
                    className="bg-emerald-100 px-1.5 py-0.5 rounded-md flex-row items-center border border-emerald-200"
                  >
                    <MessageCircle size={10} color="#059669" />
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>

          {/* 1-CLICK CALL NOW & WHATSAPP BUTTONS */}
          <View className="flex-row gap-2.5 mb-2.5">
            {/* 1-Click Call Button */}
            <TouchableOpacity
              onPress={() => handleStartPhoneCall(cleanMobile || lead.mobile)}
              className="flex-1 bg-indigo-600 py-3.5 rounded-2xl flex-row justify-center items-center shadow-md active:bg-indigo-700"
            >
              <PhoneCall size={19} color="#FFB703" />
              <View className="ml-2">
                <Text className="text-white text-[13px] font-bold tracking-wider uppercase">CALL NOW</Text>
                <Text className="text-[#FFB703] text-[10px] font-bold">{displayMobile}</Text>
              </View>
            </TouchableOpacity>

            {/* 1-Click WhatsApp Button */}
            <TouchableOpacity
              onPress={() => handleSendWhatsApp()}
              className="w-[40%] bg-[#25D366] py-3.5 rounded-2xl flex-row justify-center items-center shadow-md active:bg-emerald-600"
            >
              <MessageCircle size={19} color="#ffffff" />
              <View className="ml-1.5">
                <Text className="text-white text-[13px] font-bold tracking-wider uppercase">WHATSAPP</Text>
                <Text className="text-white/80 text-[10px] font-bold">1-Click Chat</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Quick 1-Tap WhatsApp Templates (Instant Send) */}
          <View className="pt-2 border-t border-slate-100">
            <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              1-Tap WhatsApp Templates (Instant Send):
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {quickTemplates.map((tpl, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleSendWhatsApp(tpl.text)}
                  className="mr-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 flex-row items-center active:bg-emerald-100"
                >
                  <Send size={11} color="#059669" />
                  <Text className="text-[11px] font-bold text-emerald-800 ml-1.5">{tpl.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Profile & Metadata Collapsible Toggle */}
          <TouchableOpacity
            onPress={() => setShowMetadataDetails(!showMetadataDetails)}
            className="mt-2.5 pt-2 border-t border-slate-100 flex-row justify-between items-center"
          >
            <View className="flex-row items-center">
              <Share2 size={12} color="#64748B" />
              <Text className="text-[11px] font-bold text-slate-600 ml-1.5">
                Source: <Text className="font-bold text-slate-800">{lead.lead_source || 'Meta Lead Ads'}</Text>
                {customFieldsEntries.length > 0 ? ` • ${customFieldsEntries.length} Meta Answers` : ''}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-[10px] font-bold text-slate-400 mr-1">
                {showMetadataDetails ? 'Hide Info' : 'View Info'}
              </Text>
              {showMetadataDetails ? <ChevronUp size={14} color="#64748B" /> : <ChevronDown size={14} color="#64748B" />}
            </View>
          </TouchableOpacity>

          {/* Collapsible Metadata Details */}
          {showMetadataDetails && (
            <View className="mt-2.5 pt-2.5 border-t border-slate-100 bg-slate-50 p-3 rounded-2xl">
              {/* Campaign, AdSet, Ad */}
              {(lead.campaign_name || lead.adset_name || lead.ad_name || lead.utm_campaign) && (
                <View className="mb-2">
                  <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Campaign &amp; Ad Attribution:
                  </Text>
                  <View className="flex-row flex-wrap gap-1">
                    {lead.campaign_name && (
                      <View className="bg-white px-2 py-0.5 rounded border border-slate-200">
                        <Text className="text-[9px] font-bold text-slate-600">Campaign: {lead.campaign_name}</Text>
                      </View>
                    )}
                    {lead.adset_name && (
                      <View className="bg-white px-2 py-0.5 rounded border border-slate-200">
                        <Text className="text-[9px] font-bold text-slate-600">AdSet: {lead.adset_name}</Text>
                      </View>
                    )}
                    {lead.ad_name && (
                      <View className="bg-white px-2 py-0.5 rounded border border-slate-200">
                        <Text className="text-[9px] font-bold text-slate-600">Ad: {lead.ad_name}</Text>
                      </View>
                    )}
                    {lead.utm_campaign && !lead.campaign_name && (
                      <View className="bg-white px-2 py-0.5 rounded border border-slate-200">
                        <Text className="text-[9px] font-bold text-slate-600">UTM: {lead.utm_campaign}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Meta Lead Form Q&A */}
              {customFieldsEntries.length > 0 && (
                <View className="mb-2">
                  <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Meta Form Questions &amp; Answers:
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {customFieldsEntries.map(([k, v]) => (
                      <View key={k} className="bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                        <Text className="text-[10px] font-bold text-amber-900">
                          {k}: <Text className="font-bold text-amber-800">{String(v)}</Text>
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Email & Business Type */}
              <View className="flex-row justify-between items-center text-[11px] pt-1">
                <Text className="text-[11px] text-slate-500 font-medium">
                  Email: <Text className="text-slate-800 font-bold">{lead.email || 'N/A'}</Text>
                </Text>
                {lead.business_type ? (
                  <View className="bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                    <Text className="text-[9px] font-bold text-indigo-700 uppercase">{lead.business_type}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          )}
        </View>

        {/* ========================================================== */}
        {/* CARD 2: 1-SCREEN TELECALLER INTERACTION WORKBENCH          */}
        {/* ========================================================== */}
        <View className="bg-white rounded-3xl p-4 mb-3.5 shadow-sm border border-slate-100">
          <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <Text className="text-[14px] font-bold text-indigo-950 uppercase tracking-wider">
              Telecaller Interaction Form
            </Text>
            {/* Duration Display */}
            <View className="flex-row items-center bg-slate-100 px-2.5 py-1 rounded-xl">
              <Clock size={13} color="#64748B" />
              <Text className="text-[11px] font-bold text-slate-800 ml-1">
                Talk Time: {formatDuration(Number(durationSec))} ({durationSec}s)
              </Text>
            </View>
          </View>

          {/* Form Error Banner */}
          {formError ? (
            <View className="bg-red-50 border border-red-200 p-3 rounded-2xl mb-3.5 flex-row items-center">
              <TriangleAlert size={18} color="#DC2626" />
              <Text className="text-red-700 text-xs font-bold flex-1 ml-2">{formError}</Text>
            </View>
          ) : null}

          {/* Quick Talk-Time Duration Overrides */}
          <View className="flex-row items-center justify-between mb-4 bg-amber-50/60 p-2.5 rounded-2xl border border-amber-200/60">
            <Text className="text-[11px] font-bold text-amber-900">Talk Time Override:</Text>
            <View className="flex-row items-center gap-1.5">
              {[0, 30, 60, 120, 300].map((sec) => (
                <TouchableOpacity
                  key={sec}
                  onPress={() => setDurationSec(String(sec))}
                  className={`px-2 py-1 rounded-lg border ${
                    Number(durationSec) === sec ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-amber-200'
                  }`}
                >
                  <Text className={`text-[10px] font-bold ${Number(durationSec) === sec ? 'text-white' : 'text-slate-700'}`}>
                    {sec === 0 ? '0s' : sec < 60 ? `${sec}s` : `${sec / 60}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 1. PRIMARY STATUS SELECTOR (14 Required Statuses) */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">
                1. Primary Status *
              </Text>
              {selectedStatus ? (
                <View className="bg-slate-100 px-2 py-0.5 rounded-md">
                  <Text className="text-[11px] font-bold text-slate-700">{selectedStatus}</Text>
                </View>
              ) : null}
            </View>
            <View className="flex-row flex-wrap gap-1.5">
              {PRIMARY_STATUSES.map((item) => {
                const isSelected = selectedStatus === item.value;
                return (
                  <TouchableOpacity
                    key={item.value}
                    onPress={() => handleSelectStatus(item)}
                    className={`px-3 py-2 rounded-xl border flex-row items-center ${
                      isSelected
                        ? `${item.color} border-transparent shadow-sm`
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    {isSelected && <Check size={12} color="#FFFFFF" className="mr-1" />}
                    <Text className={`text-[12px] font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 2. CALL DISPOSITION SELECTOR (10 Required Dispositions) */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">
                2. Call Disposition
              </Text>
              {selectedDisposition ? (
                <View className="bg-slate-100 px-2 py-0.5 rounded-md">
                  <Text className="text-[11px] font-bold text-slate-700">{selectedDisposition}</Text>
                </View>
              ) : null}
            </View>
            <View className="flex-row flex-wrap gap-1.5">
              {CALL_DISPOSITIONS.map((disp) => {
                const isSelected = selectedDisposition === disp;
                return (
                  <TouchableOpacity
                    key={disp}
                    onPress={() => handleSelectDisposition(disp)}
                    className={`px-3 py-2 rounded-xl border ${
                      isSelected ? 'bg-indigo-600 border-indigo-600 shadow-sm' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <Text className={`text-[12px] font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                      {disp}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 3. MANDATORY REMARKS & QUICK TAG CHIPS */}
          <View className="mb-4">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-[12px] font-bold text-slate-800 uppercase tracking-wider">
                3. Mandatory Remarks / Summary *
              </Text>
              <Text className="text-[10px] font-semibold text-slate-600">Required</Text>
            </View>

            <Text className="text-[11px] font-medium text-slate-500 mb-2">
              Tap 1-click chip to insert discussion summary:
            </Text>
            <View className="flex-row flex-wrap gap-1.5 mb-2.5">
              {QUICK_REMARK_TAGS.map((chip) => (
                <TouchableOpacity
                  key={chip}
                  onPress={() => handleQuickRemarkChip(chip)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 active:bg-slate-200"
                >
                  <Text className="text-[11px] font-bold text-slate-700">+ {chip}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              ref={remarksInputRef}
              multiline
              numberOfLines={3}
              value={remarks}
              onChangeText={(text) => {
                setRemarks(text);
                if (formError) setFormError('');
              }}
              placeholder="Enter client discussion summary (e.g. Discussed 15L tin pricing, customer asked for catalog on WhatsApp)..."
              placeholderTextColor="#94A3B8"
              className={`border rounded-2xl p-3.5 text-[13px] h-20 text-indigo-950 bg-slate-50 ${
                !remarks.trim() && formError ? 'border-red-400 bg-red-50/40' : 'border-slate-200'
              }`}
              textAlignVertical="top"
            />
          </View>

          {/* 4. NEXT FOLLOW-UP SECTION */}
          <View className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Calendar size={16} color="#D97706" />
                <Text className="text-[12px] font-bold text-slate-800 ml-2 uppercase tracking-wider">
                  4. Schedule Next Follow-up
                </Text>
              </View>
              <Switch
                value={scheduleFollowup}
                onValueChange={(val) => {
                  setScheduleFollowup(val);
                  if (val && !followupDate) {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setFollowupDate(formatLocalDate(tomorrow));
                    setFollowupTime('11:00');
                  }
                }}
                trackColor={{ false: '#CBD5E1', true: '#FFB703' }}
                thumbColor={scheduleFollowup ? '#4F46E5' : '#FFFFFF'}
              />
            </View>

            {scheduleFollowup && (
              <View className="mt-3 pt-3 border-t border-slate-200/60">
                {/* Quick Date Chips */}
                <Text className="text-[11px] font-bold text-slate-500 mb-1.5">Quick Date:</Text>
                <View className="flex-row flex-wrap gap-1.5 mb-3">
                  {[
                    { label: 'Today', days: 0 },
                    { label: 'Tomorrow', days: 1 },
                    { label: 'In 2 Days', days: 2 },
                    { label: 'In 3 Days', days: 3 },
                    { label: 'In 1 Week', days: 7 }
                  ].map((d) => (
                    <TouchableOpacity
                      key={d.label}
                      onPress={() => handleQuickDate(d.days)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <Text className="text-[11px] font-bold text-slate-700">{d.label}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={() => setCalendarModalVisible(true)}
                    className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 flex-row items-center"
                  >
                    <Calendar size={11} color="#B45309" />
                    <Text className="text-[11px] font-bold text-amber-800 ml-1">Pick Date</Text>
                  </TouchableOpacity>
                </View>

                {/* Quick Time Chips */}
                <Text className="text-[11px] font-bold text-slate-500 mb-1.5">Quick Time:</Text>
                <View className="flex-row flex-wrap gap-1.5 mb-3">
                  {[
                    { label: '+15 Min', min: 15 },
                    { label: '+30 Min', min: 30 },
                    { label: '+1 Hr', min: 60 }
                  ].map((t) => (
                    <TouchableOpacity
                      key={t.label}
                      onPress={() => handleQuickTime(t.min)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <Text className="text-[11px] font-bold text-slate-700">{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                  {['11:00', '14:30', '17:30'].map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => handleSetSpecificTime(slot)}
                      className={`px-2.5 py-1.5 rounded-lg border ${
                        followupTime === slot ? 'bg-amber-500 border-amber-500' : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text className={`text-[11px] font-bold ${followupTime === slot ? 'text-white' : 'text-slate-700'}`}>
                        {slot === '11:00' ? '11:00 AM' : slot === '14:30' ? '02:30 PM' : '05:30 PM'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Date & Time Text Inputs */}
                <View className="flex-row justify-between">
                  <View className="w-[48%]">
                    <Text className="text-[10px] font-bold uppercase mb-1 text-slate-500">Date (YYYY-MM-DD)</Text>
                    <View className="flex-row items-center border rounded-xl px-2.5 py-2 border-slate-200 bg-white">
                      <Calendar size={14} color="#64748B" />
                      <TextInput
                        className="flex-1 ml-2 text-xs font-bold text-slate-800 p-0"
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#94A3B8"
                        value={followupDate}
                        onChangeText={setFollowupDate}
                      />
                    </View>
                  </View>
                  <View className="w-[48%]">
                    <Text className="text-[10px] font-bold uppercase mb-1 text-slate-500">Time (HH:MM)</Text>
                    <View className="flex-row items-center border rounded-xl px-2.5 py-2 border-slate-200 bg-white">
                      <Clock size={14} color="#64748B" />
                      <TextInput
                        className="flex-1 ml-2 text-xs font-bold text-slate-800 p-0"
                        placeholder="11:30"
                        placeholderTextColor="#94A3B8"
                        value={followupTime}
                        onChangeText={setFollowupTime}
                      />
                    </View>
                  </View>
                </View>

                {/* Reminder Priority Selector */}
                <View className="mt-3 flex-row items-center justify-between">
                  <Text className="text-[11px] font-bold text-slate-600">Reminder Priority:</Text>
                  <View className="flex-row gap-1.5">
                    {['High', 'Medium', 'Low'].map((p) => (
                      <TouchableOpacity
                        key={p}
                        onPress={() => setFollowupPriority(p)}
                        className={`px-2.5 py-1 rounded-lg border ${
                          followupPriority === p
                            ? p === 'High' ? 'bg-red-600 border-red-600' : 'bg-indigo-600 border-indigo-600'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <Text className={`text-[10px] font-bold ${followupPriority === p ? 'text-white' : 'text-slate-600'}`}>
                          {p}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mt-2.5 flex-row items-center bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                  <CircleCheck size={13} color="#059669" />
                  <Text className="text-[11px] font-bold text-emerald-800 ml-1.5">
                    Push &amp; Voice reminder alert will notify you automatically.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ========================================================== */}
        {/* CARD 3: DOCUMENTS & SCREENSHOT ATTACHMENTS (Requirement 2) */}
        {/* ========================================================== */}
        <View className="bg-white rounded-3xl p-4 mb-3.5 shadow-sm border border-slate-100">
          <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <View className="flex-row items-center">
              <Paperclip size={16} color="#4F46E5" />
              <Text className="text-[14px] font-bold text-indigo-950 uppercase tracking-wider ml-2">
                Documents &amp; Screenshots ({lead.documents?.length || 0})
              </Text>
            </View>
            <TouchableOpacity
              onPress={handlePickAndUploadDocument}
              disabled={uploadingDoc}
              className="bg-indigo-600 px-3 py-1.5 rounded-xl flex-row items-center shadow-xs"
            >
              {uploadingDoc ? (
                <ActivityIndicator size="small" color="#FFB703" />
              ) : (
                <>
                  <Upload size={12} color="#FFB703" />
                  <Text className="text-white text-[11px] font-bold ml-1.5">+ Attach File</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <Text className="text-[11px] text-slate-500 mb-3 font-medium">
            Attach payment receipts, GST certificates, shop photos, or quotations with 1 tap.
          </Text>

          {lead.documents && lead.documents.length > 0 ? (
            <View className="gap-2">
              {lead.documents.map((doc, idx) => (
                <View
                  key={doc._id || idx}
                  className="flex-row items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80"
                >
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="w-8 h-8 rounded-xl bg-indigo-50 items-center justify-center mr-2.5">
                      <FileText size={16} color="#4F46E5" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs font-bold text-indigo-950" numberOfLines={1}>
                        {doc.name || `Document #${idx + 1}`}
                      </Text>
                      <Text className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(doc.uploadedAt || Date.now()).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={() => {
                      const fullUrl = getDocumentFullUrl(doc.url);
                      if (fullUrl) {
                        Linking.openURL(fullUrl).catch(() => {
                          Alert.alert('Notice', 'Cannot open document URL directly.');
                        });
                      }
                    }}
                    className="px-2.5 py-1.5 bg-white rounded-xl border border-slate-200 flex-row items-center shadow-xs"
                  >
                    <ExternalLink size={12} color="#4F46E5" />
                    <Text className="text-[11px] font-bold text-indigo-950 ml-1">Open</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              onPress={handlePickAndUploadDocument}
              disabled={uploadingDoc}
              className="p-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 items-center justify-center"
            >
              <Paperclip size={20} color="#94A3B8" />
              <Text className="text-xs font-bold text-slate-600 mt-1.5">No documents attached yet</Text>
              <Text className="text-[10px] text-slate-400 mt-0.5">Tap here to select an image or PDF from device</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ========================================================== */}
        {/* CARD 4: TIMELINE OF PREVIOUS CALLS & FOLLOW-UPS            */}
        {/* ========================================================== */}
        <View className="bg-white rounded-3xl p-4 mb-3.5 shadow-sm border border-slate-100">
          <TouchableOpacity
            onPress={() => setShowHistory(!showHistory)}
            className="flex-row justify-between items-center"
          >
            <View className="flex-row items-center">
              <Clock size={16} color="#4F46E5" />
              <Text className="text-[13px] font-bold text-indigo-950 ml-2 uppercase tracking-wider">
                Timeline &amp; Previous Interactions ({calls.length} calls, {followups.length} follow-ups)
              </Text>
            </View>
            {showHistory ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
          </TouchableOpacity>

          {showHistory && (
            <View className="mt-3 pt-3 border-t border-slate-100">
              {/* Filter Tabs for Timeline */}
              <View className="flex-row gap-1.5 mb-3">
                {[
                  { key: 'ALL', label: `All (${timeline.length || calls.length + followups.length})` },
                  { key: 'CALLS', label: `Calls (${calls.length})` },
                  { key: 'FOLLOWUPS', label: `Follow-ups (${followups.length})` }
                ].map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => setTimelineFilter(tab.key)}
                    className={`px-2.5 py-1 rounded-lg border ${
                      timelineFilter === tab.key ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    <Text className={`text-[10px] font-bold ${timelineFilter === tab.key ? 'text-white' : 'text-slate-700'}`}>
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Render Timeline Items */}
              {filteredTimeline.length === 0 ? (
                <Text className="text-[12px] text-slate-400 font-medium text-center py-3">
                  No interactions recorded yet for this filter.
                </Text>
              ) : (
                filteredTimeline.map((item, idx) => {
                  const isCall = item.type === 'CALL';
                  const isFollowup = item.type === 'FOLLOWUP';
                  const isDoc = item.type === 'DOCUMENT';
                  const isFlag = item.type === 'INVALID_FLAG';

                  return (
                    <View key={idx} className="bg-slate-50 p-3 rounded-2xl mb-2.5 border border-slate-100">
                      <View className="flex-row justify-between items-start mb-1">
                        <View className="flex-row items-center flex-1">
                          {isCall ? (
                            <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center mr-2">
                              <PhoneCall size={12} color="#1D4ED8" />
                            </View>
                          ) : isFollowup ? (
                            <View className="w-6 h-6 rounded-full bg-amber-100 items-center justify-center mr-2">
                              <Calendar size={12} color="#B45309" />
                            </View>
                          ) : isDoc ? (
                            <View className="w-6 h-6 rounded-full bg-purple-100 items-center justify-center mr-2">
                              <Paperclip size={12} color="#7C3AED" />
                            </View>
                          ) : isFlag ? (
                            <View className="w-6 h-6 rounded-full bg-red-100 items-center justify-center mr-2">
                              <Ban size={12} color="#DC2626" />
                            </View>
                          ) : (
                            <View className="w-6 h-6 rounded-full bg-slate-200 items-center justify-center mr-2">
                              <Tag size={12} color="#475569" />
                            </View>
                          )}
                          <Text className="text-[12px] font-bold text-indigo-950">{item.title}</Text>
                        </View>

                        <Text className="text-[10px] font-bold text-slate-400">
                          {new Date(item.date).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </View>

                      {item.description ? (
                        <Text className="text-[11px] font-medium text-slate-600 bg-white p-2 rounded-xl border border-slate-100 mt-1">
                          {item.description}
                        </Text>
                      ) : null}

                      {/* Document Attachment Direct Link */}
                      {isDoc && item.document_url ? (
                        <View className="mt-2 pt-2 border-t border-slate-200/60 flex-row items-center justify-between">
                          <Text className="text-[10px] font-bold text-slate-500">Attachment Available</Text>
                          <TouchableOpacity
                            onPress={() => {
                              const fullUrl = getDocumentFullUrl(item.document_url);
                              if (fullUrl) Linking.openURL(fullUrl).catch(() => {});
                            }}
                            className="px-2.5 py-1 bg-white rounded-lg border border-purple-200 flex-row items-center"
                          >
                            <ExternalLink size={10} color="#7C3AED" />
                            <Text className="text-[10px] font-bold text-purple-700 ml-1">Open File</Text>
                          </TouchableOpacity>
                        </View>
                      ) : null}

                      {/* Audio Recording Playback (Requirement 5) */}
                      {isCall && item.recording_url ? (
                        <View className="mt-2 pt-2 border-t border-slate-200/60 flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <Volume2 size={13} color="#2563EB" />
                            <Text className="text-[10px] font-bold text-slate-600 ml-1.5">
                              Call Audio Recording
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleToggleAudioPlayback(item.recording_url)}
                            className={`px-3 py-1.5 rounded-xl border flex-row items-center shadow-xs ${
                              playingAudioUrl === item.recording_url
                                ? 'bg-blue-600 border-blue-600'
                                : 'bg-white border-blue-200'
                            }`}
                          >
                            {playingAudioUrl === item.recording_url ? (
                              <>
                                <Square size={11} color="#ffffff" fill="#ffffff" />
                                <Text className="text-[10px] font-bold text-white ml-1">Stop Audio</Text>
                              </>
                            ) : (
                              <>
                                <Play size={11} color="#1D4ED8" fill="#1D4ED8" />
                                <Text className="text-[10px] font-bold text-blue-700 ml-1">Play Recording</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ========================================================== */}
      {/* FIXED BOTTOM BAR: 1-SINGLE TAP SAVE & COMPLETE ACTION      */}
      {/* ========================================================== */}
      <View className="absolute bottom-0 left-0 right-0 p-3.5 bg-white border-t border-slate-200 shadow-2xl flex-row items-center justify-between z-20">
        <TouchableOpacity
          onPress={() => setCallModalFallbackVisible(true)}
          className="w-12 h-12 bg-slate-100 rounded-2xl justify-center items-center border border-slate-200 mr-2"
        >
          <Briefcase size={20} color="#4F46E5" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSaveAndComplete}
          disabled={saveCallMutation.isPending}
          className="flex-1 bg-indigo-600 py-4 rounded-2xl flex-row justify-center items-center shadow-lg active:bg-indigo-700"
        >
          {saveCallMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <CircleCheck size={20} color="#FFB703" />
              <Text className="text-white text-[14px] font-bold tracking-wide ml-2">
                {powerQueue === '1' ? 'SAVE & NEXT LEAD ⚡' : 'SAVE & COMPLETE (1-TAP)'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ========================================================== */}
      {/* MODAL 1: EDIT LEAD DETAILS                                 */}
      {/* ========================================================== */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-indigo-950/50">
          <View className="bg-white rounded-t-3xl p-5 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-indigo-950">Edit Lead Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'name', label: 'Lead / Customer Name' },
                { key: 'mobile', label: 'Primary Mobile Number' },
                { key: 'alternate_mobile', label: 'Alternate Mobile Number' },
                { key: 'email', label: 'Email Address' },
                { key: 'city', label: 'City' },
                { key: 'state', label: 'State' },
                { key: 'business_type', label: 'Business Type (Distributor/Retailer/Trader)' },
                { key: 'product_interest', label: 'Product / Course Interest' }
              ].map((field) => (
                <View key={field.key} className="mb-3">
                  <Text className="text-xs font-bold text-slate-600 mb-1">{field.label}</Text>
                  <TextInput
                    value={editForm[field.key]}
                    onChangeText={(val) => setEditForm({ ...editForm, [field.key]: val })}
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-indigo-950 bg-slate-50"
                  />
                </View>
              ))}

              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-600 mb-1.5">Priority Level</Text>
                <View className="flex-row gap-2">
                  {['Hot', 'Warm', 'Cold'].map((lvl) => (
                    <TouchableOpacity
                      key={lvl}
                      onPress={() => setEditForm({ ...editForm, priority: lvl })}
                      className={`flex-1 py-2.5 rounded-xl border items-center ${
                        editForm.priority === lvl ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${editForm.priority === lvl ? 'text-white' : 'text-slate-700'}`}>
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => editLeadMutation.mutate(editForm)}
                disabled={editLeadMutation.isPending}
                className="bg-indigo-600 py-4 rounded-xl items-center justify-center mt-2 mb-6"
              >
                {editLeadMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-sm">Save Lead Profile</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================== */}
      {/* MODAL 2: SIMPLE CALENDAR PICKER                            */}
      {/* ========================================================== */}
      <SimpleCalendarModal
        visible={calendarModalVisible}
        onClose={() => setCalendarModalVisible(false)}
        onSelect={(dateStr) => {
          setFollowupDate(dateStr);
          setCalendarModalVisible(false);
        }}
        isDark={false}
        title="Select Follow-up Date"
      />

      {/* ========================================================== */}
      {/* MODAL 3: CALL MODAL FALLBACK / EXTENDED DISPOSITION        */}
      {/* ========================================================== */}
      {callModalFallbackVisible && (
        <CallModal
          visible={callModalFallbackVisible}
          onClose={() => setCallModalFallbackVisible(false)}
          lead={lead}
          onSubmit={async (details) => {
            await saveCallMutation.mutateAsync(details);
            setCallModalFallbackVisible(false);
          }}
          isDark={false}
          initialDuration={Number(durationSec)}
        />
      )}
    </View>
  );
}
