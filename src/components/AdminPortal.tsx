import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Terminal, 
  Copy, 
  CheckCircle2, 
  ShieldAlert, 
  Settings, 
  Users, 
  Search, 
  Code,
  Send,
  Save,
  Trash2,
  Sliders,
  HelpCircle,
  FileCode,
  RefreshCw,
  Clock,
  Play
} from 'lucide-react';
import { Specialty, Doctor, Booking } from '../types';

interface AdminPortalProps {
  specialties: Specialty[];
  doctors: Doctor[];
  bookings: Booking[];
  confirmArrival: (id: string) => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  deleteBooking: (id: string) => void;
  addDoctor: (docData: Omit<Doctor, 'id'>) => void;
  updateDoctorStatus: (id: string, status: Doctor['status']) => void;
  resetAllData: () => void;
}

export default function AdminPortal({ 
  specialties, 
  doctors, 
  bookings, 
  confirmArrival, 
  updateBookingStatus, 
  deleteBooking, 
  addDoctor, 
  updateDoctorStatus, 
  resetAllData 
}: AdminPortalProps) {
  
  const [filterQuery, setFilterQuery] = useState('');
  const [subTab, setSubTab] = useState<'tables' | 'api'>('tables');
  const [tableMode, setTableMode] = useState<'bookings' | 'patients'>('bookings');
  const [tablesQuery, setTablesQuery] = useState('');
  const [customApiUrl, setCustomApiUrl] = useState(() => {
    return localStorage.getItem('dawidar_custom_api_url') || 'https://oracleapex.com/ords/nerd_acc/dentaldata/dental';
  });
  const [isSaved, setIsSaved] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Testing sandbox state
  const [testBookingId, setTestBookingId] = useState<string>('');
  const [apiResponse, setApiResponse] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error';
    statusCode?: number;
    payloadSent?: any;
    responseBody?: string;
    errorMessage?: string;
  }>({ status: 'idle' });

  useEffect(() => {
    // Set first booking as default to try testing
    if (bookings.length > 0 && !testBookingId) {
      setTestBookingId(bookings[0].id);
    }
  }, [bookings, testBookingId]);

  const handleSaveApiUrl = () => {
    localStorage.setItem('dawidar_custom_api_url', customApiUrl);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const triggerCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Process and perform real HTTP Request to test their custom API
  const handleTestPostAPI = async () => {
    const selectedBooking = bookings.find(b => b.id === testBookingId);
    if (!selectedBooking) {
      setApiResponse({
        status: 'error',
        errorMessage: 'الرجاء اختيار حجز حقيقي لتفريغ البيانات والتجربة عليها'
      });
      return;
    }

    if (!customApiUrl.startsWith('http://') && !customApiUrl.startsWith('https://')) {
      setApiResponse({
        status: 'error',
        errorMessage: 'الرجاء إدخال رابط API صحيح يبدأ بـ http:// أو https://'
      });
      return;
    }

    // Prepare JSON payload according to requested format
    const serviceName = specialties.find(s => s.id === selectedBooking.specialtyId)?.name || 'عام';
    const payload = {
      patientName: selectedBooking.patientName,               // الاسم الكامل
      phone: selectedBooking.phone,                           // رقم الهاتف
      gender: selectedBooking.gender,                         // جنس المريض (ذكر / أنثى)
      serviceName: serviceName,                               // الخدمة المحددة للأسنان
      date: selectedBooking.date,                             // تاريخ الموعد
      timeSlot: selectedBooking.timeSlot,                     // توقيت الحضور المفضل
      notes: selectedBooking.notes || 'لا يوجد ملاحظات',        // الشكوى أو الملاحظات
      doctorId: selectedBooking.doctorId,                     // معرّف الطبيب (د. حازم دويدار)
      doctorName: 'د. حازم دويدار',                            // اسم الطبيب المشرف وثابت
      status: selectedBooking.status,                         // حالة الطلب الحالية
      isArrived: selectedBooking.isArrived || false,          // هل حضر للعيادة
      arrivedAt: selectedBooking.arrivedAt || null,           // توقيت الوصول الفعلي إن وجد
      systemBookingId: selectedBooking.id,                    // معرف الحجز الفني بالنظام
      createdAt: selectedBooking.createdAt                    // وقت إنشاء الطلب
    };

    setApiResponse({
      status: 'loading',
      payloadSent: payload
    });

    try {
      const response = await fetch(customApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const bodyText = await response.text();
      let formattedResponse = bodyText;
      try {
        formattedResponse = JSON.stringify(JSON.parse(bodyText), null, 2);
      } catch (e) {
        // Not a JSON, keep as-is
      }

      setApiResponse({
        status: response.ok ? 'success' : 'error',
        statusCode: response.status,
        payloadSent: payload,
        responseBody: formattedResponse,
        errorMessage: response.ok ? undefined : `الخادم رد بكود خطأ: ${response.status}`
      });

    } catch (err: any) {
      setApiResponse({
        status: 'error',
        payloadSent: payload,
        errorMessage: `فشل الاتصال برابط الـ API. تأكد من بروتوكول CORS في خادمك ومن الرابط المكتوب. التفاصيل: ${err.message}`
      });
    }
  };

  const filteredLiveBookings = bookings.filter(b => 
    b.patientName.includes(filterQuery) || 
    b.phone.includes(filterQuery)
  );

  const activeTestBooking = bookings.find(b => b.id === testBookingId);
  const activeServiceName = activeTestBooking 
    ? (specialties.find(s => s.id === activeTestBooking.specialtyId)?.name || 'عام')
    : 'زراعة الأسنان وجراحة الفكين';

  // Sample code snippets for developers
  const fetchCodeSnippet = `// 🚀 كود إرسال بيانات المريض فورياً إلى خادمك وقاعدة بياناتك الخاصة
// تم التجهيز بالتفصيل طبقا للبيانات المطلوبة في التسجيل ومطابقة التصميم

async function registerPatientInYourDatabase(bookingData) {
  // الرابط المعيّن في لوحة التحكم الخاص بمركز د. حازم
  const API_ENDPOINT = "${customApiUrl}";

  const payload = {
    patientName: bookingData.patientName,    // الاسم الكامل للمريض
    phone: bookingData.phone,                // رقم الهاتف (جوال المريض)
    gender: bookingData.gender,              // الجنس (ذكر / أنثى)
    serviceName: bookingData.serviceName,    // اسم الخدمة (مثال: زراعة أسنان)
    date: bookingData.date,                  // تاريخ الحجز (YYYY-MM-DD)
    timeSlot: bookingData.timeSlot,          // فترة الحضور (موعد العيادة)
    notes: bookingData.notes || '',         // الملاحظات أو الشكوى
    doctorId: "doc-dawidar",                 // معرّف الطبيب (د. حازم دويدار)
    status: "waiting",                       // حالة الموعد البدئية
    isArrived: false                         // حالة الحضور والوصول الفعلي
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const result = await response.json();
    console.log("تمت المزامنة بنجاح وحفظ البيانات:", result);
    return result;
  } catch (error) {
    console.error("فشل إرسال البيانات للـ API الخاص بكم:", error);
    throw error;
  }
}`;

  return (
    <div className="space-y-8 text-right" id="developer-api-portal-root">
      
      {/* 1. MASTER BANNER - Premium Developer and Gate Info */}
      <div className="bg-[#051a22] border border-teal-950 rounded-3xl p-6 md:p-8 text-right relative overflow-hidden shadow-xl animate-fade-in">
        <div className="absolute top-0 left-0 w-48 h-full bg-gradient-to-r from-teal-500/5 to-transparent pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4 z-10 relative">
          <div className="space-y-2 order-2 md:order-1 text-center md:text-right">
            <div className="inline-flex items-center gap-2 bg-gradient-to-l from-teal-400/20 to-teal-400/5 text-teal-300 px-3.5 py-1 rounded-full text-xs font-bold border border-teal-500/10 font-sans">
              <Terminal className="w-3.5 h-3.5 text-teal-400" />
              <span>مستندات وبوابة تكامل ربط الـ API الخارجية للعيادة</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black text-white">
              بوابة المطورين وتكامل ربط Oracle APEX 26.1 الفوري
            </h2>
            <p className="text-[#9df2ea] text-xs md:text-sm max-w-2xl leading-relaxed">
              تم ربط الـ API الخاص بـ Oracle APEX والموجّه لخدمات **ORDS** (`https://oracleapex.com/ords/nerd_acc/dentaldata/dental`) بشكل ذكي وفعال كافتراضي للنظام! يتم ترحيل حجوزات المرضى (الاسم، الهاتف، الجنس، والخدمة المطلوبة) تلقائياً وفوراً كـ **JSON payload** لمنع تعارض قواعد البيانات ولتوفير تزامن آني دقيق.
            </p>
          </div>

          <div className="p-3 bg-teal-950 text-teal-400 rounded-2xl border border-teal-900 block order-1 md:order-2 shrink-0">
            <Code className="w-8 h-8 text-teal-350" />
          </div>
        </div>

        {/* Technical Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 mt-6 border-t border-teal-950 text-right text-xs">
          <div className="bg-[#030e12] p-3 rounded-xl border border-teal-950/40">
            <span className="text-slate-500 block text-[10px] mb-0.5">الطبيب المتوفر حالياً</span>
            <strong className="text-teal-300 font-bold">د. حازم دويدار (استشاري)</strong>
          </div>
          <div className="bg-[#030e12] p-3 rounded-xl border border-teal-950/40">
            <span className="text-slate-500 block text-[10px] mb-0.5">التخصص العيادي</span>
            <strong className="text-[#9df2ea]">طب وجراحة وتجميل الأسنان</strong>
          </div>
          <div className="bg-[#030e12] p-3 rounded-xl border border-teal-950/40">
            <span className="text-slate-500 block text-[10px] mb-0.5">الرابط النشط حالياً</span>
            <span className="text-[#9df2ea] font-mono tracking-wide truncate block" title={customApiUrl}>
              {customApiUrl || 'لم يتم التحديد'}
            </span>
          </div>
          <div className="bg-[#030e12] p-3 rounded-xl border border-teal-950/40">
            <span className="text-slate-500 block text-[10px] mb-0.5">حالة الخدمة والمزامنة</span>
            <strong className="text-emerald-400 font-bold flex items-center gap-1 justify-end">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              جاهز ومستعد للمزامنة
            </strong>
          </div>
        </div>
      </div>

      {/* Choose active Workspace view */}
      <div className="flex gap-2 justify-end border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setSubTab('api')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
            subTab === 'api' 
              ? 'bg-[#091b22] text-white shadow-lg' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          }`}
        >
          <Terminal className="w-4 h-4 text-teal-400" />
          <span>لوحة ربط ومراقبة الـ API</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('tables')}
          className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
            subTab === 'tables' 
              ? 'bg-teal-650 bg-teal-600 text-white shadow-lg shadow-teal-600/10' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>إدارة جداول قواعد البيانات (المرضى والحجوزات)</span>
        </button>
      </div>

      {/* 2. CORE PORTFOLIO WORKSPACE: LEFT IS API/TABLES WORKSPACE, RIGHT IS QUEUE MANAGER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COMPONENT (8 COLS): Conditional Workspace */}
        <div className="lg:col-span-8 space-y-6 order-2 lg:order-1">
          
          {subTab === 'tables' ? (
            <div className="space-y-6">
              
              {/* Tables Banner / Stats */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 space-y-6 shadow-md text-right">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2 justify-end">
                      <span>إدارة مستودعات وجداول قواعد البيانات السحابية 📁</span>
                    </h3>
                    <p className="text-xs text-slate-500">مزامنة تامة لبيانات الحجز وسجلات المرضى المستخلصة من الـ Cloud Firestore</p>
                  </div>
                  
                  {/* Table Toggle controls */}
                  <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => { setTableMode('patients'); setTablesQuery(''); }}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
                        tableMode === 'patients' 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      👥 جدول ملفات المرضى ({Object.keys(bookings.reduce((acc: any, b) => { acc[b.phone] = true; return acc; }, {})).length})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTableMode('bookings'); setTablesQuery(''); }}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer select-none ${
                        tableMode === 'bookings' 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      📅 جدول بيانات الحجوزات ({bookings.length})
                    </button>
                  </div>
                </div>

                {/* Cloud Database Online Badge Info */}
                <div className="flex justify-between items-center bg-teal-50/50 border border-teal-100/30 p-3.5 rounded-2xl text-[11px] text-teal-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span>قاعدة بيانات Firestore متصلة ونشطة (صقيلة التحديث)</span>
                  </div>
                  <span className="text-slate-400 text-[10px]">المطوّر: ميسرة الشريف</span>
                </div>

                {/* Search in Tables */}
                <div className="flex gap-2">
                  <div className="relative w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
                    <input 
                      type="text" 
                      value={tablesQuery}
                      onChange={(e) => setTablesQuery(e.target.value)}
                      placeholder={tableMode === 'bookings' ? 'ابحث باسم المريض، الجوال، أو تاريخ الحجز (مثال: 2026-06-10)...' : 'ابحث باسم المريض أو رقم جواله...'}
                      className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-3 focus:outline-none focus:border-teal-500 transition font-sans text-right"
                    />
                  </div>
                </div>

                {/* Main Table Viewer */}
                {tableMode === 'bookings' ? (
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-inner">
                    <table className="w-full text-[11px] text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-100 font-extrabold text-[10px]">
                          <th className="py-3 px-3 text-center">رقم المسار</th>
                          <th className="py-3 px-3">اسم المريض</th>
                          <th className="py-3 px-3">رقم الهاتف التواصل</th>
                          <th className="py-3 px-3">الخدمة والعيادة</th>
                          <th className="py-3 px-3">التاريخ والوقت</th>
                          <th className="py-3 px-3 text-center">الحالة</th>
                          <th className="py-3 px-3 text-center">حالة الحضور</th>
                          <th className="py-3 px-3 text-center">الإجراءات والسجل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {bookings.filter(b => 
                          b.patientName.includes(tablesQuery) || 
                          b.phone.includes(tablesQuery) ||
                          b.date.includes(tablesQuery)
                        ).length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">لا توجد حجوزات مسجلة مطابقة للبحث حالياً.</td>
                          </tr>
                        ) : (
                          bookings.filter(b => 
                            b.patientName.includes(tablesQuery) || 
                            b.phone.includes(tablesQuery) ||
                            b.date.includes(tablesQuery)
                          ).map((b) => {
                            const spec = specialties.find(s => s.id === b.specialtyId);
                            const specName = spec ? spec.name : 'كشف عام';
                            return (
                              <tr key={b.id} className="hover:bg-slate-50/50 transition">
                                <td className="py-3 px-3 text-center font-mono font-bold text-teal-600">#{b.queueNumber}</td>
                                <td className="py-3 px-3 font-semibold text-slate-900">{b.patientName}</td>
                                <td className="py-3 px-3 font-mono text-slate-600">{b.phone}</td>
                                <td className="py-3 px-3">
                                  <span className="bg-teal-50 text-teal-800 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                    {specName}
                                  </span>
                                </td>
                                <td className="py-3 px-3 font-mono text-slate-500">
                                  {b.date} • {b.timeSlot}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {b.status === 'completed' && <span className="bg-emerald-105 bg-emerald-120 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold text-[9px]">مكتمل</span>}
                                  {b.status === 'in-progress' && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold text-[9px] animate-pulse">مستمر</span>}
                                  {b.status === 'waiting' && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-bold text-[9px]">قيد الانتظار</span>}
                                  {b.status === 'cancelled' && <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold text-[9px]">ملغي</span>}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  {b.isArrived ? (
                                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 justify-center">
                                      <span>● حضر للعيادة</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-slate-400">مجدول فقط</span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <div className="flex gap-1 justify-center">
                                    {!b.isArrived && (
                                      <button
                                        onClick={() => confirmArrival(b.id)}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded text-[9px] cursor-pointer"
                                        title="تأكيد حضور"
                                      >
                                        وصول
                                      </button>
                                    )}
                                    <button
                                      onClick={() => updateBookingStatus(b.id, 'completed')}
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[9px] cursor-pointer"
                                    >
                                      إتمام
                                    </button>
                                    <button
                                      onClick={() => deleteBooking(b.id)}
                                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-1 py-0.5 rounded text-[9px] cursor-pointer font-bold"
                                      title="حذف نهائي"
                                    >
                                      حذف
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-100 rounded-2xl shadow-inner">
                    <table className="w-full text-[11px] text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 border-b border-slate-100 font-extrabold text-[10px]">
                          <th className="py-3 px-4">اسم المريض</th>
                          <th className="py-3 px-4">رقم التواصل (الجوال)</th>
                          <th className="py-3 px-4 text-center">الجنس</th>
                          <th className="py-3 px-4 text-center">إجمالي الزيارات والمواعيد</th>
                          <th className="py-3 px-4">آخر زيارة مسجلة</th>
                          <th className="py-3 px-4">الملاحظات والشكوى</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {(() => {
                          const patientsMap: Record<string, { name: string; phone: string; gender: string; bookingsCount: number; lastVisit: string; notes: string }> = {};
                          bookings.forEach(b => {
                            const key = b.phone || 'no-phone';
                            if (!patientsMap[key]) {
                              patientsMap[key] = {
                                name: b.patientName,
                                phone: b.phone,
                                gender: b.gender,
                                bookingsCount: 0,
                                lastVisit: b.date,
                                notes: b.notes || 'طلب كشف ومتابعة مستمرة للفكين'
                              };
                            }
                            patientsMap[key].bookingsCount += 1;
                            if (new Date(b.date) > new Date(patientsMap[key].lastVisit)) {
                              patientsMap[key].lastVisit = b.date;
                            }
                          });
                          const patientsList = Object.values(patientsMap);
                          const filtered = patientsList.filter(p => 
                            p.name.includes(tablesQuery) || 
                            p.phone.includes(tablesQuery)
                          );

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">لا يوجد مرضى مسجلين بالاسم أو رقم الجوال في قاعدة البيانات حالياً.</td>
                              </tr>
                            );
                          }

                          return filtered.map((p, index) => (
                            <tr key={index} className="hover:bg-slate-50/50 transition">
                              <td className="py-3.5 px-4 font-bold text-slate-900">{p.name}</td>
                              <td className="py-3.5 px-4 font-mono text-slate-600">{p.phone}</td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.gender === 'ذكر' || p.gender === 'male' || p.gender === 'M'
                                    ? 'bg-blue-50 text-blue-700' 
                                    : 'bg-rose-50 text-rose-700'
                                }`}>
                                  {p.gender || 'ذكر'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center font-mono font-bold text-teal-600">{p.bookingsCount} موعد</td>
                              <td className="py-3.5 px-4 font-mono text-slate-500">{p.lastVisit}</td>
                              <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate" title={p.notes}>
                                {p.notes || 'لا يوجد ملاحظات مدونة'}
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* API CONFIGURATION BOX - Pasting dynamic API URL */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 space-y-4 shadow-md text-right">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                  <span className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                    <Database className="w-5 h-5 text-teal-655 text-teal-600" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800">موضع إدخال وتكوين الـ API وعنوان سيرفرك</h3>
                    <p className="text-xs text-slate-400">احقن رابط الـ API لبياناتك بالأسفل لتوجيه الاستدعاء ومزامنة المواعيد فور ترحيلها</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="relative text-right">
                    <label className="block text-xs font-bold text-slate-600 mb-2">رابط استقبال البيانات (POST api Endpoint URL):</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={customApiUrl}
                        onChange={(e) => setCustomApiUrl(e.target.value)}
                        placeholder="اكتب هنا رابط خادمك (مثال: https://my-server.com/api/dawidar-bookings)"
                        className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl pr-4 pl-4 py-3.5 focus:outline-none focus:border-teal-500 transition font-mono text-left"
                      />
                      <button
                        type="button"
                        onClick={handleSaveApiUrl}
                        className="bg-slate-900 hover:bg-teal-950 font-bold text-white px-5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer select-none shrink-0 active:scale-95"
                      >
                        {isSaved ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>تم الحفظ!</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            <span>حفظ الرابط 💾</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 text-xs text-amber-900 leading-relaxed text-right space-y-1.5">
                    <p className="font-bold flex items-center gap-1 justify-end">
                      <span>تنبيه المطور الفني وحقن الكود:</span>
                      <span className="text-sm">⚠️</span>
                    </p>
                    <p>
                      سيقوم النظام بإرسال طلب **HTTP POST** محمل ببيانات المريض بهيكل **JSON** بمجرد إضافة حجز جديد، أو عند نقرك على زر **إرسال فوري لتجربة الـ API** في وحدة الاختبار على اليسار.
                    </p>
                  </div>
                </div>
              </div>

              {/* PARAMETERS AND REGISTRATION DATA FIELDS REQUIREMENTS */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 space-y-4 shadow-md text-right">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                    <Sliders className="w-5 h-5 text-teal-600" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800">البيانات والمتغيرات المطلوبة في التسجيل والـ API</h3>
                    <p className="text-xs text-slate-400">جدول البيانات المرسلة والمتاحة في الهيكل JSON للتخزين ببرنامجك الخاص</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-slate-150">
                        <th className="py-3 px-4 font-extrabold">المتغير الفني (JSON Key)</th>
                        <th className="py-3 px-4 font-extrabold">نوعه (Type)</th>
                        <th className="py-3 px-4 font-extrabold">المعنى والوصف</th>
                        <th className="py-3 px-4 font-extrabold">الحالة</th>
                        <th className="py-3 px-4 font-extrabold">بيانات تجريبية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      <tr>
                        <td className="py-3.5 px-4 font-mono text-teal-700 font-bold">patientName</td>
                        <td className="py-3.5 px-4"><span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">string</span></td>
                        <td className="py-3.5 px-4">اسم المريض المراجع بالكامل أبجدياً</td>
                        <td className="py-3.5 px-4 text-emerald-600 font-bold">إجباري (Required)</td>
                        <td className="py-3.5 px-4 font-mono">"أحمد محمد الشناوي"</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 font-mono text-teal-700 font-bold">phone</td>
                        <td className="py-3.5 px-4"><span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">string</span></td>
                        <td className="py-3.5 px-4">رقم جوال المريض الفعال (أرقام فقط)</td>
                        <td className="py-3.5 px-4 text-emerald-600 font-bold">إجباري (Required)</td>
                        <td className="py-3.5 px-4 font-mono">"01012345678"</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 font-mono text-teal-700 font-bold">gender</td>
                        <td className="py-3.5 px-4"><span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">string</span></td>
                        <td className="py-3.5 px-4">جنس المريض المختار بالاستمارة</td>
                        <td className="py-3.5 px-4 text-emerald-600 font-bold">إجباري (Required)</td>
                        <td className="py-3.5 px-4 font-mono">"ذكر" | "أنثى"</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 font-mono text-teal-700 font-bold">serviceName</td>
                        <td className="py-3.5 px-4"><span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">string</span></td>
                        <td className="py-3.5 px-4">الخدمة السنية المحددة (تنظيف، زراعة، تقويم...)</td>
                        <td className="py-3.5 px-4 text-emerald-600 font-bold">إجباري (Required)</td>
                        <td className="py-3.5 px-4 font-mono">"زراعة الأسنان وجراحة الفكين"</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 font-mono text-teal-700 font-bold">date</td>
                        <td className="py-3.5 px-4"><span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">string</span></td>
                        <td className="py-3.5 px-4">تاريخ حضور الكشف (صيغة ISO)</td>
                        <td className="py-3.5 px-4 text-emerald-600 font-bold">إجباري (Required)</td>
                        <td className="py-3.5 px-4 font-mono">"2026-06-10"</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 font-mono text-teal-700 font-bold">timeSlot</td>
                        <td className="py-3.5 px-4"><span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">string</span></td>
                        <td className="py-3.5 px-4">فترة وموعد الوصول المحدد للحضور</td>
                        <td className="py-3.5 px-4 text-emerald-600 font-bold">إجباري (Required)</td>
                        <td className="py-3.5 px-4 font-mono">"05:30 م"</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 font-mono text-teal-700 font-bold">notes</td>
                        <td className="py-3.5 px-4"><span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">string</span></td>
                        <td className="py-3.5 px-4">الشكوى المبدئية أو الملاحظات الإضافية</td>
                        <td className="py-3.5 px-4 text-slate-500">اختياري (Optional)</td>
                        <td className="py-3.5 px-4 font-mono">"ألم حاد في الضرس العلوي الأيمن"</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 px-4 font-mono text-teal-700 font-bold">doctorId</td>
                        <td className="py-3.5 px-4"><span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-mono">string</span></td>
                        <td className="py-3.5 px-4">معرّف الاستشاري المعالج (ثابت للعيادة)</td>
                        <td className="py-3.5 px-4 text-slate-400">تلقائي (Auto)</td>
                        <td className="py-3.5 px-4 font-mono">"doc-dawidar"</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ACTIVE DEVELOPER CODE PLAYGROUND SNIPPET */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 space-y-4 shadow-xl text-right relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-xl pointer-events-none"></div>

                <div className="flex justify-between items-center text-xs flex-row-reverse border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 flex-row-reverse">
                    <FileCode className="w-5 h-5 text-teal-400" />
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-100">شيفرة الاستدعاء الفنية (API Connection Code Snippet)</h4>
                      <p className="text-[10px] text-slate-400">يمكنك نسخ واستخدام هذا الهيكل البرمجي داخل تطبيق React أو Node</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerCopy('code', fetchCodeSnippet)}
                    className="bg-slate-800 hover:bg-slate-950 text-white border border-slate-700 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 cursor-pointer select-none"
                  >
                    {copiedKey === 'code' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>تم النسخ!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ الشيفرة</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="bg-[#030e12] text-teal-350 font-mono text-[10.5px] p-5 rounded-2xl overflow-x-auto text-left leading-relaxed max-h-[300px]">
                  {fetchCodeSnippet}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COMPONENT (4 COLS): LIVE QUEUE & TESTING APPARATUS */}
        <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
          
          {/* LIVE QUEUE LIST & SEARCH */}
          <div className="bg-[#091b22] text-white border border-teal-950 rounded-3xl p-5 space-y-5 shadow-xl relative text-right">
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none"></div>

            <div className="space-y-1.5 border-b border-slate-800/80 pb-3">
              <h3 className="font-extrabold text-sm flex items-center justify-end gap-1.5">
                <span>سجلات الحجوزات النشطة بالعيادة اليوم</span>
                <Users className="w-4 h-4 text-teal-400" />
              </h3>
              <p className="text-[10px] text-slate-400 leading-normal">
                المرضى المسجلين لحضور عيادة الكشف الفوري مع الطبيب حازم دويدار. ابحث بالاسم للمتابعة.
              </p>
            </div>

            {/* Filter Input */}
            <div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3" />
                <input 
                  type="text" 
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="ابحث باسم المريض أو هاتفه..."
                  className="w-full text-[11px] bg-[#030e12] border border-slate-800 rounded-xl pr-8 pl-3 py-2.5 text-right text-slate-200 focus:outline-none focus:border-teal-400 font-sans"
                />
              </div>
            </div>

            {/* Queue Cards */}
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {filteredLiveBookings.length === 0 ? (
                <p className="text-center text-slate-500 text-[10px] py-8">لا يوجد حجوزات مطابقة للبحث حالياً</p>
              ) : (
                filteredLiveBookings.map(b => {
                  const serviceName = specialties.find(s => s.id === b.specialtyId)?.name || 'عام';
                  return (
                    <div 
                      key={b.id} 
                      onClick={() => setTestBookingId(b.id)}
                      className={`p-3.5 rounded-xl border text-[11px] leading-relaxed relative cursor-pointer transition-all ${
                        testBookingId === b.id 
                          ? 'bg-slate-900 border-teal-500 shadow-md shadow-teal-500/10' 
                          : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-center flex-row-reverse mb-1.5">
                        <div className="flex items-center gap-1.5 flex-row-reverse">
                          <span className="font-bold text-slate-100">{b.patientName}</span>
                          <strong className="text-teal-400 bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.2 rounded text-[9px] font-mono">#{b.queueNumber}</strong>
                        </div>
                        {b.isArrived ? (
                          <span className="text-[8.5px] bg-emerald-500/20 text-emerald-305 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-full font-bold">تم الحضور</span>
                        ) : (
                          <span className="text-[8.5px] bg-amber-500/10 text-amber-305 text-amber-300 border border-amber-500/35 px-1.5 py-0.2 rounded-full font-bold animate-pulse">مجدول</span>
                        )}
                      </div>
                      
                      <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-900/60 pt-2 mt-2 text-right">
                        <p>رقم الجوال: <span className="font-mono text-slate-300">{b.phone}</span> | الجنس: <span className="text-teal-300 font-extrabold">{b.gender || 'ذكر'}</span></p>
                        <p>الخدمة المطلوبة: <strong className="text-amber-200">{serviceName}</strong></p>
                        <p className="font-mono text-[9px] text-slate-500">الموعد: {b.date} • {b.timeSlot}</p>
                      </div>

                      {/* Immediate Control Operations */}
                      <div className="flex gap-1.5 mt-2.5 border-t border-slate-900/40 pt-2 justify-start">
                        {!b.isArrived && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmArrival(b.id);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 py-1 rounded text-[9px]"
                          >
                            تأكيد وصول 🔔
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateBookingStatus(b.id, 'completed');
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[9px]"
                        >
                          إتمام الكشف
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBooking(b.id);
                          }}
                          className="text-rose-400 hover:text-rose-500 font-bold px-1.5 py-1 text-[9px] mr-auto"
                        >
                          حذف السجل
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Clear all Data trigger */}
            <div className="border-t border-slate-800/80 pt-3 flex justify-between items-center text-[10.5px]">
              <span className="text-slate-500">حذف الحجوزات الافتراضية والمسار:</span>
              <button
                type="button"
                onClick={resetAllData}
                className="text-rose-400 hover:text-rose-500 font-bold border border-rose-950/40 px-2 py-1 rounded-lg transition"
              >
                حذف وإعادة تعيين البيانات ⚠️
              </button>
            </div>
          </div>

          {/* ACTIVE TEST SANDBOX PLAYGROUND */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 space-y-4 shadow-md text-right">
            <div className="space-y-1 border-b border-slate-100 pb-3">
              <h4 className="font-black text-sm text-slate-800 flex items-center justify-end gap-1.5">
                <span>أداة تجربة واختبار ترحيل الـ API الفوري</span>
                <Play className="w-4 h-4 text-teal-600 fill-teal-600" />
              </h4>
              <p className="text-[10px] text-slate-400 leading-normal">
                اختر مريضاً من القائمة أعلاه واختبر إرسال طلب تجريبي لـ API الخاص بك الآن لرؤية سرعة الترحيل والاستجابة
              </p>
            </div>

            {activeTestBooking ? (
              <div className="space-y-3.5 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 font-sans text-right space-y-1">
                  <div className="flex justify-between flex-row-reverse text-[11px]">
                    <span className="text-slate-400">اسم المريض المختار للتجربة:</span>
                    <strong className="text-slate-800">{activeTestBooking.patientName}</strong>
                  </div>
                  <div className="flex justify-between flex-row-reverse text-[11px]">
                    <span className="text-slate-400">البيانات النشطة:</span>
                    <span className="text-teal-700 font-bold">الهاتف {activeTestBooking.phone} | {activeTestBooking.gender || 'ذكر'}</span>
                  </div>
                  <div className="flex justify-between flex-row-reverse text-[11px]">
                    <span className="text-slate-400">الخدمة والسن الكاشف:</span>
                    <strong className="text-slate-800">{activeServiceName}</strong>
                  </div>
                </div>

                <div className="text-left">
                  <button
                    type="button"
                    onClick={handleTestPostAPI}
                    disabled={apiResponse.status === 'loading'}
                    className="w-full bg-[#111c1e] hover:bg-[#1db9aa] hover:text-slate-900 text-teal-350 text-teal-400 text-slate-100 font-black py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    {apiResponse.status === 'loading' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري ترحيل البيانات للـ API...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>إرسال فوري لتجربة الـ API (Test POST)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* API Request console output display */}
                {apiResponse.status !== 'idle' && (
                  <div className="space-y-3 border-t border-slate-100 pt-3 animate-zoom-in text-right">
                    <div className="flex justify-between items-center text-[10px] flex-row-reverse">
                      <span className="text-slate-500 font-bold">استجابة السيرفر ووخرج الـ Console:</span>
                      {apiResponse.status === 'success' && (
                        <span className="text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold">
                          تم الاتصال بنجاح ({apiResponse.statusCode})
                        </span>
                      )}
                      {apiResponse.status === 'error' && (
                        <span className="text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full font-bold">
                          حدث خطأ بالاتصال
                        </span>
                      )}
                      {apiResponse.status === 'loading' && (
                        <span className="text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full font-bold animate-pulse">
                          في جاري الإرسال
                        </span>
                      )}
                    </div>

                    {/* Error block instruction */}
                    {apiResponse.errorMessage && (
                      <p className="text-[10px] text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100 leading-relaxed font-bold">
                        {apiResponse.errorMessage}
                      </p>
                    )}

                    {/* Console box output */}
                    <div className="space-y-1 text-left font-mono text-[9px]">
                      <span className="text-slate-400 block text-right font-sans">البيانات المرسلة (JSON payload sent):</span>
                      <pre className="bg-[#030e12] text-teal-300 p-2.5 rounded-lg max-h-[120px] overflow-y-auto">
                        {JSON.stringify(apiResponse.payloadSent, null, 2)}
                      </pre>
                      
                      {apiResponse.responseBody && (
                        <>
                          <span className="text-slate-400 block text-right font-sans mt-2">محتوى الإجابة الراجع من خادمج (Response):</span>
                          <pre className="bg-slate-900 text-amber-200 p-2.5 rounded-lg max-h-[120px] overflow-y-auto">
                            {apiResponse.responseBody}
                          </pre>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-center text-slate-400 py-4">برجاء تسجيل حجز أولاً بالتطبيق لتجربته هنا.</p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
