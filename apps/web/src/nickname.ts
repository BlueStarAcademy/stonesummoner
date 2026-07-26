/** Hangul syllable nicknames: 2–6 characters. */
const NICK_RE = /^[가-힣]{2,6}$/;

const PROFANITY = [
  "시발",
  "씨발",
  "씨벌",
  "시벌",
  "병신",
  "븅신",
  "지랄",
  "좆",
  "좇",
  "존나",
  "졸라",
  "새끼",
  "새꺄",
  "니미",
  "니앰",
  "니애미",
  "느금",
  "개새",
  "개쉐",
  "씹",
  "창녀",
  "창년",
  "보지",
  "자지",
  "섹스",
  "야동",
  "포르노",
  "성인물",
  "장애인",
  "정신병",
  "자살",
  "죽여",
  "죽을래",
  "운영자",
  "관리자",
  "운영진",
  "개발자",
  "시스템",
  "관리팀",
  "스톤소환",
  "공식",
];

export function normalizeNickname(raw: string): string {
  return String(raw ?? "")
    .normalize("NFC")
    .replace(/\s+/g, "")
    .trim();
}

export function containsProfanity(nickname: string): boolean {
  const n = normalizeNickname(nickname).toLowerCase();
  if (!n) return false;
  return PROFANITY.some((w) => n.includes(w.toLowerCase()));
}

export type NicknameValidation =
  | { ok: true; nickname: string }
  | { ok: false; error: string };

export function validateNickname(raw: string): NicknameValidation {
  const nickname = normalizeNickname(raw);
  if (!nickname) return { ok: false, error: "nickname_required" };
  if (!NICK_RE.test(nickname)) return { ok: false, error: "nickname_format" };
  if (containsProfanity(nickname))
    return { ok: false, error: "nickname_profanity" };
  return { ok: true, nickname };
}

export function nicknameErrorMessage(code: string): string {
  switch (code) {
    case "nickname_required":
      return "닉네임을 입력해 주세요.";
    case "nickname_format":
      return "닉네임은 한글 2~6글자로 입력해 주세요.";
    case "nickname_profanity":
      return "사용할 수 없는 닉네임입니다.";
    case "nickname_taken":
      return "이미 사용 중인 닉네임입니다.";
    case "nickname_locked":
      return "닉네임은 한 번만 설정할 수 있습니다.";
    case "email_taken":
      return "이미 가입된 이메일입니다.";
    case "email_invalid":
      return "올바른 이메일을 입력해 주세요.";
    default:
      return "요청을 처리할 수 없습니다.";
  }
}
