export type ScheduleCategory = '소통/잡담' | '게임' | '쿡방' | '야외방송' | '휴방' | '특별합방';

export type ScheduleStatus = 'scheduled' | 'live' | 'cancelled' | 'finished';

export interface ScheduleItem {
  id: string;
  title: string;
  description: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  category: ScheduleCategory;
  status: ScheduleStatus;
  isHoliday: boolean;
  createdAt: string;
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  formattedSoopText: string;
  isPinned: boolean;
  createdAt: string;
  author: string;
}

export interface FanArtItem {
  id: string;
  title: string;
  author: string;
  imageUrl: string;
  sourceUrl?: string; // 네이버 카페 원본 주소 등
  tags: string[];
  likes: number;
  createdAt: string;
}

export type EventStatus = 'active' | 'upcoming' | 'ended';

export interface EventItem {
  id: string;
  title: string;
  description: string;
  status: EventStatus;
  startDate: string;
  endDate: string;
  formUrl?: string;
  bannerUrl?: string;
  participantCount?: number;
  createdAt: string;
}

export type UserRole = 'streamer' | 'producer' | 'guest';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
