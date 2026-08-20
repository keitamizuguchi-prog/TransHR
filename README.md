# 人材配置シミュレーションアプリ

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.3.

## Firebase設定（重要）

Google認証機能を使用するには、以下の手順でFirebaseを設定してください。

### 1. Firebaseプロジェクトの作成
1. [Firebase Console](https://console.firebase.google.com/)にアクセスしてログイン
2. 「プロジェクトを作成」をクリック
3. プロジェクト名を入力し、Googleアナリティクスは任意

### 2. ウェブアプリの登録
1. Firebaseコンソール内で、「ウェブアプリを追加」を選択
2. アプリの設定画面から、以下の情報をコピー：
   - apiKey
   - authDomain
   - projectId
   - storageBucket
   - messagingSenderId
   - appId

### 3. 認証情報の設定
1. `src/environments/environment.ts`ファイルを開く
2. 上記の情報を対応するフィールドに貼り付け

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: 'YOUR_API_KEY',           // ← 実際の値に置き換え
    authDomain: 'YOUR_AUTH_DOMAIN',   // ← 実際の値に置き換え
    projectId: 'YOUR_PROJECT_ID',     // ← 実際の値に置き換え
    storageBucket: 'YOUR_STORAGE_BUCKET',
    messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
    appId: 'YOUR_APP_ID',
  },
};
```

### 4. Google認証の有効化
1. Firebaseコンソールの「認証」セクションを開く
2. 「Sign-in method」タブで「Google」を選択
3. 「有効にする」をオンにする
4. 「プロジェクトサポートメール」を選択して保存

### 5. 認可設定
1. Firebaseコンソール → 「プロジェクト設定」
2. 「承認済みドメイン」に `localhost:4200` を追加

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
