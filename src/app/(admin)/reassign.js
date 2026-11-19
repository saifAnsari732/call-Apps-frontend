import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { ChevronLeft, Calendar, UserCheck, ArrowRight, CheckSquare, Square, Users } from 'lucide-react-native';
import SimpleCalendarModal from '../../components/SimpleCalendarModal';

export default function BulkReassign() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('By Date'); // 'By Date', 'Caller Transfer'
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [customDate, setCustomDate] = useState('');
  
  // Tab 1 state
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [targetCallerTab1, setTargetCallerTab1] = useState('');

  // Tab 2 state
  const [fromCaller, setFromCaller] = useState('');
  const [toCaller, setToCaller] = useState('');

  // Fetch Telecallers
  const { data: callersData } = useQuery({
    queryKey: ['adminTelecallersList'],
    queryFn: async () => {
      const response = await api.get('/telecallers');
      return response.data;
    }
  });
  const telecallers = callersData?.telecallers || [];

  // Fetch Leads for Tab 1
  const { data: leadsData, isLoading: leadsLoading } = useQuery({
    queryKey: ['reassignLeadsList', customDate],
    queryFn: async () => {
      if (!customDate) return { leads: [] };
      const response = await api.get('/leads', { 
        params: { startDate: customDate, endDate: customDate } 
      });
      return response.data;
    },
    enabled: !!customDate
  });
  const leads = leadsData?.leads || [];

  // Bulk Assign Mutation (Tab 1)
  const assignMutation = useMutation({
    mutationFn: (data) => api.patch('/leads/bulk-assign', data),
    onSuccess: (data) => {
      Alert.alert('Success', data?.message || 'Leads assigned successfully!');
      setSelectedLeads([]);
      setTargetCallerTab1('');
      queryClient.invalidateQueries({ queryKey: ['reassignLeadsList'] });
      queryClient.invalidateQueries({ queryKey: ['adminLeadsList'] });
    },
    onError: (error) => Alert.alert('Error', error.response?.data?.error || 'Failed to assign leads')
  });

  // Transfer Mutation (Tab 2)
  const transferMutation = useMutation({
    mutationFn: (data) => api.patch('/leads/transfer-caller', data),
    onSuccess: (data) => {
      Alert.alert('Success', data?.message || 'Leads transferred successfully!');
      setFromCaller('');
      setToCaller('');
      queryClient.invalidateQueries({ queryKey: ['adminTelecallersList'] });
      queryClient.invalidateQueries({ queryKey: ['adminLeadsList'] });
    },
    onError: (error) => Alert.alert('Error', error.response?.data?.error || 'Failed to transfer leads')
  });

  const handleBulkAssign = () => {
    if (selectedLeads.length === 0) return Alert.alert('Wait', 'Please select at least 1 lead.');
    if (!targetCallerTab1) return Alert.alert('Wait', 'Please select a telecaller to assign to.');
    assignMutation.mutate({ leadIds: selectedLeads, callerId: targetCallerTab1 });
  };

  const handleTransfer = () => {
    if (!fromCaller || !toCaller) return Alert.alert('Wait', 'Please select both Source and Destination callers.');
    if (fromCaller === toCaller) return Alert.alert('Wait', 'Source and Destination cannot be the same.');
    
    Alert.alert(
      'Confirm Transfer',
      'Are you sure you want to transfer ALL leads from the selected caller to the new caller?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Transfer All', style: 'destructive', onPress: () => {
          transferMutation.mutate({ fromCallerId: fromCaller, toCallerId: toCaller });
        }}
      ]
    );
  };

  const toggleLeadSelect = (id) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(l => l !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Header */}
      <View className="bg-indigo-600 pt-14 pb-4 px-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
          <ChevronLeft color="#ffffff" size={26} />
        </TouchableOpacity>
        <Image
          source={require('../../../assets/images/logo-3d.png')}
          style={{ width: 28, height: 28, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#334155' }}
          resizeMode="cover"
        />
        <Text className="text-white text-[19px] font-bold tracking-wide">Bulk Reassign</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-slate-200 shadow-sm">
        {['By Date', 'Caller Transfer'].map(tab => (
          <TouchableOpacity 
            key={tab}
            className={`flex-1 py-4 border-b-2 items-center ${activeTab === tab ? 'border-[#FFB703]' : 'border-transparent'}`}
            onPress={() => setActiveTab(tab)}
          >
            <Text className={`font-bold ${activeTab === tab ? 'text-indigo-950' : 'text-slate-400'}`}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* TAB 1: BY DATE */}
        {activeTab === 'By Date' && (
          <View>
            <Text className="text-slate-500 mb-2 font-medium">1. Select Date</Text>
            <TouchableOpacity 
              onPress={() => setCalendarVisible(true)}
              className="flex-row items-center bg-white border border-slate-200 p-4 rounded-xl mb-6 shadow-sm"
            >
              <Calendar size={20} color="#64748B" />
              <Text className="ml-3 font-bold text-indigo-950 text-[16px]">
                {customDate ? customDate : 'Tap to pick a date'}
              </Text>
            </TouchableOpacity>

            {customDate ? (
              <View>
                <View className="flex-row justify-between items-end mb-3">
                  <Text className="text-slate-500 font-medium">2. Select Leads ({leads.length} found)</Text>
                  
                  {leads.length > 0 && (
                    <View className="flex-row gap-2">
                      <TouchableOpacity onPress={() => setSelectedLeads(leads.slice(0, 10).map(l => l.id))} className="bg-slate-200 px-2 py-1 rounded">
                        <Text className="text-xs font-bold">10</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setSelectedLeads(leads.slice(0, 20).map(l => l.id))} className="bg-slate-200 px-2 py-1 rounded">
                        <Text className="text-xs font-bold">20</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setSelectedLeads(leads.map(l => l.id))} className="bg-indigo-600 px-2 py-1 rounded">
                        <Text className="text-xs font-bold text-white">All</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {leadsLoading ? (
                  <ActivityIndicator size="large" color="#4F46E5" className="my-6" />
                ) : leads.length === 0 ? (
                  <View className="bg-slate-100 p-6 rounded-xl items-center mb-6 border border-slate-200 border-dashed">
                    <Text className="text-slate-400 font-bold">No leads found on this date.</Text>
                  </View>
                ) : (
                  <View className="bg-white border border-slate-200 rounded-xl mb-6 max-h-[300px] overflow-hidden">
                    <ScrollView nestedScrollEnabled className="p-3">
                      {leads.map(lead => (
                        <TouchableOpacity 
                          key={lead.id}
                          onPress={() => toggleLeadSelect(lead.id)}
                          className="flex-row items-center p-3 border-b border-slate-50"
                        >
                          {selectedLeads.includes(lead.id) ? (
                            <CheckSquare size={18} color="#4F46E5" />
                          ) : (
                            <Square size={18} color="#CBD5E1" />
                          )}
                          <View className="ml-3 flex-1">
                            <Text className="font-bold text-indigo-950" numberOfLines={1}>{lead.name}</Text>
                            <Text className="text-xs text-slate-500">{lead.mobile} • {lead.status}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <Text className="text-slate-500 mb-2 font-medium">3. Select Destination Caller</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                  {telecallers.map(caller => (
                    <TouchableOpacity 
                      key={caller.id}
                      onPress={() => setTargetCallerTab1(caller.id)}
                      className={`mr-3 p-4 rounded-xl border min-w-[140px] ${targetCallerTab1 === caller.id ? 'bg-[#FFF8E1] border-[#FFB703]' : 'bg-white border-slate-200'}`}
                    >
                      <View className="flex-row justify-between items-center mb-2">
                        <UserCheck size={18} color={targetCallerTab1 === caller.id ? '#F59E0B' : '#94A3B8'} />
                        {targetCallerTab1 === caller.id && <View className="w-2 h-2 bg-[#F59E0B] rounded-full" />}
                      </View>
                      <Text className={`font-bold text-[15px] ${targetCallerTab1 === caller.id ? 'text-indigo-950' : 'text-slate-600'}`}>{caller.name}</Text>
                      <Text className="text-xs text-slate-400 mt-1">{caller.assigned_leads_count} Leads</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity 
                  onPress={handleBulkAssign}
                  disabled={assignMutation.isPending || selectedLeads.length === 0 || !targetCallerTab1}
                  className={`py-4 rounded-xl items-center ${(assignMutation.isPending || selectedLeads.length === 0 || !targetCallerTab1) ? 'bg-slate-300' : 'bg-indigo-600'}`}
                >
                  {assignMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-[#FFB703] font-bold text-[16px]">ASSIGN {selectedLeads.length} LEADS</Text>}
                </TouchableOpacity>

              </View>
            ) : null}
          </View>
        )}

        {/* TAB 2: CALLER TRANSFER */}
        {activeTab === 'Caller Transfer' && (
          <View>
            <View className="bg-[#FFF8E1] p-4 rounded-xl border border-[#FFE082] mb-6 flex-row">
              <Users size={20} color="#F59E0B" className="mt-0.5" />
              <Text className="ml-3 text-slate-700 leading-5 flex-1 font-medium">
                Transfer all leads from one telecaller to another instantly. This is useful when an employee leaves or goes on vacation.
              </Text>
            </View>

            <Text className="text-slate-500 mb-2 font-medium">From (Source Caller)</Text>
            <View className="bg-white rounded-xl border border-slate-200 mb-6 overflow-hidden">
              {telecallers.map(caller => (
                <TouchableOpacity 
                  key={`from-${caller.id}`}
                  onPress={() => setFromCaller(caller.id)}
                  className={`p-4 border-b border-slate-50 flex-row justify-between items-center ${fromCaller === caller.id ? 'bg-slate-50' : 'bg-white'}`}
                >
                  <View>
                    <Text className="font-bold text-indigo-950">{caller.name}</Text>
                    <Text className="text-xs text-slate-500">{caller.assigned_leads_count || 0} Total Leads</Text>
                  </View>
                  <View className={`w-5 h-5 rounded-full border-2 justify-center items-center ${fromCaller === caller.id ? 'border-red-500' : 'border-slate-300'}`}>
                    {fromCaller === caller.id && <View className="w-2.5 h-2.5 bg-red-500 rounded-full" />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View className="items-center mb-6">
              <View className="w-10 h-10 bg-slate-100 rounded-full justify-center items-center border border-slate-200">
                <ArrowRight size={20} color="#64748B" style={{ transform: [{ rotate: '90deg' }] }} />
              </View>
            </View>

            <Text className="text-slate-500 mb-2 font-medium">To (Destination Caller)</Text>
            <View className="bg-white rounded-xl border border-slate-200 mb-8 overflow-hidden">
              {telecallers.map(caller => (
                <TouchableOpacity 
                  key={`to-${caller.id}`}
                  onPress={() => setToCaller(caller.id)}
                  className={`p-4 border-b border-slate-50 flex-row justify-between items-center ${toCaller === caller.id ? 'bg-slate-50' : 'bg-white'}`}
                >
                  <View>
                    <Text className="font-bold text-indigo-950">{caller.name}</Text>
                    <Text className="text-xs text-slate-500">{caller.assigned_leads_count || 0} Total Leads</Text>
                  </View>
                  <View className={`w-5 h-5 rounded-full border-2 justify-center items-center ${toCaller === caller.id ? 'border-emerald-500' : 'border-slate-300'}`}>
                    {toCaller === caller.id && <View className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              onPress={handleTransfer}
              disabled={transferMutation.isPending || !fromCaller || !toCaller}
              className={`py-4 rounded-xl items-center shadow-lg ${(transferMutation.isPending || !fromCaller || !toCaller) ? 'bg-slate-300 shadow-none' : 'bg-indigo-600 shadow-[#4F46E5]/30'}`}
            >
              {transferMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-[#FFB703] font-bold text-[16px] tracking-wide">TRANSFER ALL LEADS</Text>}
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      <SimpleCalendarModal 
        visible={calendarVisible} 
        onClose={() => setCalendarVisible(false)}
        onSelect={(date) => {
          setCustomDate(date);
          setCalendarVisible(false);
        }}
        isDark={false}
        title="Select Date"
      />
    </View>
  );
}
