import type { Lang } from './i18n';

export type ExampleId = 'delivery' | 'otp' | 'job' | 'normal';

export const EXAMPLES: Record<Lang, Record<ExampleId, string>> = {
  en: {
    delivery: 'USPS: Your package is on hold due to an unpaid $1.99 redelivery fee. Pay within 24 hours to avoid return: https://bit.ly/usps-redeliver',
    otp: "Hi, this is the Chase fraud department. We blocked a suspicious $940 transfer. To cancel it, reply with the 6-digit code we just sent you. Don't tell anyone, this is confidential.",
    job: 'Part-time job! Like & follow TikTok videos and earn $300 per day. No experience needed. Contact our manager on Telegram @hr_lisa to start today.',
    normal: "Hey! Running 10 minutes late, grab us a table near the window. See you soon.",
  },
  vi: {
    delivery: 'GHTK: Don hang cua ban dang bi giu do thieu phi giao hang 15.000d. Vui long thanh toan trong vong 24h tai https://ghtk-vn.top/pay de tranh bi hoan.',
    otp: 'Chào anh/chị, em là nhân viên ngân hàng Vietcombank. Tài khoản của anh/chị đang bị tạm khoá. Anh/chị vui lòng đọc giúp em mã OTP vừa gửi để mở khoá ngay lập tức.',
    job: 'Tuyển CTV làm tại nhà, việc nhẹ lương cao, thu nhập 500.000đ mỗi ngày, hoa hồng 30%. Liên hệ Zalo để nhận nhiệm vụ.',
    normal: 'Tối nay 7h cả nhà ăn cơm ở nhà ngoại nhé con. Nhớ mua giúp mẹ ít trái cây.',
  },
};
