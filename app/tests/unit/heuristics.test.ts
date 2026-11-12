// F1 Done-when tests — wiki/features/f1-onscreen-engine.md
import { describe, expect, it } from 'vitest';
import { analyzeLocally, linkFlags } from '../../src/engine/heuristics';

const cats = (t: string) => analyzeLocally(t).redFlags.map((f) => f.category);

describe('F1 on-device engine', () => {
  it('EN delivery-fee phishing with short link → likely_scam', () => {
    const r = analyzeLocally(
      'USPS: Your package is on hold due to an unpaid $1.99 redelivery fee. Pay within 24 hours to avoid return: https://bit.ly/3xYzQ1',
    );
    expect(r.verdict).toBe('likely_scam');
    expect(cats('USPS: unpaid $1.99 redelivery fee. Pay within 24 hours https://bit.ly/3xYzQ1')).toContain('link_shortener');
  });

  it('VN fake police + transfer + secrecy → likely_scam', () => {
    const r = analyzeLocally(
      'Đây là Công an quận 1. Tài khoản của bạn liên quan đến vụ án rửa tiền. Bạn phải chuyển tiền vào tài khoản tạm giữ để xác minh, tuyệt đối giữ bí mật, không được nói với người thân.',
    );
    expect(r.verdict).toBe('likely_scam');
    expect(r.redFlags.map((f) => f.category)).toEqual(expect.arrayContaining(['impersonation', 'money_request', 'secrecy']));
    // Evidence is quoted from the ORIGINAL text, with diacritics.
    expect(r.redFlags.find((f) => f.category === 'money_request')?.evidence).toContain('chuyển tiền');
  });

  it('VN text without diacritics is also caught', () => {
    expect(analyzeLocally('Chuc mung ban da trung thuong, vui long dong phi nhan thuong').verdict).not.toBe('low_risk');
  });

  it('VN fake prize → at least suspicious', () => {
    const r = analyzeLocally('Chúc mừng bạn đã trúng thưởng xe SH. Vui lòng đóng phí nhận thưởng 500.000đ qua số tài khoản 0123456789.');
    expect(['suspicious', 'likely_scam']).toContain(r.verdict);
    expect(r.scamType).toBe('prize');
  });

  it('normal personal message → low_risk with no flags', () => {
    const r = analyzeLocally('See you at 7pm at the cafe near the office. Bring the book!');
    expect(r.verdict).toBe('low_risk');
    expect(r.redFlags).toHaveLength(0);
  });

  it('legit bank OTP notice ("do not share") is NOT likely_scam', () => {
    expect(analyzeLocally('Your Chase verification code is 482913. Do not share this code with anyone.').verdict).toBe('low_risk');
    expect(analyzeLocally('Ma OTP cua ban la 123456. Tuyet doi KHONG cung cap ma OTP cho bat ky ai.').verdict).toBe('low_risk');
  });

  it('OTP request from a "staff member" → likely flagged', () => {
    const r = analyzeLocally('Hi this is the bank fraud department. Please send me the OTP code we just texted you to stop the transfer.');
    expect(r.redFlags.map((f) => f.category)).toContain('otp_request');
    expect(r.verdict).not.toBe('low_risk');
  });

  it('look-alike + risky TLD flagged; real domain not flagged', () => {
    const bad = linkFlags('Login: https://paypal.com.secure-login.xyz/verify').map((f) => f.category);
    expect(bad).toEqual(expect.arrayContaining(['link_lookalike', 'link_risky_tld']));
    expect(linkFlags('Visit https://www.paypal.com/us/home')).toHaveLength(0);
    expect(linkFlags('https://online.mbbank.com.vn')).toHaveLength(0);
    expect(linkFlags('http://paypa1.com/login').map((f) => f.category)).toContain('link_lookalike');
  });

  it('APK install request → remote_access', () => {
    expect(cats('Tải ứng dụng dịch vụ công tại link sau để cập nhật VNeID: http://dichvucong-gov.top/vneid.apk')).toContain('remote_access');
  });

  it('VN bank-staff OTP scam flags impersonation + account-lock urgency + OTP', () => {
    const r = analyzeLocally(
      'Chào anh/chị, em là nhân viên ngân hàng Vietcombank. Tài khoản của anh/chị đang bị tạm khoá. Anh/chị vui lòng đọc giúp em mã OTP vừa gửi.',
    );
    expect(r.redFlags.map((f) => f.category)).toEqual(expect.arrayContaining(['impersonation', 'urgency', 'otp_request']));
    expect(r.verdict).toBe('likely_scam');
  });

  it('delivery fee + suspicious link is typed as phishing', () => {
    expect(analyzeLocally('USPS: unpaid $1.99 redelivery fee. Pay within 24 hours: https://bit.ly/x').scamType).toBe('phishing');
  });

  it('empty input → low_risk, score 0', () => {
    const r = analyzeLocally('   ');
    expect(r).toMatchObject({ verdict: 'low_risk', riskScore: 0 });
  });

  it('5,000-character message runs in < 50 ms', () => {
    const long = 'Congratulations you won a prize, transfer the fee now at https://bit.ly/x. '.repeat(70).slice(0, 5000);
    analyzeLocally(long); // warm-up (JIT)
    const t0 = performance.now();
    analyzeLocally(long);
    expect(performance.now() - t0).toBeLessThan(50);
  });
});
