# 🌍 Local4LocalEU Project

Welcome to the **Local4LocalEU** project! This README provides all the necessary instructions to set up and run the application on your local machine. 

The project is composed of:

- **Frontend:** Angular
- **Backend:** Spring Boot
- **Database:** PostgreSQL

---

## 🚀 Prerequisites

Before starting, ensure you have the following installed on your machine:

- **Node.js:** Version 20.11.1 or higher ([Download Node.js](https://nodejs.org/))
- **Angular CLI:** Version 18.1.0 or higher ([Install Angular CLI](https://angular.io/cli))
- **Java Development Kit (JDK):** Version 21 ([Download JDK](https://www.oracle.com/java/technologies/javase-downloads.html))
- **PostgreSQL:** Version 12 or higher ([Download PostgreSQL](https://www.postgresql.org/download/))

---

## 🛠️ Project Setup

### 1️⃣ Clone the Repository

1. Select the **development** branch.
2. Run the following commands:

   ```bash
   git clone https://github.com/Centric-RO/Local4Local.git
   cd Local4LocalEU
   ```

---

### 2️⃣ Backend Setup (Spring Boot)

#### Step 1: Configure the Database

1. Ensure PostgreSQL is running.
2. Create a new database in PostgreSQL, e.g., `local4local_eu`.
3. Update your PostgreSQL credentials in the `application.properties` or `application.yml` file located in **`backend/src/main/resources/`**:

   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/local4local_eu
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

#### Step 2: Build and Run the Backend

1. Open the `backend` folder in your IDE.
2. Build and run the Spring Boot project.
3. The backend service will now be running at [http://localhost:8080](http://localhost:8080).

---

### 3️⃣ Frontend Setup (Angular)

#### Step 1: Navigate to the Frontend Directory

```bash
cd frontend
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Run the Frontend Application

```bash
npm start
```

- The frontend should now be running at [http://localhost:4200](http://localhost:4200).

---

## 🌐 Running the Application

1. Ensure that both the **backend** and **frontend** servers are running.
2. Open your browser and navigate to [http://localhost:4200](http://localhost:4200).
3. The frontend should now be connected to the backend and ready to use.

---

## 🐞 Troubleshooting

### Backend Issues

- **Database Connection Error:** Ensure PostgreSQL is running and the credentials in `application.properties` are correct.
- **Port Conflicts:**  Verify that port `8080` is free or update the port in `application.properties`.

### Frontend Issues

- **Dependency Errors:** Run `npm install` to ensure all dependencies are installed.
- **Port Conflicts:** Verify that port `4200` is free or update the Angular CLI configuration.

---


### 🌟 Thank you for using Local4LocalEU!
