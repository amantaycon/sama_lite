const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
// const db = require('./mysqlcon'); // Assuming you have a db.js for database connection

// db.connect((err) => {
//     if (err) { console.error('Error connecting to MySQL:', err); return; }
//     var columns = `id INT AUTO_INCREMENT PRIMARY KEY,
//         name VARCHAR(255),
//         description VARCHAR(255) UNIQUE,
//         deadline DATE,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`;

//     var sql = `CREATE TABLE IF NOT EXISTS projects (${columns})`;
//     db.query(sql, (err) => {
//         if (err) { console.error({ error: 'Error creating users table', details: err }); return; }
//     });


//     // Create tasks and comments tables
//     var columns = `id INT AUTO_INCREMENT PRIMARY KEY,
//       projectId INT,
//       title VARCHAR(255),
//       status ENUM('Not Started', 'In Progress', 'Completed') DEFAULT 'Not Started',
//       priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium',
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE`;

//     var sql = `CREATE TABLE IF NOT EXISTS tasks (${columns})`;
//     db.query(sql, (err) => {
//         if (err) { console.error({ error: 'Error creating users table', details: err }); return; }
//     });

//     var columns = `id INT AUTO_INCREMENT PRIMARY KEY,
//         projectId INT,
//         userId INT,
//         userName VARCHAR(255),
//         text TEXT,
//         createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE`;
//     var sql = `CREATE TABLE IF NOT EXISTS comments (${columns})`;
//     db.query(sql, (err) => {
//         if (err) { console.error({ error: 'Error creating comments table', details: err }); return; }
//     });
// });



// Sample data


let projects = [
    { id: 1, name: 'Website Redesign', description: 'Redesign company website', deadline: '2025-07-15' },
    { id: 2, name: 'Mobile App', description: 'Build new mobile application', deadline: '2025-08-30' }
];

// Sample tasks and comments
let tasks = [
    { id: 1, projectId: 1, title: 'Create wireframes', status: 'Completed', priority: 'High', comments: [] },
    { id: 2, projectId: 1, title: 'Develop homepage', status: 'In Progress', priority: 'High', comments: [] },
    { id: 3, projectId: 2, title: 'API integration', status: 'Not Started', priority: 'Medium', comments: [] }
];

let comments = [
    { id: 1, projectId: 1, userId: 1, userName: 'John Doe', text: 'Great project idea!', createdAt: new Date() },
    { id: 2, projectId: 1, userId: 2, userName: 'Jane Smith', text: 'When do we start?', createdAt: new Date() }
];

// Sample data
// let projects = [];
// let tasks = [];
// let comments = [];

// async function loadSampleData() {
//     try {
//         // Load projects
//         const [projectRows] = await db.query('SELECT * FROM projects');
//         projects = projectRows;

//         // Load tasks
//         const [taskRows] = await db.query('SELECT * FROM tasks');
//         tasks = taskRows.map(task => ({
//             ...task,
//             comments: [] // Initialize comments as empty array
//         }));

//         // Load comments
//         const [commentRows] = await db.query('SELECT * FROM comments');
//         comments = commentRows;

//         // Associate comments with tasks
//         tasks.forEach(task => {
//             task.comments = comments.filter(c => c.taskId === task.id);
//         });

//     } catch (error) {
//         console.error('Error loading sample data:', error);
//     }
// }





// Middleware


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

// Routes
app.get('/', (req, res) => {
    res.render('dashboard', {
        projectCount: projects.length,
        taskCount: tasks.length,
        completedCount: tasks.filter(t => t.status === 'Completed').length,
        tasks: tasks
    });
});

app.get('/projects', (req, res) => {
    res.render('projects', { projects });
});

app.get('/projects/:id', (req, res) => {
    const project = projects.find(p => p.id == req.params.id);
    if (!project) {
        return res.status(404).send('Project not found');
    }
    const projectComments = comments.filter(c => c.projectId == req.params.id);
    res.render('project-details', {
        project,
        comments: projectComments
    });
});

app.get('/tasks', (req, res) => {
    const filteredTasks = req.query.projectId
        ? tasks.filter(t => t.projectId == req.query.projectId)
        : tasks;

    res.render('tasks', {
        tasks: filteredTasks,
        projects,
        selectedProjectId: req.query.projectId
    });
});

// API Endpoints
app.post('/api/tasks', (req, res) => {
    try {
        const newTask = {
            id: tasks.length + 1,
            title: req.body.title,
            projectId: parseInt(req.body.projectId),
            status: req.body.status,
            priority: req.body.priority,
            comments: []
        };

        tasks.push(newTask);
        res.status(201).json(newTask);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/projects', (req, res) => {
    const newProject = {
        id: projects.length + 1,
        name: req.body.name,
        description: req.body.description,
        deadline: req.body.deadline
    };
    projects.push(newProject);
    res.status(201).json(newProject);
});

// Task Comments API
app.get('/api/tasks/:taskId/comments', (req, res) => {
    const task = tasks.find(t => t.id == req.params.taskId);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task.comments || []);
});

app.post('/api/tasks/:taskId/comments', (req, res) => {
    try {
        const task = tasks.find(t => t.id == req.params.taskId);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        if (!req.body.text || req.body.text.trim() === '') {
            return res.status(400).json({ error: 'Comment text cannot be empty' });
        }

        const newComment = {
            id: Date.now(),
            userId: 1, // In real app, get from auth
            userName: 'Current User', // In real app, get from session
            text: req.body.text.trim(),
            createdAt: new Date()
        };

        if (!task.comments) {
            task.comments = [];
        }

        task.comments.unshift(newComment);
        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Project filter redirect
app.get('/filter-tasks', (req, res) => {
    const projectId = req.query.projectId;
    if (projectId) {
        return res.redirect(`/tasks?projectId=${projectId}`);
    }
    res.redirect('/tasks');
});

app.get('/projects', (req, res) => {
    res.render('projects', { projects });
});

// POST route for creating new projects
app.post('/api/projects', (req, res) => {
    try {
        const newProject = {
            id: projects.length + 1,
            name: req.body.name,
            description: req.body.description,
            deadline: req.body.deadline
        };
        projects.push(newProject);
        res.status(201).json(newProject);
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});