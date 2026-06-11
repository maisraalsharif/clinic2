import { Doctor, Specialty, Booking } from './types';

export const INITIAL_SPECIALTIES: Specialty[] = [
  {
    id: 'surgery',
    name: 'زراعة الأسنان وجراحة الفكين',
    icon: 'Activity',
    description: 'تعويض الأسنان المفقودة بأحدث غرسات التيتانيوم الألمانية والسويسرية والعمليات الجراحية.',
    room: 'عيادة الاستشاري د. حازم'
  },
  {
    id: 'ortho',
    name: 'تقويم الأسنان وتجميل الفكين',
    icon: 'Smile',
    description: 'تركيب تقويم الأسنان المعدني التقليدي والشفاف غير المرئي لتنسيق شكل ومظهر الابتسامة.',
    room: 'عيادة الاستشاري د. حازم'
  },
  {
    id: 'endo',
    name: 'علاج عصب وجذور الأسنان',
    icon: 'FlaskConical',
    description: 'تنظيف قنوات الجذور وسحب العصب مجهرياً وبطرق خالية تماماً من الألم لراحة قصوى.',
    room: 'عيادة الاستشاري د. حازم'
  },
  {
    id: 'cosmetic',
    name: 'تبييض الأسنان بالليزر وتجميل الابتسامة',
    icon: 'Sparkles',
    description: 'تصميم ابتسامة هوليوود وتبييض الأسنان بالليزر لإزالة التصبغات العميقة فوراً.',
    room: 'عيادة الاستشاري د. حازم'
  },
  {
    id: 'pediatric',
    name: 'طب أسنان الأطفال الوقائي',
    icon: 'Baby',
    description: 'عناية وقائية وترميمية لأسنان الأطفال بجلسات ممتعة بالغاز الضاحك المهدئ والجميل.',
    room: 'عيادة الاستشاري د. حازم'
  },
  {
    id: 'periodontics',
    name: 'تنظيف الجير وعلاج أمراض اللثة',
    icon: 'ShieldAlert',
    description: 'إزالة الترسبات التكلسية والموجات الصوتية لتفتيح اللثة وعلاج النزيف المستمر.',
    room: 'عيادة الاستشاري د. حازم'
  }
];

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-dawidar',
    name: 'د. حازم دويدار',
    specialtyId: 'surgery',
    title: 'استشاري جراحة وزراعة الأسنان وتجميل الفم والفكين - البورد الأمريكي للأسنان',
    status: 'available',
    availability: 'يومياً مسائاً من 5:00 م إلى 11:00 م',
    slots: [
      '05:00 م', '05:15 م', '05:30 م', '05:45 م',
      '06:00 م', '06:15 م', '06:30 م', '06:45 م',
      '07:00 م', '07:15 م', '07:30 م', '07:45 م',
      '08:00 م', '08:15 م', '08:30 م', '08:45 م',
      '09:00 م', '09:15 م', '09:30 م', '09:45 م',
      '10:00 م', '10:15 م', '10:30 م', '10:45 م'
    ],
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200'
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'book-1',
    patientName: 'أحمد محمد الشناوي',
    phone: '01012345678',
    gender: 'ذكر',
    specialtyId: 'surgery',
    doctorId: 'doc-dawidar',
    date: new Date().toISOString().split('T')[0], // Today's date dynamically
    timeSlot: '05:30 م',
    status: 'completed',
    queueNumber: 1,
    createdAt: new Date().toISOString(),
    notes: 'استشارة لزراعة ضرسين تالفين وفحص كثافة العظام عبر الأشعة ثلاثية الأبعاد.',
    isArrived: true,
    arrivedAt: new Date().toISOString()
  },
  {
    id: 'book-2',
    patientName: 'هند أحمد السعيد',
    phone: '01144558899',
    gender: 'أنثى',
    specialtyId: 'ortho',
    doctorId: 'doc-dawidar',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '07:00 م',
    status: 'in-progress',
    queueNumber: 2,
    createdAt: new Date().toISOString(),
    notes: 'ضبط وشد سلك تقويم الأسنان المعدني العلوي ومراجعة الأطراف الدقيقة.',
    isArrived: true,
    arrivedAt: new Date().toISOString()
  },
  {
    id: 'book-3',
    patientName: 'مصطفى عبد الرحمن السيد',
    phone: '01255566788',
    gender: 'ذكر',
    specialtyId: 'endo',
    doctorId: 'doc-dawidar',
    date: new Date().toISOString().split('T')[0],
    timeSlot: '08:30 م',
    status: 'waiting',
    queueNumber: 3,
    createdAt: new Date().toISOString(),
    notes: 'ألم مستمر وشديد جداً يزداد ليلاً ويشتد مع المشروبات الباردة والساخنة.',
    isArrived: false
  }
];
