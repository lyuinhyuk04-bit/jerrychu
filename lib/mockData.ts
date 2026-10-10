import { ScheduleItem, NoticeItem, FanArtItem, EventItem, AdminUser } from './types';

export const ADMIN_ACCOUNTS: AdminUser[] = [
  {
    id: 'admin-1',
    email: 'jerrychu@soop.live',
    name: '제리츄 (스트리머)',
    role: 'streamer',
  },
  {
    id: 'admin-2',
    email: 'producer@jerrychu.com',
    name: '제작자 (관리자)',
    role: 'producer',
  },
];

// 2026년 9월 기준 샘플 방송 일정 (월간, 주간)
export const INITIAL_SCHEDULES: ScheduleItem[] = [
  {
    id: 'sched-1',
    title: '🧀 제리츄의 저녁 짭조름 소통 & 영도 타임',
    description: '한 주를 시작하는 저녁 영도 시청과 도란도란 소통방송! 신상 치즈 젤리 리뷰도 준비 완료!',
    startTime: '2026-09-07T19:00:00+09:00',
    endTime: '2026-09-07T23:00:00+09:00',
    category: '소통/잡담',
    status: 'finished',
    isHoliday: false,
    createdAt: '2026-09-01T10:00:00+09:00',
  },
  {
    id: 'sched-2',
    title: '🎮 둠칫둠칫 리듬게임 & 발로란트 시참전',
    description: '시청자 참여 발로란트 내전! 카페에서 참가 신청글을 확인해주세요.',
    startTime: '2026-09-08T20:00:00+09:00',
    endTime: '2026-09-09T00:00:00+09:00',
    category: '게임',
    status: 'finished',
    isHoliday: false,
    createdAt: '2026-09-01T10:00:00+09:00',
  },
  {
    id: 'sched-3',
    title: '🍳 제리츄의 치즈 폭탄 토스트 심야 쿡방!',
    description: '치즈가 주르륵 흐르는 쿡방 도전기! 과연 제리츄는 주방을 무사히 지켜낼 수 있을 것인가?',
    startTime: '2026-09-09T20:30:00+09:00',
    endTime: '2026-09-10T01:00:00+09:00',
    category: '쿡방',
    status: 'live',
    isHoliday: false,
    createdAt: '2026-09-01T10:00:00+09:00',
  },
  {
    id: 'sched-4',
    title: '😴 힐링 충전 휴방일 (푹 쉬고 올게요!)',
    description: '다음 콘텐츠 준비 및 휴식일입니다. 카페에서 놀아주세요!',
    startTime: '2026-09-10T00:00:00+09:00',
    endTime: '2026-09-10T23:59:59+09:00',
    category: '휴방',
    status: 'scheduled',
    isHoliday: true,
    createdAt: '2026-09-01T10:00:00+09:00',
  },
  {
    id: 'sched-5',
    title: '🌟 [특별합방] 버츄얼 패밀리 종합 게임 랜선 파티',
    description: '초호화 게스트진과 함께하는 어몽어스 & 폴가이즈 내전 파티!',
    startTime: '2026-09-11T19:30:00+09:00',
    endTime: '2026-09-12T00:30:00+09:00',
    category: '특별합방',
    status: 'scheduled',
    isHoliday: false,
    createdAt: '2026-09-02T10:00:00+09:00',
  },
  {
    id: 'sched-6',
    title: '🍰 주말 저녁 힐링 영도 & 신작 공포게임 찍먹',
    description: '불금/주말 맞이 팬아트 감상 및 핫한 신작 공포게임 미션 방송!',
    startTime: '2026-09-12T20:00:00+09:00',
    endTime: '2026-09-13T01:00:00+09:00',
    category: '게임',
    status: 'scheduled',
    isHoliday: false,
    createdAt: '2026-09-02T10:00:00+09:00',
  },
  {
    id: 'sched-7',
    title: '🎁 9월 팬 미팅 룰렛 & 소통 주말 마무리',
    description: '9월 이달의 팬 룰렛 보상 추첨 및 다음 주 일정 안내!',
    startTime: '2026-09-13T19:00:00+09:00',
    endTime: '2026-09-13T23:00:00+09:00',
    category: '소통/잡담',
    status: 'scheduled',
    isHoliday: false,
    createdAt: '2026-09-03T10:00:00+09:00',
  },
  {
    id: 'sched-8',
    title: '🧀 제리츄의 저녁 소통 & 시청자 사연 읽기',
    description: '카페 사연함에 남겨주신 재미있는 소소한 이야기 읽어보기',
    startTime: '2026-09-15T19:00:00+09:00',
    endTime: '2026-09-15T23:00:00+09:00',
    category: '소통/잡담',
    status: 'scheduled',
    isHoliday: false,
    createdAt: '2026-09-03T10:00:00+09:00',
  },
  {
    id: 'sched-9',
    title: '🎨 9월 팬아트 공모전 수상작 발표 생방송',
    description: '팬분들께서 그려주신 제리츄 팬아트 모아보고 시상식 진행!',
    startTime: '2026-09-18T20:00:00+09:00',
    endTime: '2026-09-18T23:30:00+09:00',
    category: '특별합방',
    status: 'scheduled',
    isHoliday: false,
    createdAt: '2026-09-03T10:00:00+09:00',
  }
];

export const INITIAL_NOTICES: NoticeItem[] = [
  {
    id: 'notice-1',
    title: '🧀 [공지] 9월 2주차 제리츄 방송 일정 및 안내입니다!',
    content: '안녕하세요! 제리츄입니다 🧀 이번 주에도 재미있는 방송 콘텐츠가 꽉 차있어요! 금요일 특별합방과 수요일 쿡방 놓치지 마세요!',
    formattedSoopText: `[SOOP 방송국 공지 템플릿]
━━━━━━━━━━━━━━━━━━━━━━━━━━
🧀 제리츄 9월 2주차 방송 안내 🧀
━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 월요일: 짭조름 소통 & 영도 타임 (19:00~)
📍 화요일: 발로란트 시참 내전 (20:00~)
📍 수요일: 치즈 폭탄 토스트 쿡방! (20:30~)
📍 목요일: 힐링 충전 휴방일 😴
📍 금요일: 버츄얼 패밀리 합방 파티! (19:30~)
📍 토요일: 팬아트 감상 & 공포게임 (20:00~)
📍 일요일: 9월 팬 룰렛 추첨 (19:00~)

늘 응원해 주시는 우리 츄츄단 여러분 고맙습니다❤️
네이버 카페에서도 다양한 이벤트가 진행 중이니 많은 방문 부탁드려요!`,
    isPinned: true,
    createdAt: '2026-09-07T12:00:00+09:00',
    author: '제리츄',
  },
  {
    id: 'notice-2',
    title: '🎨 9월 제리츄 팬아트 공모전 개최 안내 (네이버 카페 연동)',
    content: '제리츄의 신규 가을 의상 팬아트 공모전이 네이버 카페에서 열렸습니다! 당첨자에게는 문화상품권과 굿즈 세트를 드립니다.',
    formattedSoopText: `[SOOP 게시판 공지]
🎨 제리츄 9월 가을 팬아트 공모전 안내 🎨
- 참여 기간: 9월 1일 ~ 9월 17일
- 발표: 9월 18일 생방송 중!
- 자세한 참여 방법은 제리츄 네이버 카페 (https://cafe.naver.com/jerrychu) 공지사항을 확인해 주세요!`,
    isPinned: true,
    createdAt: '2026-09-01T15:00:00+09:00',
    author: '제작자',
  },
  {
    id: 'notice-3',
    title: '📢 방송 중 영도 및 채팅 수칙 안내',
    content: '서로 존중하는 쾌적한 채팅 환경을 위해 타 스트리머 비하, 과도한 훈수 및 스포일러는 금지됩니다.',
    formattedSoopText: `[채팅 수칙]
1. 타 스트리머 언급 및 비교 금지
2. 스포일러 및 지나친 훈수 금지
3. 친목 및 닉네임 언급 자제`,
    isPinned: false,
    createdAt: '2026-08-20T10:00:00+09:00',
    author: '제리츄',
  }
];

export const INITIAL_FANARTS: FanArtItem[] = [
  {
    id: 'fanart-1',
    title: '치즈 조각을 든 귀여운 제리츄 🧀',
    author: '츄츄단1호',
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    sourceUrl: 'https://www.sooplive.com/station/rariruro/board/123988475',
    tags: ['SD팬아트', '치즈', '귀여움'],
    likes: 142,
    createdAt: '2026-09-08T18:00:00+09:00',
  },
  {
    id: 'fanart-2',
    title: '가을 트렌치코트 착장의 제리츄 버츄얼 일러스트 🍂',
    author: '금손마왕',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    sourceUrl: 'https://www.sooplive.com/station/rariruro/board/123988475',
    tags: ['고퀄리티', '가을의상', '버츄얼'],
    likes: 289,
    createdAt: '2026-09-06T14:20:00+09:00',
  },
  {
    id: 'fanart-3',
    title: '쿡방 전사 제리츄와 타버린 토스트 🍞',
    author: '요리왕츄',
    imageUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
    sourceUrl: 'https://www.sooplive.com/station/rariruro/board/123988475',
    tags: ['짤방', '쿡방', '팬아트'],
    likes: 95,
    createdAt: '2026-09-05T21:10:00+09:00',
  },
  {
    id: 'fanart-4',
    title: '게임 승리 포즈! 🎮✨',
    author: '발로츄',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
    sourceUrl: 'https://www.sooplive.com/station/rariruro/board/123988475',
    tags: ['게임', '일러스트', '시참'],
    likes: 210,
    createdAt: '2026-09-03T11:00:00+09:00',
  },
  {
    id: 'fanart-5',
    title: '네온 사이버 제리츄 퓨처 스타일 ⚡',
    author: 'CyberArtist',
    imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
    sourceUrl: 'https://www.sooplive.com/station/rariruro/board/123988475',
    tags: ['네온', '스페셜', '일러스트'],
    likes: 178,
    createdAt: '2026-09-01T16:45:00+09:00',
  }
];

export const INITIAL_EVENTS: EventItem[] = [
  {
    id: 'event-1',
    title: '🧀 제리츄 시청자 참여 발로란트 5v5 내전 신청!',
    description: '화요일 방송에서 진행되는 시청자 참여 발로란트 이벤트 매치입니다. 계급 무관! 네이버 카페 신청 양식을 작성해 주세요.',
    status: 'active',
    startDate: '2026-09-05',
    endDate: '2026-09-12',
    formUrl: 'https://cafe.naver.com/jerrychu',
    bannerUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80',
    participantCount: 48,
    createdAt: '2026-09-05T10:00:00+09:00',
  },
  {
    id: 'event-2',
    title: '🎨 9월 이달의 팬아트 공모전 - 가을 테마',
    description: '가을을 맞이하여 제리츄의 새로운 포즈/의상 팬아트를 모집합니다. 최우수상에게는 문화상품권 10만원과 제리츄 친필 서명 장패드 증정!',
    status: 'active',
    startDate: '2026-09-01',
    endDate: '2026-09-17',
    formUrl: 'https://cafe.naver.com/jerrychu',
    bannerUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
    participantCount: 32,
    createdAt: '2026-09-01T12:00:00+09:00',
  },
  {
    id: 'event-3',
    title: '🎁 9월 츄츄단 이달의 서포터 룰렛 이벤트',
    description: 'SOOP 방송국 서포터분들과 구독자분들을 위한 추첨 룰렛 이벤트입니다. 당첨된 10분께 치킨 기프티콘 발송!',
    status: 'upcoming',
    startDate: '2026-09-13',
    endDate: '2026-09-13',
    formUrl: 'https://www.sooplive.com/station/rariruro',
    bannerUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&auto=format&fit=crop&q=80',
    participantCount: 120,
    createdAt: '2026-09-02T14:00:00+09:00',
  }
];

export const FIXED_QUICK_LINKS = {
  soopStation: 'https://www.sooplive.com/station/rariruro',
  naverCafe: 'https://cafe.naver.com/jerrychu',
  youtube: 'https://www.youtube.com/@jerryChu2',
  googleSheet: 'https://docs.google.com/spreadsheets/d/1ZBA843UsgO75w8n1QJ9Il1aZVUbKdgILG-kWxhUmkAQ/edit?gid=0#gid=0',
  soopFanartBoard: 'https://www.sooplive.com/station/rariruro/board/123988475',
};
