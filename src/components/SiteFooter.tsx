import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-cols">
          <div>
            <Link href="/" className="footer-logo" aria-label="NOPIUM 홈"><Image src="/brand/nopium-wordmark-uppercase-heavy.svg" width={92} height={21} alt="NOPIUM" /></Link>
            <p>병원 · 재활 전문가 · 환자를 잇는 퇴원 후 재활 서비스</p>
          </div>
          <div>
            <h4>환자·보호자</h4>
            <Link href="/experts">재활 전문가 찾기</Link>
            <Link href="/my">내 재활</Link>
            <Link href="/#faq">자주 묻는 질문</Link>
          </div>
          <div>
            <h4>파트너</h4>
            <Link href="/partner">재활 전문가 가입</Link>
            <Link href="/hospital">병원 도입 문의</Link>
          </div>
          <div>
            <h4>고객센터</h4>
            <Link href="/#faq">이용 안내와 자주 묻는 질문</Link>
            <Link href="/admin">운영 화면 둘러보기</Link>
          </div>
        </div>
        <p className="footer-note">
          이 화면의 전문가·병원·후기·수치는 모두 시안용 예시입니다. 입력과 변경은 이 브라우저의 체험 데이터에만 반영되며 실제 기관에 전송되지 않습니다.
        </p>
        <p className="footer-copy">© 2026 NOPIUM</p>
      </div>
    </footer>
  );
}


