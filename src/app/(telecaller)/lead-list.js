import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Linking, Alert, ScrollView, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Search, MapPin, Briefcase, CalendarClock, ChevronRight, Phone, ChevronLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import OfflineBanner from '../../components/OfflineBanner';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function TelecallerLeadList() {
  const router = useRouter();
  const { category, tag } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');

  // Determine if we should ask backend for a specific status
  let statusFilter = undefined;
  if (category === 'Follow-up') {
    statusFilter = 'Follow Up';
  } else if (category === 'Not Connected') {
    statusFilter = 'Not Connected';
  } else if (category === 'Closed') {
    statusFilter = 'Closed';
  } else if (category === 'Rejected') {
    statusFilter = 'Rejected';
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['telecallerLeadsList', searchQuery, category, tag],
    queryFn: async () => {
      const response = await api.get('/leads', {
        params: {
          query: searchQuery || undefined,
          status: statusFilter || undefined
        }
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Fresh Lead': return { bg: '#EFF6FF', border: '#BFDBFE', text: '#2563EB' }; 
      case 'Assigned': return { bg: '#EEF2FF', border: '#C7D2FE', text: '#4F46E5' }; 
      case 'Follow Up': return { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706' }; 
      case 'Callback': return { bg: '#FEFCE8', border: '#FEF08A', text: '#CA8A04' }; 
      case 'Interested': return { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669' }; 
      case 'Closed': return { bg: '#F0FDFA', border: '#99F6E4', text: '#0D9488' }; 
      case 'Not Connected': return { bg: '#F1F5F9', border: '#CBD5E1', text: '#475569' }; 
      default: return { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B' }; 
    }
  };

  // Filter leads based on category or tag
  const displayLeads = data?.leads?.filter(lead => {
    if (tag) {
      return lead.tags && lead.tags.includes(tag);
    }

    const contactedStatuses = ['Follow Up', 'Callback', 'Interested', 'Distributor Interested', 'Trader Interested', 'Not Connected', 'Closed', 'Rejected', 'DSS Interested', 'RSS Interested', 'SS Interested'];

    if (category === 'Uncontacted') {
      return !contactedStatuses.includes(lead.status) && lead.status !== 'Not Connected';
    }
    if (category === 'Connected') {
      // Anything that is contacted AND not 'Not Connected'
      return contactedStatuses.includes(lead.status) && lead.status !== 'Not Connected';
    }
    if (category === 'In-Progress') {
      return ['Callback', 'Interested', 'Distributor Interested', 'Trader Interested', 'DSS Interested', 'RSS Interested', 'SS Interested'].includes(lead.status);
    }
    if (category === 'Interested') {
      return ['Interested', 'Distributor Interested', 'Trader Interested', 'DSS Interested', 'RSS Interested', 'SS Interested'].includes(lead.status);
    }
    // Follow-up, Not Connected, Closed, Rejected are directly filtered by the backend statusFilter
    return true;
  }) || [];

  return (
    <View className="flex-1 bg-[#FFF1F2]">
      <OfflineBanner />

      {/* Header */}
      <View className="bg-[#E11D48] pt-14 pb-6 px-4 rounded-b-[40px] shadow-xl shadow-rose-900/20 z-10 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2">
          <ChevronLeft size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Image 
          source={require('../../../assets/brand-logo.jpg')}
          style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: '#ffffff' }}
          resizeMode="cover"
        />
        <Text className="text-white text-2xl font-bold flex-1">{category || 'Leads'}</Text>
      </View>

      <View className="px-6 py-4">
        <View className="flex-row items-center border border-slate-300 rounded-full px-4 py-3 bg-white shadow-sm shadow-slate-200">
          <Search size={20} color="#64748B" />
          <TextInput
            className="flex-1 ml-3 text-[15px] py-1 text-slate-800 font-bold"
            placeholder="Search leads..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Leads List */}
      {isLoading ? (
        <ActivityIndicator size="large" color="#4C1D95" style={{ paddingVertical: 80 }} />
      ) : error ? (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-red-500 text-base font-bold mb-2">Error loading leads</Text>
          <Text className="text-xs text-slate-500 mb-6">{error.message}</Text>
          <TouchableOpacity onPress={() => refetch()} className="bg-[#E11D48] px-8 py-3 rounded-full shadow-md">
            <Text className="text-white text-sm font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : displayLeads.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-[13px] text-center text-slate-400 font-bold uppercase tracking-widest">
            No leads found
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayLeads}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4C1D95" colors={['#4C1D95']} />
          }
          renderItem={({ item }) => (
            <View className="mb-4 p-5 rounded-[24px] bg-white shadow-sm shadow-slate-200 flex-row items-center justify-between border border-slate-100">
              <TouchableOpacity
                onPress={() => router.push(`/lead/${item.id}`)}
                className="flex-1 mr-3"
                activeOpacity={0.7}
              >
                <View className="flex-row justify-between items-start mb-2.5">
                  <Text className="text-[18px] font-black flex-1 mr-3 text-slate-900 tracking-tight leading-tight">
                    {item.name}
                  </Text>
                  <View className="px-2.5 py-1 rounded-full border" style={{ backgroundColor: getStatusColor(item.status).bg, borderColor: getStatusColor(item.status).border }}>
                    <Text className="text-[10px] font-black uppercase tracking-widest" style={{ color: getStatusColor(item.status).text }}>
                      {item.status}
                    </Text>
                  </View>
                </View>

                <Text className="text-[12px] font-bold uppercase tracking-[0.1em] mb-3 text-slate-400">
                  <Text className="text-slate-600">{item.mobile}</Text> • {item.lead_source}
                </Text>
                
                {/* Lead Tags Display */}
                {item.tags && item.tags.length > 0 && (
                  <View className="flex-row flex-wrap mb-3 gap-2">
                    {item.tags.map((t, i) => (
                      <View key={i} className="bg-rose-100 px-2.5 py-1 rounded-md border border-rose-200">
                        <Text className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">{t}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View className="flex-row flex-wrap border-t border-slate-100 pt-3 space-y-1.5">
                  <View className="flex-row items-center w-[48%] mb-1">
                    <MapPin size={14} color="#94A3B8" strokeWidth={2.5} />
                    <Text className="text-[12px] text-slate-500 font-bold ml-2" numberOfLines={1}>
                      {item.city || 'N/A'}, {item.state || 'N/A'}
                    </Text>
                  </View>
                  <View className="flex-row items-center w-[48%] mb-1">
                    <Briefcase size={14} color="#94A3B8" strokeWidth={2.5} />
                    <Text className="text-[12px] text-slate-500 font-bold ml-2" numberOfLines={1}>
                      {item.business_type || 'N/A'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <View className="flex-col items-center gap-2">
                <TouchableOpacity
                  onPress={() => {
                    Linking.openURL(`tel:${item.mobile}`).catch(() => {});
                  }}
                  className="bg-emerald-50 p-3 rounded-full"
                >
                  <Phone size={18} color="#E11D48" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push(`/lead/${item.id}`)}
                  className="bg-indigo-50 p-3 rounded-full"
                >
                  <ChevronRight size={18} color="#4C1D95" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}
