# `Study Buddy Chatbot AI`

## Description
Chatbot edukatif yang dirancang untuk membantu pelajar memahami materi dengan interaktif, adaptif, dan menyenangkan.
Berfokus untuk mendukung Quality Education (SDG #4) melalui pembelajaran berbasis dialog, refleksi, dan personalisasi.

**Note for developers : fork the repo first before edit or commit.**

## 🧑‍💻 Team

|          **Name**          |      **Role**       |
|----------------------------|---------------------|
| Muhammad Alvin Ababil      | Project Manager     |
| Kemas M Aryadary Rasyad    | Front End Technical |
| Karina Azzahra             | Front End UI/UX     |
| M Rafli Adhan S            | Back End            |

## 🚀 Features
- **🤖 AI Powered Chatbot**                   : Bisa menjawab pertanyaan, menjelaskan materi dan memberi latihan soal. Didukung oleh model AI yang adaptif terhadap gaya belajar penguna.
- **📚 Chat History Tracking**                : Menyimpan riwayat percakapan agar pengguna bisa meninjau kembali materi yang dibahas.
- **🎓 Education Level Selector**             : Bisa menyesuaikan gaya bahasa dan kedalaman materi terhadap tingkat edukasi pengguna.
- **📊 Adaptive Learning Flow**               : Sistem pembelajaran menyesuaikan performa dan respons pengguna.
- **📆 Scheduling**                           : Bisa menjadwalkan event pada google calendar
- **🌐 Decentralized Frontend Architecture**  : Frontend bersifat modular dan scalable sehingga bisa mengembangkan fitur tanpa mengaggu sistem utama.
- **📓 Retrieval Augmented Generation**       : Bisa menjelaskan isi dari dokumen yang diinputkan pengguna dan menjawab pertanyaan pengguna berdasarkan dokumen yang diberikan.
- **📽️ Generate Youtube Video Links**         : Bisa generate link video youtube untuk membantu pengguna menggunakan video pembelajaran.


## 🛠 Tech Stack

**Frontend:**
- NextJS
- Tailwind CSS
- ShadCN
- Zustand

**Backend:**
- AI SDK (Gemini 2.5 Flash)
- MySQL Database example XAMPP
- NodeJS

## 🚀 How to Run the Project

### Step 1. Clone the Repository
```bash
https://github.com/NeoRyumasil/Team4-StudyBuddyChatbotAI-AIXSoftDevBootcamp.git
cd Team4-StudyBuddyChatbotAI-AIXSoftDevBootcamp/studybuddy
```

### Step 2. Install Depedencies
```bash
pnpm add ai @ai-sdk/react @ai-sdk/google
npx shadcn@latest add
pnpm add react-markdown remark-gfm
pnpm install zustand 
pnpm install @google/generative-ai
```

### Step 3 Setup Environtment
- Make .env.local file
- Add this code on .env.local
  ```bash
  GOOGLE_GENERATIVE_AI_API_KEY = Insert your API Key
  GEMINI_MODEL = Insert your gemini model here

  GOOGLE_CLIENT_ID = Insert your google client id
  GOOGLE_CLIENT_SECRET = Insert yout google client secret
  NEXTAUTH_SECRET = Insert String
  NEXTAUTH_URL = http://localhost:3000

  NEXT_PUBLIC_GOOGLE_CLIENT_ID = Insert your public google client id
  YOUTUBE_API_KEY = Insert your youtube API key

  GOOGLE_REDIRECT_URL = http://localhost:3000/api/auth/callback
  
  DB_HOST=localhost
  DB_USER=root
  DB_PASSWORD=''
  DB_NAME=chatai
  ```
  
### Step 4 Make Database
- Activate mySQL database
- Make database name 'chatai'
- insert SQL code on this repo to the database

### Step 5 Run the Project
```bash
  npm run dev
```

### Step 6 
- Ctrl + Click localhost link on the terminal to access the AI.

## 📋 Requirements (optional)
- Node.js versi 18 or newer
- MySQL Database example (XAMPP)
- Google API
