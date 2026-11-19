import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { ChevronRight, Filter, Users, PhoneCall, CalendarCheck, CheckCircle2, PhoneOff, XCircle, Tag, Star, AlertCircle, MessageSquare, ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LeadsCategories() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const statusCategories = [
    {
      title: 'All Leads',
      subtitle: 'Complete list of assigned leads',
      category: 'All',
      icon: Users,
      bgColor: 'bg-rose-50',
      iconColor: '#E11D48'
    },
    {
      title: 'Uncontacted / Fresh',
      subtitle: "Leads not called yet",
      category: 'Uncontacted',
      icon: PhoneCall,
      bgColor: 'bg-blue-50',
      iconColor: '#2563EB'
    },
    {
      title: 'Connected',
      subtitle: 'Successfully connected calls',
      category: 'Connected',
      icon: CheckCircle2,
      bgColor: 'bg-emerald-50',
      iconColor: '#059669'
    },
    {
      title: 'Follow-up Scheduled',
      subtitle: 'Calls set for later date',
      category: 'Follow-up',
      icon: CalendarCheck,
      bgColor: 'bg-amber-50',
      iconColor: '#D97706'
    },
    {
      title: 'Not Connected',
      subtitle: 'Unreachable or busy numbers',
      category: 'Not Connected',
      icon: PhoneOff,
      bgColor: 'bg-slate-100',
      iconColor: '#64748B'
    },
    {
      title: 'Rejected / Invalid',
      subtitle: 'Not interested or wrong number',
      category: 'Rejected',
      icon: XCircle,
      bgColor: 'bg-red-50',
      iconColor: '#DC2626'
    }
  ];

  const tagCategories = [
    {
      title: 'VIP Leads',
      subtitle: 'High priority premium prospects',
      tag: 'VIP',
      icon: Star,
      bgColor: 'bg-amber-100',
      iconColor: '#B45309'
    },
    {
      title: 'Urgent Action',
      subtitle: 'Requires immediate callback',
      tag: 'Urgent',
      icon: AlertCircle,
      bgColor: 'bg-rose-100',
      iconColor: '#BE123C'
    },
    {
      title: 'WhatsApp Needed',
      subtitle: 'Send brochure or details on WhatsApp',
      tag: 'WhatsApp',
      icon: MessageSquare,
      bgColor: 'bg-emerald-100',
      iconColor: '#047857'
    }
  ];

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      {/* Header */}
      <View 
        className="bg-[#0F172A] px-6 rounded-b-[36px] shadow-md z-10"
        style={{ paddingTop: Math.max(insets.top, 48), paddingBottom: 28 }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
              <ChevronLeft size={24} color="#ffffff" />
            </TouchableOpacity>
            <Image 
              source={require('../../../assets/images/logo-3d.png')}
              style={{ width: 32, height: 32, borderRadius: 8, marginRight: 10, borderWidth: 1, borderColor: '#334155' }}
              resizeMode="cover"
            />
            <Text className="text-white text-xl font-bold tracking-tight">Leads Directory</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(telecaller)/lead-list')} className="p-2 bg-white/10 rounded-full">
            <Filter size={18} color="#E2E8F0" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingTop: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Categories Section */}
        <Text className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-3 px-1">By Status</Text>
        
        {statusCategories.map((cat, index) => {
          const Icon = cat.icon;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(`/(telecaller)/lead-list?category=${cat.category}`)}
              className="bg-white rounded-2xl p-4 mb-3 shadow-xs border border-slate-200/80 flex-row items-center justify-between"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1 pr-2">
                <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mr-4">
                  <Icon size={20} color="#0F172A" strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 text-base font-bold mb-0.5 tracking-tight">
                    {cat.title}
                  </Text>
                  <Text className="text-slate-500 text-xs font-medium" numberOfLines={1}>
                    {cat.subtitle}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#CBD5E1" strokeWidth={2.5} />
            </TouchableOpacity>
          );
        })}

        {/* Tag Categories Section */}
        <Text className="text-xs font-semibold uppercase text-slate-500 tracking-wider mt-5 mb-3 px-1">By Tags &amp; Labels</Text>
        
        {tagCategories.map((tagCat, index) => {
          const Icon = tagCat.icon;
          return (
            <TouchableOpacity
              key={index}
              onPress={() => router.push(`/(telecaller)/lead-list?tag=${tagCat.tag}`)}
              className="bg-white rounded-2xl p-4 mb-3 shadow-xs border border-slate-200/80 flex-row items-center justify-between"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center flex-1 pr-2">
                <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mr-4">
                  <Icon size={20} color="#0F172A" strokeWidth={2} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-slate-900 text-base font-bold mb-0.5 tracking-tight mr-2">
                      {tagCat.title}
                    </Text>
                    <View className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                      <Text className="text-[9px] font-semibold text-slate-700 uppercase">{tagCat.tag}</Text>
                    </View>
                  </View>
                  <Text className="text-slate-500 text-xs font-medium" numberOfLines={1}>
                    {tagCat.subtitle}
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color="#CBD5E1" strokeWidth={2.5} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
