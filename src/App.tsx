import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PatientPortal from './components/PatientPortal';
import AdminPortal from './components/AdminPortal';
import { INITIAL_SPECIALTIES, INITIAL_DOCTORS, INITIAL_BOOKINGS } from './data';
import { Specialty, Doctor, Booking, BookingStatus } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'booking' | 'admin'>('booking');
  
  // Core persistent and live lists
  const [specialties, setSpecialties] = useState<Specialty[]>(INITIAL_SPECIALTIES);
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);

  // Sync dental services (specialties) from Oracle APEX
  const syncSpecialties = () => {
    fetch('/api/external-services-test')
      .then(res => {
        if (!res.ok) throw new Error("Failed to load specialties");
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data.items)) {
          const mapped: Specialty[] = data.items.map((item: any) => ({
            id: String(item.service_id),
            name: item.service_name,
            icon: item.service_name.includes('عصب') 
              ? 'FlaskConical' 
              : item.service_name.includes('تبييض') 
                ? 'Sparkles' 
                : item.service_name.includes('تقويم') 
                  ? 'Smile' 
                  : item.service_name.includes('تنظيف') 
                    ? 'ShieldAlert' 
                    : 'Activity',
            description: `${item.service_category || 'خدمة أسنان'} • السعر: ${item.price} ج.م • المدة: ${item.duration_min} دقيقة`,
            room: 'عيادة الاستشاري د. حازم'
          }));
          setSetSpecialtiesCacheAndStore(mapped);
          console.log("[Oracle APEX Sync] Successfully synchronized specialties:", mapped);
        }
      })
      .catch(err => {
        console.warn("[Oracle APEX Sync] Failing to load specialties dynamically, using default values:", err);
      });
  };

  const setSetSpecialtiesCacheAndStore = (mapped: Specialty[]) => {
    setSpecialties(mapped);
  };

  // Sync with Express backend on component load
  const syncBookings = () => {
    fetch('/api/bookings')
      .then(res => {
        if (!res.ok) throw new Error("Network response error");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setBookings(data);
        }
      })
      .catch(err => {
        console.warn("Could not load live bookings, falling back to local state:", err);
        const saved = localStorage.getItem('dawidar_clinic_bookings');
        if (saved) {
          setBookings(JSON.parse(saved));
        }
      });
  };

  useEffect(() => {
    syncSpecialties();
    syncBookings();
    // Poll occasionally to keep live updates synced
    const interval = setInterval(() => {
      syncBookings();
      syncSpecialties();
    }, 10000); // sync specialties every 10s and bookings
    return () => clearInterval(interval);
  }, []);

  // Save back to local storage as fallback
  useEffect(() => {
    localStorage.setItem('dawidar_clinic_bookings', JSON.stringify(bookings));
  }, [bookings]);

  // Add booking queue worker with server persistence
  const addBooking = (bookingData: Omit<Booking, 'id' | 'queueNumber' | 'status' | 'createdAt'>): Booking => {
    const today = new Date().toISOString().split('T')[0];
    const sameDayBookings = bookings.filter(b => b.date === bookingData.date);
    const maxQueue = sameDayBookings.length > 0 
      ? Math.max(...sameDayBookings.map(b => b.queueNumber)) 
      : 0;
    
    const tempId = `book-temp-${Date.now()}`;
    const newBooking: Booking = {
      ...bookingData,
      id: tempId,
      status: 'waiting',
      queueNumber: maxQueue + 1,
      createdAt: new Date().toISOString(),
      isArrived: false
    };

    // Optimistically update UI
    setBookings(prev => [...prev, newBooking]);

    // Send API Post request to server
    const serviceName = specialties.find(s => s.id === bookingData.specialtyId)?.name || 'عام';
    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...bookingData,
        serviceName
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Network error on booking creation");
        return res.json();
      })
      .then(savedBooking => {
        // Swap temp booking with server-persisted booking
        setBookings(prev => prev.map(b => b.id === tempId ? savedBooking : b));

        // Automatically push data to customer's custom API if configured in localStorage
        const customApiUrl = localStorage.getItem('dawidar_custom_api_url') || 'https://oracleapex.com/ords/nerd_acc/dentaldata/dental';
        if (customApiUrl && (customApiUrl.startsWith('http://') || customApiUrl.startsWith('https://'))) {
          const serviceName = specialties.find(s => s.id === savedBooking.specialtyId)?.name || 'عام';
          fetch(customApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientName: savedBooking.patientName,
              phone: savedBooking.phone,
              gender: savedBooking.gender,
              serviceName: serviceName,
              date: savedBooking.date,
              timeSlot: savedBooking.timeSlot,
              notes: savedBooking.notes || '',
              doctorId: savedBooking.doctorId,
              status: savedBooking.status,
              isArrived: savedBooking.isArrived || false
            })
          })
            .then(res => console.log(`[Developer API Sync] Synchronized booking dynamically to custom server. HTTP status: ${res.status}`))
            .catch(err => console.warn(`[Developer API Sync] Error syncing to custom server:`, err));
        }
      })
      .catch(err => {
        console.error("Error creating booking via server API:", err);
      });

    return newBooking;
  };

  // Confirm arrival via server API (bypassing status changes with exact timestamp logging)
  const confirmArrival = (id: string) => {
    // Optimistic UI state change
    setBookings(prev => prev.map(b => {
      if (b.id === id) {
        return { 
          ...b, 
          isArrived: true, 
          arrivedAt: new Date().toISOString(),
          status: b.status === 'waiting' ? 'in-progress' : b.status 
        };
      }
      return b;
    }));

    // Post to Express Backend API /api/bookings/:id/arrive
    fetch(`/api/bookings/${id}/arrive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => {
        if (!res.ok) throw new Error("Could not confirm arrival on server");
        return res.json();
      })
      .then(result => {
        if (result.success && result.booking) {
          // Sync exact record with server details
          setBookings(prev => prev.map(b => b.id === id ? result.booking : b));
        }
      })
      .catch(err => {
        console.error("Error confirming arrival via API:", err);
        alert("فشل تأكيد الوصول في قاعدة البيانات عبر الـ API. يرجى المحاولة لاحقاً!");
      });
  };

  // Change booking status (Waiting -> In-progress -> Completed -> Cancelled)
  const updateBookingStatus = (id: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => {
      if (b.id === id) {
        return { ...b, status };
      }
      return b;
    }));

    // Post status update to server
    fetch(`/api/bookings/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
      .then(res => res.json())
      .catch(err => console.error("Error updating status via API:", err));
  };

  // Delete booking completely from database
  const deleteBooking = (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف سجل هذا الموعد نهائياً من النظام؟')) {
      // Optimistic delete
      setBookings(prev => prev.filter(b => b.id !== id));

      // Call API delete
      fetch(`/api/bookings/${id}`, {
        method: 'DELETE'
      }).catch(err => console.error("Error deleting via API:", err));
    }
  };

  // Add new clinical staff doctor
  const addDoctor = (docData: Omit<Doctor, 'id'>) => {
    const newDoc: Doctor = {
      ...docData,
      id: `doc-${Date.now()}`
    };
    setDoctors(prev => [...prev, newDoc]);
  };

  // Toggle Doctor's availability status (available, busy, on-leave)
  const updateDoctorStatus = (id: string, status: Doctor['status']) => {
    setDoctors(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, status };
      }
      return d;
    }));
  };

  // Restore factory mock data / clear database
  const resetAllData = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين كافة البيانات الافتراضية وحذف الجلسات المسجلة اليوم؟')) {
      setBookings(INITIAL_BOOKINGS);
      setDoctors(INITIAL_DOCTORS);
      localStorage.removeItem('dawidar_clinic_bookings');

      fetch('/api/bookings/reset', {
        method: 'POST'
      }).catch(err => console.error("Error resetting data via API:", err));
    }
  };

  // Calculate waiting count for today to pass to header
  const todayDate = new Date().toISOString().split('T')[0];
  const waitingTodayCount = bookings.filter(b => b.date === todayDate && b.status === 'waiting').length;

  return (
    <div className="min-h-screen bg-[#fcfdfd] text-slate-800 flex flex-col font-sans transition-colors duration-300" id="clinic-viewport">
      
      {/* Clinic Premium Header containing our luxury look/feel */}
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        todayBookingsCount={waitingTodayCount} 
      />

      {/* Main Viewport Content body container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 md:py-12">
        {activeTab === 'booking' ? (
          <PatientPortal 
            specialties={specialties} 
            doctors={doctors} 
            bookings={bookings} 
            addBooking={addBooking} 
          />
        ) : (
          <AdminPortal 
            specialties={specialties} 
            doctors={doctors} 
            bookings={bookings} 
            confirmArrival={confirmArrival}
            updateBookingStatus={updateBookingStatus} 
            deleteBooking={deleteBooking} 
            addDoctor={addDoctor} 
            updateDoctorStatus={updateDoctorStatus} 
            resetAllData={resetAllData} 
          />
        )}
      </main>

      {/* Elegant footer matching Dr. Dawidar Luxury look */}
      <footer className="bg-[#01090c] border-t border-teal-950/50 py-10 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-right">
          
          <div className="space-y-2 text-right">
            <h5 className="font-extrabold text-slate-200 text-sm">مركز دويدار التخصصي لطب الأسنان</h5>
            <p className="leading-relaxed text-slate-400">
              تحت إدارة وإشراف الاستشاري دكتور حازم دويدار، نقدم رعاية متخصصة راقية بمجال تقويم، زراعة، علاج عصب، وحشوات تجميلية للأسنان، مجهزين بأحدث وحدات معالجة وتعقيم لحماية ابتسامتك.
            </p>
          </div>

          <div className="space-y-2 border-y md:border-y-0 md:border-x border-teal-950/40 py-6 md:py-0 md:px-6 text-right">
            <h5 className="font-extrabold text-slate-200 text-sm">تواصل فوري معنا</h5>
            <p className="text-slate-400">مواعيد العمل: يومياً من 5:00 مساءً حتى 11:00 مساءً</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-400 mt-2">
              <a href="tel:+201018784470" className="hover:text-teal-400 transition font-mono">هاتف/واتساب: 01018784470 20+</a>
              <a href="https://wa.me/201018784470" target="_blank" rel="noreferrer" className="hover:text-teal-400 transition">واتساب العيادة</a>
            </div>
          </div>

          <div className="space-y-2 self-center text-center md:text-left">
            <p className="text-slate-400 text-[11px]">كافة الحقوق محفوظة © {new Date().getFullYear()} مركز دويدار لطب الأسنان.</p>
            <p className="text-[10px] text-slate-500">تم التطوير بجودة متناهية لتوافق الأنظمة الصحية الرقمية وسرعة تأكيد وصول المرضى عبر الـ API.</p>
          </div>

        </div>
      </footer>

    </div>
  );
}
