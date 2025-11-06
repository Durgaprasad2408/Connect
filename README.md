                                                                                    
╔══════════════════════════════════════════════════════════════╗
║                     🚀 CONNECT - LinkedIn Clone              ║
║                 Professional Networking Platform             ║
╚══════════════════════════════════════════════════════════════╝

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.2.1-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.19.2-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-010101?style=flat&logo=socket.io&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1.16-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![JWT](https://img.shields.io/badge/JWT-9.0.2-000000?style=flat&logo=json-web-tokens&logoColor=white)](https://jwt.io/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-1.41.0-3448C5?style=flat&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

---

## 📋 Table of Contents

- [🎯 Project Overview](#project-overview)
- [🛠️ Tech Stack](#tech-stack)
- [⚡ Features](#features)
- [🚀 Quick Start](#quick-start)
- [📁 Project Structure](#project-structure)
- [💻 Usage Instructions](#usage-instructions)
- [🤝 Contributing](#contributing)
- [📄 License](#license)
- [🙏 Acknowledgements](#acknowledgements)
- [📞 Contact](#contact)

---

## 🎯 Project Overview

**Connect** is a modern, full-stack LinkedIn clone built with cutting-edge technologies. It provides a professional networking platform where users can create profiles, share posts, connect with professionals, and engage in meaningful professional discussions.

### Key Highlights ✨
- 🎨 **Modern UI/UX** with responsive design using Tailwind CSS
- 🔐 **Secure Authentication** with JWT tokens and bcrypt encryption
- 📱 **Real-time Features** powered by Socket.io for instant notifications
- ☁️ **Cloud Storage** integration with Cloudinary for profile photos and media
- 📊 **MongoDB Database** for scalable data management
- ⚡ **Lightning Fast** with Vite for frontend and optimized Express.js backend
- 🎯 **Professional Focus** designed specifically for networking and career development

---

## 🛠️ Tech Stack

### Frontend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | ^19.1.1 | Modern UI library for building interactive interfaces |
| **Vite** | ^7.1.7 | Fast build tool and development server |
| **React Router** | ^7.9.5 | Client-side routing for SPA navigation |
| **Tailwind CSS** | ^4.1.16 | Utility-first CSS framework for rapid UI development |
| **Axios** | ^1.13.2 | HTTP client for API requests |
| **Socket.io Client** | ^4.8.1 | Real-time bidirectional event-based communication |
| **React Icons** | ^5.5.0 | Comprehensive icon library |
| **@tailwindcss/vite** | ^4.1.16 | Vite plugin for Tailwind CSS |

### Backend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20.x | JavaScript runtime for server-side development |
| **Express.js** | ^4.19.2 | Web application framework for Node.js |
| **MongoDB** | ^8.2.1 | NoSQL database for flexible data storage |
| **Mongoose** | ^8.2.1 | MongoDB object modeling for Node.js |
| **JSON Web Tokens** | ^9.0.2 | Secure authentication token implementation |
| **bcrypt** | ^5.1.1 | Password hashing and verification |
| **Socket.io** | ^4.8.1 | Real-time WebSocket communication |
| **Cloudinary** | ^1.41.0 | Cloud-based image and video management |
| **CORS** | ^2.8.5 | Cross-Origin Resource Sharing middleware |
| **Helmet** | ^7.1.0 | Security middleware for Express applications |
| **Multer** | ^1.4.5-lts.1 | File upload handling middleware |

### Development Tools
| Technology | Version | Purpose |
|------------|---------|---------|
| **ESLint** | ^9.36.0 | Code linting for consistent quality |
| **Nodemon** | ^3.1.10 | Development utility for auto-restarting server |
| **Vite Plugin React** | ^5.0.4 | React support for Vite build tool |

---

## ⚡ Features

### 🔐 Authentication & Security
- User registration and login with secure JWT authentication
- Password encryption using bcrypt
- Protected routes and middleware validation
- Session management with refresh tokens
- Helmet security headers for XSS protection

### 👤 User Management
- Comprehensive user profiles with professional information
- Profile photo upload and management via Cloudinary
- Profile updates with real-time validation
- User search and discovery features

### 📝 Post Management
- Create, edit, and delete professional posts
- Rich text content support
- Image and media file uploads
- Real-time post interactions
- Post engagement tracking

### 🌐 Real-time Features
- Live notifications for connections and posts
- Real-time messaging system
- Instant profile updates
- Live activity feeds
- Socket.io powered real-time communication

### 📊 Data Management
- MongoDB database with Mongoose ODM
- Efficient data modeling and relationships
- Automatic data validation and sanitization
- Scalable database architecture

### 🎨 Modern UI/UX
- Responsive design for all device sizes
- Professional LinkedIn-inspired interface
- Smooth animations and transitions
- Loading states and error handling
- Mobile-first design approach

---

## 🚀 Quick Start

### Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** (v20.x or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Git** for version control

### Installation Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/Durgaprasad2408/Connect.git
cd Connect
```

#### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment variables file
cp .env.example .env

# Edit .env file with your configuration
```

#### 3. Configure Backend Environment Variables
Create a `.env` file in the `backend` directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/connect_clone
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/connect_clone

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRE=7d
REFRESH_TOKEN_SECRET=your_super_secure_refresh_token_secret_here
REFRESH_TOKEN_EXPIRE=30d

# Server Configuration
PORT=5000
NODE_ENV=development

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

#### 4. Frontend Setup
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Create environment variables file
cp .env.example .env
```

#### 5. Configure Frontend Environment Variables
Create a `.env` file in the `frontend` directory:

```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# App Configuration
VITE_APP_NAME=Connect
VITE_APP_VERSION=1.0.0
```

#### 6. Database Setup
Make sure MongoDB is running on your system or use MongoDB Atlas:
- **Local**: Start MongoDB service
- **Atlas**: Ensure your cluster is accessible

#### 7. Start the Application
```bash
# Start backend (in backend directory)
npm run dev

# Start frontend (in frontend directory, new terminal)
npm run dev
```

#### 8. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs (if implemented)

---

## 📁 Project Structure

```
connect-linkedin-clone/
├── README.md
├── .gitignore
│
├── backend/
│   ├── .env
│   ├── .gitignore
│   ├── package.json
│   ├── index.js
│   │
│   ├── middleware/
│   │   └── authMiddleware.js         # JWT authentication middleware
│   │
│   ├── models/
│   │   ├── Post.js                   # Post schema and model
│   │   ├── RefreshToken.js           # Refresh token model
│   │   └── User.js                   # User schema and model
│   │
│   ├── routes/
│   │   ├── authRoutes.js             # Authentication endpoints
│   │   ├── postRoutes.js             # Post management endpoints
│   │   └── userRoutes.js             # User management endpoints
│   │
│   └── utils/
│       ├── cloudinary.js             # Cloudinary configuration
│       └── jwt.js                    # JWT utility functions
│
└── frontend/
    ├── .env
    ├── .gitignore
    ├── eslint.config.js
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── vercel.json
    ├── vite.config.js
    │
    ├── public/
    │   └── vite.svg                   # Static assets
    │
    └── src/
        ├── App.jsx                    # Main application component
        ├── index.css                  # Global styles and Tailwind imports
        ├── main.jsx                   # Application entry point
        │
        ├── components/
        │   ├── Loader.jsx             # Loading spinner component
        │   ├── Modal.jsx              # Reusable modal component
        │   ├── Navbar.jsx             # Navigation bar component
        │   ├── PostCard.jsx           # Individual post display
        │   ├── PostForm.jsx           # Post creation/editing form
        │   ├── ProfilePhotoUpload.jsx # Profile image upload
        │   ├── ProfileUpdate.jsx      # Profile editing form
        │   ├── ProtectedRoute.jsx     # Route protection wrapper
        │   └── ShareProfile.jsx       # Profile sharing component
        │
        ├── context/
        │   ├── AuthContext.jsx        # Authentication state management
        │   └── SocketContext.jsx      # Socket.io context provider
        │
        ├── pages/
        │   ├── AuthPage.jsx           # Login/Registration page
        │   ├── FeedPage.jsx           # Main feed with posts
        │   ├── NotFound.jsx           # 404 error page
        │   ├── ProfilePage.jsx        # User profile page
        │   └── SinglePost.jsx         # Individual post view
        │
        ├── services/
        │   └── api.js                 # API service functions
        │
        └── utils/
            └── formatDate.js          # Date formatting utilities
```

---

## 💻 Usage Instructions

1. **Create Your Profile**: Register and fill out your professional information
2. **Build Your Network**: Connect with classmates, professors, and industry professionals
3. **Share Your Journey**: Post about your projects, internships, and academic achievements
4. **Discover Opportunities**: Browse job postings and networking events
5. **Learn from Others**: Follow industry leaders and participate in discussions


### Core Workflows 🔄

#### Creating a Professional Post
1. Navigate to the main feed
2. Click "Create Post" or the compose button
3. Write your content in the text area
4. Add images or files if needed
5. Click "Post" to share with your network

#### Updating Your Profile
1. Go to your profile page
2. Click "Edit Profile"
3. Update your information
4. Upload a new profile photo
5. Save changes to update your professional presence

---

## 🤝 Contributing

We welcome contributions from developers of all skill levels! Here's how you can help improve Connect:

### Getting Started

1. **Fork the Repository**
   ```bash
   git clone https://github.com/Durgaprasad2408/Connect.git
   cd Connect
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Write clean, well-commented code
   - Follow existing code style and conventions
   - Add tests for new functionality
   - Update documentation as needed

4. **Commit Your Changes**
   Use conventional commit messages:
   ```bash
   git commit -m "feat: add real-time messaging system"
   git commit -m "fix: resolve profile photo upload issue"
   git commit -m "docs: update API documentation"
   git commit -m "style: improve responsive design"
   git commit -m "refactor: optimize database queries"
   git commit -m "test: add unit tests for authentication"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Navigate to the original repository
   - Click "New Pull Request"
   - Provide a clear description of your changes
   - Link any related issues

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Development Guidelines

#### Code Style
- Use ESLint configuration provided in the project
- Follow React best practices and hooks patterns
- Use meaningful variable and function names
- Keep components small and focused
- Implement proper error handling

#### Testing
- Write unit tests for utility functions
- Test API endpoints with tools like Postman or Jest
- Verify responsive design on different screen sizes
- Test real-time features thoroughly

#### Security
- Never commit sensitive information (API keys, passwords)
- Use environment variables for configuration
- Validate all user inputs
- Follow OWASP security guidelines

### Areas for Contribution

#### 🎯 High Priority
- Real-time messaging system
- Mobile app development
- Performance optimizations
- Security enhancements

#### 🔧 Backend Improvements
- Database query optimization
- Additional API endpoints
- Enhanced authentication features
- File upload improvements
- API rate limiting

#### 🎨 Frontend Enhancements
- UI/UX improvements
- Accessibility features
- Animation and transitions
- Component library expansion


### Pull Request Process

1. **Ensure your code follows the project conventions**
2. **Test your changes thoroughly**
3. **Update documentation if needed**
4. **Create a detailed pull request description**
5. **Wait for code review and address feedback**

### Code Review Checklist

- [ ] Code follows project style guidelines
- [ ] All tests pass
- [ ] No console errors or warnings
- [ ] Responsive design works on all devices
- [ ] Security considerations addressed
- [ ] Documentation updated

---

---

## 🙏 Acknowledgements

We are grateful to the open-source community and the creators of the amazing technologies that power Connect:

### Core Technologies
- **React Team** - For the incredible React library that powers our frontend
- **Node.js Foundation** - For providing the robust JavaScript runtime
- **MongoDB** - For the flexible and scalable database solution
- **Express.js Community** - For the minimalist and flexible web framework
- **Vite Team** - For the lightning-fast build tool and development server

### Key Libraries & Services
- **Socket.io** - For enabling real-time bidirectional communication
- **Tailwind CSS** - For the utility-first CSS framework
- **Cloudinary** - For reliable cloud-based media management
- **JWT Community** - For secure authentication token implementation
- **bcrypt Team** - For password hashing and security

### Development Tools
- **ESLint** - For maintaining code quality and consistency
- **Vercel** - For seamless deployment and hosting solutions
- **GitHub** - For version control and collaborative development

### Inspiration
- **LinkedIn** - For inspiring the professional networking concept
- **Open Source Community** - For creating an ecosystem of shared knowledge
- **Contributors** - For every developer who has contributed to this project

### Special Thanks
- All beta testers who provided valuable feedback
- Contributors who helped improve code quality and documentation
- The developer community for support and inspiration
- Educational institutions promoting open-source learning

---

## 📞 Contact

We'd love to hear from you! Whether you have questions, suggestions, or want to contribute, don't hesitate to reach out.

### 👨‍💻 Development Team
**Lead Developer**: [Durga Prasad Pandiripalli]  
📧 Email: [durgaprasadpandiripalli@outlook.com]  
💼 LinkedIn: [https://www.linkedin.com/in/durga-prasad-pandiripalli-5b97ab264]  
🌐 Portfolio: [durgaprasadpandiripalli.me]  


### 🚀 Get Involved
- **⭐ Star this repository** if you find it helpful
- **🐛 Report issues** you encounter
- **💡 Suggest features** you'd like to see
- **🤝 Contribute** to the codebase
- **📢 Spread the word** about Connect

---

<div align="center">

### ⭐ If you find this project helpful, please consider giving it a star! ⭐

**Built with ❤️ by the Connect Development Team**

[⬆️ Back to Top](#connect---linkedin-clone)

</div>