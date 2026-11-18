import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import api from '../../services/api';
import { FileSpreadsheet, Download, Calendar, ChevronDown, FileText, Database, ShieldCheck, PhoneCall, Award, MapPin } from 'lucide-react-native';
import OfflineBanner from '../../components/OfflineBanner';

export default function AdminReports() {
  const [downloading, setDownloading] = useState(null); // stores reportType when downloading

  const reports = [
    { type: 'daily_leads', title: 'Daily Leads', desc: 'Generated today', icon: <Database size={24} color="#16A34A" /> },
    { type: 'lead_assignment', title: 'Lead Assignment', desc: 'Generated today', icon: <FileSpreadsheet size={24} color="#16A34A" /> },
    { type: 'telecaller_performance', title: 'Telecaller Performance', desc: 'Generated today', icon: <Award size={24} color="#16A34A" /> },
    { type: 'call_report', title: 'Call Report', desc: 'Generated today', icon: <PhoneCall size={24} color="#16A34A" /> },
    { type: 'conversion_report', title: 'Conversion Trends', desc: 'Generated today', icon: <ShieldCheck size={24} color="#16A34A" /> }
  ];

  const handleExport = async (reportType, title) => {
    setDownloading(reportType);
    try {
      const response = await api.get('/reports/export', {
        params: { reportType, format: 'csv' },
        responseType: 'text'
      });

      // Add UTF-8 BOM so Excel reads Unicode properly
      const csvData = '\uFEFF' + response.data;
      const filename = `${reportType}_export_${Date.now()}.csv`;

      if (Platform.OS === 'web') {
        const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const fileUri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(fileUri, csvData); // UTF8 is default in Expo

        const isSharingAvailable = await Sharing.isAvailableAsync();
        if (isSharingAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: `Share ${title}`,
            UTI: 'public.comma-separated-values-text'
          });
        } else {
          Alert.alert('Saved Locally', `Report has been saved, but sharing is unavailable on this device.\nUri: ${fileUri}`);
        }
      }
    } catch (err) {
      console.log('Export error:', err);
      Alert.alert('Export Failed', 'Unable to fetch report from server. Please verify your connection.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <OfflineBanner />

      {/* Header */}
      <View className="pt-14 pb-2 px-6">
        <Text className="text-[28px] font-black text-[#0B192C] tracking-tight">Performance Reports</Text>
        <Text className="text-slate-500 text-sm mt-1 pr-6 leading-5">Download comprehensive analytical reports.</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* Filters Card */}
        <View className="bg-white rounded-2xl p-5 mb-8 border border-slate-200 shadow-sm shadow-slate-200/50 mt-4">
          <View className="mb-4">
            <Text className="text-xs font-bold text-slate-700 mb-2">Date Range</Text>
            <View className="flex-row items-center border border-slate-300 rounded-xl px-3 bg-white h-12 justify-between">
              <View className="flex-row items-center">
                <Calendar size={16} color="#64748B" />
                <Text className="ml-2 text-sm text-[#0B192C] font-bold">Last 30 Days</Text>
              </View>
              <ChevronDown size={16} color="#0B192C" />
            </View>
          </View>

          <View className="flex-row justify-between mb-6">
            <View className="w-[48%]">
              <Text className="text-xs font-bold text-slate-700 mb-2">Output Format</Text>
              <View className="flex-row items-center border border-slate-300 rounded-xl px-3 bg-white h-12 justify-between">
                <View className="flex-row items-center">
                  <FileText size={16} color="#64748B" />
                  <Text className="ml-2 text-sm text-[#0B192C] font-bold">Excel (.xlsx)</Text>
                </View>
                <ChevronDown size={16} color="#0B192C" />
              </View>
            </View>

            <View className="w-[48%]">
              <Text className="text-xs font-bold text-slate-700 mb-2">Division</Text>
              <View className="flex-row items-center border border-slate-300 rounded-xl px-3 bg-white h-12 justify-between">
                <View className="flex-row items-center">
                  <MapPin size={16} color="#64748B" />
                  <Text className="ml-2 text-sm text-[#0B192C] font-bold">All Divisions</Text>
                </View>
                <ChevronDown size={16} color="#0B192C" />
              </View>
            </View>
          </View>

          <TouchableOpacity className="bg-[#FFB703] h-12 rounded-xl justify-center items-center shadow-sm shadow-[#FFB703]/30">
            <Text className="text-[#0B192C] font-black text-sm">Apply Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Available Reports */}
        <Text className="text-lg font-black text-[#0B192C] mb-4">Available Reports</Text>
        
        {reports.map((report, index) => (
          <View key={index} className="bg-white rounded-2xl p-4 mb-3 flex-row items-center justify-between border border-slate-200 shadow-sm shadow-slate-200/40">
            <View className="flex-row items-center flex-1">
              <View className="w-12 h-12 bg-emerald-50 rounded-xl justify-center items-center mr-4 border border-emerald-100">
                {report.icon}
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-[#0B192C]">{report.title}</Text>
                <Text className="text-xs text-slate-500 mt-0.5">{report.desc}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              onPress={() => handleExport(report.type, report.title)}
              disabled={downloading === report.type}
              className="w-10 h-10 rounded-full border-2 border-[#0B192C] justify-center items-center ml-2"
            >
              {downloading === report.type ? (
                <ActivityIndicator size="small" color="#0B192C" />
              ) : (
                <Download size={16} color="#0B192C" strokeWidth={2.5} />
              )}
            </TouchableOpacity>
          </View>
        ))}

        {/* Custom Insight Banner */}
        <View className="bg-[#0B192C] rounded-2xl p-6 mt-6 mb-4 shadow-lg shadow-slate-900/40">
          <Text className="text-white text-lg font-bold mb-1">Need custom insight?</Text>
          <Text className="text-slate-300 text-xs mb-4">Contact data team for specialized report generation</Text>
          <TouchableOpacity className="bg-[#FFB703] self-start px-5 py-2.5 rounded-full">
            <Text className="text-[#0B192C] font-bold text-sm">Request Access</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
