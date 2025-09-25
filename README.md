# 📚 Smart Study Planner

A modern, interactive dashboard for managing your study tasks and schedule. Built with vanilla HTML, CSS, and JavaScript - no frameworks required!

![Smart Study Planner Dashboard](https://img.shields.io/badge/Status-Active-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue) ![HTML](https://img.shields.io/badge/HTML-5-orange) ![CSS](https://img.shields.io/badge/CSS-3-blue) ![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow)

## ✨ Features

### 🏠 Dashboard Overview
- **Task Statistics**: Real-time counts of total, completed, pending, and overdue tasks
- **Quick Actions**: One-click task creation with full modal form
- **Recent Tasks**: Display of your most recently created tasks
- **Upcoming Deadlines**: Smart deadline tracking with urgency indicators

### 📋 Task Management
- **Modal-Based Forms**: Clean, popup-based task creation and editing
- **Comprehensive Task Data**: Title, subject, dates, priority, notes, and reminders
- **Priority Levels**: High, Medium, and Low priority classification
- **Progress Tracking**: Visual progress indicators for each task
- **Bulk Actions**: Edit, delete, and mark tasks as complete

### 📅 Interactive Timeline
- **Visual Schedule**: Gantt-chart style timeline view of your tasks
- **Flexible Time Ranges**: 7, 14, or 30-day views
- **Smart Navigation**: Previous/Next navigation with "Today" quick jump
- **Advanced Filtering**: Filter by priority, subject, and completion status
- **Color-Coded Tasks**: Visual priority and status indicators
- **Interactive Elements**: Click tasks to edit, hover for detailed tooltips

### 📈 Analytics & Insights
- **Subject Distribution**: Breakdown of tasks by subject area
- **Productivity Insights**: Smart recommendations based on your progress
- **Completion Tracking**: Real-time completion rate analysis
- **Performance Metrics**: Overdue task monitoring and suggestions

### 🔔 Smart Notifications
- **Browser Notifications**: Customizable reminder system
- **Deadline Alerts**: Automatic notifications before due dates
- **Smart Scheduling**: Reminders that respect your browser visibility

### 💾 Data Management
- **Local Storage**: All data saved securely in your browser
- **Import/Export**: JSON-based backup and restore functionality
- **Data Persistence**: Your tasks are automatically saved as you work
- **Cross-Session**: Data persists between browser sessions

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software installation required!

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Arsenal17x/Smart-Study-Planner.git
   cd Smart-Study-Planner
   ```

2. **Open in browser**
   - **Option 1**: Double-click `index.html` to open directly in your browser
   - **Option 2**: Use a local server (recommended for full functionality):
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx serve
     
     # Using PHP
     php -S localhost:8000
     ```
   - Navigate to `http://localhost:8000` in your browser

### First Use

1. **Enable Notifications** (Optional): Click the 🔔 button in the header to enable browser notifications for reminders
2. **Create Your First Task**: Use the "Add New Task" button on the overview page
3. **Explore Sections**: Navigate through Overview, Tasks, Timeline, and Analytics using the sidebar
4. **Customize Filters**: Use timeline filters to focus on specific priorities or subjects

## 🎯 Usage Guide

### Creating Tasks
1. Click "Add Task" from any section
2. Fill in the task details:
   - **Title**: What you need to study
   - **Subject**: Course or topic area
   - **Start Date**: When you plan to begin
   - **Due Date**: Deadline for completion
   - **Estimated Hours**: Time you expect to spend
   - **Priority**: High, Medium, or Low
   - **Notes**: Additional details or chapters to cover
   - **Reminder**: Minutes before due date for notification
3. Click "Save Task"

### Managing Tasks
- **Edit**: Click "Edit" on any task or click timeline bars
- **Complete**: Mark tasks as done using the "Done" button
- **Delete**: Remove tasks with the "Delete" button
- **Filter**: Use timeline filters to focus on specific tasks

### Timeline Navigation
- **Change Range**: Select 7, 14, or 30-day views
- **Navigate Time**: Use ◀ ▶ buttons to move through dates
- **Jump to Today**: Click "📅 Today" to return to current date
- **Filter Tasks**: Use priority, subject, and status filters

### Data Backup
- **Export**: Click "Export" to download your tasks as JSON
- **Import**: Click "Import" to restore tasks from a JSON file

## 🎨 Customization

### Color Themes
The app uses CSS custom properties for easy theme customization. Edit `style.css`:

```css
:root {
    --bg: #0f1724;           /* Background color */
    --card: #0b1220;         /* Card background */
    --accent: #7c5cff;       /* Accent color */
    --success: #22c55e;      /* Success/completed color */
    --danger: #ef4444;       /* Error/overdue color */
}
```

### Adding Features
The modular structure makes it easy to extend:
- **New Sections**: Add to the sidebar navigation and create corresponding HTML/CSS
- **Custom Filters**: Extend the filter functions in `script.js`
- **Additional Analytics**: Add new widgets to the analytics section

## 🏗️ Project Structure

```
Smart-Study-Planner/
│
├── index.html          # Main HTML structure
├── style.css           # All styling and responsive design
├── script.js           # Application logic and functionality
└── README.md           # This documentation
```

### Key Components

- **Dashboard Layout**: CSS Grid-based responsive layout
- **Modal System**: Popup forms for task management
- **Timeline Engine**: Dynamic Gantt-chart rendering
- **Filter System**: Multi-criteria task filtering
- **Storage Manager**: LocalStorage-based data persistence
- **Notification System**: Browser API integration

## 🔧 Technical Details

### Browser Compatibility
- **Chrome**: 70+
- **Firefox**: 65+
- **Safari**: 12+
- **Edge**: 79+

### Technologies Used
- **HTML5**: Semantic structure and accessibility
- **CSS3**: Grid, Flexbox, animations, and responsive design
- **Vanilla JavaScript**: ES6+ features, no external dependencies
- **Web APIs**: Local Storage, Notifications, File API

### Performance Features
- **Lazy Rendering**: Sections render only when active
- **Efficient Updates**: Minimal DOM manipulation
- **Memory Management**: Proper timer cleanup for notifications
- **Responsive Design**: Optimized for all screen sizes

## 📱 Mobile Support

The app is fully responsive and works great on mobile devices:
- **Collapsible Sidebar**: Icon-only navigation on small screens
- **Touch-Friendly**: Large buttons and touch targets
- **Mobile Forms**: Optimized input fields and date pickers
- **Responsive Timeline**: Horizontal scrolling for timeline view

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the existing code style
4. **Test thoroughly**: Ensure all features work across browsers
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**: Describe your changes and their benefits

### Development Guidelines
- Use vanilla JavaScript (no frameworks)
- Maintain accessibility standards
- Follow existing naming conventions
- Test on multiple browsers
- Keep the bundle size minimal

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♀️ Support

### Frequently Asked Questions

**Q: Do I need an internet connection?**
A: No! The app works completely offline after the initial page load.

**Q: Where is my data stored?**
A: All data is stored locally in your browser's localStorage. It never leaves your device.

**Q: Can I use this on multiple devices?**
A: Use the export/import feature to transfer your data between devices.

**Q: What happens if I clear my browser data?**
A: Your tasks will be lost. Make sure to export your data regularly as a backup.

### Issues and Bug Reports

If you encounter any issues:
1. Check the browser console for error messages
2. Try refreshing the page
3. Clear localStorage and start fresh (note: this will delete your tasks)
4. [Open an issue](https://github.com/Arsenal17x/Smart-Study-Planner/issues) with:
   - Browser version
   - Steps to reproduce
   - Expected vs actual behavior
   - Console error messages (if any)

## 🔄 Changelog

### Version 2.0 (Current)
- ✨ Complete dashboard redesign
- 🎯 Modal-based task management
- 📅 Interactive timeline with filters
- 📊 Analytics and insights
- 🔔 Enhanced notification system
- 📱 Improved mobile responsiveness

### Version 1.0
- Basic task management
- Simple timeline view
- Local storage integration
- Export/import functionality

## 🎯 Roadmap

### Upcoming Features
- [ ] **Recurring Tasks**: Support for daily, weekly, monthly tasks
- [ ] **Study Sessions**: Pomodoro timer integration
- [ ] **Goal Setting**: Long-term academic goal tracking
- [ ] **Calendar Integration**: Sync with Google Calendar
- [ ] **Themes**: Light/dark mode toggle
- [ ] **Advanced Analytics**: Study time tracking and reporting
- [ ] **Collaboration**: Share study plans with classmates
- [ ] **Mobile App**: Native mobile application

---

**Made with ❤️ for students everywhere**

*Start organizing your study life today!* 🚀