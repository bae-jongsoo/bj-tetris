# Android WebView APK packaging

이 폴더는 BJ Tetris 웹 게임을 안드로이드 WebView 앱으로 패키징하기 위한 최소 프로젝트입니다.

## 프로젝트 구조
- `android/app/src/main/java/com/example/bjtetris/MainActivity.java` : WebView 로컬 자산 로드
- `android/app/src/main/AndroidManifest.xml` : 앱/액티비티 설정
- `android/app/build.gradle` : 빌드 설정 + 빌드 전에 웹 파일을 `assets`에 자동 동기화

## 빌드 방법
1. Android Studio에서 `android/` 폴더를 열기
2. 상단 메뉴 `Build > Build Bundle(s) / APK(s) > Build APK(s)`
3. `app/build/outputs/apk/debug/app-debug.apk` (또는 release) 생성
4. 출시용은 Release 서명 후 배포

## 주의
- 빌드 시 `preBuild` 단계에서 프로젝트 루트의 아래 항목이 자동으로 `app/src/main/assets`로 복사됩니다.
  - `index.html`
  - `styles.css`
  - `src/**`
  - `assets/**`
