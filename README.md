# Hoyo-Login

**ja**  
このプロジェクトでは、原神のログインボーナスを自動的に受け取り、LINE通知で受け取った結果を通知するアプリケーションを構築しています。アプリケーションはPlaywrightを使用し、インフラ環境はAWS CDKを使用して構築されています。
クロスプラットフォームです(たぶん)。Windows、Linux、macOSで、ローカル

Google認証でホヨラボにログインできる場合のみ利用できます。
目安月コスト$0.5

### ワークフロー
1. S3に前回の認証データがあるかチェックする
2. ない場合、Google認証を行います
3. hoyolabにアクセスします
4. hoyolabにGoogleでログインします
5. ログインボーナスを受け取ります

**en**  
This project involves building an application that automatically receives HaraShin login bonuses and notifies users of the results received via LINE notifications. The application is built using Playwright and the infrastructure environment is built using AWS CDK.
maybe Cross-platform. Windows, Linux, and macOS, locally 

Available only if you can log in to HoyoLab with Google Authentication.
Approximate monthly cost $0.5

### Workflow
1. check if there is previous authentication data in S3
2. if not, perform Google authentication
3. access hoyolab
4. login to hoyolab with Google
5. receive login bonus

![image](aws.drawio.png)

<img src="https://user-images.githubusercontent.com/40763821/234156120-5fe8f3ff-8571-4232-9b5f-f212782cbb70.jpeg" width="300" height="500">
