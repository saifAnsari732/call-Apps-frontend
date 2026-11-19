import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
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
      <View className={`flex-1 justify-center items-center px-6 ${isDark ? 'bg-indigo-950' : 'bg-[#F5F7FF]'}`}>
        <Text className="text-red-500 text-sm font-semibold mb-2">Failed to load analytics</Text>
        <Text className={`text-xs text-center mb-6 ${isDark ? 'text-indigo-200' : 'text-slate-500'}`}>{error.message}</Text>
        <TouchableOpacity onPress={() => refetch()} className="bg-indigo-600 px-6 py-3 rounded-xl shadow-md shadow-indigo-500/30">
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
    <View className={`flex-1 ${isDark ? 'bg-indigo-950' : 'bg-[#F5F7FF]'}`}>
      {/* Fixed Curved Header */}
      <View className="pt-20 pb-12 px-6 rounded-b-[40px] shadow-md z-10 overflow-hidden border-b border-indigo-400/30">
        <LinearGradient
          colors={['#4F46E5', '#2563EB', '#1D4ED8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <Image 
                source={isTeamLeader ? require('../../../assets/images/avatar-teamleader.png') : require('../../../assets/images/avatar-admin.png')}
                style={{ width: 42, height: 42, borderRadius: 21, marginRight: 12, borderWidth: 1.5, borderColor: '#A5B4FC' }}
                resizeMode="cover"
              />
              <View>
                <Text className="text-[11px] uppercase font-semibold tracking-widest text-indigo-100">
                  Welcome Back, {isTeamLeader ? 'Team Leader ' + (user?.name?.split(' ')[0] || '') : (user?.name?.split(' ')[0] || 'Admin')}
                </Text>
                <Text className="text-[10px] text-amber-300 font-semibold tracking-wider">
                  {user?.team ? `${user.team} • ` : ''}{user?.role ? user.role.toUpperCase() : 'MANAGEMENT'}
                </Text>
              </View>
            </View>
            <Text className="text-3xl font-bold tracking-tight text-white mt-3 mb-2">
              {isTeamLeader ? 'Team Matrix' : 'Overview Matrix'}
            </Text>
          </View>
          <TouchableOpacity onPress={() => refetch()} className="p-3 rounded-full bg-white/20 border border-white/25">
            <RefreshCw size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" colors={['#4F46E5']} />
        }
      >
        {isLoading && !data ? (
          <View className="py-20 justify-center items-center">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className={`text-sm mt-3 font-medium ${isDark ? 'text-indigo-200' : 'text-indigo-600'}`}>Loading Analytics...</Text>
          </View>
        ) : (
          <View className="p-5 space-y-6">

          {/* Date Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-1">
            <TouchableOpacity 
              onPress={() => setDateFilter(dateFilter === 'today' ? '' : 'today')}
              className={`px-4 py-2 rounded-xl border mr-2.5 shadow-xs ${dateFilter === 'today' ? 'bg-indigo-600 border-indigo-600' : isDark ? 'bg-indigo-900 border-indigo-800' : 'bg-white border-indigo-200'}`}
            >
              <Text className={`text-[11px] font-semibold uppercase tracking-wider ${dateFilter === 'today' ? 'text-white' : isDark ? 'text-indigo-200' : 'text-indigo-950'}`}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setDateFilter(dateFilter === 'yesterday' ? '' : 'yesterday')}
              className={`px-4 py-2 rounded-xl border mr-2.5 shadow-xs ${dateFilter === 'yesterday' ? 'bg-indigo-600 border-indigo-600' : isDark ? 'bg-indigo-900 border-indigo-800' : 'bg-white border-indigo-200'}`}
            >
              <Text className={`text-[11px] font-semibold uppercase tracking-wider ${dateFilter === 'yesterday' ? 'text-white' : isDark ? 'text-indigo-200' : 'text-indigo-950'}`}>Yesterday</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setDateFilter(dateFilter === 'last7' ? '' : 'last7')}
              className={`px-4 py-2 rounded-xl border mr-2.5 shadow-xs ${dateFilter === 'last7' ? 'bg-indigo-600 border-indigo-600' : isDark ? 'bg-indigo-900 border-indigo-800' : 'bg-white border-indigo-200'}`}
            >
              <Text className={`text-[11px] font-semibold uppercase tracking-wider ${dateFilter === 'last7' ? 'text-white' : isDark ? 'text-indigo-200' : 'text-indigo-950'}`}>Last 7 Days</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setDateFilter(dateFilter === 'thisMonth' ? '' : 'thisMonth')}
              className={`px-4 py-2 rounded-xl border shadow-xs mr-2.5 ${dateFilter === 'thisMonth' ? 'bg-indigo-600 border-indigo-600' : isDark ? 'bg-indigo-900 border-indigo-800' : 'bg-white border-indigo-200'}`}
            >
              <Text className={`text-[11px] font-semibold uppercase tracking-wider ${dateFilter === 'thisMonth' ? 'text-white' : isDark ? 'text-indigo-200' : 'text-indigo-950'}`}>This Month</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setCalendarVisible(true)}
              className={`px-4 py-2 rounded-xl border shadow-xs flex-row items-center mr-4 ${dateFilter === 'custom' ? 'bg-indigo-600 border-indigo-600' : isDark ? 'bg-indigo-900 border-indigo-800' : 'bg-white border-indigo-200'}`}
            >
              <CalendarIcon size={12} color={dateFilter === 'custom' ? '#FFFFFF' : isDark ? '#A5B4FC' : '#4F46E5'} style={{ marginRight: 4 }} />
              <Text className={`text-[11px] font-semibold uppercase tracking-wider ${dateFilter === 'custom' ? 'text-white' : isDark ? 'text-indigo-200' : 'text-indigo-950'}`}>
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
              const colorTheme = kpi.gradient[0];
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => handleNavigation(kpi.label)}
                  className={`w-[48%] mb-4 p-4 rounded-2xl border shadow-xs ${isDark ? 'bg-indigo-900/90 border-indigo-800 shadow-indigo-950' : 'bg-white border-indigo-100'}`}
                >
                  <View className="flex-row justify-between items-start mb-4">
                    <View 
                      className="w-11 h-11 rounded-full items-center justify-center"
                      style={{ backgroundColor: `${colorTheme}18` }}
                    >
                      <Icon size={20} color={colorTheme} strokeWidth={2} />
                    </View>
                  </View>
                  <Text
                    className="text-2xl font-bold tracking-tight mb-1"
                    style={{ color: isDark ? '#FFFFFF' : colorTheme }}
                  >
                    {kpi.value}
                  </Text>
                  <Text className={`text-[11px] font-semibold tracking-wider ${isDark ? 'text-indigo-200' : 'text-slate-600'}`}>
                    {kpi.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Conversion Analytics Card */}
          <View className={`p-5 rounded-3xl shadow-xs border ${isDark ? 'bg-indigo-900/90 border-indigo-800' : 'bg-white border-indigo-100'}`}>
            <View className="flex-row items-center mb-5">
              <View className="p-2 bg-amber-50 rounded-xl mr-3">
                <TrendingUp size={18} color="#F59E0B" />
              </View>
              <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-indigo-950'}`}>
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
            <View className={`flex-row justify-between border-t pt-4 mt-4 ${isDark ? 'border-indigo-800' : 'border-indigo-50'}`}>
              <View className="items-center w-[30%]">
                <Text className={`text-[9px] uppercase tracking-wider font-semibold ${isDark ? 'text-indigo-200' : 'text-slate-500'}`}>Avg Duration</Text>
                <Text className="text-sm font-bold mt-1.5 text-indigo-600">
                  {formatTalkTime(conversionAnalytics.avgTalkTime)}
                </Text>
              </View>
              <View className={`items-center w-[30%] border-x ${isDark ? 'border-indigo-800' : 'border-indigo-50'}`}>
                <Text className={`text-[9px] uppercase tracking-wider font-semibold ${isDark ? 'text-indigo-200' : 'text-slate-500'}`}>Connected</Text>
                <Text className="text-sm font-bold mt-1.5 text-emerald-600">
                  {conversionAnalytics.connectedCalls}
                </Text>
              </View>
              <View className="items-center w-[30%]">
                <Text className={`text-[9px] uppercase tracking-wider font-semibold ${isDark ? 'text-indigo-200' : 'text-slate-500'}`}>Unanswered</Text>
                <Text className="text-sm font-bold mt-1.5 text-amber-600">
                  {conversionAnalytics.notConnectedCalls}
                </Text>
              </View>
            </View>
          </View>

          {/* Telecaller Performance Chart Card */}
          <View className={`p-5 rounded-3xl shadow-xs border ${isDark ? 'bg-indigo-900/90 border-indigo-800' : 'bg-white border-indigo-100'}`}>
            <View className="flex-row items-center mb-5">
              <View className="p-2 bg-indigo-50 rounded-xl mr-3">
                <Users size={18} color="#4F46E5" />
              </View>
              <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-indigo-950'}`}>
                Team Output
              </Text>
            </View>
            <View className="pr-2">
              <TelecallerPerformanceChart data={performanceChart} isDark={isDark} />
            </View>
          </View>

          {/* Rankings Widget */}
          <View className={`p-5 rounded-3xl shadow-xs border ${isDark ? 'bg-indigo-900/90 border-indigo-800' : 'bg-white border-indigo-100'}`}>
            <View className="flex-row items-center mb-5">
              <View className="p-2 bg-emerald-50 rounded-xl mr-3">
                <Award size={18} color="#10B981" />
              </View>
              <Text className={`text-base font-bold ${isDark ? 'text-white' : 'text-indigo-950'}`}>
                Leaderboard
              </Text>
            </View>

            <View className="space-y-3">
              {/* 1st Place */}
              <View className={`flex-row justify-between items-center p-3.5 rounded-2xl border ${isDark ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                <View className="flex-row items-center flex-1">
                  <View className={`w-8 h-8 rounded-full justify-center items-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'} mr-2`}>
                    <Text className="font-bold text-xs text-amber-700">1st</Text>
                  </View>
                  <Image 
                    source={require('../../../assets/images/avatar-telecaller.png')}
                    style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, borderWidth: 1.5, borderColor: '#F59E0B' }}
                    resizeMode="cover"
                  />
                  <View className="flex-1 pr-2">
                    <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-indigo-950'}`} numberOfLines={1}>{rankings.topCloser}</Text>
                    <Text className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>Top Closer</Text>
                  </View>
                </View>
                <CheckCircle2 size={18} color="#D97706" />
              </View>

              {/* 2nd Place */}
              <View className={`flex-row justify-between items-center p-3.5 rounded-2xl border ${isDark ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
                <View className="flex-row items-center flex-1">
                  <View className={`w-8 h-8 rounded-full justify-center items-center ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'} mr-2`}>
                    <Text className="font-bold text-xs text-indigo-700">2nd</Text>
                  </View>
                  <Image 
                    source={require('../../../assets/images/avatar-telecaller.png')}
                    style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, borderWidth: 1.5, borderColor: '#4F46E5' }}
                    resizeMode="cover"
                  />
                  <View className="flex-1 pr-2">
                    <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-indigo-950'}`} numberOfLines={1}>{rankings.topTelecaller}</Text>
                    <Text className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`}>Most Interested</Text>
                  </View>
                </View>
                <ThumbsUp size={17} color="#4F46E5" />
              </View>

              {/* 3rd Place */}
              <View className={`flex-row justify-between items-center p-3.5 rounded-2xl border ${isDark ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                <View className="flex-row items-center flex-1">
                  <View className={`w-8 h-8 rounded-full justify-center items-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'} mr-2`}>
                    <Text className="font-bold text-xs text-emerald-700">3rd</Text>
                  </View>
                  <Image 
                    source={require('../../../assets/images/avatar-telecaller.png')}
                    style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10, borderWidth: 1.5, borderColor: '#10B981' }}
                    resizeMode="cover"
                  />
                  <View className="flex-1 pr-2">
                    <Text className={`text-xs font-bold ${isDark ? 'text-white' : 'text-indigo-950'}`} numberOfLines={1}>{rankings.topPerformer}</Text>
                    <Text className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Most Calls</Text>
                  </View>
                </View>
                <PhoneCall size={17} color="#059669" />
              </View>
            </View>
          </View>

        </View>
        )}
      </ScrollView>
    </View>
  );
}
