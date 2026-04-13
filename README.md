# SETU – Smart E-Learning Platform 🎓
### *Bridge the Divide with Low-Bandwidth, AI-Powered Learning*

**SETU** is a high-efficiency e-learning platform specifically designed to bridge the education gap in rural institutions where internet connectivity is often unstable or slow. By combining low-bandwidth optimizations with cutting-edge **Generative AI**, SETU ensures that quality education is never hindered by infrastructure limitations.

---

## 🚀 Key Features

-   **🤖 AI-Powered Quiz Extraction**: Automatically extract Multiple Choice Questions (MCQs) from PDF and DOCX study materials using Google Gemini AI, saving teachers hours of manual work.
-   **🔐 Secure Multi-Channel Auth**: 
    -   **Google OAuth 2.0 Integration**: One-tap secure login for students and teachers.
    -   **OTP Verification**: Email-based One-Time Password verification for secure registration.
-   **📊 Real-Time Analytics Dashboard**: Live tracking of students, active sessions, and uploaded content for comprehensive overview at a glance.
-   **📶 Low Bandwidth Optimization**: Optimized data fetching and audio-first delivery that works seamlessly on 2G/3G networks.
-   **📝 Persistent Learning Path**: Student quiz attempts, scores, and detailed answer explanations are stored persistently for progress tracking.
-   **🎧 Audio-First Content**: High-quality audio delivery prioritized to ensure content accessibility even on the weakest connections.
-   **📲 Progressive Web App (PWA)**: A lightweight experience that runs on any device without requiring heavy downloads or high-end hardware.

---

## 🛠️ Tech Stack

-   **Frontend**: 
    -   **Core**: HTML5, CSS3 (Modern Glassmorphic UI)
    -   **Logic**: Vanilla JavaScript
    -   **Typography**: Google Fonts (Outfit, Inter)
-   **Backend**: 
    -   **Primary**: PHP (Optimized for performance)
    -   **Intelligence**: Google Gemini AI (Flash 1.5/2.0 Models)
    -   **Alternative**: Node.js + Express (located in `server.js`)
-   **Database**: 
    -   **Primary**: MySQL (via XAMPP)
    -   **Local Development**: SQLite (`database.sqlite`)

---

## ⚙️ Setup Instructions

### 1. Prerequisites
- **XAMPP** (Apache & MySQL)
- **Google Cloud Console Project** (for OAuth2)
- **Google Gemini API Key**

### 2. Installation
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-repo/SETU.git
    ```
2.  **Move to Web Root**:
    Copy the `SETU` folder to your `C:\xampp\htdocs\` directory.
3.  **Database Setup**:
    -   Start **Apache** and **MySQL** from XAMPP.
    -   Open [phpMyAdmin](http://localhost/phpmyadmin/).
    -   Create a database named `setu_db`.
    -   Import `setup.sql` from the root directory.

### 3. Configuration
1.  Locate `config.php` in the root directory.
2.  Add your credentials:
    ```php
    define('GOOGLE_CLIENT_ID', 'YOUR_GOOGLE_CLIENT_ID');
    define('GEMINI_API_KEY', 'YOUR_GEMINI_API_KEY');
    ```

### 4. Run Application
-   Navigate to `http://localhost/SETU/index.html` (Landing Page) or `login.html`.

---

## 📁 Project Structure

-   `index.html`: Modern landing page with globe visualization.
-   `student.html` / `teacher.html`: Role-specific dashboard interfaces.
-   `process_ai_quiz.php`: Backend logic for AI MCQ extraction using Gemini.
-   `google_auth.php` / `otp_handler.php`: Advanced authentication handlers.
-   `db_connect.php`: Database connection layer.
-   `uploads/`: Directory for learning materials.
-   `setup.sql`: Core database schema.

---

## 🤝 Contributing
Contributions are welcome! If you have ideas for improving AI features or network resilience, feel free to fork and PR.

---

## 📄 License
This project is licensed under the MIT License.

