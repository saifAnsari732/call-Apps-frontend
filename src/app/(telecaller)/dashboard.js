import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Image, Modal, TextInput, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { PhoneCall, CheckSquare, BarChart2, History, Briefcase, Bell, Filter, Menu, Zap, X, UserPlus, Clock, Award, ChevronRight } from 'lucide-react-native';
import OfflineBanner from '../../components/OfflineBanner';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function TelecallerDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [walkinModalVisible, setWalkinModalVisible] = useState(false);
  const [powerDialerVisible, setPowerDialerVisible] = useState(false);
  const [walkinForm, setWalkinForm] = useState({
    name: '',
    mobile: '',
    city: '',
    state: '',
    business_type: 'Distributor',
    product_interest: 'Mustard Oil (15L Tin)',
    notes: ''
  });

  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['telecallerDashboardStats'],
    queryFn: async () => {
      const response = await api.get('/reports/telecaller-dashboard');
      return response.data;
    },
    staleTime: 2 * 60 * 1000
  });

  const { data: powerQueueData, isLoading: loadingQueue, refetch: refetchQueue } = useQuery({
    queryKey: ['powerQueue'],
    queryFn: async () => {
      const res = await api.get('/leads/power-queue');
      return res.data;
    },
    enabled: powerDialerVisible
  });

  const shiftMutation = useMutation({
    mutationFn: (shift_status) => api.patch('/auth/shift', { shift_status }),
    onSuccess: (res) => {
      if (res.data?.user) {
        updateUser(res.data.user);
      }
      queryClient.invalidateQueries({ queryKey: ['telecallerDashboardStats'] });
    }
  });

  const createWalkinMutation = useMutation({
    mutationFn: (payload) => api.post('/leads', { ...payload, assignToSelf: true, lead_source: 'Walk-in Lead' }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['telecallerDashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['telecallerLeadsList'] });
      setWalkinModalVisible(false);
      setWalkinForm({
        name: '',
        mobile: '',
        city: '',
        state: '',
        business_type: 'Distributor',
        product_interest: 'Mustard Oil (15L Tin)',
        notes: ''
      });
      const newId = res.data?.leadId;
      Alert.alert('Walk-in Lead Added', 'Lead has been assigned to your workspace.', [
        { text: 'Close' },
        ...(newId ? [{ text: 'Open Lead', onPress: () => router.push(`/lead/${newId}`) }] : [])
      ]);
    },
    onError: (err) => {
      Alert.alert('Error', err.response?.data?.error || err.message || 'Could not add lead');
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const currentShift = data?.kpis?.shiftStatus || user?.shift_status || 'Clocked In';

  const cycleShiftStatus = () => {
    const order = ['Clocked In', 'On Break', 'Clocked Out'];
    const next = order[(order.indexOf(currentShift) + 1) % order.length];
    shiftMutation.mutate(next);
  };

  const handleStartPowerDialer = () => {
    setPowerDialerVisible(true);
    refetchQueue();
  };

  const handleAddWalkin = () => {
    if (!walkinForm.name.trim() || !walkinForm.mobile.trim()) {
      Alert.alert('Required', 'Please enter Customer Name and 10-digit Mobile Number.');
      return;
    }
    createWalkinMutation.mutate(walkinForm);
  };

  const todaysCalls = data?.kpis?.todaysCallsCount || 0;
  const callTarget = data?.kpis?.dailyCallTarget || user?.daily_call_target || 50;
  const callProgressPct = Math.min(100, Math.round((todaysCalls / callTarget) * 100));

  const closedDeals = data?.kpis?.closed || 0;
  const convTarget = data?.kpis?.dailyConversionTarget || user?.daily_conversion_target || 5;

  const menuItems = [
    {
      title: 'My Leads',
      subtitle: `${data?.kpis?.assignedLeads || 0} Total`,
      icon: PhoneCall,
      bgColor: 'bg-blue-50',
      iconColor: '#3B82F6',
      action: () => router.push('/(telecaller)/leads')
    },
    {
      title: 'My Tasks',
      subtitle: `${data?.todaysFollowups?.length || 0} Due Today`,
      icon: CheckSquare,
      bgColor: 'bg-rose-50',
      iconColor: '#F43F5E',
      action: () => router.push('/(telecaller)/followups')
    },
    {
      title: 'My Report',
      subtitle: `${todaysCalls} Calls Today`,
      icon: BarChart2,
      bgColor: 'bg-rose-50',
      iconColor: '#E11D48',
      action: () => router.push('/(telecaller)/reports')
    },
    {
      title: 'Call Logs',
      subtitle: 'History & Audio',
      icon: History,
      bgColor: 'bg-purple-50',
      iconColor: '#8B5CF6',
      action: () => router.push('/(telecaller)/calls')
    },
    {
      title: 'Walk-in Leads',
      subtitle: '+ Add New Lead',
      icon: UserPlus,
      bgColor: 'bg-amber-50',
      iconColor: '#F59E0B',
      action: () => setWalkinModalVisible(true)
    },
    {
      title: 'Fresh Queue',
      subtitle: `${data?.kpis?.freshLeads || 0} Uncontacted`,
      icon: Zap,
      bgColor: 'bg-emerald-50',
      iconColor: '#10B981',
      action: () => router.push('/(telecaller)/lead-list?category=Uncontacted')
    }
  ];

  return (
    <View className="flex-1 bg-[#FFF1F2]">
      <OfflineBanner />
      {/* Top Header */}
      <View className="bg-[#E11D48] pt-16 pb-10 px-6 rounded-b-[44px] shadow-xl shadow-rose-900/20 z-20">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={cycleShiftStatus} className="bg-white/20 px-3 py-1.5 rounded-full flex-row items-center border border-white/30">
            <View
              className={`w-2 h-2 rounded-full mr-1.5 ${
                currentShift === 'Clocked In' ? 'bg-emerald-400' : currentShift === 'On Break' ? 'bg-amber-300' : 'bg-slate-300'
              }`}
            />
            <Text className="text-white text-[11px] font-bold">{currentShift}</Text>
          </TouchableOpacity>

          <View className="flex-row items-center">
            <Image 
              source={require('../../../assets/images/logo-glow.png')}
              style={{ width: 30, height: 30, borderRadius: 15, marginRight: 7, borderWidth: 2, borderColor: '#FDA4AF' }}
              resizeMode="cover"
            />
            <Text className="text-white text-sm font-black tracking-widest">KisanConnect</Text>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={() => router.push('/(telecaller)/followups')} className="p-2 relative -mr-2">
              <Bell size={20} color="#FFF1F2" />
              {(data?.todaysFollowups?.length || 0) > 0 && (
                <View className="absolute top-1 right-1 bg-[#FDA4AF] w-4 h-4 rounded-full border-2 border-[#E11D48] justify-center items-center">
                  <Text className="text-[8px] font-bold text-rose-900">{data.todaysFollowups.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View className="items-center mb-2">
          <Text className="text-rose-200 text-xs font-bold mb-1 tracking-wider uppercase">
            {user?.team || 'North Region Sales'} • {user?.employee_id || 'EMP101'}
          </Text>
          <Text className="text-white text-3xl font-black mb-5 tracking-tight">{user?.name || 'Telecaller'}</Text>

          {/* Daily Call & Conversion Target Bar */}
          <View className="w-full bg-white/15 rounded-2xl p-3.5 mb-5 border border-white/20">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-white text-xs font-bold">Daily Calls Target: {todaysCalls} / {callTarget}</Text>
              <Text className="text-rose-100 text-xs font-black">{callProgressPct}% • Closed: {closedDeals}/{convTarget}</Text>
            </View>
            <View className="w-full bg-rose-950/40 h-2 rounded-full overflow-hidden">
              <View className="bg-amber-300 h-full rounded-full" style={{ width: `${callProgressPct}%` }} />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleStartPowerDialer}
            activeOpacity={0.85}
            className="bg-white w-[92%] py-4 rounded-2xl shadow-lg shadow-black/10 flex-row justify-center items-center"
          >
            <Zap size={18} color="#E11D48" fill="#E11D48" />
            <Text className="text-[#E11D48] text-base font-black tracking-wide ml-2">Start Power Calling Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scroll Area */}
      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E11D48" />}
      >
        {isLoading && !data ? (
          <View className="py-20 justify-center items-center">
            <ActivityIndicator size="large" color="#E11D48" />
            <Text className="text-sm mt-4 text-slate-500 font-semibold tracking-wide">Syncing Workspace...</Text>
          </View>
        ) : (
          <>
            {/* Upcoming Follow-ups Section */}
            {data?.todaysFollowups && data.todaysFollowups.length > 0 && (
              <View className="mb-6">
                <View className="flex-row justify-between items-end mb-3.5 px-1">
                  <Text className="text-lg font-black text-slate-800 tracking-tight">Due & Overdue Follow-ups</Text>
                  <TouchableOpacity onPress={() => router.push('/(telecaller)/followups')}>
                    <Text className="text-sm font-bold text-[#E11D48]">View All ({data.todaysFollowups.length})</Text>
                  </TouchableOpacity>
                </View>
                
                {data.todaysFollowups.slice(0, 3).map((f, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => router.push(`/lead/${f.lead}`)}
                    className="bg-white p-4 rounded-2xl mb-2.5 shadow-sm shadow-slate-200/50 border border-slate-100 flex-row justify-between items-center"
                  >
                    <View className="flex-1 pr-4">
                      <View className="flex-row items-center">
                        <Text className="text-base font-bold text-slate-800 mr-2">{f.lead_name}</Text>
                        {f.isOverdue && (
                          <View className="bg-red-100 px-2 py-0.5 rounded">
                            <Text className="text-[9px] font-black text-red-700">OVERDUE</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs font-medium text-slate-500 mt-0.5" numberOfLines={1}>
                        {f.notes || 'Scheduled follow-up call'}
                      </Text>
                    </View>
                    <View className="bg-rose-50 px-3 py-2 rounded-xl border border-rose-100/50">
                      <Text className="text-rose-600 font-bold text-xs">{f.time}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Quick Actions Grid */}
            <Text className="text-lg font-black text-slate-800 mb-3.5 px-1 tracking-tight">Workspace Actions</Text>
            <View className="flex-row flex-wrap justify-between">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity 
                    key={index}
                    activeOpacity={0.7}
                    onPress={item.action}
                    className="w-[48%] bg-white p-4 rounded-3xl mb-4 shadow-sm shadow-slate-200/50 border border-rose-100/60 items-center justify-center"
                  >
                    <View className={`w-13 h-13 p-3.5 rounded-full ${item.bgColor} items-center justify-center mb-2.5`}>
                      <Icon size={22} color={item.iconColor} strokeWidth={2.2} />
                    </View>
                    <Text className="text-slate-800 font-bold text-sm tracking-tight text-center">
                      {item.title}
                    </Text>
                    <Text className="text-slate-400 font-semibold text-[11px] mt-0.5 text-center">
                      {item.subtitle}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      {/* POWER DIALER AUTO-QUEUE MODAL */}
      <Modal
        visible={powerDialerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPowerDialerVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-3xl p-6 max-h-[82%]">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-full bg-rose-100 items-center justify-center mr-3">
                  <Zap size={18} color="#E11D48" fill="#E11D48" />
                </View>
                <View>
                  <Text className="text-lg font-black text-slate-900">Power Dialer Queue</Text>
                  <Text className="text-xs text-slate-500">Auto-prioritized Overdue Follow-ups & Fresh Meta Leads</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setPowerDialerVisible(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            {loadingQueue ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#E11D48" />
                <Text className="text-xs text-slate-500 mt-3 font-semibold">Building your priority calling queue...</Text>
              </View>
            ) : !powerQueueData?.queue || powerQueueData.queue.length === 0 ? (
              <View className="py-12 items-center">
                <Text className="text-sm font-bold text-slate-700">All caught up! 🎉</Text>
                <Text className="text-xs text-slate-400 mt-1">No pending uncontacted leads or due follow-ups in your queue.</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => {
                    const first = powerQueueData.queue[0];
                    setPowerDialerVisible(false);
                    router.push(`/lead/${first.id}?powerQueue=1`);
                  }}
                  className="bg-[#E11D48] py-4 rounded-2xl flex-row items-center justify-center mb-4 shadow-md"
                >
                  <PhoneCall size={18} color="#fff" />
                  <Text className="text-white font-black text-sm ml-2">
                    Launch Auto-Session ({powerQueueData.queue.length} Leads Ready)
                  </Text>
                </TouchableOpacity>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {powerQueueData.queue.map((item, idx) => (
                    <TouchableOpacity
                      key={item.id || idx}
                      onPress={() => {
                        setPowerDialerVisible(false);
                        router.push(`/lead/${item.id}?powerQueue=1`);
                      }}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-2.5 flex-row items-center justify-between"
                    >
                      <View className="flex-1 pr-3">
                        <View className="flex-row items-center mb-0.5">
                          <Text className="text-xs font-black text-rose-600 mr-2">#{idx + 1}</Text>
                          <Text className="text-sm font-bold text-slate-900">{item.name}</Text>
                        </View>
                        <Text className="text-[11px] text-slate-500 font-semibold">
                          +91 {item.mobile} • {item.city || 'India'}
                        </Text>
                        <Text className="text-[10px] font-bold text-amber-700 mt-1">{item.queueReason}</Text>
                      </View>
                      <ChevronRight size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* WALK-IN / MANUAL LEAD ENTRY MODAL */}
      <Modal
        visible={walkinModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setWalkinModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-lg font-black text-slate-900">Add Walk-in / Direct Lead</Text>
                <Text className="text-xs text-slate-500">Directly adds & assigns prospect to your workspace</Text>
              </View>
              <TouchableOpacity onPress={() => setWalkinModalVisible(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-600 mb-1">Customer / Store Name *</Text>
                <TextInput
                  placeholder="e.g. Sharma Agro Traders"
                  value={walkinForm.name}
                  onChangeText={(v) => setWalkinForm({ ...walkinForm, name: v })}
                  className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50"
                />
              </View>
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-600 mb-1">10-Digit Mobile Number *</Text>
                <TextInput
                  placeholder="9876543210"
                  keyboardType="phone-pad"
                  value={walkinForm.mobile}
                  onChangeText={(v) => setWalkinForm({ ...walkinForm, mobile: v })}
                  className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50"
                />
              </View>
              <View className="flex-row justify-between mb-3">
                <View className="w-[48%]">
                  <Text className="text-xs font-bold text-slate-600 mb-1">City</Text>
                  <TextInput
                    placeholder="Indore"
                    value={walkinForm.city}
                    onChangeText={(v) => setWalkinForm({ ...walkinForm, city: v })}
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50"
                  />
                </View>
                <View className="w-[48%]">
                  <Text className="text-xs font-bold text-slate-600 mb-1">State</Text>
                  <TextInput
                    placeholder="Madhya Pradesh"
                    value={walkinForm.state}
                    onChangeText={(v) => setWalkinForm({ ...walkinForm, state: v })}
                    className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50"
                  />
                </View>
              </View>
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-600 mb-1">Business Type</Text>
                <View className="flex-row gap-2">
                  {['Distributor', 'Trader', 'Retail', 'Industrial'].map((bType) => (
                    <TouchableOpacity
                      key={bType}
                      onPress={() => setWalkinForm({ ...walkinForm, business_type: bType })}
                      className={`px-3 py-2 rounded-xl border ${
                        walkinForm.business_type === bType ? 'bg-rose-600 border-rose-600' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${walkinForm.business_type === bType ? 'text-white' : 'text-slate-700'}`}>
                        {bType}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View className="mb-3">
                <Text className="text-xs font-bold text-slate-600 mb-1">Product Interest</Text>
                <TextInput
                  placeholder="Mustard Oil (15L Tin) / Bulk Tanker"
                  value={walkinForm.product_interest}
                  onChangeText={(v) => setWalkinForm({ ...walkinForm, product_interest: v })}
                  className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50"
                />
              </View>
              <View className="mb-4">
                <Text className="text-xs font-bold text-slate-600 mb-1">Initial Notes</Text>
                <TextInput
                  placeholder="Walk-in customer inquiry notes..."
                  value={walkinForm.notes}
                  onChangeText={(v) => setWalkinForm({ ...walkinForm, notes: v })}
                  className="border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 bg-slate-50"
                />
              </View>

              <TouchableOpacity
                onPress={handleAddWalkin}
                disabled={createWalkinMutation.isPending}
                className="bg-[#E11D48] py-4 rounded-xl items-center justify-center mb-6"
              >
                {createWalkinMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-bold text-sm">Save Walk-in Lead</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
