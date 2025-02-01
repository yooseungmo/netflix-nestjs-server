module.exports = {
  printWidth: 100, // 한 줄 최대 길이 
  tabWidth: 2, // 들여쓰기 간격 
  useTabs: false, // 스페이스 사용 (false), 탭 사용 (true)
  semi: true, // 세미콜론 사용 
  singleQuote: true, // 작은 따옴표 사용 
  trailingComma: 'all', // 여러 줄일 경우, 마지막에도 쉼표 추가
  bracketSpacing: true, // 중괄호 `{ foo: bar }` 형식 유지
  proseWrap: 'never', // 마크다운 파일 줄바꿈 강제 X
  endOfLine: 'lf', // 줄바꿈 `LF`(Git에서 충돌 방지)
};
