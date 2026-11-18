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
    <View className="flex-1 bg-[#FFF1F2]">
      <OfflineBanner />

      {/* HEADER */}
      <View className="bg-[#E11D48] pt-14 pb-0 z-10 shadow-lg shadow-rose-900/20">
        <View className="px-4 flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
              <ChevronLeft color="#ffffff" size={28} />
            </TouchableOpacity>
            <Image 
              source={require('../../../assets/brand-logo.jpg')}
              style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8, borderWidth: 1, borderColor: '#ffffff' }}
              resizeMode="cover"
            />
            <Text className="text-white text-2xl font-semibold tracking-wide">
              Call Logs
            </Text>
          </View>
          <TouchableOpacity className="p-1">
            <Filter color="#ffffff" size={24} />
          </TouchableOpacity>
        </View>

        {/* TABS */}
        <View className="flex-row px-4 justify-between">
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`pb-3 border-b-[3px] ${activeTab === tab ? 'border-white' : 'border-transparent'}`}
            >
              <Text className={`text-[12px] font-bold tracking-widest ${activeTab === tab ? 'text-white' : 'text-[#A78BFA]'}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* LIST */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4C1D95" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500 font-bold">Failed to load logs</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4C1D95']} />}
          showsVerticalScrollIndicator={false}
        >
          {filteredLogs.length === 0 ? (
            <View className="py-20 items-center justify-center">
              <Text className="text-slate-400 font-bold tracking-wider">NO CALLS FOUND</Text>
            </View>
          ) : (
            filteredLogs.map((log) => {
              const timeString = new Date(log.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              const dateString = new Date(log.start_time).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              
              return (
                <View key={log.id} className="bg-white p-5 rounded-[16px] mb-3 shadow-sm shadow-slate-200 border border-slate-100 flex-row justify-between items-start">
                  <View className="flex-1 space-y-1.5 pr-2">
                    <View className="flex-row justify-between items-start">
                      <Text className="text-[15px] font-black text-[#0B192C]">{log.lead_name}</Text>
                      <View className={`px-2 py-0.5 rounded-full ${log.status === 'Not Connected' ? 'bg-slate-100' : 'bg-emerald-50 border border-emerald-100'}`}>
                        <Text className={`text-[10px] font-bold ${log.status === 'Not Connected' ? 'text-slate-500' : 'text-emerald-600'}`}>{log.status}</Text>
                      </View>
                    </View>
                    <Text className="text-[13px] text-slate-500 font-bold mb-1">{log.lead_mobile}  •  {log.duration}s</Text>
                    <Text className="text-[12px] text-slate-500 font-medium">
                      {dateString} at {timeString}
                    </Text>
                    {log.notes ? (
                      <View className="mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <Text className="text-[13px] text-slate-700 font-medium">{log.notes}</Text>
                      </View>
                    ) : null}
                    
                    {log.followup_date && (
                      <View className="mt-2 bg-amber-50 p-2.5 rounded-lg border border-amber-100 flex-row items-center">
                        <Text className="text-[12px] font-bold text-amber-700">Follow-up: </Text>
                        <Text className="text-[12px] font-medium text-amber-600">{log.followup_date} at {log.followup_time}</Text>
                      </View>
                    )}
                    {log.recording_url ? (
                      <TouchableOpacity className="mt-2 bg-indigo-50 p-2 rounded-lg border border-indigo-100 flex-row items-center w-[120px] justify-center">
                        <Text className="text-[12px] font-bold text-indigo-700">Play Recording</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View className="mt-1">
                    {/* Icon indicating call type */}
                    <PhoneOutgoing size={20} color="#8B5CF6" />
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
