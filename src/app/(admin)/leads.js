import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, FlatList, Platform } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Plus, Filter, CheckSquare, Square, UserCheck, RefreshCw, Search, ChevronRight, MapPin, Briefcase, Phone, Mail, User, ShieldCheck, UserX, Download, Calendar, Edit2, PenLine, Navigation, MoreHorizontal, FileText, Share, CornerUpRight, ArrowRightCircle, X } from 'lucide-react-native';
import OfflineBanner from '../../components/OfflineBanner';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';

export default function AdminLeads() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useLocalSearchParams();

  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  // Search & Filters state
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Fresh', 'Follow Up', 'Callback'
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);

  // Fetch leads
  const { data: leadsData, isLoading: leadsLoading, refetch: refetchLeads } = useQuery({
    queryKey: ['adminLeadsList', activeTab],
    queryFn: async () => {
      let statusFilter = '';
      if (activeTab === 'Fresh') statusFilter = 'new';
      if (activeTab === 'Follow Up') statusFilter = 'follow_up';
      if (activeTab === 'Callback') statusFilter = 'callback';
      
      const params = { status: statusFilter || undefined };
      
      const response = await api.get('/leads', { params });
      return response.data;
    },
    staleTime: 5 * 60 * 1000
  });

  const getStatusColor = (status, type) => {
    const s = (status || '').toLowerCase();
    if (s === 'new' || s === 'fresh') return type === 'bg' ? 'bg-emerald-100' : 'text-emerald-700';
    if (s === 'follow_up' || s === 'follow up') return type === 'bg' ? 'bg-amber-100' : 'text-amber-700';
    if (s === 'callback') return type === 'bg' ? 'bg-blue-100' : 'text-blue-700';
    if (s === 'closed' || s === 'converted') return type === 'bg' ? 'bg-slate-100' : 'text-slate-600';
    return type === 'bg' ? 'bg-slate-100' : 'text-slate-600';
  };

  const getStatusBorder = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'new' || s === 'fresh') return 'bg-emerald-600';
    if (s === 'follow_up' || s === 'follow up') return 'bg-[#0B192C]';
    if (s === 'callback') return 'bg-red-600';
    if (s === 'closed' || s === 'converted') return 'bg-slate-600';
    return 'bg-slate-300';
  };

  const getStatusLabel = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'new') return 'Fresh';
    if (s === 'follow_up') return 'Follow Up';
    if (s === 'callback') return 'Callback';
    if (s === 'converted' || s === 'closed') return 'Closed';
    return status || 'Fresh';
  };

  // Mock data if API is empty to match Image 8 exactly
  const mockLeads = [
    { id: '1', business_name: 'Industrial Lubricants Ltd', mobile: '8853109053', status: 'Fresh', assigned_to: { name: 'Kuldeep Kesharwani' }, created_at: '2026-06-27T10:00:00Z' },
    { id: '2', business_name: 'Global Gas Corp', mobile: '9621619343', status: 'Follow Up', assigned_to: { name: 'Abhishek Rai Ghandhi' }, created_at: '2026-06-26T10:00:00Z' },
    { id: '3', business_name: 'PetroChem Solutions', mobile: '9312241263', status: 'Callback', assigned_to: { name: 'Kumar Prashant' }, created_at: '2026-06-25T10:00:00Z' },
    { id: '4', business_name: 'Apex Oil Refineries', mobile: '9910029341', status: 'Closed', assigned_to: null, created_at: '2026-06-24T10:00:00Z' }
  ];

  const displayLeads = leadsData?.leads && leadsData.leads.length > 0 ? leadsData.leads : mockLeads;

  const toggleSelect = (id) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(l => l !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const renderLeadItem = ({ item }) => {
    const isSelected = selectedLeads.includes(item.id);
    const borderIndicator = getStatusBorder(item.status);
    const badgeBg = getStatusColor(item.status, 'bg');
    const badgeText = getStatusColor(item.status, 'text');
    const statusLabel = getStatusLabel(item.status);

    const dateStr = new Date(item.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    return (
      <View className="bg-white rounded-[20px] mb-4 border border-slate-100 shadow-sm shadow-slate-200/50 overflow-hidden relative">
        {/* Status indicator bar */}
        <View className={`absolute left-0 top-6 bottom-6 w-1.5 rounded-r-full ${borderIndicator}`} />
        
        <View className="p-5 pl-6">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1">
                <Text className="text-[15px] font-bold text-[#0B192C]">{item.business_name || item.name || 'Unknown Business'}</Text>
                <Text className="text-[13px] text-slate-500 mt-0.5 mb-1.5">Lead #{item.mobile || 'N/A'}</Text>
                
                {item.tags && item.tags.length > 0 && (
                  <View className="flex-row flex-wrap gap-2">
                    {item.tags.map((t, idx) => (
                      <View key={idx} className="bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200">
                        <Text className="text-[9px] font-bold text-rose-700 uppercase tracking-wider">{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <View className={`${badgeBg} px-3 py-1 rounded-full`}>
                <Text className={`${badgeText} text-[11px] font-bold`}>{statusLabel}</Text>
              </View>
            </View>

          <View className="flex-row justify-between items-center border-t border-slate-100 pt-4 pb-4">
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assigned To</Text>
              <View className="flex-row items-center">
                <User size={12} color="#64748B" />
                <Text className="text-[13px] font-bold text-[#0B192C] ml-1.5">{item.assigned_to?.name || 'Unassigned'}</Text>
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Created On</Text>
              <View className="flex-row items-center">
                <Calendar size={12} color="#64748B" />
                <Text className="text-[13px] text-[#0B192C] ml-1.5">{dateStr}</Text>
              </View>
            </View>
          </View>

          <View className="flex-row justify-between items-center border-t border-slate-100 pt-4">
            <View className="flex-row">
              <TouchableOpacity className="w-10 h-10 rounded-full border border-slate-200 justify-center items-center mr-2">
                <CornerUpRight size={18} color="#0B192C" />
              </TouchableOpacity>
              <TouchableOpacity className="w-10 h-10 rounded-full border border-slate-200 justify-center items-center">
                <PenLine size={18} color="#0B192C" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              className="bg-[#0B192C] px-6 py-2.5 rounded-full flex-row items-center"
              onPress={() => router.push(`/lead/${item._id || item.id}`)}
            >
              <Text className="text-white font-bold text-sm">View Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Multi-select overlay */}
        {multiSelectMode && (
          <TouchableOpacity 
            className="absolute inset-0 bg-transparent justify-center items-end pr-5"
            onPress={() => toggleSelect(item.id)}
          >
            <View className={`w-6 h-6 rounded-md border-2 justify-center items-center ${isSelected ? 'bg-[#FFB703] border-[#FFB703]' : 'border-slate-300 bg-white'}`}>
              {isSelected && <CheckSquare size={14} color="#0B192C" />}
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <OfflineBanner />
      
      {/* Header */}
      <View className="pt-14 pb-2 px-5">
        <Text className="text-[28px] font-black text-[#0B192C] tracking-tight">Manage Leads</Text>
        <Text className="text-slate-500 text-sm mt-1 pr-6 leading-5">Centralized distribution and tracking for oil manufacturing divisions.</Text>
      </View>

      {/* Advanced Filter & Reassign Button */}
      <View className="px-5 mt-4 mb-5 flex-row justify-between items-center">
        <TouchableOpacity className="flex-row items-center border border-slate-200 bg-white px-4 py-2.5 rounded-xl shadow-sm shadow-slate-200/50">
          <Filter size={16} color="#64748B" />
          <Text className="text-slate-600 font-medium ml-2 text-sm">Advanced Filter</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => router.push('/(admin)/reassign')}
          className="flex-row items-center bg-[#FFB703] px-4 py-2.5 rounded-xl shadow-sm shadow-[#FFB703]/30"
        >
          <UserCheck size={16} color="#0B192C" />
          <Text className="text-[#0B192C] font-black ml-2 text-sm tracking-wide">Bulk Reassign</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="px-5 mb-4 flex-row border-b border-slate-200 pb-2">
        {['All', 'Fresh', 'Follow Up', 'Callback'].map(tab => (
          <TouchableOpacity 
            key={tab} 
            onPress={() => setActiveTab(tab)}
            className={`mr-3 px-4 py-2 rounded-full border ${activeTab === tab ? 'bg-[#0B192C] border-[#0B192C]' : 'bg-white border-slate-200'}`}
          >
            <Text className={`text-sm font-bold ${activeTab === tab ? 'text-white' : 'text-slate-500'}`}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Multi-select Toggle & Quick Select */}
      <View className="px-5 mb-4">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity className="flex-row items-center" onPress={() => {
            setMultiSelectMode(!multiSelectMode);
            if (multiSelectMode) setSelectedLeads([]); // Clear when turning off
          }}>
            {multiSelectMode ? <CheckSquare size={18} color="#0B192C" /> : <Square size={18} color="#64748B" />}
            <Text className={`font-medium ml-2 text-sm ${multiSelectMode ? 'text-[#0B192C]' : 'text-slate-600'}`}>
              Multi-select Mode
            </Text>
          </TouchableOpacity>
          
          {multiSelectMode && (
            <View className="flex-row gap-2">
              <TouchableOpacity 
                onPress={() => setSelectedLeads(displayLeads.slice(0, 10).map(l => l.id || l._id))}
                className="bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300"
              >
                <Text className="text-[11px] font-bold text-slate-700">10</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setSelectedLeads(displayLeads.slice(0, 20).map(l => l.id || l._id))}
                className="bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300"
              >
                <Text className="text-[11px] font-bold text-slate-700">20</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setSelectedLeads(displayLeads.map(l => l.id || l._id))}
                className="bg-[#0B192C] px-3 py-1.5 rounded-lg"
              >
                <Text className="text-[11px] font-bold text-white">All</Text>
              </TouchableOpacity>
              {selectedLeads.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSelectedLeads([])}
                  className="bg-red-100 px-3 py-1.5 rounded-lg border border-red-200"
                >
                  <Text className="text-[11px] font-bold text-red-600">Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={displayLeads}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        renderItem={renderLeadItem}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshing={leadsLoading}
        onRefresh={() => refetchLeads()}
        ListFooterComponent={() => (
          <View className="mt-4 mb-8">
            <Text className="text-center text-slate-500 text-xs font-medium mb-4">Showing 1-12 of 1,248 leads</Text>
            <View className="flex-row justify-center items-center">
              <View className="w-10 h-10 bg-white border border-slate-200 rounded-xl justify-center items-center mx-1">
                <ChevronRight size={16} color="#64748B" style={{ transform: [{ rotate: '180deg' }] }} />
              </View>
              <View className="w-10 h-10 bg-[#0B192C] rounded-xl justify-center items-center mx-1">
                <Text className="text-white font-bold">1</Text>
              </View>
              <View className="w-10 h-10 bg-white border border-slate-200 rounded-xl justify-center items-center mx-1">
                <Text className="text-slate-600 font-medium">2</Text>
              </View>
              <View className="w-10 h-10 bg-white border border-slate-200 rounded-xl justify-center items-center mx-1">
                <Text className="text-slate-600 font-medium">3</Text>
              </View>
              <Text className="text-slate-400 mx-1">...</Text>
              <View className="w-10 h-10 bg-white border border-slate-200 rounded-xl justify-center items-center mx-1">
                <Text className="text-slate-600 font-medium">104</Text>
              </View>
              <View className="w-10 h-10 bg-white border border-slate-200 rounded-xl justify-center items-center mx-1">
                <ChevronRight size={16} color="#0B192C" />
              </View>
            </View>
          </View>
        )}
      />

      {/* Floating Add Button */}
      <TouchableOpacity 
        className="absolute bottom-24 right-5 w-16 h-16 bg-[#0B192C] rounded-full justify-center items-center shadow-lg shadow-[#0B192C]/50 z-50"
      >
        <Plus size={32} color="#FFFFFF" />
      </TouchableOpacity>

    </View>
  );
}
