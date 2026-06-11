export interface Doctor {
  id: string;
  name: string;
  specialtyId: string;
  title: string;
  status: 'available' | 'busy' | 'on-leave';
  availability: string;
  avatar: string;
  slots?: string[];
}

export interface Specialty {
  id: string;
  name: string;
  icon: string;
  description: string;
  room: string;
}

export type BookingStatus = 'waiting' | 'in-progress' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  patientName: string;
  phone: string;
  gender: 'male' | 'female' | 'ذكر' | 'أنثى' | string;
  specialtyId: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  status: BookingStatus;
  queueNumber: number;
  createdAt: string;
  notes?: string;
  isArrived?: boolean;
  arrivedAt?: string;
}
