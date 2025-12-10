# 🌍 Local4LocalEU Project

Welcome to the **Local4LocalEU** project! 'Localforlocal' project evolved into the 'Gemeentepassen' project. This README provides all the necessary instructions to set up and run the application on your local machine.

The repository for the 'Gemeentepassen' project is here: [https://github.com/CentricEU/local4local.](https://github.com/CentricEU/gemeentepassen)

The project is founded by the EU NGI Program.

The project is composed of:

- **Frontend:** Angular
- **Backend:** Spring Boot
- **Database:** PostgreSQL

---

## 🚀 Prerequisites

Before starting, ensure you have the following installed on your machine:
- **PostgreSQL:** version 12 or higher
- **Maven:** 3.9.11
- **Node.js:** Version 20.11.1 or higher ([Download Node.js](https://nodejs.org/))
- **Angular CLI:** Version 18.1.0 or higher ([Install Angular CLI](https://angular.io/cli))
- **Java Development Kit (JDK):** Version 21 ([Download JDK](https://www.oracle.com/java/technologies/javase-downloads.html))
- **PostgreSQL:** Version 12 or higher ([Download PostgreSQL](https://www.postgresql.org/download/))
- **AWS Account:** A valid AWS account to configure the AWS CLI ([Create an AWS Account](https://aws.amazon.com/))
- **AWS CLI**

---

## 🛠️ Project Setup

### 1️⃣ Clone the Repository

1. Select the **development** branch.
2. Run the following commands:

   ```bash
   git clone https://github.com/CentricEU/Local4Local.git
   cd Local4Local
   ```

---

### 2️⃣ Backend Setup (Spring Boot)

#### Step 1: Configure the Database

1. Ensure PostgreSQL is running.
2. Create a new database in PostgreSQL, e.g., `local4localEU`.
3. Update your PostgreSQL credentials in the `application.properties` or `application.yml` file located in **`backend/src/main/resources/`**:

   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/local4localEU
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```
4. Set Up the `.aws` Folder

    a.  **Install AWS CLI** if you haven't already:
   - Download and install the AWS CLI from the [AWS CLI installation page](https://docs.aws.amazon.com/cli/latest/userguide/).

    b. **Configure the AWS CLI:**
       - Run the following command in your terminal to configure the AWS CLI with your credentials:

    ```bash
     aws configure
     ```

     - During configuration, you will be prompted to enter your:
     - **AWS Access Key ID**
     - **AWS Secret Access Key**
     - **Default region name** (e.g., `us-east-1`)
     - **Default output format** (e.g., `json`)

    c. The `.aws` folder will be created in your user directory, typically at `C:/Users/your_username/.aws` on Windows, or `~/.aws` on macOS/Linux.

    d. Ensure that your AWS credentials are properly configured by checking the folder and files at:
      - `C:/Users/your_username/.aws/credentials`
      - `C:/Users/your_username/.aws/config`


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
 📋 Note: If you encounter issues with dependency conflicts, try running:
 
  ```bash
 npm install --legacy-peer-deps
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

### Database Connection Issues

**Symptoms:**

- Backend fails to start
- Connection refused errors in logs

**Solutions:**

- Verify PostgreSQL service is running
- Confirm credentials in `application.properties` match your database configuration
- Ensure database name is `local4localEU` as specified in the connection URL

### Port Conflicts

**Symptoms:**

- Application fails to start
- "Address already in use" errors

**Required Ports:**

- Backend: 8080
- Frontend: 4200

**Solutions:**

- Check that required ports are available before starting applications
- Stop conflicting services or modify port configuration in application properties or Angular CLI configuration

### Frontend Dependency Errors

**Symptoms:**

- npm install fails
- Peer dependency warnings

**Solutions:**

- Use the `--legacy-peer-deps` flag during installation
- Verify Node.js version 20.11.1 or higher is installed by running `node --version`
- Ensure Angular CLI version 18.1.0 or higher is installed

### AWS Configuration Issues

**Symptoms:**

- Backend cannot access AWS services
- Authentication errors in logs

**Solutions:**

- Verify AWS CLI is properly installed
- Confirm credentials are configured by checking the `.aws` folder in your user directory
- Run `aws configure` again to update credentials if needed
- Ensure your AWS account has the necessary permissions
---


### 🌟 Thank you for using Local4LocalEU!
