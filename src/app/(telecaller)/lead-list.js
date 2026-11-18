import React, { useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Linking, Alert, ScrollView, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Search, MapPin, Briefcase, CalendarClock, ChevronRight, Phone, ChevronLeft, MessageCircle, X, Tag, Star, Zap } from 'lucide-react-native';
import OfflineBanner from '../../components/OfflineBanner';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function TelecallerLeadList() {
  const router = useRouter();
  const { category, tag } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search states (Requirement 10: Global Mobile Number Search)
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'HOT' | 'UNCONTACTED' | 'INTERESTED' | 'CONVERTED'

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['telecallerLeadsList', searchQuery, category, tag],
    queryFn: async () => {
      const response = await api.get('/leads', {
        params: {
          query: searchQuery || undefined
        }
      });
      return response.data;
    },
    staleTime: 60 * 1000
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'New':
      case 'Fresh Lead':
        return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' };
      case 'Contacted':
        return { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' };
      case 'Interested':
      case 'Qualified':
        return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' };
      case 'Follow Up':
      case 'Follow-up Required':
      case 'Callback':
        return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' };
      case 'Converted':
      case 'Closed':
        return { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' };
      case 'Demo Scheduled':
        return { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' };
      case 'Payment Pending':
        return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' };
      case 'Wrong Number':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' };
      case 'Duplicate':
        return { bg: 'bg-zinc-100', border: 'border-zinc-300', text: 'text-zinc-700' };
      case 'Not Connected':
      case 'Call Not Connected':
      case 'Busy':
        return { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-700' };
      case 'Not Interested':
      case 'Lost':
      case 'Rejected':
        return { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' };
      default:
        return { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600' };
    }
  };

  // Filter leads by search, category, and activeFilter chips
  const filteredLeads = (data?.leads || []).filter((lead) => {
    // 1. Local Tag filter
    if (tag) {
      return lead.tags && lead.tags.includes(tag);
    }

    // 2. Category param
    const st = lead.status || '';
    if (category === 'Uncontacted') {
      if (lead.call_attempts > 0 || ['Interested', 'Contacted', 'Follow Up', 'Converted', 'Closed'].includes(st)) {
        return false;
      }
    } else if (category === 'Connected') {
      if (lead.call_attempts === 0 || ['Not Connected', 'Call Not Connected', 'Wrong Number', 'Busy'].includes(st)) {
        return false;
      }
    } else if (category === 'Follow-up') {
      if (!['Follow Up', 'Follow-up Required', 'Callback', 'Callback Scheduled', 'Demo Scheduled'].includes(st)) {
        return false;
      }
    } else if (category === 'Not Connected') {
      if (!['Not Connected', 'Call Not Connected', 'Busy', 'Wrong Number', 'Switched off', 'No answer'].includes(st)) {
        return false;
      }
    } else if (category === 'Interested') {
      if (!['Interested', 'Qualified', 'Demo Scheduled', 'Demo/Meeting Scheduled', 'Payment Pending'].includes(st)) {
        return false;
      }
    } else if (category === 'Closed' || category === 'Converted') {
      if (!['Converted', 'Closed'].includes(st)) {
        return false;
      }
    } else if (category === 'Rejected' || category === 'Lost') {
      if (!['Rejected', 'Not Interested', 'Lost', 'Invalid Lead', 'Duplicate Lead', 'Duplicate'].includes(st)) {
        return false;
      }
    }

    // 3. Quick Chips Filter
    if (activeFilter === 'HOT') {
      const p = (lead.priority || '').toLowerCase();
      return p.includes('hot') || p.includes('high') || p.includes('vip');
    }
    if (activeFilter === 'UNCONTACTED') {
      return (lead.call_attempts || 0) === 0 || ['New', 'Fresh Lead', 'Assigned'].includes(st);
    }
    if (activeFilter === 'INTERESTED') {
      return ['Interested', 'Qualified', 'Demo/Meeting Scheduled', 'Demo Scheduled', 'Payment Pending'].includes(st);
    }
    if (activeFilter === 'CONVERTED') {
      return ['Converted', 'Closed'].includes(st);
    }

    return true;
  });

  const handleCall = (mobile) => {
    const clean = String(mobile || '').replace(/\D/g, '').slice(-10);
    if (clean) {
      Linking.openURL(`tel:${clean}`).catch(() => {});
    }
  };

  const handleWhatsApp = async (lead) => {
    let clean = String(lead.mobile || '').replace(/\D/g, '');
    if (!clean) return;
    if (clean.length === 10) clean = '91' + clean;
    const msg = encodeURIComponent(`Namaste ${lead.name || 'Sir'} ji, KisanConnect me inquiry karne ke liye dhanyawad (${lead.product_interest || 'Bulk Oil'}). Rate list share kar raha hoon.`);
    const nativeUrl = `whatsapp://send?phone=${clean}&text=${msg}`;
    const webUrl = `https://wa.me/${clean}?text=${msg}`;
    try {
      const supported = await Linking.canOpenURL(nativeUrl);
      if (supported) {
        await Linking.openURL(nativeUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      Linking.openURL(webUrl).catch(() => {});
    }
  };

  return (
    <View className="flex-1 bg-[#FFF1F2]">
      <OfflineBanner />

      {/* Header */}
      <View className="bg-[#E11D48] pt-14 pb-5 px-4 shadow-md z-10">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-2">
            <TouchableOpacity onPress={() => router.back()} className="p-2 mr-2 bg-white/20 rounded-full">
              <ChevronLeft size={22} color="#ffffff" />
            </TouchableOpacity>
            <View>
              <Text className="text-white text-xl font-black tracking-tight" numberOfLines={1}>
                {category ? `${category} Leads` : tag ? `${tag} Leads` : 'All Leads Directory'}
              </Text>
              <Text className="text-rose-100 text-xs font-semibold">
                {filteredLeads.length} prospects matching
              </Text>
            </View>
          </View>
        </View>

        {/* Global Search Bar (Requirement 10: Phone & Name) */}
        <View className="mt-3.5 flex-row items-center bg-white rounded-xl px-3.5 py-2.5 shadow-sm">
          <Search size={16} color="#E11D48" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by 10-digit mobile number, name, or city..."
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-2.5 text-xs text-slate-800 font-bold"
            keyboardType="default"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
              <X size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Chips Bar */}
      <View className="bg-white px-3 py-2.5 border-b border-rose-100 shadow-xs">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {[
              { key: 'ALL', label: 'All Leads' },
              { key: 'HOT', label: '🔥 Hot & VIP' },
              { key: 'UNCONTACTED', label: '⚡ Fresh & Uncalled' },
              { key: 'INTERESTED', label: '⭐ Interested' },
              { key: 'CONVERTED', label: '🏆 Converted' }
            ].map((chip) => {
              const isSelected = activeFilter === chip.key;
              return (
                <TouchableOpacity
                  key={chip.key}
                  onPress={() => setActiveFilter(chip.key)}
                  className={`px-3 py-1.5 rounded-full border ${
                    isSelected ? 'bg-[#E11D48] border-[#E11D48]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Leads List */}
      {isLoading ? (
        <View className="py-24 items-center justify-center">
          <ActivityIndicator size="large" color="#E11D48" />
          <Text className="text-xs text-slate-500 font-bold mt-3">Filtering leads database...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-rose-600 font-bold text-sm mb-2">Error loading leads</Text>
          <TouchableOpacity onPress={() => refetch()} className="bg-[#E11D48] px-6 py-2.5 rounded-xl shadow-xs">
            <Text className="text-white text-xs font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredLeads.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <Search size={36} color="#CBD5E1" />
          <Text className="text-slate-500 font-bold text-sm mt-3">No leads found</Text>
          <Text className="text-slate-400 text-xs mt-1">Try searching by mobile number or change filters</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLeads}
          keyExtractor={(item) => (item.id || item._id).toString()}
          contentContainerStyle={{ padding: 14, paddingBottom: 130 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E11D48" />}
          renderItem={({ item }) => {
            const badge = getStatusBadge(item.status);
            const leadId = item.id || item._id;

            return (
              <TouchableOpacity
                onPress={() => router.push(`/lead/${leadId}`)}
                activeOpacity={0.8}
                className="bg-white rounded-2xl p-4 mb-3 border border-slate-200 shadow-xs"
              >
                {/* Top Row: Name + Lead Code + Priority Badge */}
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center flex-wrap gap-1.5">
                      <Text className="text-base font-black text-slate-900">{item.name}</Text>
                      {item.lead_id && (
                        <View className="bg-slate-100 px-1.5 py-0.5 rounded">
                          <Text className="text-[10px] font-mono font-bold text-slate-600">{item.lead_id}</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-xs text-slate-600 font-bold mt-0.5">
                      +91 {item.mobile} {item.alternate_mobile ? `(Alt: ${item.alternate_mobile})` : ''}
                    </Text>
                  </View>

                  <View className={`px-2.5 py-1 rounded-full border ${badge.bg} ${badge.border}`}>
                    <Text className={`text-[10px] font-black uppercase ${badge.text}`}>
                      {item.status || 'New'}
                    </Text>
                  </View>
                </View>

                {/* Details Row: Location + Product */}
                <View className="flex-row items-center justify-between mb-3 text-xs">
                  <View className="flex-row items-center">
                    <MapPin size={11} color="#64748B" />
                    <Text className="text-xs text-slate-500 font-medium ml-1">
                      {item.city ? `${item.city}${item.state ? `, ${item.state}` : ''}` : 'Location N/A'}
                    </Text>
                  </View>
                  <Text className="text-xs font-bold text-slate-700">
                    {item.product_interest || item.business_type || 'General'}
                  </Text>
                </View>

                {/* 1-Tap Action Row */}
                <View className="flex-row items-center gap-2 pt-2 border-t border-slate-100">
                  <TouchableOpacity
                    onPress={() => handleCall(item.mobile)}
                    className="flex-1 bg-[#E11D48] py-2 rounded-xl flex-row items-center justify-center shadow-xs"
                  >
                    <Phone size={13} color="#ffffff" fill="#ffffff" />
                    <Text className="text-white text-xs font-black ml-1.5">Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleWhatsApp(item)}
                    className="w-10 h-9 rounded-xl bg-[#25D366] items-center justify-center shadow-xs"
                  >
                    <MessageCircle size={16} color="#ffffff" fill="#ffffff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => router.push(`/lead/${leadId}`)}
                    className="w-10 h-9 rounded-xl bg-slate-100 items-center justify-center"
                  >
                    <ChevronRight size={16} color="#475569" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}