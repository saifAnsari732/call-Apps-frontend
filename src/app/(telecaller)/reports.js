import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator, Modal, TouchableWithoutFeedback, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { ArrowLeft, Share2, Download, Calendar as CalendarIcon, Check } from 'lucide-react-native';

const DATE_FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last7' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'All Time', value: 'all' }
];

export default function MyReportsPage() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('today');

  const getDates = (filter) => {
    const end = new Date();
    let start = new Date();

    if (filter === 'yesterday') {
      start.setDate(start.getDate() - 1);
      end.setDate(end.getDate() - 1);
    } else if (filter === 'last7') {
      start.setDate(start.getDate() - 7);
    } else if (filter === 'thisMonth') {
      start.setDate(1);
    } else if (filter === 'all') {
      start = new Date('2020-01-01');
    }

    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  };

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['telecallerMyReports', selectedFilter],
    queryFn: async () => {
      const { startDate, endDate } = getDates(selectedFilter);
      const response = await api.get('/reports/my-reports', {
        params: { startDate, endDate }
      });
      return response.data;
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSelectFilter = (val) => {
    setSelectedFilter(val);
    setFilterModalVisible(false);
  };

  const currentFilterLabel = DATE_FILTERS.find(f => f.value === selectedFilter)?.label;

  // Helper to format seconds to HH:MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00:00';
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const formatEarliestTime = (isoString) => {
    if (!isoString) return '00:00:00';
    return new Date(isoString).toLocaleTimeString('en-US', { hour12: false });
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* HEADER */}
      <View className="bg-[#0F172A] pt-14 pb-4 px-4 flex-row items-center justify-between shadow-sm z-10">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <ArrowLeft color="#ffffff" size={24} />
          </TouchableOpacity>
          <Image 
            source={require('../../../assets/images/logo-3d.png')}
            style={{ width: 28, height: 28, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#334155' }}
            resizeMode="cover"
          />
          <Text className="text-white text-[20px] font-bold tracking-tight">
            My Reports
          </Text>
        </View>
        <View className="flex-row">
          <TouchableOpacity className="p-1 mr-4">
            <Share2 color="#ffffff" size={20} />
          </TouchableOpacity>
          <TouchableOpacity className="p-1">
            <Download color="#ffffff" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-500 font-semibold">Failed to load reports</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0F172A']} />}
        >
          {/* DATE FILTER */}
          <View className="flex-row items-center justify-between mb-6 mt-2">
            <Text className="text-[18px] font-bold text-slate-900 tracking-tight">
              Performance
            </Text>
            <TouchableOpacity 
              onPress={() => setFilterModalVisible(true)}
              className="bg-white border border-slate-200 px-3 py-2 rounded-xl flex-row items-center shadow-xs"
            >
              <CalendarIcon size={16} color="#475569" />
              <Text className="ml-2 font-semibold text-slate-800 text-[14px]">{currentFilterLabel}</Text>
            </TouchableOpacity>
          </View>

          {/* CALL OVERVIEW HEADER */}
          <Text className="text-[18px] font-bold text-slate-900 mb-4 tracking-tight">
            Call Overview
          </Text>

          {/* OVERALL STATS GRID */}
          <View className="flex-row flex-wrap justify-between">
            <View className="w-[48%] bg-white rounded-2xl p-5 mb-4 shadow-xs border border-slate-200/80">
              <Text className="text-[22px] font-bold text-slate-900 mb-2">{stats.totalCalls}</Text>
              <Text className="text-[13px] font-medium text-slate-600 leading-tight">Total Calls</Text>
            </View>

            <View className="w-[48%] bg-white rounded-2xl p-5 mb-4 shadow-xs border border-slate-200/80">
              <Text className="text-[22px] font-bold text-slate-900 mb-2">{stats.connectedCalls}</Text>
              <Text className="text-[13px] font-medium text-slate-600 leading-tight">Total Calls Connected</Text>
            </View>

            <View className="w-[48%] bg-white rounded-2xl p-5 mb-4 shadow-xs border border-slate-200/80">
              <Text className="text-[20px] font-bold text-slate-900 mb-2">{formatDuration(stats.totalCallTime)}</Text>
              <Text className="text-[13px] font-medium text-slate-600 leading-tight">Total Call Time</Text>
            </View>

            <View className="w-[48%] bg-white rounded-2xl p-5 mb-4 shadow-xs border border-slate-200/80">
              <Text className="text-[22px] font-bold text-slate-900 mb-2">{stats.unconnectedCalls}</Text>
              <Text className="text-[13px] font-medium text-slate-600 leading-tight">Total Unconnected Calls</Text>
            </View>

            <View className="w-[48%] bg-white rounded-2xl p-5 mb-4 shadow-xs border border-slate-200/80">
              <Text className="text-[20px] font-bold text-slate-900 mb-2">{formatDuration(stats.avgCallDuration)}</Text>
              <Text className="text-[13px] font-medium text-slate-600 leading-tight">Avg. Call Duration</Text>
            </View>

            <View className="w-[48%] bg-white rounded-2xl p-5 mb-4 shadow-xs border border-slate-200/80">
              <Text className="text-[20px] font-bold text-slate-900 mb-2">{formatEarliestTime(stats.firstCallTime)}</Text>
              <Text className="text-[13px] font-medium text-slate-600 leading-tight">Avg. Start Calling Time</Text>
            </View>
          </View>

          {/* OUTGOING CALLS HEADER */}
          <Text className="text-[18px] font-bold text-slate-900 mt-4 mb-4 tracking-tight">
            Outgoing Calls
          </Text>

          {/* OUTGOING STATS GRID */}
          <View className="flex-row flex-wrap justify-between">
            <View className="w-[48%] bg-white rounded-2xl p-5 mb-4 shadow-xs border border-slate-200/80">
              <Text className="text-[22px] font-bold text-slate-900 mb-2">{stats.totalCalls}</Text>
              <Text className="text-[13px] font-medium text-slate-600 leading-tight">Total Outgoing Calls</Text>
            </View>

            <View className="w-[48%] bg-white rounded-2xl p-5 mb-4 shadow-xs border border-slate-200/80">
              <Text className="text-[22px] font-bold text-slate-900 mb-2">{stats.connectedCalls}</Text>
              <Text className="text-[13px] font-medium text-slate-600 leading-tight">Outgoing Connected Calls</Text>
            </View>

            <View className="w-[48%] bg-white rounded-2xl p-5 mb-4 shadow-xs border border-slate-200/80">
              <Text className="text-[22px] font-bold text-slate-900 mb-2">{stats.unconnectedCalls}</Text>
              <Text className="text-[13px] font-medium text-slate-600 leading-tight">Outgoing Unanswered Calls</Text>
            </View>

            <View className="w-[48%] bg-white rounded-2xl p-5 mb-4 shadow-xs border border-slate-200/80">
              <Text className="text-[20px] font-bold text-slate-900 mb-2">{formatDuration(stats.avgCallDuration)}</Text>
              <Text className="text-[13px] font-medium text-slate-600 leading-tight">Avg. Outgoing Call Duration</Text>
            </View>
          </View>

          {/* LEAD STATUS OVERVIEW */}
          <Text className="text-[18px] font-bold text-slate-900 mt-4 mb-4 tracking-tight">
            Lead Status Overview
          </Text>

          {stats.leadStats && (
            <View className="flex-row flex-wrap justify-between">
              <View className="w-[48%] bg-white rounded-2xl p-5 mb-4 shadow-xs border border-slate-200/80">
                <Text className="text-[22px] font-bold text-slate-900 mb-2">{stats.leadStats.followUps || 0}</Text>
                <Text className="text-[13px] font-medium text-slate-600 leading-tight">Follow Ups</Text>
              </View>

              <View className="w-[48%] bg-white rounded-2xl p-5 mb-4 shadow-xs border border-slate-200/80">
                <Text className="text-[22px] font-bold text-slate-900 mb-2">{stats.leadStats.interested || 0}</Text>
                <Text className="text-[13px] font-medium text-slate-600 leading-tight">Interested Leads</Text>
              </View>

              <View className="w-[48%] bg-white rounded-2xl p-5 mb-4 shadow-xs border border-slate-200/80">
                <Text className="text-[22px] font-bold text-slate-900 mb-2">{stats.leadStats.callbackLeads || 0}</Text>
                <Text className="text-[13px] font-medium text-slate-600 leading-tight">Callback Requests</Text>
              </View>

              <View className="w-[48%] bg-white rounded-2xl p-5 mb-4 shadow-xs border border-slate-200/80">
                <Text className="text-[22px] font-bold text-slate-900 mb-2">{stats.leadStats.notConnectedLeads || 0}</Text>
                <Text className="text-[13px] font-medium text-slate-600 leading-tight">Not Connected (Leads)</Text>
              </View>

              <View className="w-[48%] bg-white rounded-2xl p-5 mb-4 shadow-xs border border-slate-200/80">
                <Text className="text-[22px] font-bold text-slate-900 mb-2">{stats.leadStats.closed || 0}</Text>
                <Text className="text-[13px] font-medium text-slate-600 leading-tight">Closed Leads</Text>
              </View>
              
              <View className="w-[48%] bg-white rounded-2xl p-5 mb-4 shadow-xs border border-slate-200/80">
                <Text className="text-[22px] font-bold text-slate-900 mb-2">{stats.leadStats.distributorInterested || 0}</Text>
                <Text className="text-[13px] font-medium text-slate-600 leading-tight">Distributor Interested</Text>
              </View>
            </View>
          )}

        </ScrollView>
      )}

      {/* FILTER MODAL */}
      <Modal visible={filterModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-6 pb-10">
              <Text className="text-[20px] font-bold text-slate-900 mb-6">Select Date Range</Text>
              {DATE_FILTERS.map(f => (
                <TouchableOpacity 
                  key={f.value}
                  onPress={() => handleSelectFilter(f.value)}
                  className={`py-4 border-b border-slate-100 flex-row justify-between items-center`}
                >
                  <Text className={`text-[16px] font-semibold ${selectedFilter === f.value ? 'text-slate-900' : 'text-slate-600'}`}>
                    {f.label}
                  </Text>
                  {selectedFilter === f.value && <Check size={20} color="#0F172A" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

    </View>
  );
}
