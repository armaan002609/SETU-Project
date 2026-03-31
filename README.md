# SETU – Smart E-Learning Platform 🎓
### *Low Bandwidth Learning for Everyone*

**SETU** is a high-efficiency e-learning platform specifically designed to bridge the education gap in rural institutions where internet connectivity is often unstable or slow. By prioritizing low-bandwidth optimizations and an audio-first approach, SETU ensures that quality education is never hindered by infrastructure limitations.

---

## 🚀 Key Features

-   **📶 Low Bandwidth Optimization**: Optimized for 2G/3G networks, ensuring smooth access to learning materials.
-   **🎧 Audio-First Learning**: High-quality audio delivery that works seamlessly even on the weakest connections.
-   **📲 Progressive Web App (PWA)**: A lightweight experience that runs on any device without requiring heavy downloads or high-end hardware.
-   **👨‍🏫 Teacher & Student Dashboards**: Dedicated interfaces for managing courses, tracking progress, and conducting live sessions.
-   **📝 Smart Quizzes**: Interactive quiz modules for real-time assessment and feedback.
-   **📦 Resilient Downloads**: Support for offline learning and resume-able downloads for unstable connections.
-   **⚡ AI-Assisted Learning**: Integrated smart features to assist students in their learning journey.

---

## 🛠️ Tech Stack

-   **Frontend**: 
    -   HTML5, CSS3 (Modern, responsive UI)
    -   JavaScript (Vanilla & Node-based logic)
    -   Google Fonts (Roboto)
-   **Backend**: 
    -   **Primary**: PHP (Optimized for XAMPP/LAMP environments)
    -   **Alternative**: Node.js + Express (located in `server.js`)
-   **Database**: 
    -   **Primary**: MySQL (via XAMPP)
    -   **Alternative**: SQLite (`database.sqlite`)

---

## ⚙️ Setup Instructions (XAMPP / PHP)

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-repo/SETU.git
    ```
2.  **Move to Web Root**:
    Copy the `SETU` folder to your `C:\xampp\htdocs\` directory.
3.  **Database Setup**:
    -   Start **Apache** and **MySQL** from the XAMPP Control Panel.
    -   Open [phpMyAdmin](http://localhost/phpmyadmin/).
    -   Create a new database named `setu_db`.
    -   Import the `setup.sql` file provided in the root directory.
4.  **Configuration**:
    -   Check `db_connect.php` to ensure the MySQL credentials (`root`, empty password) match your environment.
5.  **Run the Application**:
    -   Navigate to `http://localhost/SETU/login.html` in your browser.

### 🟢 Alternative: Node.js Backend
If you prefer running the Node.js version:
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the server:
    ```bash
    npm start
    ```
    *Note: This uses the SQLite database by default.*

---

## 📁 Project Structure

-   `index.html`: Main landing page with platform overview.
-   `student.html` / `teacher.html`: Role-based dashboard interfaces.
-   `setup.sql`: Database schema and initial configuration.
-   `db_connect.php`: Centralized database connection logic.
-   `uploads/`: Directory for stored learning materials.
-   `script.js`, `student.js`, `teacher.js`: Frontend logic for different modules.
-   `server.js`: Node.js/Express backend implementation.

---

## 🤝 Contributing
Contributions are welcome! If you have ideas for improving low-bandwidth performance or adding new features, feel free to fork the repo and submit a PR.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
"# SETU" 
