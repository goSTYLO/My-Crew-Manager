# My Crew Manager

A comprehensive project management platform with AI-powered features, real-time collaboration, and team management capabilities.

## 🚀 Features

### Core Project Management
- **Project Creation & Management** - Create and manage projects with detailed information
- **AI-Powered Project Analysis** - Upload project proposals and get AI-generated insights
- **Backlog Management** - Generate and manage epics, user stories, and tasks
- **Sprint Planning** - Organize work into sprints with timeline management
- **Task Assignment** - Assign tasks to team members with status tracking

### Team Collaboration
- **Project Invitations** - Invite users to join projects with acceptance workflow
- **Real-time Chat** - WebSocket-based communication system
- **Team Member Management** - Add, remove, and manage project members
- **Role-based Access** - Different permission levels for project management

### AI Integration
- **LLM-Powered Analysis** - Extract features, roles, goals, and timelines from project proposals
- **Backlog Generation** - Automatically create epics, sub-epics, user stories, and tasks
- **Smart Project Insights** - AI-driven project recommendations and analysis

## 🏗️ Architecture

### Backend (Django)
- **Django REST Framework** - RESTful API endpoints
- **WebSocket Support** - Real-time communication via Django Channels
- **AI API Module** - Core project management and AI integration
- **Project Management Module** - Traditional project management features
- **Chat Module** - Real-time messaging system
- **Users Module** - User authentication and management

### Frontend
- **React Web App** - Modern web interface with TypeScript
- **Flutter Mobile App** - Cross-platform mobile application

## 📋 Project Invitation System

The platform includes a comprehensive project invitation system that allows project creators to invite users to join their projects.

### Features
- **Invitation Workflow** - Send, accept, and decline project invitations
- **Permission Management** - Only project creators can send invitations
- **Duplicate Prevention** - Prevents multiple pending invitations to the same user
- **Automatic Membership** - Accepting an invitation automatically creates project membership
- **Status Tracking** - Track invitation status (pending, accepted, declined, expired)
- **Cleanup Management** - Automatic cleanup of old declined invitations

### API Endpoints

#### Create Invitation
```http
POST /api/ai/invitations/
Content-Type: application/json

{
  "project": 1,
  "invitee": 2,
  "message": "Join our awesome project!"
}
```

#### Accept Invitation
```http
POST /api/ai/invitations/{id}/accept/
```

#### Decline Invitation
```http
POST /api/ai/invitations/{id}/decline/
```

#### Get My Invitations
```http
GET /api/ai/invitations/my-invitations/
```

#### List Project Invitations
```http
GET /api/ai/invitations/?project_id=1
```

### Management Commands

#### Cleanup Old Declined Invitations
```bash
# Delete declined invitations older than 30 days
python manage.py purge_old_invitations --days=30

# Preview what would be deleted (dry run)
python manage.py purge_old_invitations --days=30 --dry-run
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- Flutter SDK (for mobile development)

### Backend Setup
```bash
# Clone the repository
git clone <repository-url>
cd My-Crew-Manager

# Install Python dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Frontend Setup
```bash
# Web application
cd web
npm install
npm run dev

# Mobile application
cd mobile/mycrewmanager
flutter pub get
flutter run
```

## 📁 Project Structure

```
My-Crew-Manager/
├── ai_api/                    # AI-powered project management
│   ├── models.py             # Project, Epic, UserStory, Task models
│   ├── views.py              # REST API endpoints
│   ├── serializers.py        # API serialization
│   ├── admin.py              # Django admin interface
│   └── management/           # Management commands
├── project_management/       # Traditional project management
├── chat/                     # Real-time messaging
├── users/                    # User authentication
├── web/                      # React frontend
├── mobile/                   # Flutter mobile app
├── LLMs/                     # AI/LLM integration
└── docs/                     # API documentation
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=sqlite:///db.sqlite3

# AI API Keys (optional)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Django Settings
SECRET_KEY=your_secret_key
DEBUG=True
```

## 📚 API Documentation

### AI API Endpoints
- **Projects**: `/api/ai/projects/`
- **Invitations**: `/api/ai/invitations/`
- **Epics**: `/api/ai/epics/`
- **User Stories**: `/api/ai/user-stories/`
- **Tasks**: `/api/ai/story-tasks/`
- **Members**: `/api/ai/project-members/`

### Chat Endpoints
- **WebSocket**: `ws://localhost:8000/ws/chat/`
- **Messages**: `/api/chat/messages/`

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test ai_api
python manage.py test chat
```

### Frontend Tests
```bash
# Web app tests
cd web
npm test

# Mobile app tests
cd mobile/mycrewmanager
flutter test
```

## 🚀 Deployment

### Production Setup
1. Set `DEBUG=False` in settings
2. Configure production database
3. Set up static file serving
4. Configure WebSocket support
5. Set up SSL certificates

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `docs/` folder
- Review the API endpoints documentation

## 🔄 Recent Updates

### Project Invitation System (Latest)
- ✅ Complete invitation workflow implementation
- ✅ RESTful API endpoints for invitation management
- ✅ Django admin interface for invitation oversight
- ✅ Automatic membership creation on acceptance
- ✅ Duplicate invitation prevention
- ✅ Management command for cleanup of old invitations
- ✅ Comprehensive testing and validation

---

**Built with ❤️ using Django, React, Flutter, and AI**
