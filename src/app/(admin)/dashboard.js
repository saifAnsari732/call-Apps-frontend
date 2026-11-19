import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { TelecallerPerformanceChart, ConversionDonutChart } from '../../components/SvgCharts';
import OfflineBanner from '../../components/OfflineBanner';
import { LinearGradient } from 'expo-linear-gradient';
import { RefreshCw, TrendingUp, CheckCircle, PhoneCall, Award, Users, UserPlus, UserCheck, Calendar, PhoneForwarded, CheckCircle2, ThumbsUp, Briefcase, PhoneOff, User, Calendar as CalendarIcon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import SimpleCalendarModal from '../../components/SimpleCalendarModal';

export default function AdminDashboard() {
  const { theme } = useThemeStore();
  const { user } = useAuthStore();
  const isDark = theme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState(''); // '', 'today', 'yesterday', 'last7', 'thisMonth', 'custom'
  const [customDate, setCustomDate] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const router = useRouter();

  const handleNavigation = (label) => {
    let params = {};
    if (label === 'Fresh Leads') params.status = 'Fresh Lead';
    if (label === 'Assigned Leads') params.status = 'Assigned';
    if (label === 'Interested') params.status = 'Interested';
    if (label === 'Follow Ups') params.status = 'Follow Up';
    if (label === 'Callbacks') params.status = 'Callback';
    if (label === 'Closed Leads') params.status = 'Closed';
    if (label === 'Not Connected') params.status = 'Not Connected';
    if (label === 'Distributor Int.') params.business_type = 'Distributor';
    if (label === 'Trader Int.') params.business_type = 'Trader';

    router.push({ pathname: '/(admin)/leads', params });
  };

  const isTeamLeader = user?.role === 'team_leader' || user?.role === 'manager';

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['adminDashboardStats', dateFilter, user?.role],
    queryFn: async () => {
      let startDate = undefined;
      let endDate = undefined;
      
      const today = new Date();
      if (dateFilter === 'today') {
        startDate = today.toISOString().split('T')[0];
        endDate = startDate;
      } else if (dateFilter === 'yesterday') {
        const d = new Date();
        d.setDate(today.getDate() - 1);
        startDate = d.toISOString().split('T')[0];
        endDate = startDate;
      } else if (dateFilter === 'last7') {
        const d = new Date();
        d.setDate(today.getDate() - 7);
        startDate = d.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
      } else if (dateFilter === 'thisMonth') {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
      } else if (dateFilter === 'custom' && customDate) {
        startDate = customDate;
        endDate = customDate;
      }

      const endpoint = isTeamLeader ? '/reports/team-leader-dashboard' : '/reports/admin-dashboard';
      const response = await api.get(endpoint, {
        params: { startDate, endDate }
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (error) {
    return (
      <View className={`flex-1 justify-center items-center px-6 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <Text className="text-red-500 text-sm font-semibold mb-2">Failed to load analytics</Text>
        <Text className={`text-xs text-center mb-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{error.message}</Text>
        <TouchableOpacity onPress={() => refetch()} className="bg-amber-500 px-6 py-3 rounded-xl shadow-lg shadow-amber-500/30">
          <Text className="text-white text-xs font-bold uppercase tracking-wider">Retry Load</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const kpis = data?.kpis || {};
  const performanceChart = data?.performanceChart || [];
  const conversionAnalytics = data?.conversionAnalytics || {
    connectedCalls: kpis.connectedCalls || 0,
    notConnectedCalls: Math.max(0, (kpis.totalCalls || 0) - (kpis.connectedCalls || 0)),
    conversionRate: kpis.conversionRate || 0,
    avgTalkTime: kpis.avgFirstResponseTimeMinutes ? kpis.avgFirstResponseTimeMinutes * 60 : 120
  };
  const rankings = data?.rankings || {
    topPerformer: data?.leaderboard?.[0]?.name || 'N/A',
    topCloser: data?.leaderboard?.[0]?.name || 'N/A',
    topTelecaller: data?.leaderboard?.[0]?.name || 'N/A'
  };

  const kpiItems = [
    { label: isTeamLeader ? 'Team Leads' : 'Total Leads', value: kpis.totalLeads ?? kpis.teamTotalLeads ?? 0, gradient: ['#6366F1', '#818CF8'], Icon: Users },
    { label: 'Fresh Leads', value: kpis.freshLeads ?? kpis.newLeads ?? 0, gradient: ['#3B82F6', '#60A5FA'], Icon: UserPlus },
    { label: 'Assigned Leads', value: kpis.assignedLeads ?? kpis.teamTotalLeads ?? 0, gradient: ['#8B5CF6', '#A855F7'], Icon: UserCheck },
    { label: 'Interested', value: kpis.interestedLeads || 0, gradient: ['#10B981', '#34D399'], Icon: ThumbsUp },
    { label: 'Follow Ups', value: kpis.followUpLeads ?? kpis.todayFollowupsCount ?? 0, gradient: ['#F59E0B', '#FBBF24'], Icon: Calendar },
    { label: 'Callbacks', value: kpis.callbackLeads ?? kpis.overdueFollowupsCount ?? 0, gradient: ['#EAB308', '#FDE047'], Icon: PhoneForwarded },
    { label: 'Closed Leads', value: kpis.closedLeads ?? kpis.convertedLeads ?? 0, gradient: ['#14B8A6', '#2DD4BF'], Icon: CheckCircle2 },
    { label: 'Not Connected', value: kpis.notConnectedLeads ?? kpis.lostLeads ?? 0, gradient: ['#EF4444', '#F87171'], Icon: PhoneOff },
    { label: 'Distributor Int.', value: kpis.distributorInterestedLeads || 0, gradient: ['#EC4899', '#F472B6'], Icon: Briefcase },
    { label: 'Trader Int.', value: kpis.traderInterestedLeads || 0, gradient: ['#F43F5E', '#FB7185'], Icon: TrendingUp },
  ];

  const formatTalkTime = (seconds) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <View className={`flex-1 ${isDark ? 'bg-slate-950' : 'bg-[#FFF1F2]'}`}>
      {/* Fixed Curved Header */}
      <View className="pt-20 pb-12 px-6 rounded-b-[48px] shadow-xl z-10 overflow-hidden border-b-2 border-rose-500/30">
        <LinearGradient
          colors={['#E11D48', '#BE123C', '#881337']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <View className="w-9 h-9 rounded-full bg-white justify-center items-center mr-3 shadow-lg shadow-black/10">
                <Text className="text-rose-700 text-sm font-black">
                  {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
                </Text>
              </View>
              <Text className="text-[11px] uppercase font-extrabold tracking-widest text-rose-200">
                Welcome Back, {isTeamLeader ? 'Team Leader ' + (user?.name?.split(' ')[0] || '') : (user?.name?.split(' ')[0] || 'Admin')}
              </Text>
            </View>
            <Text className="text-4xl font-black tracking-tight text-white mt-4 mb-2">
              {isTeamLeader ? 'Team Matrix' : 'Overview Matrix'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => refetch()} className="p-3 rounded-full bg-white/20 border border-white/30 backdrop-blur-md">
            <RefreshCw size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" colors={['#F59E0B']} />
        }
      >
        {isLoading && !data ? (
          <View className="py-20 justify-center items-center">
            <ActivityIndicator size="large" color="#F59E0B" />
            <Text className={`text-sm mt-3 font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading Analytics...</Text>
          </View>
        ) : (
          <View className="p-5 space-y-6">

          {/* Date Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-1">
            <TouchableOpacity 
              onPress={() => setDateFilter(dateFilter === 'today' ? '' : 'today')}
              className={`px-4 py-2 rounded-xl border mr-2.5 shadow-sm ${dateFilter === 'today' ? 'bg-rose-500 border-rose-500' : isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <Text className={`text-[11px] font-extrabold uppercase tracking-wider ${dateFilter === 'today' ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-600'}`}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setDateFilter(dateFilter === 'yesterday' ? '' : 'yesterday')}
              className={`px-4 py-2 rounded-xl border mr-2.5 shadow-sm ${dateFilter === 'yesterday' ? 'bg-rose-500 border-rose-500' : isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <Text className={`text-[11px] font-extrabold uppercase tracking-wider ${dateFilter === 'yesterday' ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-600'}`}>Yesterday</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setDateFilter(dateFilter === 'last7' ? '' : 'last7')}
              className={`px-4 py-2 rounded-xl border mr-2.5 shadow-sm ${dateFilter === 'last7' ? 'bg-rose-500 border-rose-500' : isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <Text className={`text-[11px] font-extrabold uppercase tracking-wider ${dateFilter === 'last7' ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-600'}`}>Last 7 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setDateFilter(dateFilter === 'thisMonth' ? '' : 'thisMonth')}
              className={`px-4 py-2 rounded-xl border shadow-sm mr-2.5 ${dateFilter === 'thisMonth' ? 'bg-rose-500 border-rose-500' : isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <Text className={`text-[11px] font-extrabold uppercase tracking-wider ${dateFilter === 'thisMonth' ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-600'}`}>This Month</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setCalendarVisible(true)}
              className={`px-4 py-2 rounded-xl border shadow-sm flex-row items-center mr-4 ${dateFilter === 'custom' ? 'bg-rose-500 border-rose-500' : isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
            >
              <CalendarIcon size={12} color={dateFilter === 'custom' ? '#FFFFFF' : isDark ? '#94A3B8' : '#475569'} style={{ marginRight: 4 }} />
              <Text className={`text-[11px] font-extrabold uppercase tracking-wider ${dateFilter === 'custom' ? 'text-white' : isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {dateFilter === 'custom' && customDate ? customDate : 'Custom Date'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <SimpleCalendarModal
            visible={calendarVisible}
            onClose={() => setCalendarVisible(false)}
            isDark={isDark}
            title="Select Specific Date"
            onSelect={(date) => {
              setCustomDate(date);
              setDateFilter('custom');
              setCalendarVisible(false);
            }}
          />

          {/* KPI Card grid */}
          <View className="flex-row flex-wrap justify-between">
            {kpiItems.map((kpi, idx) => {
              const Icon = kpi.Icon;
              const colorTheme = kpi.gradient[0]; // use primary color from gradient
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => handleNavigation(kpi.label)}
                  className={`w-[48%] mb-4 p-4 rounded-3xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800 shadow-black' : 'bg-white border-slate-100 shadow-slate-200/50'}`}
                >
                  <View className="flex-row justify-between items-start mb-4">
                    <View 
                      className="w-12 h-12 rounded-full items-center justify-center"
                      style={{ backgroundColor: `${colorTheme}15` }}
                    >
                      <Icon size={22} color={colorTheme} strokeWidth={2} />
                    </View>
                  </View>
                  <Text className={`text-2xl font-black tracking-tight mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    {kpi.value}
                  </Text>
                  <Text className={`text-[11px] font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {kpi.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Conversion Analytics Card */}
          <View className={`p-5 rounded-[28px] shadow-sm border ${isDark ? 'bg-slate-900/90 border-slate-800 shadow-black/40' : 'bg-white border-white shadow-rose-100/40'}`}>
            <View className="flex-row items-center mb-5">
              <View className="p-2 bg-amber-500/10 rounded-xl mr-3">
                <TrendingUp size={18} color="#F59E0B" />
              </View>
              <Text className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Conversion Analytics
              </Text>
            </View>

            <ConversionDonutChart
              connected={conversionAnalytics.connectedCalls}
              notConnected={conversionAnalytics.notConnectedCalls}
              conversionRate={conversionAnalytics.conversionRate}
              isDark={isDark}
            />

            {/* Sub-KPI Row */}
            <View className={`flex-row justify-between border-t pt-4 mt-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <View className="items-center w-[30%]">
                <Text className={`text-[9px] uppercase tracking-wider font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Avg Duration</Text>
                <Text className={`text-sm font-black mt-1.5 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {formatTalkTime(conversionAnalytics.avgTalkTime)}
                </Text>
              </View>
              <View className={`items-center w-[30%] border-x ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <Text className={`text-[9px] uppercase tracking-wider font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Connected</Text>
                <Text className={`text-sm font-black mt-1.5 text-emerald-500`}>
                  {conversionAnalytics.connectedCalls}
                </Text>
              </View>
              <View className="items-center w-[30%]">
                <Text className={`text-[9px] uppercase tracking-wider font-extrabold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Unanswered</Text>
                <Text className={`text-sm font-black mt-1.5 text-rose-500`}>
                  {conversionAnalytics.notConnectedCalls}
                </Text>
              </View>
            </View>
          </View>

          {/* Telecaller Performance Chart Card */}
          <View className={`p-5 rounded-[28px] shadow-sm border ${isDark ? 'bg-slate-900/90 border-slate-800 shadow-black/40' : 'bg-white border-white shadow-rose-100/40'}`}>
            <View className="flex-row items-center mb-5">
              <View className="p-2 bg-rose-500/10 rounded-xl mr-3">
                <Users size={18} color="#6366F1" />
              </View>
              <Text className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Team Output
              </Text>
            </View>
            <View className="pr-2">
              <TelecallerPerformanceChart data={performanceChart} isDark={isDark} />
            </View>
          </View>

          {/* Rankings Widget */}
          <View className={`p-5 rounded-[28px] shadow-sm border ${isDark ? 'bg-slate-900/90 border-slate-800 shadow-black/40' : 'bg-white border-white shadow-rose-100/40'}`}>
            <View className="flex-row items-center mb-5">
              <View className="p-2 bg-emerald-500/10 rounded-xl mr-3">
                <Award size={18} color="#10B981" />
              </View>
              <Text className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>
                Leaderboard
              </Text>
            </View>

            <View className="space-y-3">
              {/* 1st Place */}
              <View className={`flex-row justify-between items-center p-3.5 rounded-2xl border ${isDark ? 'bg-amber-500/5 border-amber-500/10' : 'bg-amber-50 border-amber-100'}`}>
                <View className="flex-row items-center flex-1">
                  <View className={`w-8 h-8 rounded-full justify-center items-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-200'}`}>
                    <Text className="text-amber-600 font-black text-xs">1st</Text>
                  </View>
                  <View className="ml-3 flex-1 pr-2">
                    <Text className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-800'}`} numberOfLines={1}>{rankings.topCloser}</Text>
                    <Text className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Top Closer</Text>
                  </View>
                </View>
                <CheckCircle2 size={20} color="#F59E0B" />
              </View>

              {/* 2nd Place */}
              <View className={`flex-row justify-between items-center p-3.5 rounded-2xl border ${isDark ? 'bg-rose-500/5 border-rose-500/10' : 'bg-rose-50 border-rose-100'}`}>
                <View className="flex-row items-center flex-1">
                  <View className={`w-8 h-8 rounded-full justify-center items-center ${isDark ? 'bg-rose-500/20' : 'bg-rose-200'}`}>
                    <Text className="text-indigo-600 font-black text-xs">2nd</Text>
                  </View>
                  <View className="ml-3 flex-1 pr-2">
                    <Text className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-800'}`} numberOfLines={1}>{rankings.topTelecaller}</Text>
                    <Text className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Most Interested</Text>
                  </View>
                </View>
                <ThumbsUp size={18} color="#6366F1" />
              </View>

              {/* 3rd Place */}
              <View className={`flex-row justify-between items-center p-3.5 rounded-2xl border ${isDark ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100'}`}>
                <View className="flex-row items-center flex-1">
                  <View className={`w-8 h-8 rounded-full justify-center items-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-200'}`}>
                    <Text className="text-emerald-600 font-black text-xs">3rd</Text>
                  </View>
                  <View className="ml-3 flex-1 pr-2">
                    <Text className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-800'}`} numberOfLines={1}>{rankings.topPerformer}</Text>
                    <Text className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Most Calls</Text>
                  </View>
                </View>
                <PhoneCall size={18} color="#10B981" />
              </View>
            </View>
          </View>

        </View>
        )}
      </ScrollView>
    </View>
  );
}
