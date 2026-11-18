import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert, Linking, Image } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { PhoneCall, Check, Clock, Bell, MessageCircle, ExternalLink } from 'lucide-react-native';
import OfflineBanner from '../../components/OfflineBanner';
import CallModal from '../../components/CallModal';
import { useRouter } from 'expo-router';

export default function TelecallerFollowups() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'upcoming', 'overdue'
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
    staleTime: 2 * 60 * 1000
  });

  const completeMutation = useMutation({
    mutationFn: (followupId) => api.patch(`/followups/${followupId}/complete`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecallerFollowupsList'] });
      queryClient.invalidateQueries({ queryKey: ['telecallerDashboardStats'] });
      Alert.alert('Done', 'Follow-up marked as completed.');
    }
  });

  const disposeMutation = useMutation({
    mutationFn: (details) => api.post('/calls', details),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telecallerFollowupsList'] });
      queryClient.invalidateQueries({ queryKey: ['telecallerDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['telecallerLeadsList'] });
      Alert.alert('Success', 'Call outcome saved & follow-up updated!');
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

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <OfflineBanner />
      
      {/* Top Header */}
      <View className="pt-14 pb-4 px-6 flex-row items-center justify-between bg-[#F8FAFC]">
        <View className="flex-row items-center">
          <Image 
            source={require('../../../assets/brand-logo.jpg')}
            style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 1, borderColor: '#0B192C' }}
            resizeMode="cover"
          />
          <View>
            <Text className="text-2xl font-black text-[#0B192C] tracking-tight">Follow-ups & Tasks</Text>
            <Text className="text-xs text-slate-500 font-medium">Scheduled callbacks & reminders</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onRefresh} className="p-2">
          <Bell size={22} color="#0B192C" />
        </TouchableOpacity>
      </View>

      {/* Segmented Control */}
      <View className="px-5 mb-5">
        <View className="flex-row bg-[#F1F5F9] rounded-xl p-1">
          {[
            { key: 'today', label: `Today (${data?.today?.length || 0})` },
            { key: 'overdue', label: `Overdue (${data?.overdue?.length || 0})` },
            { key: 'upcoming', label: `Upcoming (${data?.upcoming?.length || 0})` }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className="flex-1 py-2.5 rounded-lg items-center justify-center shadow-sm"
              style={{ backgroundColor: activeTab === tab.key ? '#0B192C' : 'transparent' }}
            >
              <Text className="text-xs font-bold" style={{ color: activeTab === tab.key ? '#FFFFFF' : '#64748B' }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="py-20 items-center justify-center">
          <ActivityIndicator size="large" color="#0B192C" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0B192C" />}
        >
          {list.map((item, index) => {
            const isOverdue = activeTab === 'overdue';
            const isToday = activeTab === 'today';
            const borderColorHex = isOverdue ? '#DC2626' : isToday ? '#F59E0B' : '#CBD5E1';
            const leadId = item.lead?._id || item.lead;
            
            return (
              <View key={item.id || index} className="bg-white rounded-2xl p-5 mb-4 border-l-4 shadow-sm shadow-slate-200" style={{ borderLeftColor: borderColorHex }}>
                <TouchableOpacity
                  onPress={() => leadId && router.push(`/lead/${leadId}`)}
                  className="flex-row justify-between items-start mb-1"
                >
                  <View className="flex-row items-center flex-wrap flex-1">
                    <Text className="text-lg font-bold mr-2 text-[#0B192C]">
                      {item.lead_name || item.lead?.name || 'Unknown Lead'}
                    </Text>
                    {isOverdue && (
                      <View className="bg-red-100 px-2 py-0.5 rounded mr-2">
                        <Text className="text-[9px] font-bold text-red-600 uppercase">OVERDUE</Text>
                      </View>
                    )}
                    {isToday && (
                      <View className="bg-amber-100 px-2 py-0.5 rounded mr-2">
                        <Text className="text-[9px] font-bold text-amber-700 uppercase">DUE TODAY</Text>
                      </View>
                    )}
                  </View>
                  <ExternalLink size={15} color="#94A3B8" />
                </TouchableOpacity>

                <View className="flex-row items-center mb-3">
                  <Clock size={12} color="#0B192C" />
                  <Text className="text-xs font-bold text-[#0B192C] ml-1.5">
                    {item.date} at {item.time} • +91 {item.lead_mobile || item.lead?.mobile || 'N/A'}
                  </Text>
                </View>

                <View className="bg-slate-50 rounded-xl p-3.5 mb-4 border border-slate-100">
                  <Text className="text-[13px] text-slate-600 italic leading-5 font-medium">
                    "{item.notes || 'Scheduled follow-up call.'}"
                  </Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <TouchableOpacity 
                    className="flex-1 bg-amber-400 h-11 rounded-xl flex-row justify-center items-center shadow-sm mr-2.5"
                    onPress={() => handleCall(item)}
                  >
                    <PhoneCall size={15} color="#0B192C" />
                    <Text className="text-[#0B192C] font-bold ml-2 text-xs">Call & Log</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleWhatsApp(item)}
                    className="w-11 h-11 rounded-xl bg-[#25D366] justify-center items-center mr-2.5"
                  >
                    <MessageCircle size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => completeMutation.mutate(item.id)}
                    className="w-11 h-11 rounded-xl border border-emerald-300 bg-emerald-50 justify-center items-center"
                  >
                    <Check size={18} color="#059669" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          {list.length === 0 && (
            <View className="py-16 items-center justify-center">
              <Text className="text-slate-400 font-bold text-sm">No follow-ups in {activeTab} category.</Text>
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
          initialDuration={45}
        />
      )}
    </View>
  );
}
