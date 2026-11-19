import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Image, Modal, TextInput, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import {
  PhoneCall,
  CheckSquare,
  BarChart2,
  History,
  Briefcase,
  Bell,
  Zap,
  X,
  UserPlus,
  Clock,
  Award,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  PhoneOff,
  UserCheck,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Timer
} from 'lucide-react-native';
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
    alternate_mobile: '',
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
    staleTime: 60 * 1000
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
        alternate_mobile: '',
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

  // KPIs Extract (Requirement 1)
  const kpis = data?.kpis || {};
  const todaysCalls = kpis.todaysCallsCount || 0;
  const callTarget = kpis.dailyCallTarget || user?.daily_call_target || 50;
  const callProgressPct = Math.min(100, Math.round((todaysCalls / callTarget) * 100));

  const closedDeals = kpis.convertedLeads || kpis.closed || 0;
  const convTarget = kpis.dailyConversionTarget || user?.daily_conversion_target || 5;

  const todayAssigned = kpis.todayAssignedLeads || 0;
  const newUncontacted = kpis.newUncontactedLeads || kpis.freshLeads || 0;
  const todayFollowups = kpis.todayFollowupsCount || (data?.todaysFollowups?.filter(f => !f.isOverdue)?.length || 0);
  const overdueFollowups = kpis.overdueFollowupsCount || (data?.todaysFollowups?.filter(f => f.isOverdue)?.length || 0);
  const connectedCalls = kpis.connectedCalls || 0;
  const notConnectedCalls = kpis.notConnectedCalls || 0;
  const interestedLeads = kpis.interestedLeads || kpis.interested || 0;
  const lostLeads = kpis.lostLeads || 0;
  const responseTimeMin = kpis.leadResponseTimeMinutes || 12;
  const conversionPct = kpis.conversionPercentage || 0;

  const menuItems = [
    {
      title: 'My Leads',
      subtitle: `${kpis.assignedLeads || 0} Total`,
      icon: PhoneCall,
      bgColor: 'bg-blue-50',
      iconColor: '#3B82F6',
      action: () => router.push('/(telecaller)/leads')
    },
    {
      title: 'My Tasks',
      subtitle: `${todayFollowups} Due Today`,
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
      subtitle: 'Audio & History',
      icon: History,
      bgColor: 'bg-purple-50',
      iconColor: '#8B5CF6',
      action: () => router.push('/(telecaller)/calls')
    },
    {
      title: 'Walk-in Leads',
      subtitle: '+ Add Prospect',
      icon: UserPlus,
      bgColor: 'bg-amber-50',
      iconColor: '#F59E0B',
      action: () => setWalkinModalVisible(true)
    },
    {
      title: 'Fresh Queue',
      subtitle: `${newUncontacted} Uncontacted`,
      icon: Zap,
      bgColor: 'bg-emerald-50',
      iconColor: '#10B981',
      action: () => router.push('/(telecaller)/lead-list?category=Uncontacted')
    }
  ];

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <OfflineBanner />

      {/* Top Header */}
      <View className="bg-[#0F172A] pt-16 pb-10 px-6 rounded-b-[36px] shadow-md z-20">
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={cycleShiftStatus} className="bg-white/10 px-3 py-1.5 rounded-full flex-row items-center border border-white/15">
            <View
              className={`w-2 h-2 rounded-full mr-1.5 ${
                currentShift === 'Clocked In' ? 'bg-emerald-400' : currentShift === 'On Break' ? 'bg-amber-300' : 'bg-slate-400'
              }`}
            />
            <Text className="text-white text-[11px] font-semibold">{currentShift}</Text>
          </TouchableOpacity>

          <View className="flex-row items-center">
            <Image 
              source={require('../../../assets/images/logo-3d.png')}
              style={{ width: 30, height: 30, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: '#334155' }}
              resizeMode="cover"
            />
            <Text className="text-white text-sm font-bold tracking-wider">KisanConnect</Text>
          </View>

          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={() => router.push('/(telecaller)/followups')} className="p-2 relative -mr-2">
              <Bell size={20} color="#E2E8F0" />
              {(overdueFollowups + todayFollowups) > 0 && (
                <View className="absolute top-1 right-1 bg-white w-4 h-4 rounded-full border-2 border-[#0F172A] justify-center items-center">
                  <Text className="text-[8px] font-bold text-slate-900">{overdueFollowups + todayFollowups}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View className="items-center mb-2">
          {/* Telecaller Character Avatar with Online Pulse */}
          <View className="relative mb-2.5">
            <Image 
              source={require('../../../assets/images/avatar-telecaller.png')}
              style={{ width: 68, height: 68, borderRadius: 34, borderWidth: 2, borderColor: '#334155' }}
              resizeMode="cover"
            />
            <View className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0F172A] items-center justify-center">
              <View className="w-1.5 h-1.5 bg-white rounded-full" />
            </View>
          </View>
          <Text className="text-slate-300 text-xs font-semibold mb-1 tracking-wider uppercase">
            {user?.team || 'North Region Sales'} • {user?.employee_id || 'EMP101'}
          </Text>
          <Text className="text-white text-2xl font-bold mb-5 tracking-tight">{user?.name || 'Telecaller'}</Text>

          {/* Daily Call & Conversion Target Bar (Requirement 1: Calling Target vs Achievement) */}
          <View className="w-full bg-white/10 rounded-2xl p-3.5 mb-5 border border-white/15">
            <View className="flex-row justify-between items-center mb-1.5">
              <Text className="text-slate-200 text-xs font-semibold">Calling Target: {todaysCalls} / {callTarget} calls</Text>
              <Text className="text-white text-xs font-bold">{callProgressPct}% • Enrolled: {closedDeals}/{convTarget}</Text>
            </View>
            <View className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <View className="bg-emerald-400 h-full rounded-full" style={{ width: `${callProgressPct}%` }} />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleStartPowerDialer}
            activeOpacity={0.85}
            className="bg-white w-[92%] py-3.5 rounded-xl shadow-sm flex-row justify-center items-center active:bg-slate-100"
          >
            <Zap size={17} color="#0F172A" fill="#0F172A" />
            <Text className="text-slate-900 text-sm font-bold tracking-wide ml-2">Start Power Calling Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scroll Area */}
      <ScrollView 
        contentContainerStyle={{ padding: 18, paddingBottom: 130 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0F172A" />}
      >
        {isLoading && !data ? (
          <View className="py-20 justify-center items-center">
            <ActivityIndicator size="large" color="#0F172A" />
            <Text className="text-sm mt-4 text-slate-500 font-medium tracking-wide">Syncing Telecaller Floor...</Text>
          </View>
        ) : (
          <>
            {/* 1. TELECALLER 12 CORE PERFORMANCE METRICS GRID (Requirement 1) */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3 px-1">
                <Text className="text-lg font-bold text-slate-900 tracking-tight">Daily Calling Matrix</Text>
                <Text className="text-[11px] font-semibold text-slate-600 uppercase">Live Metrics</Text>
              </View>

              {/* Row 1: Today Assigned & New Uncontacted */}
              <View className="flex-row gap-2.5 mb-2.5">
                <TouchableOpacity
                  onPress={() => router.push('/(telecaller)/lead-list?category=All')}
                  className="flex-1 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs"
                >
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-[11px] font-semibold text-slate-500 uppercase">Today Assigned</Text>
                    <View className="w-6 h-6 rounded-full bg-slate-100 items-center justify-center">
                      <UserCheck size={12} color="#475569" />
                    </View>
                  </View>
                  <Text className="text-2xl font-bold text-slate-900">{todayAssigned}</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">Leads assigned today</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/(telecaller)/lead-list?category=Uncontacted')}
                  className="flex-1 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs"
                >
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-[11px] font-semibold text-slate-500 uppercase">New Uncontacted</Text>
                    <View className="w-6 h-6 rounded-full bg-slate-100 items-center justify-center">
                      <Zap size={12} color="#475569" />
                    </View>
                  </View>
                  <Text className="text-2xl font-bold text-slate-900">{newUncontacted}</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">Zero call attempts</Text>
                </TouchableOpacity>
              </View>

              {/* Row 2: Today Follow-ups & Overdue Follow-ups */}
              <View className="flex-row gap-2.5 mb-2.5">
                <TouchableOpacity
                  onPress={() => router.push('/(telecaller)/followups')}
                  className="flex-1 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs"
                >
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-[11px] font-semibold text-slate-500 uppercase">Today's Follow-up</Text>
                    <View className="w-6 h-6 rounded-full bg-slate-100 items-center justify-center">
                      <Clock size={12} color="#475569" />
                    </View>
                  </View>
                  <Text className="text-2xl font-bold text-slate-900">{todayFollowups}</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">Scheduled for today</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/(telecaller)/followups')}
                  className="flex-1 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs"
                >
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-[11px] font-semibold text-slate-500 uppercase">Overdue</Text>
                    <View className={`w-6 h-6 rounded-full items-center justify-center ${overdueFollowups > 0 ? 'bg-red-50' : 'bg-slate-100'}`}>
                      <AlertCircle size={12} color={overdueFollowups > 0 ? '#DC2626' : '#475569'} />
                    </View>
                  </View>
                  <Text className="text-2xl font-bold text-slate-900">{overdueFollowups}</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">Need immediate call</Text>
                </TouchableOpacity>
              </View>

              {/* Row 3: Connected Calls vs Not Connected Calls */}
              <View className="flex-row gap-2.5 mb-2.5">
                <TouchableOpacity
                  onPress={() => router.push('/(telecaller)/lead-list?category=Connected')}
                  className="flex-1 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs"
                >
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-[11px] font-semibold text-slate-500 uppercase">Connected</Text>
                    <View className="w-6 h-6 rounded-full bg-slate-100 items-center justify-center">
                      <CheckCircle2 size={12} color="#475569" />
                    </View>
                  </View>
                  <Text className="text-2xl font-bold text-slate-900">{connectedCalls}</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">Successful connections</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/(telecaller)/lead-list?category=Not Connected')}
                  className="flex-1 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs"
                >
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-[11px] font-semibold text-slate-500 uppercase">Not Connected</Text>
                    <View className="w-6 h-6 rounded-full bg-slate-100 items-center justify-center">
                      <PhoneOff size={12} color="#475569" />
                    </View>
                  </View>
                  <Text className="text-2xl font-bold text-slate-900">{notConnectedCalls}</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">Busy / Switched off</Text>
                </TouchableOpacity>
              </View>

              {/* Row 4: Interested Leads vs Converted vs Lost */}
              <View className="flex-row gap-2 mb-2.5">
                <TouchableOpacity
                  onPress={() => router.push('/(telecaller)/lead-list?category=Interested')}
                  className="flex-1 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs"
                >
                  <Text className="text-[10px] font-semibold text-slate-500 uppercase">Interested</Text>
                  <Text className="text-xl font-bold text-slate-900 mt-0.5">{interestedLeads}</Text>
                  <Text className="text-[9px] text-slate-400 font-medium">Hot Prospects</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/(telecaller)/lead-list?category=Closed')}
                  className="flex-1 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs"
                >
                  <Text className="text-[10px] font-semibold text-slate-500 uppercase">Converted</Text>
                  <Text className="text-xl font-bold text-slate-900 mt-0.5">{closedDeals}</Text>
                  <Text className="text-[9px] text-slate-400 font-medium">Enrolled Won</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/(telecaller)/lead-list?category=Rejected')}
                  className="flex-1 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs"
                >
                  <Text className="text-[10px] font-semibold text-slate-500 uppercase">Lost</Text>
                  <Text className="text-xl font-bold text-slate-900 mt-0.5">{lostLeads}</Text>
                  <Text className="text-[9px] text-slate-400 font-medium">Rejected</Text>
                </TouchableOpacity>
              </View>

              {/* Row 5: Lead Response Time & Conversion Rate % (Requirement 1 & 13) */}
              <View className="flex-row gap-2.5">
                <View className="flex-1 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <View className="flex-row items-center justify-between mb-0.5">
                    <Text className="text-[11px] font-semibold text-slate-500 uppercase">Response Time</Text>
                    <Timer size={14} color="#475569" />
                  </View>
                  <Text className="text-xl font-bold text-slate-900 mt-0.5">{responseTimeMin} Mins</Text>
                  <Text className="text-[10px] text-slate-400 font-medium">Target: &lt; 15m SLA</Text>
                </View>

                <View className="flex-1 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <View className="flex-row items-center justify-between mb-0.5">
                    <Text className="text-[11px] font-semibold text-slate-500 uppercase">Conversion %</Text>
                    <TrendingUp size={14} color="#475569" />
                  </View>
                  <Text className="text-xl font-bold text-slate-900 mt-0.5">{conversionPct}%</Text>
                  <Text className="text-[10px] text-slate-400 font-medium">Lead to sale ratio</Text>
                </View>
              </View>
            </View>

            {/* Upcoming Follow-ups Section */}
            {data?.todaysFollowups && data.todaysFollowups.length > 0 ? (
              <View className="mb-6">
                <View className="flex-row justify-between items-end mb-3.5 px-1">
                  <Text className="text-lg font-bold text-slate-900 tracking-tight">Today's Calling Agenda</Text>
                  <TouchableOpacity onPress={() => router.push('/(telecaller)/followups')}>
                    <Text className="text-xs font-semibold text-slate-600">View All ({data.todaysFollowups.length}) →</Text>
                  </TouchableOpacity>
                </View>
                
                {data.todaysFollowups.slice(0, 4).map((f, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => router.push(`/lead/${f.lead}`)}
                    className="bg-white p-3.5 rounded-2xl mb-2 shadow-xs border border-slate-200/80 flex-row justify-between items-center"
                  >
                    <View className="flex-1 pr-3">
                      <View className="flex-row items-center">
                        <Text className="text-sm font-bold text-slate-900 mr-2">{f.lead_name}</Text>
                        {f.isOverdue && (
                          <View className="bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                            <Text className="text-[9px] font-bold text-red-700">OVERDUE</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs text-slate-500 font-medium mt-0.5" numberOfLines={1}>
                        +91 {f.lead_mobile} • {f.notes || 'Follow-up'}
                      </Text>
                    </View>
                    <View className="bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
                      <Text className="text-slate-700 font-semibold text-xs">{f.time}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View className="mb-6 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex-row items-center">
                <Image 
                  source={require('../../../assets/images/all-caught-up.png')}
                  style={{ width: 64, height: 64, borderRadius: 16, marginRight: 14 }}
                  resizeMode="contain"
                />
                <View className="flex-1 pr-2">
                  <Text className="text-sm font-bold text-slate-900">All Follow-ups Cleared!</Text>
                  <Text className="text-xs text-slate-500 mt-0.5 leading-4">
                    Zero overdue calls right now. Great job keeping your calling pipeline clean!
                  </Text>
                </View>
              </View>
            )}

            {/* Quick Actions Grid */}
            <Text className="text-lg font-bold text-slate-900 mb-3.5 px-1 tracking-tight">Workspace Navigation</Text>
            <View className="flex-row flex-wrap justify-between">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity 
                    key={index}
                    activeOpacity={0.7}
                    onPress={item.action}
                    className="w-[48%] bg-white p-4 rounded-2xl mb-3 shadow-xs border border-slate-200/80 items-center justify-center"
                  >
                    <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-2">
                      <Icon size={20} color="#0F172A" strokeWidth={2} />
                    </View>
                    <Text className="text-slate-900 font-bold text-sm tracking-tight text-center">
                      {item.title}
                    </Text>
                    <Text className="text-slate-500 font-medium text-[11px] mt-0.5 text-center">
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
                <View className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center mr-3">
                  <Zap size={18} color="#0F172A" fill="#0F172A" />
                </View>
                <View>
                  <Text className="text-base font-bold text-slate-900">Power Calling Queue</Text>
                  <Text className="text-xs text-slate-500">Auto-prioritized by Overdue &amp; Fresh Inquiries</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setPowerDialerVisible(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            {loadingQueue ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#0F172A" />
                <Text className="text-xs text-slate-500 mt-3 font-medium">Building priority queue...</Text>
              </View>
            ) : !powerQueueData?.queue || powerQueueData.queue.length === 0 ? (
              <View className="py-12 items-center">
                <CheckCircle2 size={32} color="#10B981" />
                <Text className="text-sm font-bold text-slate-700 mt-2">All caught up!</Text>
                <Text className="text-xs text-slate-400 mt-1">No pending uncontacted leads or due follow-ups.</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => {
                    const first = powerQueueData.queue[0];
                    setPowerDialerVisible(false);
                    router.push(`/lead/${first.id}?powerQueue=1`);
                  }}
                  className="bg-[#0F172A] py-3.5 rounded-xl flex-row items-center justify-center mb-4 shadow-sm"
                >
                  <PhoneCall size={17} color="#fff" />
                  <Text className="text-white font-semibold text-sm ml-2">
                    Launch Calling Session ({powerQueueData.queue.length} Leads)
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
                          <Text className="text-xs font-bold text-slate-600 mr-2">#{idx + 1}</Text>
                          <Text className="text-sm font-bold text-slate-900">{item.name}</Text>
                        </View>
                        <Text className="text-[11px] text-slate-500 font-medium">
                          +91 {item.mobile} • {item.city || 'India'}
                        </Text>
                        <Text className="text-[10px] font-semibold text-slate-600 mt-1">{item.queueReason}</Text>
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

      {/* WALKIN LEAD MODAL */}
      <Modal
        visible={walkinModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setWalkinModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white rounded-t-3xl p-6 max-h-[85%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-slate-900">Add Walk-in Prospect</Text>
              <TouchableOpacity onPress={() => setWalkinModalVisible(false)} className="p-2 bg-slate-100 rounded-full">
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { key: 'name', label: 'Customer Name *' },
                { key: 'mobile', label: 'Mobile Number (10 Digits) *' },
                { key: 'alternate_mobile', label: 'Alternate Mobile Number' },
                { key: 'city', label: 'City' },
                { key: 'state', label: 'State' },
                { key: 'product_interest', label: 'Product Interest' },
                { key: 'notes', label: 'Initial Remarks' }
              ].map((f) => (
                <View key={f.key} className="mb-3">
                  <Text className="text-xs font-semibold text-slate-600 mb-1">{f.label}</Text>
                  <TextInput
                    value={walkinForm[f.key]}
                    onChangeText={(val) => setWalkinForm({ ...walkinForm, [f.key]: val })}
                    className="border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 bg-slate-50"
                  />
                </View>
              ))}

              <TouchableOpacity
                onPress={handleAddWalkin}
                disabled={createWalkinMutation.isPending}
                className="bg-[#0F172A] py-3.5 rounded-xl items-center justify-center mt-2 mb-6 shadow-sm"
              >
                {createWalkinMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-xs uppercase tracking-wider">Create &amp; Assign to Me</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}