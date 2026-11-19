import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Filter, PhoneOutgoing, PhoneIncoming, PhoneMissed, Phone, ChevronLeft } from 'lucide-react-native';
import OfflineBanner from '../../components/OfflineBanner';

export default function CallLogsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const { data: logs, isLoading, error, refetch } = useQuery({
    queryKey: ['telecallerCallLogs'],
    queryFn: async () => {
      const response = await api.get('/calls/my-logs');
      return response.data;
    },
    staleTime: 5 * 60 * 1000
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const tabs = ['ALL', 'OUTGOING', 'INCOMING', 'MISSED'];

  const filteredLogs = logs?.filter(log => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'OUTGOING') return true; // App currently logs only outgoing
    return false;
  }) || [];

  return (
    <View className="flex-1 bg-[#F5F7FF]">
      <OfflineBanner />

      {/* HEADER */}
      <View className="bg-indigo-600 pt-14 pb-0 z-10 shadow-sm">
        <View className="px-4 flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
              <ChevronLeft color="#ffffff" size={28} />
            </TouchableOpacity>
            <Image 
              source={require('../../../assets/images/logo-3d.png')}
              style={{ width: 30, height: 30, borderRadius: 8, marginRight: 8, borderWidth: 1.5, borderColor: '#A5B4FC' }}
              resizeMode="cover"
            />
            <Text className="text-white text-xl font-bold tracking-tight">
              Call Logs
            </Text>
          </View>
          <TouchableOpacity className="p-1">
            <Filter color="#ffffff" size={22} />
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View className="flex-row px-4 justify-between">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`pb-3 border-b-[3px] ${activeTab === tab ? 'border-amber-300' : 'border-transparent'}`}
            >
              <Text className={`text-[12px] font-semibold tracking-widest ${activeTab === tab ? 'text-white' : 'text-indigo-200'}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* LIST */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500 font-semibold">Failed to load logs</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
          showsVerticalScrollIndicator={false}
        >
          {filteredLogs.length === 0 ? (
            <View className="py-20 items-center justify-center">
              <Image 
                source={require('../../../assets/images/all-caught-up.png')}
                style={{ width: 140, height: 140, marginBottom: 14 }}
                resizeMode="contain"
              />
              <Text className="text-indigo-950 font-bold text-base">No Call History Found</Text>
              <Text className="text-slate-500 text-xs mt-1 text-center">New incoming and outgoing call attempts will appear here.</Text>
            </View>
          ) : (
            filteredLogs.map((log) => {
              const timeString = new Date(log.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              const dateString = new Date(log.start_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              
              return (
                <View key={log.id} className="bg-white p-4 rounded-2xl mb-3 shadow-xs border border-indigo-100 flex-row justify-between items-start">
                  <Image 
                    source={require('../../../assets/images/avatar-customer.png')}
                    style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 1.5, borderColor: '#C7D2FE' }}
                    resizeMode="cover"
                  />
                  <View className="flex-1 space-y-1.5 pr-2">
                    <View className="flex-row justify-between items-start">
                      <Text className="text-[15px] font-bold text-indigo-950">{log.lead_name}</Text>
                      <View className={`px-2 py-0.5 rounded-full border ${log.status === 'Not Connected' ? 'bg-orange-50 border-orange-200' : 'bg-emerald-50 border-emerald-200'}`}>
                        <Text className={`text-[10px] font-semibold ${log.status === 'Not Connected' ? 'text-orange-700' : 'text-emerald-700'}`}>{log.status}</Text>
                      </View>
                    </View>
                    <Text className="text-[13px] text-indigo-600 font-semibold mb-1">{log.lead_mobile}  •  {log.duration}s</Text>
                    <Text className="text-[12px] text-slate-500 font-medium">
                      {dateString} at {timeString}
                    </Text>
                    {log.notes ? (
                      <View className="mt-2 bg-indigo-50/40 p-2.5 rounded-xl border border-indigo-100">
                        <Text className="text-[13px] text-indigo-950 font-medium">{log.notes}</Text>
                      </View>
                    ) : null}
                    
                    {log.followup_date && (
                      <View className="mt-2 bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex-row items-center">
                        <Text className="text-[12px] font-semibold text-amber-800">Follow-up: </Text>
                        <Text className="text-[12px] font-medium text-amber-700">{log.followup_date} at {log.followup_time}</Text>
                      </View>
                    )}
                    {log.recording_url ? (
                      <TouchableOpacity className="mt-2 bg-indigo-50 p-2 rounded-xl border border-indigo-200 flex-row items-center w-[120px] justify-center">
                        <Text className="text-[12px] font-semibold text-indigo-700">Play Recording</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View className="mt-1">
                    {/* Icon indicating call type */}
                    <PhoneOutgoing size={18} color="#4F46E5" />
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
