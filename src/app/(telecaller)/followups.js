import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Linking, Image } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { PhoneCall, Check, Clock, Bell, MessageCircle, ExternalLink, Calendar, AlertTriangle, ArrowRight, Tag } from 'lucide-react-native';
import OfflineBanner from '../../components/OfflineBanner';
import CallModal from '../../components/CallModal';
import { useRouter } from 'expo-router';

export default function TelecallerFollowups() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'overdue' | 'tomorrow' | 'thisWeek'
  const [refreshing, setRefreshing] = useState(false);

  const [selectedLeadForCall, setSelectedLeadForCall] = useState(null);
  const [callModalVisible, setCallModalVisible] = useState(false);

  const todayDate = new Date().toISOString().split('T')[0];
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['telecallerFollowupsList', todayDate],
    queryFn: async () => {
      const response = await api.get('/followups', {
        params: { todayDate }
      });
      return response.data;
    },
    staleTime: 60 * 1000
  });

  const completeMutation = useMutation({
    mutationFn: (followupId) => api.patch(`/followups/${followupId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecallerFollowupsList'] });
      queryClient.invalidateQueries({ queryKey: ['telecallerDashboardStats'] });
      Alert.alert('Follow-up Completed', 'Marked task as completed.');
    }
  });

  const disposeMutation = useMutation({
    mutationFn: (details) => api.post('/calls', details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecallerFollowupsList'] });
      queryClient.invalidateQueries({ queryKey: ['telecallerDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['telecallerLeadsList'] });
      Alert.alert('Success', 'Call outcome logged & follow-up updated!');
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const list = data?.[activeTab] || [];

  const handleCall = (item) => {
    const mobile = item.lead_mobile || item.lead?.mobile;
    const leadId = item.lead?._id || item.lead;
    const leadObj = {
      id: leadId,
      name: item.lead_name || item.lead?.name || 'Lead',
      mobile
    };
    setSelectedLeadForCall(leadObj);

    if (mobile) {
      Linking.openURL(`tel:${mobile}`).catch(() => {});
    }
    setTimeout(() => {
      setCallModalVisible(true);
    }, 600);
  };

  const handleWhatsApp = (item) => {
    const mobile = String(item.lead_mobile || item.lead?.mobile || '').replace(/\D/g, '').slice(-10);
    if (!mobile) {
      Alert.alert('No Mobile', 'Valid mobile number not found for this lead.');
      return;
    }
    const name = item.lead_name || item.lead?.name || 'Sir';
    const text = encodeURIComponent(`Namaste ${name} ji, KisanConnect se aapke scheduled follow-up ke liye sampark kar rahe hain.`);
    Linking.openURL(`https://wa.me/91${mobile}?text=${text}`).catch(() => {});
  };

  const tabOptions = [
    { key: 'today', label: 'Today', count: data?.today?.length || 0, color: 'text-amber-700' },
    { key: 'overdue', label: 'Overdue', count: data?.overdue?.length || 0, color: 'text-rose-600' },
    { key: 'tomorrow', label: 'Tomorrow', count: data?.tomorrow?.length || 0, color: 'text-blue-600' },
    { key: 'thisWeek', label: 'This Week', count: data?.thisWeek?.length || 0, color: 'text-slate-700' }
  ];

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <OfflineBanner />

      {/* Top Header */}
      <View className="bg-[#0B192C] pt-14 pb-5 px-5 shadow-md">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-white text-xl font-black tracking-tight">Follow-ups &amp; Callbacks</Text>
            <Text className="text-[#FFB703] text-xs font-semibold mt-0.5">
              Scheduled tasks, reminders &amp; customer callback queue
            </Text>
          </View>
          <TouchableOpacity onPress={onRefresh} className="p-2 bg-white/10 rounded-full">
            <Bell size={18} color="#FFB703" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 4 Tabs Filter (Requirement 6: Today, tomorrow, this week, overdue) */}
      <View className="px-4 py-3 bg-white border-b border-slate-200 shadow-xs">
        <View className="flex-row bg-slate-100 rounded-xl p-1">
          {tabOptions.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 rounded-lg items-center justify-center ${
                  isActive ? 'bg-[#0B192C] shadow-xs' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-[11px] font-black ${
                    isActive ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {tab.label}
                </Text>
                <Text
                  className={`text-[10px] font-bold ${
                    isActive ? 'text-[#FFB703]' : 'text-slate-400'
                  }`}
                >
                  {tab.count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Follow-up Cards List */}
      {isLoading ? (
        <View className="py-20 items-center justify-center">
          <ActivityIndicator size="large" color="#E11D48" />
          <Text className="text-xs text-slate-500 font-bold mt-3">Loading follow-ups...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E11D48" />}
        >
          {list.map((item, index) => {
            const isOverdue = activeTab === 'overdue' || item.isOverdue;
            const leadId = item.lead?._id || item.lead;
            const leadName = item.lead_name || item.lead?.name || 'Prospect';
            const leadPhone = item.lead_mobile || item.lead?.mobile || '';

            return (
              <View
                key={item.id || index}
                className="bg-white rounded-2xl p-4 mb-3 border border-slate-200/90 shadow-xs"
              >
                {/* Header Row */}
                <TouchableOpacity
                  onPress={() => leadId && router.push(`/lead/${leadId}`)}
                  className="flex-row justify-between items-start mb-2"
                >
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center flex-wrap gap-1.5">
                      <Text className="text-base font-black text-slate-900">{leadName}</Text>
                      {item.lead_code ? (
                        <View className="bg-slate-100 px-1.5 py-0.5 rounded">
                          <Text className="text-[10px] font-mono font-bold text-slate-600">{item.lead_code}</Text>
                        </View>
                      ) : null}
                      {isOverdue && (
                        <View className="bg-rose-100 px-2 py-0.5 rounded">
                          <Text className="text-[9px] font-black text-rose-700 uppercase">OVERDUE</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-xs text-slate-500 font-medium mt-0.5">
                      +91 {leadPhone} {item.lead_city ? `• ${item.lead_city}` : ''}
                    </Text>
                  </View>

                  <View className="items-end">
                    <View className="bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex-row items-center">
                      <Clock size={11} color="#D97706" />
                      <Text className="text-amber-800 font-black text-xs ml-1">{item.time}</Text>
                    </View>
                    <Text className="text-[10px] text-slate-400 font-medium mt-1">{item.date}</Text>
                  </View>
                </TouchableOpacity>

                {/* Reason & Priority Badges */}
                <View className="flex-row items-center gap-1.5 mb-2.5">
                  <View className="bg-slate-100 px-2 py-0.5 rounded-md flex-row items-center">
                    <Tag size={10} color="#64748B" />
                    <Text className="text-[10px] font-bold text-slate-700 ml-1">
                      {item.reason || 'Callback'}
                    </Text>
                  </View>
                  {item.priority === 'High' && (
                    <View className="bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      <Text className="text-[10px] font-bold text-rose-700">High Priority</Text>
                    </View>
                  )}
                  {item.lead_product ? (
                    <View className="bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      <Text className="text-[10px] font-bold text-blue-700">{item.lead_product}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Notes box */}
                {item.notes ? (
                  <View className="bg-slate-50 rounded-xl p-2.5 mb-3 border border-slate-100">
                    <Text className="text-xs text-slate-700 italic">
                      "{item.notes}"
                    </Text>
                  </View>
                ) : null}

                {/* Direct 1-Tap Action Row */}
                <View className="flex-row items-center gap-2 pt-1 border-t border-slate-100">
                  <TouchableOpacity
                    onPress={() => handleCall(item)}
                    className="flex-1 bg-[#E11D48] py-2.5 rounded-xl flex-row items-center justify-center shadow-xs"
                  >
                    <PhoneCall size={14} color="#ffffff" fill="#ffffff" />
                    <Text className="text-white text-xs font-black ml-1.5">Call &amp; Dispose</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleWhatsApp(item)}
                    className="w-10 h-10 rounded-xl bg-[#25D366] items-center justify-center shadow-xs"
                  >
                    <MessageCircle size={18} color="#ffffff" fill="#ffffff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => completeMutation.mutate(item.id)}
                    className="w-10 h-10 rounded-xl border border-emerald-300 bg-emerald-50 items-center justify-center"
                    title="Mark Completed"
                  >
                    <Check size={18} color="#059669" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => leadId && router.push(`/lead/${leadId}`)}
                    className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center"
                  >
                    <ArrowRight size={16} color="#475569" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {list.length === 0 && (
            <View className="py-20 items-center justify-center">
              <Clock size={36} color="#CBD5E1" />
              <Text className="text-slate-500 font-bold text-sm mt-3">
                No follow-ups in {activeTab.toUpperCase()} queue.
              </Text>
              <Text className="text-slate-400 text-xs mt-1">All callbacks completed on time!</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Call Modal Instance */}
      {selectedLeadForCall && (
        <CallModal
          visible={callModalVisible}
          onClose={() => {
            setCallModalVisible(false);
            setSelectedLeadForCall(null);
          }}
          lead={selectedLeadForCall}
          onSubmit={async (payload) => {
            await disposeMutation.mutateAsync(payload);
          }}
          initialDuration={30}
        />
      )}
    </View>
  );
}