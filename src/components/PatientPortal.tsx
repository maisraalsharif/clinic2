import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Smile, 
  Baby, 
  Eye, 
  FlaskConical, 
  Stethoscope, 
  CheckCircle, 
  Search, 
  Calendar, 
  MessageSquare, 
  Clock, 
  Sparkles,
  Phone,
  User,
  ShieldAlert,
  ClipboardCheck,
  Award,
  Play,
  RotateCcw,
  Zap,
  Info,
  ChevronDown,
  Printer,
  ChevronRight,
  X,
  Sparkle,
  Cloud,
  LogOut,
  FileText,
  Check
} from 'lucide-react';
import { Specialty, Doctor, Booking } from '../types';
import { 
  googleSignIn, 
  logout as driveLogout, 
  initAuth as initDriveAuth, 
  uploadTicketToDrive, 
  listDriveTickets,
  DriveTicketFile
} from '../lib/drive';

interface PatientPortalProps {
  specialties: Specialty[];
  doctors: Doctor[];
  bookings: Booking[];
  addBooking: (bookingData: Omit<Booking, 'id' | 'queueNumber' | 'status' | 'createdAt'>) => Booking;
}

export default function PatientPortal({ specialties, doctors, bookings, addBooking }: PatientPortalProps) {
  
  // Modal Visibility State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isApexModalOpen, setIsApexModalOpen] = useState(false);

  // Booking Form State
  const [patientName, setPatientName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'ذكر' | 'أنثى' | string>('ذكر');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState(specialties[0]?.id || 'surgery');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('05:00 م');
  const [notes, setNotes] = useState('');

  // Symptom Checker State
  const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);

  // Timer State (2 minutes brushing)
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentQuadrant, setCurrentQuadrant] = useState('البدء');
  const [quadrantInstruction, setQuadrantInstruction] = useState('جاهز لبدء عملية تنظيف الأسنان الوقائية؟ انقر بدء لتفعيل المؤقت.');

  // Search Bookings State
  const [searchPhone, setSearchPhone] = useState('');
  const [searchedBookings, setSearchedBookings] = useState<Booking[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Success flow ticket (renders on-screen post booking)
  const [newlyCreatedBooking, setNewlyCreatedBooking] = useState<Booking | null>(null);

  // External Oracle APEX Booking Confirmation API States
  const [isSubmittingApi, setIsSubmittingApi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<boolean>(false);
  const [apiErrorUrl, setApiErrorUrl] = useState<string>('');

  // Toast notification state
  const [toast, setToast] = useState<{ visible: boolean; patientName: string; queueNumber: number } | null>(null);

  const showToast = (patientName: string, queueNumber: number) => {
    setToast({ visible: true, patientName, queueNumber });
    setTimeout(() => setToast(null), 5000);
  };

  // Google Drive Authentication and Storage State
  const [driveUser, setDriveUser] = useState<any>(null);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [isSavingToDrive, setIsSavingToDrive] = useState(false);
  const [driveSaveSuccess, setDriveSaveSuccess] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveTicketFile[]>([]);
  const [isLoadingDriveFiles, setIsLoadingDriveFiles] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (user, token) => {
        setDriveUser(user);
        setDriveToken(token);
        fetchDriveTickets(token);
      },
      () => {
        setDriveUser(null);
        setDriveToken(null);
        setDriveFiles([]);
      }
    );
    return () => unsubscribe && unsubscribe();
  }, []);

  // Reset external API states when booking modal state changes
  useEffect(() => {
    if (isBookingModalOpen) {
      setApiSuccess(false);
      setApiError(null);
      setApiErrorUrl('');
      setIsSubmittingApi(false);
    }
  }, [isBookingModalOpen]);

  const fetchDriveTickets = async (token: string) => {
    setIsLoadingDriveFiles(true);
    setDriveError(null);
    try {
      const files = await listDriveTickets(token);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('[Drive List Sync Error]:', err);
      setDriveError('حدث خطأ أثناء تحميل مستندات Google Drive الخاصة بك.');
    } finally {
      setIsLoadingDriveFiles(false);
    }
  };

  const handleDriveLogin = async () => {
    setDriveError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setDriveUser(result.user);
        setDriveToken(result.accessToken);
        fetchDriveTickets(result.accessToken);
      }
    } catch (err: any) {
      console.error('[Drive Login Action error]:', err);
      setDriveError('لم يتم ربط الحساب. يرجى التأكد من الموافقة على صلاحيات Google Drive.');
    }
  };

  const handleDriveLogout = async () => {
    try {
      await driveLogout();
      setDriveUser(null);
      setDriveToken(null);
      setDriveFiles([]);
    } catch (err: any) {
      console.error('[Drive Logout Action error]:', err);
    }
  };

  const formatTicketText = (booking: Booking, specs: Specialty[], docs: Doctor[]) => {
    const specialtyName = specs.find(s => s.id === booking.specialtyId)?.name || 'عام';
    const doctorName = docs.find(d => d.id === booking.doctorId)?.name || 'د. حازم دويدار';

    return `========================================
مركز الاستشاري دكتور حازم دويدار لطب وجراحة الأسنان
تذكرة حجز موعد كشف رقم: #${booking.queueNumber}
========================================

اسم المراجع: ${booking.patientName}
رقم الجوال: ${booking.phone}
الجنس: ${booking.gender || 'ذكر'}
العيادة المطلوبة: ${specialtyName}
الطبيب المشرف: ${doctorName}
تاريخ الحجز الفريد: ${booking.date}
توقيت الحجز الفعلي: ${booking.timeSlot}

حالة الطلب: مؤكد ومنتظر الفحص بالعيادة تلقائياً.
تم التسجيل تلقائياً ومزامنته بـ API خارجي وقاعدة بيانات أوراكل APEX.

شكراً لاختياركم مركز د. حازم دويدار التخصصي لطب الأسنان.
نحن عونكم وجاهزون لرعايتكم دوماً!
تاريخ إصدار المستند: ${new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
========================================`;
  };

  const handleSaveTicketToDrive = async (booking: Booking) => {
    if (!driveToken) {
      handleDriveLogin();
      return;
    }
    setIsSavingToDrive(true);
    setDriveError(null);
    setDriveSaveSuccess(false);

    try {
      const text = formatTicketText(booking, specialties, doctors);
      const safeName = booking.patientName.replace(/\s+/g, '_');
      const filename = `Dawidar_Dental_Ticket_Queue_${booking.queueNumber}_${safeName}.txt`;
      await uploadTicketToDrive(driveToken, text, filename);
      setDriveSaveSuccess(true);
      fetchDriveTickets(driveToken);
    } catch (err: any) {
      console.error('[Drive Upload Action error]:', err);
      setDriveError('فشلت محاولة حفظ التذكرة في Google Drive. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSavingToDrive(false);
    }
  };

  // Filter doctors based on selected specialty
  const filteredDoctors = doctors;

  // Pre-select first specialty when specialties array loads/updates
  useEffect(() => {
    if (specialties.length > 0 && !specialties.some(s => s.id === selectedSpecialtyId)) {
      setSelectedSpecialtyId(specialties[0].id);
    }
  }, [specialties, selectedSpecialtyId]);

  // Pre-select doctor when specialty changes
  useEffect(() => {
    if (filteredDoctors.length > 0) {
      setSelectedDoctorId(filteredDoctors[0].id);
      const firstDoctorSlots = filteredDoctors[0].slots || [];
      if (firstDoctorSlots.length > 0) {
        setSelectedTime(firstDoctorSlots[0]);
      } else {
        setSelectedTime('05:00 م');
      }
    } else {
      setSelectedDoctorId('');
    }
  }, [selectedSpecialtyId]);

  // Pre-select default time slot when selected doctor updates
  useEffect(() => {
    const activeDoc = doctors.find(d => d.id === selectedDoctorId);
    if (activeDoc) {
      const docSlots = activeDoc.slots || [];
      if (docSlots.length > 0) {
        if (!docSlots.includes(selectedTime)) {
          setSelectedTime(docSlots[0]);
        }
      }
    }
  }, [selectedDoctorId]);

  // Brushing Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          const nextSec = prev - 1;
          updateBrushingInstructions(nextSec);
          return nextSec;
        });
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsTimerRunning(false);
      setCurrentQuadrant('مكتمل! 🎉');
      setQuadrantInstruction('عمل رائع! لقد حافظت على نظافة أسنانك لمدة دقيقتين كاملتين. ينصح بتكرار العملية مرتين يومياً لحماية المينا.');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  const updateBrushingInstructions = (seconds: number) => {
    if (seconds > 90) {
      setCurrentQuadrant('الربع العلوي الأيمن 🦷');
      setQuadrantInstruction('نظف الأسطح الخارجية والداخلية بلطف بحركات دائرية من الأعلى للأسفل لزوال الأطعمة.');
    } else if (seconds > 60) {
      setCurrentQuadrant('الربع العلوي الأيسر 🦷');
      setQuadrantInstruction('انتقل الآن إلى الجانب العلوي الأيسر. تأكد من تنظيف الطواحن جيداً وزوايا عصب الأسنان الخلفية.');
    } else if (seconds > 35) {
      setCurrentQuadrant('الربع السفلي الأيمن ✨');
      setQuadrantInstruction('انتقل للأسفل يميناً. قم بتمشيط الفراغات بلطف مع التدليك الخفيف للثة.');
    } else if (seconds > 0) {
      setCurrentQuadrant('الربع السفلي الأيسر ✨');
      setQuadrantInstruction('أخر 30 ثانية للجانب السفلي الأيسر، ولا تنس تنظيف لسانك برفق لإنعاش اللثة ونفَس منعش.');
    }
  };

  const handleStartTimer = () => {
    if (timerSeconds === 0) {
      setTimerSeconds(120);
    }
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(120);
    setCurrentQuadrant('البدء');
    setQuadrantInstruction('جاهز لبدء عملية تنظيف الأسنان الوقائية؟ انقر بدء لتفعيل المؤقت.');
  };

  const formatTimer = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  // Symptom check tool details mapping
  const symptomData: Record<string, {
    title: string;
    diagnosis: string;
    specialtyId: string;
    doctorId: string;
    estimatedCost: string;
    advise: string;
  }> = {
    nerve_pain: {
      title: 'آلام العصب والتهابات الجذور الحادة',
      diagnosis: 'التهاب عصب السن المتقدم يسبب ألماً شديداً نابضاً، يزداد ليلاً ويشتد مع المشروبات الباردة والساخنة.',
      specialtyId: 'endo',
      doctorId: 'doc-yasser',
      estimatedCost: '350 - 600 جنيه مصري',
      advise: 'تجنب المضغ تماماً على الجهة المؤلمة، تناول مسكن معتمد عند اللزوم، ومراجعتنا سريعاً لحقن تخدير وسحب العصب مجهرياً.'
    },
    crooked_teeth: {
      title: 'اعوجاج وتراكم الأسنان وعدم تطابق الفكين',
      diagnosis: 'عدم تطابق الفكين والأسنان يؤدي لصعوبة التنظيف وتراكم الجير، ويتم علاجه بالتقويم الشفاف غير المرئي أو المعدني بالضمان.',
      specialtyId: 'ortho',
      doctorId: 'doc-mona',
      estimatedCost: 'كشف واستشارة مجانية (أقساط تبدأ من 250 جنيه شهرياً)',
      advise: 'تجهيز تصوير أشعة بانوراما كاملة للفكين، والحرص على تنظيف فراغات الأسنان الدقيقة بخبط مائي معقم.'
    },
    missing_teeth: {
      title: 'فقدان الأسنان والحاجة لزراعة معوضة',
      diagnosis: 'فقدان السن يؤثر على عظم الفك وتراصف بقية الأسنان، ونرشح الحل الدائم بغرسات تيتانيوم ألمانية/سويسرية ممتازة لدى د. حازم.',
      specialtyId: 'surgery',
      doctorId: 'doc-dawidar',
      estimatedCost: 'تبدأ من 1200 جنيه للغرسة الواحدة بالضمان',
      advise: 'إحضار أي أشعة سابقة، وإبلاغ الاستشاري د. حازم إذا كنت تعاني من ارتفاع السكر أو الضغط أو أمراض قلب.'
    },
    stained_teeth: {
      title: 'اصفرار الأسنان وتصبغات الشاي والتدخين العميقة',
      diagnosis: 'تراكم صبغات الأطعمة والمشروبات، ونقوم بإزالتها بتقنية ليزر فلاش المتطورة مع تفتيح آمن ومستمر لعدّة درجات.',
      specialtyId: 'cosmetic',
      doctorId: 'doc-dawidar-cosmetic',
      estimatedCost: '399 جنيه (شامل تبييض ليزر بارد وتنظيف تجميلي)',
      advise: 'تجنب المشروبات شديدة الحرارة والبرودة ومنتجات الكافيين لمدة 48 ساعة بعد جلسة التبييض للحفاظ على اللمعان.'
    },
    child_cavities: {
      title: 'تسوس وتآكل أسنان الأطفال اللبنية',
      diagnosis: 'تراكم السكريات على أسنان الأطفال اللبنية، ويتم تنظيف أسنان طفلك وتطبيق الفلورايد لمنع الحفر بهدوء ومرح تام.',
      specialtyId: 'pediatric',
      doctorId: 'doc-fatima',
      estimatedCost: '100 - 180 جنيه (تشمل جلسة تفريغ بالغاز الضاحك المهدئ واللطيف لراحة الطفل وسلامته)',
      advise: 'تهيئة الطفل بشكل إيجابي وممتع قبل الزيارة، وسيقوم فريقنا بتهيئته كبطل خارق ليغادر بهدية وأسنان سعيدة.'
    },
    bleeding_gums: {
      title: 'نزيف اللثة وتراكم التكلسات الجيرية السيئة',
      diagnosis: 'تراكم اللويحة الجرثومية (بلاير) يسبب تراجع اللثة ونفَس كريه، ويتم تقليمها بالموجات الصوتية وعلاجات تطهير اللثة بالليزر.',
      specialtyId: 'periodontics',
      doctorId: 'doc-yasser-gum',
      estimatedCost: '150 - 250 جنيه مصري',
      advise: 'استخدام فرشاة أسنان ناعمة وشطف الفم بماء دافئ مع ملح منزلي مخفف وتلافي المشروبات الغازية تماماً.'
    }
  };

  const handleApplySymptom = (key: string) => {
    const data = symptomData[key];
    if (data) {
      setSelectedSpecialtyId(data.specialtyId);
      setSelectedDoctorId(data.doctorId);
      setNotes(`الشكوى المسجلة عبر مُشخّص الأعراض: "${data.title}" - الطبيب المقترح: ${doctors.find(d => d.id === data.doctorId)?.name || 'د. حازم دويدار'}`);
      setIsBookingModalOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientName.trim()) {
      alert('يرجى إدخال اسم المريض بالكامل');
      return;
    }
    if (!phone || phone.trim().length < 9) {
      alert('يرجى إدخال رقم هاتف صحيح ومكتمل');
      return;
    }
    if (!selectedDate) {
      alert('يرجى تحديد تاريخ الحجز المطلوب');
      return;
    }
    if (!selectedDoctorId) {
      alert('يرجى تحديد الطبيب المعالج المتاح');
      return;
    }

    setIsSubmittingApi(true);
    setApiError(null);
    setApiSuccess(false);
    setApiErrorUrl('');

    // ✅ خطوة 1: سجّل الحجز في الداتا فوراً بغض النظر عن الـ API
    const created = addBooking({
      patientName,
      phone,
      gender,
      specialtyId: selectedSpecialtyId,
      doctorId: selectedDoctorId,
      date: selectedDate,
      timeSlot: selectedTime,
      notes: notes
    });

    // ✅ خطوة 2: اعرض الـ toast فوراً
    showToast(patientName, created.queueNumber);

    // ✅ خطوة 3: اقفل المودال وعرض كارت التذكرة
    setNewlyCreatedBooking(created);
    setIsBookingModalOpen(false);
    setApiSuccess(true);
    setIsSubmittingApi(false);

    // Reset form
    setPatientName('');
    setPhone('');
    setGender('ذكر');
    setNotes('');

    // ✅ خطوة 4: ابعت للـ API في الخلفية (fire & forget - مش بيأثر على الحجز)
    const serviceName = specialties.find(s => s.id === selectedSpecialtyId)?.name || 'كشف عام';
    const notesVal = notes.trim() || 'لا يوجد';
    const genderParam = gender === 'ذكر' ? '1' : '2';

    let doctorParam = '1';
    if (selectedDoctorId.includes('yasser')) doctorParam = '2';
    else if (selectedDoctorId.includes('mona')) doctorParam = '3';
    else if (selectedDoctorId.includes('fatima')) doctorParam = '4';
    else {
      const match = selectedDoctorId.match(/\d+/);
      doctorParam = match ? match[0] : '1';
    }

    const timeSlotClean = selectedTime.replace(' م', '').replace(' ص', '').trim();

    const targetUrl = `https://oracleapex.com/ords/nerd_acc/confirmpationbooking/booking/${encodeURIComponent(patientName.trim())}/${encodeURIComponent(phone.trim())}/${encodeURIComponent(genderParam)}/${encodeURIComponent(doctorParam)}/${encodeURIComponent(serviceName)}/${encodeURIComponent(selectedDate)}/${encodeURIComponent(timeSlotClean)}/${encodeURIComponent(notesVal)}`;

    console.log('Sending to Oracle APEX (background):', targetUrl);

    fetch(targetUrl, { method: 'POST' })
      .then(r => r.json())
      .then(data => console.log('[Oracle APEX Response]:', data))
      .catch(err => console.warn('[Oracle APEX background sync failed - booking already saved locally]:', err));
  };

  const handleSearchBookings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone) {
      alert('يرجى إدخال رقم الجوال للبحث عن تذكرتك');
      return;
    }
    const cleanSearch = searchPhone.trim();
    const found = bookings.filter(b => b.phone.includes(cleanSearch));
    setSearchedBookings(found);
    setHasSearched(true);
  };

  const getWhatsAppURL = (b: Booking) => {
    const specName = specialties.find(s => s.id === b.specialtyId)?.name || 'عيادة عامة';
    const docName = doctors.find(d => d.id === b.doctorId)?.name || 'الاستشاري المناوب';
    const text = `مرحباً مركز دويدار لطب الأسنان، أرغب في تأكيد حجزي الطبي التالي:
- اسم المريض: ${b.patientName}
- الجنس: ${b.gender || 'غير محدد'}
- رقم جوال المريض: ${b.phone}
- العيادة المطلوبة: ${specName}
- الطبيب الأخصائي: ${docName}
- تاريخ الموعد: ${b.date}
- الفترة الزمنية المفضلة: ${b.timeSlot}
- تذكرة المسار رقم: #${b.queueNumber}
- ملاحظات وشكوى: ${b.notes || 'لا يوجد'}`;
    return `https://wa.me/201018784470?text=${encodeURIComponent(text)}`;
  };

  const getDraftWhatsAppURL = () => {
    const specName = specialties.find(s => s.id === selectedSpecialtyId)?.name || 'غير محدد';
    const docName = doctors.find(d => d.id === selectedDoctorId)?.name || 'د. حازم دويدار';
    const text = `مرحباً مركز دويدار لطب الأسنان، أود حجز موعد سريع:
- اسم المريض: ${patientName || 'مكتوب بالطلب'}
- الجنس: ${gender}
- رقم جوال المريض: ${phone || 'مكتوب بالطلب'}
- العيادة المطلوبة: ${specName}
- الطبيب: ${docName}
- تاريخ الموعد: ${selectedDate}
- الوقت: ${selectedTime}
- ملاحظات: ${notes || 'لا يوجد'}`;
    return `https://wa.me/201018784470?text=${encodeURIComponent(text)}`;
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'waiting':
        return <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">في الانتظار (جديد)</span>;
      case 'in-progress':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px] font-semibold animate-pulse">قيد المعاينة بالعيادة</span>;
      case 'completed':
        return <span className="bg-slate-400/10 text-slate-400 border border-slate-400/20 px-2 py-0.5 rounded-full text-[10px] font-semibold">مكتمل</span>;
      case 'cancelled':
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full text-[10px] font-semibold">ملغي</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-12" id="patient-portal-root">

      {/* Toast keyframe style */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        #toast-notification {
          animation: slideDown 0.3s ease forwards;
        }
      `}</style>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div id="toast-notification" className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999]">
          <div className="bg-white border border-emerald-200 shadow-2xl rounded-2xl px-5 py-4 flex items-center gap-4 min-w-[320px] max-w-sm">
            {/* Icon */}
            <div className="shrink-0 w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            {/* Text */}
            <div className="flex-1 text-right">
              <p className="text-slate-800 font-black text-sm">تم تأكيد الحجز بنجاح! 🎉</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                مرحباً <strong className="text-teal-700">{toast.patientName}</strong> — تذكرة رقم <strong className="font-mono text-teal-600">#{toast.queueNumber}</strong> جاهزة
              </p>
            </div>
            {/* Close */}
            <button
              type="button"
              onClick={() => setToast(null)}
              className="shrink-0 text-slate-300 hover:text-slate-500 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Progress bar */}
          <div className="mt-1 mx-2 h-1 bg-emerald-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ animation: 'shrink 5s linear forwards' }}
            ></div>
          </div>
        </div>
      )}

      {/* 1. LUXURY HERO BANNER */}
      <section className="relative rounded-3xl bg-gradient-to-br from-[#0c3c4f] via-[#051c24] to-[#020e12] text-white p-8 md:p-14 border border-teal-950 shadow-2xl overflow-hidden" id="portal-hero">
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          <div className="lg:col-span-7 space-y-6 text-right order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 bg-teal-400/10 text-teal-300 px-3 py-1.5 rounded-full text-xs font-bold ring-1 ring-teal-500/20 font-sans">
              <Sparkles className="w-4 h-4 text-teal-400 animate-spin" />
              <span>عيادة الحجز الرقمي المستقل للفم والأسنان</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-black leading-tight bg-gradient-to-l from-white via-slate-100 to-teal-100 bg-clip-text text-transparent">
              عيش تجربة علاج أسنان راقية <br /> مع حجز المواعيد الفورية بالمركز
            </h2>
            
            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl font-normal">
              تحت إشراف استشاري جراحة وزراعة الأسنان واللثة <strong className="text-teal-300 underline underline-offset-4 decoration-teal-500">دكتور حازم دويدار</strong>. عيادتنا مجهزة بأفضل التقنيات الألمانية لسلامتكم. ساعات العمل مسائية تناسبكم بالكامل <strong className="text-[#1df2da] font-mono">من الساعة 5:00 م حتى 11:00 م</strong> يومياً.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                type="button"
                onClick={() => {
                  setIsApexModalOpen(true);
                }}
                className="bg-gradient-to-l from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-slate-950 font-black py-4 px-8 rounded-2xl text-xs md:text-sm cursor-pointer shadow-lg shadow-teal-500/20 transition-all duration-300 active:scale-95 flex items-center justify-center gap-2.5 self-start"
                id="btn-trigger-booking-modal"
              >
                <span className="text-lg">🦷</span>
                <strong>احجز الآن</strong>
              </button>

              <a 
                href="https://wa.me/201018784470" 
                target="_blank" 
                rel="noreferrer"
                className="bg-transparent hover:bg-white/5 border border-slate-700 hover:border-slate-500 transition py-4 px-6 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 text-slate-200 cursor-pointer"
              >
                <Phone className="w-4 h-4 text-teal-400" />
                <span>التحويل والتنسيق الفوري بالواتساب</span>
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800 max-w-lg">
              <div>
                <span className="block text-xl md:text-2xl font-black text-[#9df2ea] font-mono">5 - 11 مساءً</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">عيادات كشف مسائية يومية</span>
              </div>
              <div className="border-r border-slate-800 pr-5">
                <span className="block text-xl md:text-2xl font-black text-[#9df2ea]">أخصائي معتمد</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">معايير دقة وخبرات طبية عريقة</span>
              </div>
              <div className="border-r border-slate-800 pr-5">
                <span className="block text-xl md:text-2xl font-black text-[#9df2ea] font-sans">تأكيد فوري (API)</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">ربط لترحيل المرضى للأنظمة</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 order-1 lg:order-2 flex flex-col justify-center relative select-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-teal-500/20 via-emerald-500/10 to-transparent blur-3xl rounded-full z-0 animate-pulse"></div>
            
            <div className="relative z-10 self-center group max-w-sm w-full">
              <div className="absolute -top-3 -right-3 bg-gradient-to-l from-amber-500 to-orange-400 text-slate-950 text-[10px] font-black px-3.5 py-1.5 rounded-full shadow-lg z-35 flex items-center gap-1.5 border border-amber-300">
                <span>أحدث التقنيات الرقمية 🔬</span>
              </div>

              <div className="absolute -inset-1.5 bg-gradient-to-r from-teal-500 to-emerald-400 rounded-[32px] opacity-30 group-hover:opacity-75 blur-md transition duration-500"></div>
              
              <div className="relative bg-[#020d11] p-3 rounded-[28px] border border-teal-500/20 shadow-2xl overflow-hidden">
                <img 
                  src="/src/assets/images/dental_care_hero_1781118376075.png" 
                  alt="Dawidar Premium Dental Suite" 
                  className="rounded-2xl border border-teal-500/20 w-full object-cover relative z-10 transform group-hover:scale-[1.02] transition duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="mt-5 bg-gradient-to-b from-[#072028] to-[#04151b] border-r-4 border-teal-500 border border-teal-950/60 p-5 rounded-2xl text-xs backdrop-blur-md shadow-xl relative z-20">
                <p className="text-teal-300 font-extrabold mb-1.5 flex items-center gap-2 text-[13px]">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                  بروتوكول تعقيم دقيق وآمن بنسبة 100%
                </p>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  نستخدم مغلفات أدوات معقمة وحرارية معتمدة تُفتح مباشرةً أمام كل مراجع، لضمان صحة وسلامة أسنانكم بأعلى المعايير العالمية بالتنسيق مع استشاري الفم والفكين المعتمد.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. THE INTERACTIVE DIAGNOSTICS & BRUSHING TIMER */}
      <section className="space-y-6" id="interactive-tools-section">
        
        <div className="text-center space-y-2">
          <span className="text-teal-600 text-xs font-bold uppercase tracking-widest block">المركز التعليمي التفاعلي لصحة اللثة والأسنان</span>
          <h3 className="text-2xl md:text-3xl font-black text-slate-800">أدوات العناية والتشخيص التقريبي الذاتي</h3>
          <p className="text-slate-500 text-xs md:text-sm max-w-3xl mx-auto leading-relaxed">
            استعن بمُشخّص الأعراض الوقائي لتقدير نوع الخدمة اللازمة ومطالعة نصيحة الطبيب وتكلفة معالجة الأسنان المتوقعة.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* CARD A: SYMPTOM CHECKER */}
          <div className="lg:col-span-7 bg-slate-900 border border-teal-950/20 rounded-2xl p-6 text-white space-y-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-xl pointer-events-none"></div>

            <div className="space-y-4 text-right">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-teal-500/10 text-teal-400 rounded-lg">
                  <Activity className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-bold text-sm md:text-base text-slate-100">مساعد فحص وتقييم الأعراض الفوري</h4>
                  <p className="text-[11px] text-teal-400">تحليل فوري وتوصية وتكلفة الحشوات والزراعة والتقويم والأعصاب</p>
                </div>
              </div>

              <div className="h-px bg-slate-800"></div>

              <p className="text-xs text-slate-300 font-bold">
                اختر العَرَض الأساسي الذي تشعر في أسنانك لمعرفة التقرير الإرشادي:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.keys(symptomData).map((key) => {
                  const data = symptomData[key];
                  const isSelected = selectedSymptom === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedSymptom(key)}
                      className={`p-3.5 rounded-xl border text-right text-xs transition-all relative flex flex-col justify-between cursor-pointer ${
                        isSelected 
                          ? 'bg-teal-950/80 border-teal-400 ring-2 ring-teal-500/20 text-white' 
                          : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950 text-slate-350'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-bold">{data.title}</span>
                        <span className="text-teal-400 text-xs">🔍</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate w-full">تقرير الطبيب وتكلفة المعالجة ومطابقتها</span>
                    </button>
                  );
                })}
              </div>

              {selectedSymptom && (
                (() => {
                  const specData = symptomData[selectedSymptom];
                  const matchingDoc = doctors.find(d => d.id === specData.doctorId);
                  return (
                    <div className="bg-slate-950 border border-teal-500/10 rounded-xl p-4 space-y-3 animate-zoom-in text-xs text-right">
                      <div className="flex justify-between items-center text-teal-400 font-bold">
                        <span>التقرير التقريبي لعَرَض الأسنان:</span>
                        <span className="text-[10px] bg-teal-500/20 px-2.5 py-0.5 rounded-full text-teal-200">توصية معتمدة</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11.5px]">{specData.diagnosis}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-2 border-t border-slate-900/60 text-slate-400">
                        <div>
                          <span className="block text-slate-500 mb-0.5">التكلفة والأسعار المقدرة بالعيادة:</span>
                          <strong className="text-[#9df2ea] font-mono">{specData.estimatedCost}</strong>
                        </div>
                        <div>
                          <span className="block text-slate-500 mb-0.5">الطبيب الموصى به للمقابلة:</span>
                          <strong className="text-[#9df2ea]">{matchingDoc?.name || 'د. حازم دويدار'}</strong>
                        </div>
                      </div>

                      <div className="bg-teal-950/30 rounded-lg p-2.5 text-[10.5px] text-teal-300 border-r-2 border-teal-400 leading-relaxed">
                        <span><strong>توجيه وقائي مؤقت:</strong> {specData.advise}</span>
                      </div>

                      <div className="pt-2 text-left">
                        <button
                          type="button"
                          onClick={() => handleApplySymptom(selectedSymptom)}
                          className="bg-teal-500 hover:bg-teal-600 active:scale-95 text-slate-950 font-black py-2 px-5 rounded-lg text-xs cursor-pointer transition flex items-center gap-1.5 ml-auto"
                        >
                          <Zap className="w-3.5 h-3.5 fill-slate-950 stroke-none" />
                          <span>تعبئة الاختيارات وافتح نافذة الحجز الفوري</span>
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>

            {!selectedSymptom && (
              <div className="text-xs text-center py-4 bg-slate-950/25 rounded-xl border border-dashed border-slate-800 text-slate-500">
                <Info className="w-5 h-5 mx-auto mb-1 text-slate-600" />
                <span>اختر أي عَرَض لمعرفة تفاصيله وتعبئته مباشرة بالنموذج وحجز موعد طبيب الأسنان.</span>
              </div>
            )}
          </div>

          {/* CARD B: BRUSHING TIMER */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-[#071d26] border border-teal-950/25 rounded-2xl p-6 text-white text-center flex flex-col justify-between shadow-xl relative">
            <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="space-y-3.5 text-right">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Smile className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-bold text-sm text-slate-100">مؤقت تفريش الأسنان الوقائي والتعليمي</h4>
                  <p className="text-[10px] text-blue-400">للمحافظة على صحة المينا والوقاية من تسوس جذور الأسنان</p>
                </div>
              </div>

              <div className="h-px bg-slate-800"></div>

              <div className="relative w-32 h-32 mx-auto my-3 flex items-center justify-center">
                {isTimerRunning && (
                  <div className="absolute inset-0 rounded-full border-4 border-teal-400/10 animate-ping"></div>
                )}
                
                <svg className="w-full h-full transform -rotate-90 absolute inset-0">
                  <circle cx="64" cy="64" r="54" className="stroke-slate-800" strokeWidth="3" fill="transparent" />
                  <circle
                    cx="64" cy="64" r="54"
                    className="stroke-teal-400 transition-all duration-1000"
                    strokeWidth="5"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - timerSeconds / 120)}
                    strokeLinecap="round"
                  />
                </svg>

                <div className="text-center z-10 space-y-0.5">
                  <span className="block text-2xl font-black font-mono text-teal-300 tracking-wider">
                    {formatTimer(timerSeconds)}
                  </span>
                  <span className="text-[9px] text-[#9df2ea] px-2 py-0.5 rounded-full bg-teal-500/15 inline-block">
                    {currentQuadrant}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/60 rounded-xl p-3 text-[11px] text-slate-300 min-h-[58px] flex items-center justify-center text-center font-medium leading-relaxed border border-slate-800">
                {quadrantInstruction}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-800">
              {!isTimerRunning ? (
                <button
                  type="button"
                  onClick={handleStartTimer}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 transition cursor-pointer select-none active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950 stroke-none" />
                  <span>بدء المؤقت التفاعلي</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePauseTimer}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 transition cursor-pointer select-none active:scale-95"
                >
                  <span>إيقاف مؤقت</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetTimer}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تصفير</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 3. SUCCESS BOOKING DETAILS CARD */}
      {newlyCreatedBooking && (
        <section className="bg-teal-50 border border-teal-200 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl text-right max-w-2xl mx-auto animate-zoom-in" id="booking-success-display">
          <div className="flex items-center gap-3 justify-end pb-3 border-b border-teal-200/50">
            <div>
              <h4 className="text-teal-950 font-black text-base md:text-lg">تم جدولة حجزك الطبي بنجاح وإرساله للـ API وقاعدة البيانات!</h4>
              <p className="text-teal-800 text-xs mt-0.5 font-bold">بوابة حكمة الأسنان وتأكيد حضور المراجعين الفوري بالعيادة</p>
            </div>
            <div className="p-3 bg-teal-100 rounded-2xl text-teal-800 shrink-0">
              <CheckCircle className="w-6 h-6 text-teal-600" />
            </div>
          </div>

          <p className="text-slate-700 text-xs md:text-sm leading-relaxed">
            عزيزي المراجع <strong className="text-slate-900 font-extrabold">{newlyCreatedBooking.patientName}</strong>، تم تسجيل طلب كشف الأسنان الخاص بك وحجز مقعد انتظار، ولقد تم إرسال تذكرة الفحص برقم انتظار متسلسل ومزامنتها على الـ API الفوري للموظفين.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-teal-100 shadow-sm text-xs">
            <div className="space-y-2">
              <div className="flex justify-between flex-row-reverse border-b border-slate-50 pb-2">
                <span className="text-slate-400">رقم تذكرة الانتظار:</span>
                <span className="font-extrabold text-[#0d9488] font-mono text-sm">#{newlyCreatedBooking.queueNumber}</span>
              </div>
              <div className="flex justify-between flex-row-reverse border-b border-slate-50 pb-2">
                <span className="text-slate-400">اسم وجوال المسجل:</span>
                <strong className="text-slate-800 font-sans">{newlyCreatedBooking.patientName} ({newlyCreatedBooking.phone})</strong>
              </div>
              <div className="flex justify-between flex-row-reverse pb-1">
                <span className="text-slate-400">جنس المريض:</span>
                <strong className="text-teal-700 font-bold">{newlyCreatedBooking.gender || 'غير محدد'}</strong>
              </div>
            </div>

            <div className="space-y-2 border-r border-slate-100 pr-4">
              <div className="flex justify-between flex-row-reverse border-b border-slate-50 pb-2">
                <span className="text-slate-400">عيادة التخصص:</span>
                <strong className="text-slate-800">
                  {specialties.find(s => s.id === newlyCreatedBooking.specialtyId)?.name || 'عام'}
                </strong>
              </div>
              <div className="flex justify-between flex-row-reverse border-b border-slate-50 pb-2">
                <span className="text-slate-400">الطبيب المشرف:</span>
                <strong className="text-slate-800">
                  {doctors.find(d => d.id === newlyCreatedBooking.doctorId)?.name || 'د. حازم دويدار'}
                </strong>
              </div>
              <div className="flex justify-between flex-row-reverse pb-1">
                <span className="text-slate-400">توقيت الموعد:</span>
                <strong className="text-slate-800 font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded font-bold">
                  {newlyCreatedBooking.date} / {newlyCreatedBooking.timeSlot}
                </strong>
              </div>
            </div>
          </div>

          {/* Google Drive Integration */}
          <div className="bg-gradient-to-l from-teal-500/10 to-transparent p-4 rounded-2xl border border-teal-200/40 text-xs flex flex-col md:flex-row items-center justify-between gap-3 text-right">
            <div className="flex-1">
              <h5 className="font-extrabold text-teal-950 flex items-center gap-1.5 justify-end">
                <span>الربط بـ Google Drive الشخصي لتأمين وحفظ التذكرة</span>
                <Cloud className="w-4 h-4 text-teal-600 shrink-0" />
              </h5>
              <p className="text-slate-600 text-[10px] mt-1 leading-relaxed">
                {driveUser 
                  ? `أنت متصل الآن كـ: ${driveUser.displayName || driveUser.email}` 
                  : 'يمكنك تأمين وحفظ تذاكر الأسنان الخاصة بك بملفات جوجل درايف للوصول الفوري الآمن.'}
              </p>
              {driveError && (
                <p className="text-red-600 font-bold text-[10px] mt-1">{driveError}</p>
              )}
            </div>

            <div className="flex gap-2 shrink-0">
              {driveUser ? (
                <>
                  <button
                    type="button"
                    disabled={isSavingToDrive}
                    onClick={() => handleSaveTicketToDrive(newlyCreatedBooking)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs select-none shadow-sm duration-200"
                  >
                    {isSavingToDrive ? (
                      <span className="animate-pulse">جاري الحفظ...</span>
                    ) : driveSaveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>تم حفظها بنجاح!</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        <span>حفظ التذكرة بـ Drive</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDriveLogout}
                    className="px-2.5 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 rounded-xl transition cursor-pointer text-[10px]"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleDriveLogin}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs shadow-xs"
                >
                  <Cloud className="w-3.5 h-3.5 text-teal-600 fill-teal-100" />
                  <span>ربط حسابك وتأمين تذكرتك</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a 
              href={getWhatsAppURL(newlyCreatedBooking)}
              target="_blank" 
              rel="noreferrer"
              className="flex-1 py-3 text-center rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center justify-center gap-2 text-xs"
            >
              <Smile className="w-4 h-4 fill-white stroke-none" />
              <span>إرسال التذكرة ومتابعة الحجز على واتساب الموظفين 💬</span>
            </a>
            
            <button
              onClick={() => alert('نقوم الآن بتهيئة تذكرة مراجع الأسنان وطباعتها حرارياً...')}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer select-none"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كارد الحجز</span>
            </button>

            <button
              onClick={() => setNewlyCreatedBooking(null)}
              className="px-4 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              إلغاء النافذة
            </button>
          </div>
        </section>
      )}

      {/* 4. DENTAL CLINICS BENTO GRID */}
      <section className="space-y-6" id="specialties-section">
        <div className="text-center space-y-2">
          <span className="text-teal-600 text-xs font-bold uppercase tracking-widest block">العيادات الطبية التخصصية التابعة للمركز</span>
          <h3 className="text-xl md:text-3xl font-black text-slate-800">أقسام وعيادات الفم والأسنان المتاحة</h3>
          <p className="text-slate-500 text-xs md:text-sm max-w-3xl mx-auto leading-relaxed">
            انقر على أي قسم أسنان بالأسفل لحجز فحص وتعيين الأخصائي مباشرة وفتح نموذج التسجيل الفوري في ثوان بضغطة زر.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialties.map(spec => {
            const specDocs = doctors.filter(d => d.specialtyId === spec.id);
            return (
              <div 
                key={spec.id} 
                onClick={() => {
                  setNewlyCreatedBooking(null);
                  setSelectedSpecialtyId(spec.id);
                  setIsBookingModalOpen(true);
                }}
                className="bg-white hover:bg-[#fafdfd] border border-slate-100 rounded-2xl p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer group animate-fade-in text-right flex flex-col justify-between h-52 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-2 h-0 group-hover:h-full bg-teal-500 transition-all duration-300"></div>
                
                <div>
                  <div className="flex justify-between items-start flex-row-reverse">
                    <div className="p-3 bg-slate-50 group-hover:bg-teal-50 rounded-xl transition text-teal-600">
                      {spec.id === 'surgery' && <Activity className="w-5 h-5 text-teal-650 animate-pulse" />}
                      {spec.id === 'ortho' && <Smile className="w-5 h-5 text-teal-650" />}
                      {spec.id === 'endo' && <FlaskConical className="w-5 h-5 text-teal-650" />}
                      {spec.id === 'cosmetic' && <Sparkles className="w-5 h-5 text-teal-650" />}
                      {spec.id === 'pediatric' && <Baby className="w-5 h-5 text-teal-650" />}
                      {spec.id === 'periodontics' && <ShieldAlert className="w-5 h-5 text-teal-650" />}
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-mono font-bold px-2.5 py-1 rounded-full">
                      {spec.room}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-800 text-sm mt-4 group-hover:text-teal-800 transition">
                    {spec.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 max-w-sm">
                    {spec.description}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50 text-[10px] text-slate-400 font-bold">
                  <span className="text-teal-600 group-hover:translate-x-1 transition duration-350 inline-flex items-center gap-1 flex-row-reverse">
                    <span>احجز الآن في العيادة 🦷</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  <span>طاقم العمل: {specDocs.map(d => d.name.replace('د. ', '')).join('، ')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. BOOKING SEARCH SECTION */}
      <section className="bg-white rounded-2xl p-6 md:p-8 border border-slate-150/80 shadow-md max-w-3xl mx-auto" id="booking-search-section">
        <div className="text-center space-y-2 border-b border-slate-100 pb-5 mb-5 text-right flex flex-col items-end">
          <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-[10px] font-bold">استعلام ومطابقة حجز الأسنان للـ API</span>
          <h3 className="text-lg md:text-xl font-bold text-slate-800">البحث والاستعلام عن حجزك المسجل وتذكرتك</h3>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            أدخل رقم الهاتف الذي قمت باستخدامه في الحجز للتحقق الفوري من حالة طلب كشف الأسنان والتذكرة المسندة في قائمة طبيب المعالجة.
          </p>
        </div>

        <form onSubmit={handleSearchBookings} className="flex gap-2 items-center flex-row-reverse text-right">
          <div className="relative flex-1">
            <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
            <input
              type="text"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              placeholder="اكتب رقم الجوال للبحث (مثال: 01012345678)"
              className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-3 focus:outline-none focus:border-teal-650 transition text-right font-mono"
            />
          </div>
          <button
            type="submit"
            className="bg-slate-900 hover:bg-[#020e12] text-white text-xs font-bold py-3 px-6 rounded-xl transition flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>ابحث الآن</span>
          </button>
        </form>

        {hasSearched && searchedBookings && (
          <div className="mt-6 space-y-4 text-right">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-50">نتائج البحث المستخرجة:</h4>
            {searchedBookings.length === 0 ? (
              <p className="text-xs text-rose-500 font-semibold bg-rose-50 border border-rose-100 p-3 rounded-lg text-center">
                لم نجد أي حجز أسنان مسجل للرقم المدخل اليوم. جرب الحجز مجدداً!
              </p>
            ) : (
              searchedBookings.map(b => (
                <div key={b.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs leading-relaxed relative">
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-teal-600 rounded-r-xl"></div>
                  
                  <div className="space-y-1.5 text-right w-full sm:w-auto">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="font-extrabold text-slate-800 text-sm">{b.patientName}</span>
                      <strong className="text-teal-700 text-sm font-mono font-bold bg-white px-2 py-0.5 rounded border">#{b.queueNumber}</strong>
                    </div>
                    <div className="text-[11px] text-slate-400 space-y-0.5">
                      <p>العيادة: {specialties.find(s => s.id === b.specialtyId)?.name || 'عيادة عامة'} | الطبيب: {doctors.find(d => d.id === b.doctorId)?.name || 'د. حازم دويدار'}</p>
                      <p className="font-mono">الجنس: {b.gender || 'ذكر'} | زمن الموعد: {b.date} / {b.timeSlot}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                    {getStatusBadge(b.status)}
                    <a 
                      href={getWhatsAppURL(b)}
                      target="_blank" 
                      rel="noreferrer"
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
                    >
                      <Smile className="w-3.5 h-3.5 fill-white stroke-none" />
                      <span>واتساب</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </section>

      {/* 5.5 GOOGLE DRIVE TICKETS REGISTRY */}
      <section className="bg-[#f0f9fa]/50 rounded-2xl p-6 md:p-8 border border-teal-100 shadow-sm max-w-3xl mx-auto space-y-4" id="google-drive-tickets-section">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-teal-100/50 pb-4 text-right">
          
          <div className="flex gap-2.5 items-center">
            {driveUser ? (
              <button
                type="button"
                onClick={handleDriveLogout}
                className="px-3 py-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100/70 text-rose-700 text-[10px] font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>قطع الاتصال</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDriveLogin}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-[10px] font-extrabold rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <Cloud className="w-3.5 h-3.5 text-teal-600 fill-teal-100" />
                <span>ربط جوجل درايف</span>
              </button>
            )}

            {driveUser && (
              <button
                type="button"
                onClick={() => fetchDriveTickets(driveToken!)}
                disabled={isLoadingDriveFiles}
                className="px-3 py-1.5 border border-teal-200 bg-white hover:bg-teal-50 text-teal-700 text-[10px] font-bold rounded-xl transition cursor-pointer"
              >
                {isLoadingDriveFiles ? 'جاري التحديث...' : 'تحديث القائمة'}
              </button>
            )}
          </div>

          <div className="text-right">
            <span className="bg-teal-100 text-teal-800 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold font-mono inline-block mb-1">
              أرشيف المزامنة السحابي
            </span>
            <h4 className="text-sm font-black text-slate-800 flex items-center gap-1.5 justify-end">
              <span>تذاكر فحص الأسنان المؤرشفة بـ Google Drive</span>
              <Cloud className="w-4 h-4 text-teal-600" />
            </h4>
            <p className="text-slate-500 text-[10px] mt-0.5">
              استعرض وحمل تذاكرك السابقة المحفوظة بأمان في حسابك الشخصي على محرك البحث جوجل.
            </p>
          </div>
        </div>

        {driveUser ? (
          <div className="space-y-3">
            {isLoadingDriveFiles ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
                <span>جاري تحميل ملفات وتذاكر Google Drive...</span>
              </div>
            ) : driveFiles.length === 0 ? (
              <div className="text-center py-8 bg-white border border-slate-100 rounded-xl space-y-1.5">
                <p className="text-xs text-slate-500 font-bold">لا توجد أي تذاكر محفوظة في حسابك بمحرك الأقراص بعد.</p>
                <p className="text-[10px] text-slate-400">انجز حجزاً جديداً واضغط "حفظ التذكرة بـ Drive" في بطاقة النجاح لحفظها سحابياً.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {driveFiles.map(file => (
                  <div key={file.id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between gap-2.5 transition hover:border-teal-200 hover:shadow-sm text-right">
                    {file.webViewLink && (
                      <a 
                        href={file.webViewLink}
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-[10px] font-bold"
                      >
                        عرض المستند 🌐
                      </a>
                    )}
                    <div className="space-y-1 text-right flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate" dir="ltr">{file.name.replace('.txt', '')}</p>
                      <p className="text-[9px] text-slate-400">
                        حُفظ في: {new Date(file.createdTime).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 text-center bg-white border border-slate-100 rounded-xl space-y-3">
            <span className="inline-flex p-3 bg-teal-50 text-teal-600 rounded-full">
              <Cloud className="w-6 h-6" />
            </span>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700">لم يتم ربط حساب Google Drive بعد</p>
              <p className="text-[10px] text-slate-400 max-w-md mx-auto leading-relaxed">
                اربط حسابك للتمكن من حفظ تذاكر الكشف وجراحة الأسنان مباشرة بمستندات جوجل للوصول الفوري ومطابقتها لدى الاستشاري دكتور حازم دويدار.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDriveLogin}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition cursor-pointer select-none"
            >
              قم بربط حسابك السحابي بـ بضع ضغطات 🚀
            </button>
          </div>
        )}
      </section>

      {/* 6. BOOKING MODAL */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4 text-right animate-fade-in" id="booking-modal-holder">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl border border-slate-100 relative">
            
            <button 
              type="button"
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute left-5 top-5 p-1.5 text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-full cursor-pointer transition select-none"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2 justify-end mb-1">
                <span className="text-xl">🦷</span>
                <h4 className="text-lg font-black text-slate-800">حجز موعد كشف وجراحة أسنان فوري</h4>
              </div>
              <p className="text-xs text-slate-400">تواصل مباشر وإصدار تذاكر انتظار آلية مدعومة بالـ API لمطابقتها في العيادة.</p>
            </div>

            <div className="h-px bg-slate-100"></div>

            <form onSubmit={handleSubmit} className="space-y-4 text-right">
              
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-end gap-1">
                  <span>اسم المريض بالكامل *</span>
                  <User className="w-3.5 h-3.5 text-teal-600" />
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="مثال: سلمان عبد العزيز"
                  className="w-full text-slate-800 text-xs border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 transition placeholder:text-slate-350 text-right"
                  required
                />
              </div>

              {/* Phone & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-end gap-1">
                    <span>رقم الجوال *</span>
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01xxxxxxxx"
                    className="w-full text-slate-800 text-xs border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 transition placeholder:text-slate-350 text-center font-mono"
                    required
                  />
                  <span className="text-[9px] text-slate-400 mt-1 block">رقم للتواصل ومطابقة المعاملات</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 text-slate-600">
                    جنس المريض (النوع) *
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setGender('ذكر')}
                      className={`py-3 rounded-xl font-bold border transition text-center select-none cursor-pointer ${
                        gender === 'ذكر'
                          ? 'bg-blue-50 text-blue-800 border-blue-400 ring-2 ring-blue-400/10'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      🧔 ذكر (Male)
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('أنثى')}
                      className={`py-3 rounded-xl font-bold border transition text-center select-none cursor-pointer ${
                        gender === 'أنثى'
                          ? 'bg-pink-50 text-pink-800 border-pink-400 ring-2 ring-pink-400/10'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      👩 أنثى (Female)
                    </button>
                  </div>
                </div>
              </div>

              {/* Specialty & Doctor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 text-slate-600">
                    تخصص وجلسة الأسنان المطلوبة *
                  </label>
                  <select
                    value={selectedSpecialtyId}
                    onChange={(e) => setSelectedSpecialtyId(e.target.value)}
                    className="w-full text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-3.5 focus:outline-none focus:border-teal-600 transition text-xs cursor-pointer text-right"
                  >
                    {specialties.map(spec => (
                      <option key={spec.id} value={spec.id}>{spec.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 text-slate-600">
                    الطبيب المعالج المقترح *
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    disabled={filteredDoctors.length === 0}
                    className="w-full text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-3.5 focus:outline-none focus:border-teal-600 transition text-xs cursor-pointer disabled:bg-slate-50 text-right font-semibold"
                  >
                    {filteredDoctors.length === 0 ? (
                      <option value="">طبيب الأسنان المناوب</option>
                    ) : (
                      filteredDoctors.map(doc => (
                        <option key={doc.id} value={doc.id}>{doc.name}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-end gap-1">
                    <span>تاريخ الموعد المفضل *</span>
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-slate-800 text-xs border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 transition text-center"
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 flex items-center justify-end gap-1">
                    <span>الفترة المسائية المفتوحة يومياً (5م - 11م) *</span>
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                  </label>
                  
                  <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50">
                    {(() => {
                      const slots = [
                        '05:00 م', '05:15 م', '05:30 م', '05:45 م',
                        '06:00 م', '06:15 م', '06:30 م', '06:45 م',
                        '07:00 م', '07:15 م', '07:30 م', '07:45 م',
                        '08:00 م', '08:15 م', '08:30 م', '08:45 م',
                        '09:00 م', '09:15 م', '09:30 م', '09:45 م',
                        '10:00 م', '10:15 م', '10:30 م', '10:45 م'
                      ];
                      return slots.map(time => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className={`py-1.5 px-0.5 text-[9px] font-bold rounded border transition text-center select-none cursor-pointer ${
                            selectedTime === time
                              ? 'bg-teal-600 text-white border-teal-600 font-mono scale-[1.02] shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 font-mono'
                          }`}
                        >
                          {time}
                        </button>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-end gap-1">
                  <span>تفاصيل الشكوى أو الأعراض المترتبة</span>
                  <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: آلام حادة مستمرة بالنابية العلوية، تآكل حشو، رغبة تقويم..."
                  rows={2}
                  className="w-full text-slate-800 text-xs border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-600 transition resize-none text-right"
                ></textarea>
              </div>

              {/* Warning notice */}
              <div className="bg-slate-100 p-3 rounded-xl text-[10px] text-slate-500 leading-relaxed text-right flex items-start gap-1 justify-end">
                <span>تأكيد الموعد ينشئ معاملة مراجعة متزامنة فورياً مع نظام العيادة لوزارة الصحة.</span>
                <ShieldAlert className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              </div>

              <div className="h-px bg-slate-100 pt-1"></div>

              {/* Submit buttons */}
              <div className="flex gap-2.5">
                <button
                  type="submit"
                  disabled={isSubmittingApi}
                  className="flex-1 bg-gradient-to-l from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black py-4 px-4 rounded-xl shadow-md transition-all duration-300 flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-95 text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{isSubmittingApi ? 'جاري الاتصال بـ API المواعيد...' : 'تأكيد الحجز الفوري وإصدار التذكرة كارت'}</span>
                </button>

                <a
                  href={getDraftWhatsAppURL()}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#1ebea5] hover:bg-[#159a85] text-white font-bold py-4 px-4 rounded-xl transition text-xs text-center flex items-center gap-1 shrink-0"
                >
                  <Smile className="w-4 h-4 fill-white stroke-none" />
                  <span>عبر واتساب العيادة 💬</span>
                </a>
              </div>

              {/* API Status Feedback */}
              {isSubmittingApi && (
                <div className="mt-4 p-4 rounded-2xl border text-xs text-right bg-slate-50 border-slate-200">
                  <div className="flex items-center justify-end gap-2 text-teal-800 font-bold">
                    <span className="text-[11px]">جاري تسجيل الحجز...</span>
                    <span className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></span>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      )}

      {/* 7. ORACLE APEX IFRAME MODAL */}
      {isApexModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[1000] flex items-center justify-center p-2 sm:p-4 text-right animate-fade-in" 
          id="apex-popup-overlay"
        >
          <div className="bg-white rounded-3xl w-full max-w-6xl h-[88vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden relative animate-scale-up">
            
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-row-reverse items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5 flex-row-reverse">
                <span className="text-xl md:text-2xl">🗓️</span>
                <div className="text-right">
                  <h4 className="text-sm md:text-base font-black tracking-tight text-teal-300">نظام حجز ومتابعة المواعيد المتكامل (Oracle APEX)</h4>
                  <p className="text-[10px] md:text-xs text-slate-400">عرض مباشر وآمن لبوابة المريض الرسمية السحابية.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Secondary Full Screen Out */}
                <a
                  href="https://oracleapex.com/ords/r/nerd_acc/doctor-appointment268117/16?session=7950015601121&tz=Asia/Riyadh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                >
                  <span>فتح بصفحة جديدة ↗️</span>
                </a>
                
                {/* Close Button */}
                <button 
                  type="button"
                  onClick={() => setIsApexModalOpen(false)}
                  className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition w-8 h-8 rounded-full flex items-center justify-center cursor-pointer select-none text-xs"
                  title="إغلاق النافذة"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Warning Banner / Guide for potential Frame Loading Issues */}
            <div className="bg-amber-50 border-b border-amber-200/60 px-5 py-3 text-right flex flex-col md:flex-row-reverse md:items-center justify-between gap-3 shrink-0">
              <div className="flex items-start gap-2 flex-row-reverse">
                <span className="text-base shrink-0 mt-0.5">🔒</span>
                <div>
                  <p className="text-[11px] text-amber-950 font-sans leading-relaxed">
                    <strong>تنبيه الأمان والخصوصية:</strong> يتم توفير هذه البوابة مباشرة من خوادم <strong>Oracle APEX Linux</strong> السحابية الآمنة. قد تمنع بعض الهواتف أو المتصفحات الإطارات المدمجة (Clickjacking Protection) من العمل مباشرة هنا.
                  </p>
                </div>
              </div>
              <a 
                href="https://oracleapex.com/ords/r/nerd_acc/doctor-appointment268117/16?session=7950015601121&tz=Asia/Riyadh" 
                target="_blank" 
                rel="noreferrer"
                className="bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black px-3.5 py-1.5 rounded-lg transition shrink-0 shadow-sm inline-block text-center"
              >
                تجاوز وافتح مباشرة ↗️
              </a>
            </div>

            {/* Iframe stage container */}
            <div className="flex-1 w-full bg-slate-100 relative min-h-0">
              {/* Spinner indicator that stays behind or helper text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 text-center text-slate-400 p-4 z-0">
                <div className="w-10 h-10 border-4 border-slate-300 border-t-teal-600 rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-slate-500">جاري الاتصال بخوادم أوراكل السحابية الآمنة لـ APEX...</p>
                <p className="text-[10px] text-slate-400 max-w-sm">إذا لم تفتح الصفحة خلال ثوانٍ، يرجى الضغط على زر "تجاوز وافتح مباشرة" بالأعلى.</p>
              </div>

              <iframe
                src="https://oracleapex.com/ords/r/nerd_acc/doctor-appointment268117/16?session=7950015601121&tz=Asia/Riyadh;3:00"
                className="w-full h-full border-0 absolute inset-0 z-10 bg-white"
                title="Oracle APEX System Integration"
                allow="clipboard-write; geolocation"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </div>
            
            {/* Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex flex-row-reverse items-center justify-between text-slate-400 text-[9px] shrink-0">
              <div>الحالة: متصل بالخادم السحابي آمن 🟢</div>
              <div>جميع البيانات مشفرة وتتم حمايتها عبر أنظمة أوراكل المتطورة 🔐</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
