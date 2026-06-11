import React, { useState, useEffect } from 'react';
import { 
  Smile, 
  Clock, 
  Phone, 
  MapPin, 
  LayoutDashboard, 
  Calendar, 
  ShieldCheck,
  Stethoscope,
  Database
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'booking' | 'admin';
  setActiveTab: (tab: 'booking' | 'admin') => void;
  todayBookingsCount: number;
}

export default function Header({ activeTab, setActiveTab, todayBookingsCount }: HeaderProps) {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="w-full bg-[#020e12] border-b border-teal-950/40 sticky top-0 z-50 shadow-md text-slate-100" id="clinic-header">
      
      {/* 1. TOP BANNER BAR - Minimal luxury informational tracker */}
      <div className="bg-[#041a22] text-[11px] text-slate-400 py-2 px-4 border-b border-teal-980/30">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-mono tracking-wider text-slate-200">01018784470 20+</span>
            </span>
            <span className="hidden sm:flex items-center gap-1 border-r border-teal-950 pr-4">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>صهرجت الصغرى - شارع داير الناحية - بجوار استديو الأهرام</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 bg-teal-950 text-teal-300 px-2.5 py-0.5 rounded-full text-[10px] font-bold ring-1 ring-teal-500/10">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
              مفتوح الآن (أطباء مناوبين)
            </span>
            <span className="font-mono text-slate-300 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>{time || '11:45 ص'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN BRANDING HEADER & SCREENSHOT NAVIGATION */}
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Right side logo and branding */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-500 to-[#1df2da] shadow-lg shadow-teal-500/20 flex items-center justify-center text-slate-950">
            <Smile className="w-6 h-6 text-slate-950 stroke-2" />
          </div>
          <div className="text-right">
            <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              مركز دويدار <span className="text-teal-400">لتخصصات طب الأسنان</span>
            </h1>
            <p className="text-[10px] text-slate-400 mt-0.5 font-bold tracking-widest uppercase">
              DAWIDAR SPECIALIZED DENTAL CENTER
            </p>
          </div>
        </div>

        {/* Middle navigation links - styled exactly after the user's screenshot */}
        <nav className="flex flex-wrap items-center justify-center gap-y-2 gap-x-5 text-xs text-slate-300 font-semibold md:text-sm">
          <button 
            type="button" 
            onClick={() => setActiveTab('booking')}
            className="hover:text-teal-400 transition cursor-pointer px-1 py-0.5"
          >
            الرئيسية
          </button>
          <a href="#interactive-tools-section" className="hover:text-teal-400 transition px-1 py-0.5">خدماتنا الطبية</a>
          <a href="#interactive-tools-section" className="hover:text-teal-400 transition px-1 py-0.5">حساب التكلفة</a>
          <a href="#portal-hero" className="hover:text-teal-400 transition px-1 py-0.5">من نحن</a>
          <a href="#expert-policies" className="hover:text-teal-400 transition px-1 py-0.5">آراء المرضى</a>
          <a href="#booking-flow-cards" className="hover:text-teal-400 transition px-1 py-0.5">اتصل بنا</a>
        </nav>

        {/* Left side certification indicators */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="text-right text-xs border-r border-teal-950/40 pr-3">
            <p className="text-slate-400 text-[10px]">الدعم وبوابة الحجز الفنية</p>
            <p className="font-bold text-teal-300 font-mono">info@dawidardental.com</p>
          </div>
          <div className="bg-teal-950/40 text-teal-400 border border-teal-900/30 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>معتمد من مجلس الضمان</span>
          </div>
        </div>

      </div>

      {/* 3. DUAL ACTIVE TAB SELECTORS - For portal and bookings */}
      <div className="border-t border-teal-950/40 bg-[#020e12]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center md:justify-start gap-4">
            
            <button
              onClick={() => setActiveTab('booking')}
              className={`py-3.5 px-5 font-bold text-xs md:text-sm border-b-2 transition duration-300 flex items-center gap-1.5 cursor-pointer select-none ${
                activeTab === 'booking'
                  ? 'border-teal-400 text-teal-350 text-teal-400 bg-teal-950/20'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-slate-800'
              }`}
              id="tab-btn-booking"
            >
              <Calendar className="w-4 h-4" />
              <span>موقع العيادة الشاملة وبوابة حجز الفحوصات والمواعيد الفورية</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`py-3.5 px-5 font-bold text-xs md:text-sm border-b-2 transition duration-300 flex items-center gap-1.5 cursor-pointer select-none ${
                activeTab === 'admin'
                  ? 'border-teal-400 text-teal-350 text-teal-400 bg-teal-950/20'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-slate-800'
              }`}
              id="tab-btn-admin"
            >
              <Database className="w-4 h-4 text-teal-400" />
              <span>بوابة ربط وتكامل الـ API وإدارة الحجوزات</span>
              {todayBookingsCount > 0 && (
                <span className="mr-1 py-0.5 px-2 text-[9px] bg-teal-600 text-slate-950 rounded-full font-sans font-bold animate-pulse">
                  {todayBookingsCount}
                </span>
              )}
            </button>

          </div>
        </div>
      </div>

    </header>
  );
}
