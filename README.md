# 🎓 AI Study Assistant

An AI-powered learning platform designed to help students study smarter, organize their learning goals, and improve productivity through intelligent study tools.

AI Study Assistant aims to bring essential academic tools together in one place, including AI-assisted content summarization, quizzes, study planning, and a user-friendly interface.

---

## 🚀 Project Overview

Students often spend significant time organizing notes, revising topics, and preparing for examinations. AI Study Assistant aims to simplify this process by providing a centralized platform for learning, revision, and study management.

### ✨ Key Features

- **AI-Powered Summarization** — Designed to help students summarize study materials and understand important concepts.
- **Quiz Module** — A dedicated interface for quiz-based practice and knowledge assessment.
- **Study Plan Dashboard** — Create and manage study tasks, track progress, and organize weekly learning goals.
- **User Authentication** — Backend authentication development is being handled as part of the project.
- **Responsive Frontend** — A structured interface for navigating the platform's study tools.
- **Backend Integration** — Designed to connect frontend features with backend services and database operations.

> **Development status:** The project is under active development. Feature availability depends on the current implementation and backend integration.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Frontend structure |
| CSS3 | Styling and responsive layouts |
| JavaScript | Frontend interactions |
| Python | Backend development |
| FastAPI | Backend API framework, where configured |
| Database | Data storage through the configured database layer |
| Git & GitHub | Version control and team collaboration |

The final technology stack may evolve as development continues.

---

## 📁 Project Structure

```text
AI_STUDY_ASSISTANT/
│
├── Landing-page/
│   ├── landing_page.html
│   ├── landing_page.css
│   └── landing_page.js
│
├── login-page/
│   ├── index.html
│   ├── login.css
│   └── login.js
│
├── Registration/
│   ├── registration.html
│   ├── registration.css
│   └── registration.js
│
├── quiz-page/
│   ├── quiz-index.html
│   ├── quiz-script.js
│   └── quiz-style.css
│
├── summarize-page/
│   ├── summarize-page.html
│   ├── summarize-page.css
│   └── summarize-page.js
│
├── study-plan/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── main.py
├── database.py
├── models.py
├── schemas.py
├── test_db.py
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

*Note: The structure above represents the planned/current project organization. Update filenames and folders if your repository differs.*

---

## ⚙️ Getting Started

Follow these steps to run the project locally.

### 1. Clone the repository

```bash
git clone https://github.com/CodeCrafterDP/AI_STUDY_ASSISTANT.git
```

Navigate to the project directory:

```bash
cd AI_STUDY_ASSISTANT
```

### 2. Set up the Python environment

Make sure Python is installed on your system.

Create a virtual environment:

**Windows**
```bash
python -m venv .venv
.venv\Scripts\activate
```

**macOS / Linux**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

Create your local `.env` file from the example:

**Windows**
```bash
copy .env.example .env
```

**macOS / Linux**
```bash
cp .env.example .env
```

Open `.env` and configure the environment variables required by your backend, such as database connection details and API keys.

**Important:** Never commit your real `.env` file, API keys, passwords, or database credentials to GitHub.

### 5. Start the backend

If `main.py` exposes a FastAPI application named `app`, run:

```bash
uvicorn main:app --reload
```

The local API will typically be available at:

```text
http://127.0.0.1:8000
```

If FastAPI documentation is enabled, open:

```text
http://127.0.0.1:8000/docs
```

If your backend uses a different application entry point or startup command, follow the configuration in your source code.

### 6. Run the frontend

Open the relevant HTML file in your browser, or use the **Live Server** extension in Visual Studio Code.

For the Study Plan page, open:

```text
study-plan/index.html
```

The standalone Study Plan frontend currently uses browser `localStorage` for its locally managed data. Persistent database storage requires API integration.

---

## 🔗 Frontend and Backend Integration

The project is being developed with a separation between the frontend interface and backend services.

The planned integration workflow is:

1. The frontend sends HTTP requests to backend API endpoints.
2. The backend validates incoming requests.
3. Database models and services process the required operations.
4. The backend returns structured responses.
5. The frontend updates the interface based on the response.

Before connecting a feature, confirm the API endpoint, HTTP method, request body, response format, and authentication requirements with the team member responsible for backend APIs.

---

## 🔐 Security Considerations

- Store secrets and credentials in environment variables.
- Keep `.env` out of version control.
- Validate and sanitize incoming user data.
- Use appropriate password hashing and authentication practices.
- Apply authorization checks to protected endpoints.
- Avoid exposing private user information in API responses.
- Configure CORS appropriately for the frontend origin.

---

## 🧪 Testing

Run the project's available tests using the test framework configured in the repository.

For example, if the project uses `pytest`:

```bash
pytest
```

If `pytest` is not installed, or tests use a different framework, follow the project's dependency and testing configuration.

Test API endpoints, database operations, authentication flows, and frontend interactions before merging changes.

---

## 🗺️ Future Improvements

- [ ] Complete frontend and backend API integration.
- [ ] Implement and test user authentication.
- [ ] Connect study plans to persistent database storage.
- [ ] Develop AI-powered document and note summarization.
- [ ] Implement dynamic quizzes and progress tracking.
- [ ] Add personalized study recommendations.
- [ ] Improve mobile responsiveness and accessibility.
- [ ] Add automated tests and deployment configuration.

---

## 👥 Team Collaboration

This project is developed collaboratively using Git and GitHub.

Recommended workflow:

1. Pull the latest changes from the relevant branch.
2. Create or switch to your assigned feature branch.
3. Make changes only to the files related to your task.
4. Test your changes locally.
5. Commit with a clear, descriptive message.
6. Push your branch and open a pull request when appropriate.

Example:

```bash
git checkout feature/backend-auth
git pull origin feature/backend-auth
git add .
git commit -m "Describe your changes"
git push origin feature/backend-auth
```

**Tip:** Review `git status` before using `git add .` to ensure you do not accidentally commit unrelated files or secrets.

---

## 🤝 Contributing

Contributions, improvements, bug reports, and feature suggestions are welcome from project collaborators.

Please keep changes focused, document important configuration updates, and test your code before submitting it for review.

---

## 📄 License

No license has been specified yet. Unless a license is added to the repository, reuse and redistribution are subject to the applicable default copyright rules.

---

## 💡 Our Goal

**To make studying more organized, accessible, and productive by combining useful learning tools with AI-powered assistance.**

Built with ❤️ by the AI Study Assistant team.
