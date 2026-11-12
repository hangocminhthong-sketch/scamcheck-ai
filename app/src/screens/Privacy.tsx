import type { Route } from '../App';
import type { Lang, T } from '../i18n';

const POLICY: Record<Lang, { h: string; p: string }[]> = {
  en: [
    { h: 'What we process', p: 'When you tap “Check now”, the text and/or screenshot you chose is sent over an encrypted connection to our server and to our AI provider (Anthropic) to produce the result. It is not stored by us after the result is returned and is not used to train AI models.' },
    { h: 'What stays on your phone', p: 'Your check history (verdict and the first 140 characters of the text — never images) is stored only on your device. You can delete it at any time in History.' },
    { h: 'Analytics and ads', p: 'We use Google Firebase Analytics to count app events (for example, “a check was completed with verdict X”). These events never contain your messages, links, phone numbers or images. Ads are served by Google AdMob, which may use your advertising ID according to your device and consent settings.' },
    { h: 'Your choices', p: 'You can reset your advertising ID or opt out of personalised ads in Android settings, delete history in the app, and uninstall the app to remove all local data.' },
    { h: 'Children', p: 'ScamCheck AI is intended for users aged 13 and over.' },
    { h: 'Contact', p: 'Questions or requests: use the developer contact email on our Google Play page.' },
  ],
  vi: [
    { h: 'Dữ liệu được xử lý', p: 'Khi bạn bấm “Kiểm tra ngay”, nội dung và/hoặc ảnh bạn chọn được gửi qua kết nối mã hoá tới máy chủ của chúng tôi và nhà cung cấp AI (Anthropic) để tạo kết quả. Chúng tôi không lưu lại sau khi trả kết quả và không dùng để huấn luyện AI.' },
    { h: 'Dữ liệu trên điện thoại', p: 'Lịch sử kiểm tra (kết luận và 140 ký tự đầu — không bao giờ lưu ảnh) chỉ lưu trên thiết bị của bạn. Bạn có thể xoá bất cứ lúc nào trong mục Lịch sử.' },
    { h: 'Phân tích và quảng cáo', p: 'Chúng tôi dùng Google Firebase Analytics để đếm sự kiện trong ứng dụng (ví dụ: “một lượt kiểm tra hoàn tất với kết luận X”). Các sự kiện không bao giờ chứa tin nhắn, đường link, số điện thoại hay hình ảnh của bạn. Quảng cáo do Google AdMob cung cấp và có thể dùng mã quảng cáo theo cài đặt và sự đồng ý của bạn.' },
    { h: 'Lựa chọn của bạn', p: 'Bạn có thể đặt lại mã quảng cáo hoặc tắt quảng cáo cá nhân hoá trong cài đặt Android, xoá lịch sử trong ứng dụng, và gỡ ứng dụng để xoá toàn bộ dữ liệu cục bộ.' },
    { h: 'Trẻ em', p: 'ScamCheck AI dành cho người dùng từ 13 tuổi trở lên.' },
    { h: 'Liên hệ', p: 'Câu hỏi hoặc yêu cầu: dùng email liên hệ nhà phát triển trên trang Google Play của ứng dụng.' },
  ],
};

export function PrivacyScreen({ t, lang, go }: { t: T; lang: Lang; go: (r: Route) => void }) {
  return (
    <main className="screen" data-testid="privacy">
      <header className="topbar">
        <button className="icon-btn" aria-label={t.t('back')} onClick={() => go({ name: 'settings' })}>←</button>
        <div className="brand">{t.t('privacy')}</div>
        <span />
      </header>
      {POLICY[lang].map((s) => (
        <section className="card" key={s.h}>
          <h2>{s.h}</h2>
          <p>{s.p}</p>
        </section>
      ))}
    </main>
  );
}
