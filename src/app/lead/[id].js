import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Linking, Image, Modal, AppState } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { ChevronLeft, RefreshCcw, MapPin, Edit2, Briefcase, PhoneCall, Clock, CheckSquare, MessageCircle, X, Send } from 'lucide-react-native';
import OfflineBanner from '../../components/OfflineBanner';
import CallModal from '../../components/CallModal';
import { useAuthStore } from '../../store/authStore';

export default function LeadDetails() {
  const { id, powerQueue } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState('LEAD INFO');
  const [callModalVisible, setCallModalVisible] = useState(false);
  const [whatsappModalVisible, setWhatsappModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [trackedDuration, setTrackedDuration] = useState(0);

  // Edit Lead Form State
  const [editForm, setEditForm] = useState({
    name: '',
    mobile: '',
    email: '',
    city: '',
    state: '',
    business_type: '',
    product_interest: ''
  });

  // Track when user leaves app for phone call
  const callStartedAtRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const { data: leadData, isLoading, refetch } = useQuery({
    queryKey: ['leadDetails', id],
    queryFn: async () => {
      const response = await api.get(`/leads/${id}`);
      return response.data;
    }
  });

  // Listen for return from Phone Dialer to auto-pop CallModal with tracked duration
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        callStartedAtRef.current
      ) {
        const elapsedSec = Math.max(5, Math.round((Date.now() - callStartedAtRef.current) / 1000));
        callStartedAtRef.current = null;
        setTrackedDuration(elapsedSec);
        setCallModalVisible(true);
      }
      appStateRef.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);

  const disposeMutation = useMutation({
    mutationFn: (details) => api.post('/calls', details),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['leadDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['telecallerDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['telecallerLeadsList'] });
      queryClient.invalidateQueries({ queryKey: ['powerQueue'] });

      if (powerQueue === '1') {
        try {
          const qRes = await api.get('/leads/power-queue');
          const nextLead = qRes.data?.queue?.find(item => String(item.id) !== String(id));
          if (nextLead) {
            Alert.alert('Saved! Power Dialer Active', `Next in queue: ${nextLead.name} (${nextLead.queueReason})`, [
              { text: 'Stop Queue', style: 'cancel', onPress: () => router.back() },
              { text: 'Open Next Lead →', onPress: () => router.replace(`/lead/${nextLead.id}?powerQueue=1`) }
            ]);
            return;
          }
        } catch {}
      }

      Alert.alert('Success', 'Call outcome & disposition saved!', [
        { text: 'Stay Here' },
        { text: 'Back to List', onPress: () => router.back() }
      ]);
    }
  });

  const editLeadMutation = useMutation({
    mutationFn: (payload) => api.put(`/leads/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leadDetails', id] });
      queryClient.invalidateQueries({ queryKey: ['telecallerLeadsList'] });
      setEditModalVisible(false);
      Alert.alert('Updated', 'Lead details updated successfully.');
    }
  });

  const handleCallSubmit = async (details) => {
    await disposeMutation.mutateAsync(details);
  };

  const handleStartPhoneCall = (mobileNumber) => {
    if (!mobileNumber) {
      Alert.alert('Error', 'Mobile number not available');
      return;
    }
    callStartedAtRef.current = Date.now();
    Linking.openURL(`tel:${mobileNumber}`).catch(() => {
      // Fallback if running on web/simulator where tel: doesn't background app
      setTrackedDuration(45);
      setCallModalVisible(true);
    });
  };

  const openWhatsAppWithTemplate = (templateText) => {
    const lead = leadData?.lead || {};
    const cleanPhone = String(lead.mobile || '').replace(/\D/g, '').slice(-10);
    if (!cleanPhone) {
      Alert.alert('Invalid Phone', 'Lead does not have a valid phone number.');
      return;
    }
    const msg = encodeURIComponent(templateText);
    setWhatsappModalVisible(false);
    Linking.openURL(`https://wa.me/91${cleanPhone}?text=${msg}`).catch(() => {
      Alert.alert('Error', 'Could not open WhatsApp.');
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color="#0B192C" />
      </View>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'L';
    const parts = name.trim().split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  };

  const lead = leadData?.lead || {};
  const agentName = user?.name || 'Sales Executive';

  const quickTemplates = [
    {
      title: '1. Initial Welcome & Rate List',
      tag: 'Welcome',
      text: `Namaste ${lead.name || 'Sir/Madam'} ji! KisanConnect me inquiry karne ke liye dhanyawad (${lead.product_interest || 'Bulk Oil'}). Main ${agentName} bol raha hoon. Aapko product details aur rate list bhej raha hoon.`
    },
    {
      title: '2. Call Not Connected / Busy',
      tag: 'Missed Call',
      text: `Namaste ${lead.name || 'Sir/Madam'} ji, humne aapko KisanConnect inquiry ke silsile me call kiya tha par sampark nahi ho paya. Kripya free hokar is message ka reply karein ya call back karein. - ${agentName}`
    },
    {
      title: '3. Follow-up & Order Confirmation',
      tag: 'Follow-up',
      text: `Hello ${lead.name || 'Sir/Madam'} ji, jaisa humari call par baat hui, aapki ${lead.product_interest || 'order'} requirement note kar li gayi hai. Kisi bhi sahayata ke liye batayein. - ${agentName}`
    },
    {
      title: '4. Distributor / Dealer Proposal',
      tag: 'B2B Offer',
      text: `Namaste ${lead.name || 'Sir/Madam'} ji! ${lead.city || 'Aapke shehar'} ke liye KisanConnect Dealership / Distributorship margin sheet aur brochure yahan share kar raha hoon. - ${agentName}`
    }
  ];

  const openEditModal = () => {
    setEditForm({
      name: lead.name || '',
      mobile: lead.mobile || '',
      email: lead.email || '',
      city: lead.city || '',
      state: lead.state || '',
      business_type: lead.business_type || '',
      product_interest: lead.product_interest || ''
    });
    setEditModalVisible(true);
  };

  const formatDuration = (sec) => {
    const mins = Math.floor((sec || 0) / 60);
    const rem = (sec || 0) % 60;
    return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <OfflineBanner />

      {/* HEADER */}
      <View className="bg-[#0B192C] pt-14 pb-4 z-10">
        <View className="px-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
              <ChevronLeft color="#ffffff" size={26} />
            </TouchableOpacity>
            <Image 
              source={require('../../../assets/brand-logo.jpg')}
              style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8, borderWidth: 1, borderColor: '#ffffff' }}
              resizeMode="cover"
            />
            <View>
              <Text className="text-white text-[18px] font-bold tracking-wide">
                Lead Details {lead.lead_id ? `(${lead.lead_id})` : ''}
              </Text>
              {powerQueue === '1' && (
                <Text className="text-[#FFB703] text-[10px] font-black uppercase tracking-widest">
                  ⚡ Power Dialer Active
                </Text>
              )}
            </View>
          </View>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity onPress={() => refetch()} className="p-1.5 bg-white/10 rounded-full">
              <RefreshCcw color="#ffffff" size={18} />
            </TouchableOpacity>
            <View className="w-8 h-8 rounded-full bg-[#FFB703] justify-center items-center">
              <Text className="text-[#0B192C] font-black text-[12px]">{getInitials(agentName)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* SUB-HEADER (Call Time & Badge) */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-slate-100 z-10">
        <View className="flex-row items-center">
          <Clock size={16} color="#64748B" />
          <Text className="text-[13px] font-bold text-slate-600 ml-1.5">
            Last Talk: {formatDuration(trackedDuration)} • Attempts: {lead.call_attempts || (leadData?.calls?.length || 0)}
          </Text>
        </View>
        <View className="bg-[#FFF8E1] px-3 py-1 rounded-full border border-[#FFE082]">
          <Text className="text-[#F59E0B] font-bold text-[11px] uppercase tracking-wider">{lead.status || 'Fresh Lead'}</Text>
        </View>
      </View>

      {/* TABS */}
      <View className="bg-white flex-row justify-between px-2 pt-1 border-b border-slate-100 shadow-sm z-10">
        {['LEAD INFO', 'TIMELINE', 'HISTORY'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`pb-3 px-2 border-b-[3px] ${activeTab === tab ? 'border-[#FFB703]' : 'border-transparent'}`}
          >
            <Text className={`text-[12px] font-bold tracking-widest ${activeTab === tab ? 'text-[#0B192C]' : 'text-slate-400'}`}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CONTENT AREA */}
      {activeTab === 'TIMELINE' ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <Text className="text-[20px] font-black text-[#0B192C] mb-4 tracking-tight">Lead Timeline</Text>
          <View className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            {leadData?.timeline && leadData.timeline.length > 0 ? (
              leadData.timeline.map((event, index) => (
                <View key={index} className="flex-row mb-6 relative">
                  {index !== leadData.timeline.length - 1 && (
                    <View className="absolute left-[11px] top-8 bottom-[-24px] w-[2px] bg-slate-100" />
                  )}
                  <View className="w-6 h-6 rounded-full items-center justify-center bg-blue-50 mt-1 mr-4 border-2 border-white shadow-sm z-10">
                    <View className="w-2.5 h-2.5 bg-[#0B192C] rounded-full" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-bold text-slate-800">{event.title}</Text>
                    <Text className="text-[13px] font-medium text-slate-500 mt-1">
                      {new Date(event.date).toLocaleString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: true
                      })}
                    </Text>
                    {event.description ? (
                      <Text className="text-[14px] text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {event.description}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center py-6">
                <Text className="text-slate-400 font-bold">No timeline available.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : activeTab === 'HISTORY' ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <Text className="text-[20px] font-black text-[#0B192C] mb-4 tracking-tight">Call History</Text>
          <View className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100">
            {leadData?.calls && leadData.calls.length > 0 ? (
              leadData.calls.map((call, index) => (
                <View key={index} className="mb-5 pb-5 border-b border-slate-100">
                  <View className="flex-row justify-between items-start mb-2">
                    <View>
                      <Text className="text-[15px] font-bold text-[#0B192C]">Status: {call.status}</Text>
                      <Text className="text-[12px] text-slate-500 mt-0.5">
                        {new Date(call.start_time).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit', hour12: true
                        })}
                      </Text>
                    </View>
                    <View className="bg-slate-100 px-2 py-1 rounded-md">
                      <Text className="text-[11px] font-bold text-slate-600">Dur: {call.duration}s</Text>
                    </View>
                  </View>
                  {call.notes ? (
                    <Text className="text-[14px] text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      {call.notes}
                    </Text>
                  ) : null}
                </View>
              ))
            ) : (
              <View className="items-center py-6">
                <Text className="text-slate-400 font-bold">No calls logged yet.</Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1">
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
            {/* Card 1: Basic Info */}
            <View className="bg-white rounded-[24px] p-5 mb-4 shadow-sm border border-slate-100 relative">
              <TouchableOpacity onPress={openEditModal} className="absolute top-4 right-4 p-2 z-10 bg-slate-50 rounded-full">
                <Edit2 size={16} color="#0B192C" />
              </TouchableOpacity>
              <View className="flex-row items-center">
                <View className="w-[64px] h-[64px] bg-[#EEF2FF] rounded-full justify-center items-center mr-4">
                  <Text className="text-[#0B192C] font-black text-[22px]">{getInitials(lead.name)}</Text>
                </View>
                <View className="flex-1 pr-6">
                  <Text className="text-[18px] font-black text-[#0B192C] leading-tight mb-1">{lead.name}</Text>
                  <View className="flex-row items-center mt-0.5 mb-2">
                    <MapPin size={12} color="#64748B" />
                    <Text className="text-[13px] font-medium text-slate-500 ml-1 leading-tight">
                      {lead.city ? `${lead.city}${lead.state ? `, ${lead.state}` : ''}` : 'Location N/A'}
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-2">
                    <View className="bg-slate-100 px-2.5 py-1 rounded-md mb-1">
                      <Text className="text-[10px] font-bold text-slate-600 uppercase">{lead.business_type || 'Retail'}</Text>
                    </View>
                    {lead.tags && lead.tags.map((t, idx) => (
                      <View key={idx} className="bg-rose-100 px-2.5 py-1 rounded-md border border-rose-200 mb-1">
                        <Text className="text-[10px] font-bold text-rose-700 uppercase">{t}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Card 2: Contact Details */}
            <View className="bg-white rounded-[24px] mb-4 shadow-sm border border-slate-100 overflow-hidden">
              <View className="bg-slate-50 px-5 py-3.5 border-b border-slate-100">
                <Text className="text-[12px] font-bold text-slate-700 uppercase tracking-widest">Contact Details</Text>
              </View>
              <View className="p-5">
                <View className="flex-row justify-between items-center mb-5">
                  <Text className="text-[14px] text-slate-500 font-medium">Mobile Number</Text>
                  <Text className="text-[15px] text-[#0B192C] font-black">+91 {lead.mobile}</Text>
                </View>
                <View className="flex-row justify-between items-center mb-5">
                  <Text className="text-[14px] text-slate-500 font-medium">Email Address</Text>
                  <Text className="text-[14px] text-[#0B192C] font-bold">{lead.email || 'N/A'}</Text>
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-[14px] text-slate-500 font-medium">Lead Source</Text>
                  <Text className="text-[14px] text-[#0B192C] font-bold">{lead.lead_source || 'Meta Lead Ads'}</Text>
                </View>
              </View>
            </View>

            {/* Card 3: Product Interests */}
            <View className="bg-white rounded-[24px] mb-6 shadow-sm border border-slate-100 overflow-hidden">
              <View className="bg-slate-50 px-5 py-3.5 border-b border-slate-100">
                <Text className="text-[12px] font-bold text-slate-700 uppercase tracking-widest">Product Interest & Notes</Text>
              </View>
              <View className="p-5 space-y-3">
                <View className="flex-row items-center bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100">
                  <View className="w-11 h-11 bg-[#F5E6D3] rounded-xl justify-center items-center mr-4">
                    <CheckSquare size={20} color="#78350F" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-[#0B192C]">{lead.product_interest || 'General Inquiry'}</Text>
                    <Text className="text-[12px] text-slate-500 mt-0.5 font-medium">Business Type: {lead.business_type || 'Trader / Distributor'}</Text>
                  </View>
                </View>
                {lead.notes ? (
                  <View className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/60 mt-3">
                    <Text className="text-[11px] font-bold text-amber-800 uppercase mb-1">Lead Metadata & Notes</Text>
                    <Text className="text-[12px] text-slate-700 font-medium">{lead.notes}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>

          {/* FIXED BOTTOM BAR: CALL NOW + WHATSAPP + DISPOSITION */}
          <View className="absolute bottom-6 left-0 right-0 p-4 bg-white border-t border-slate-100 flex-row items-center justify-between shadow-lg">
            <TouchableOpacity 
              onPress={() => handleStartPhoneCall(lead.mobile)}
              className="flex-1 bg-[#FFB703] py-4 rounded-full flex-row justify-center items-center mr-2.5 shadow-sm"
            >
              <PhoneCall size={20} color="#0B192C" fill="#0B192C" />
              <Text className="text-[#0B192C] text-[15px] font-black tracking-wide ml-2">CALL NOW</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setWhatsappModalVisible(true)}
              className="w-[52px] h-[52px] bg-[#25D366] rounded-full justify-center items-center mr-2.5 shadow-sm"
            >
              <MessageCircle size={22} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => setCallModalVisible(true)}
              className="w-[52px] h-[52px] bg-[#0B192C] rounded-full justify-center items-center shadow-sm"
            >
              <Briefcase size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* WHATSAPP QUICK TEMPLATES MODAL */}
      <Modal
        visible={whatsappModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setWhatsappModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-3xl p-6 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-lg font-black text-slate-900">1-Tap WhatsApp Message</Text>
                <Text className="text-xs text-slate-500">Send instant template to {lead.name} (+91 {lead.mobile})</Text>
              </View>
              <TouchableOpacity onPress={() => setWhatsappModalVisible(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {quickTemplates.map((tpl, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => openWhatsAppWithTemplate(tpl.text)}
                  className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 mb-3"
                >
                  <View className="flex-row justify-between items-center mb-1.5">
                    <Text className="text-sm font-black text-slate-900">{tpl.title}</Text>
                    <View className="bg-emerald-600 px-2.5 py-0.5 rounded-full flex-row items-center">
                      <Send size={10} color="#fff" />
                      <Text className="text-[10px] font-bold text-white ml-1">Send</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-slate-600 leading-5">{tpl.text}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => openWhatsAppWithTemplate(`Namaste ${lead.name || ''} ji, `)}
                className="p-4 rounded-2xl bg-slate-900 items-center justify-center mt-2 mb-4"
              >
                <Text className="text-white font-bold text-sm">Open Direct Blank WhatsApp Chat</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EDIT LEAD DETAILS MODAL */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-black text-slate-900">Edit Lead Information</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'name', label: 'Customer / Firm Name' },
                { key: 'mobile', label: 'Mobile Number' },
                { key: 'email', label: 'Email Address' },
                { key: 'city', label: 'City' },
                { key: 'state', label: 'State' },
                { key: 'business_type', label: 'Business Type (Distributor / Trader / Retail)' },
                { key: 'product_interest', label: 'Product Interest' }
              ].map((field) => (
                <View key={field.key} className="mb-3.5">
                  <Text className="text-xs font-bold text-slate-600 mb-1">{field.label}</Text>
                  <TextInput
                    value={editForm[field.key]}
                    onChangeText={(val) => setEditForm({ ...editForm, [field.key]: val })}
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50"
                  />
                </View>
              ))}

              <TouchableOpacity
                onPress={() => editLeadMutation.mutate(editForm)}
                disabled={editLeadMutation.isPending}
                className="bg-[#E11D48] py-4 rounded-xl items-center justify-center mt-2 mb-6"
              >
                {editLeadMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-sm">Save Lead Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CALL MODAL FOR DISPOSITION */}
      {lead && (lead.id || lead._id) && (
        <CallModal
          visible={callModalVisible}
          onClose={() => setCallModalVisible(false)}
          lead={lead}
          onSubmit={handleCallSubmit}
          isDark={false}
          initialDuration={trackedDuration}
        />
      )}
    </View>
  );
}
