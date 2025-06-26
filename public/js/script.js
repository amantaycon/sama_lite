document.addEventListener('DOMContentLoaded', function() {
    // Task Modal elements
    const newTaskBtn = document.getElementById('new-task-btn');
    const taskModal = document.getElementById('task-modal');
    const closeModal = document.querySelector('.close');
    const taskForm = document.getElementById('task-form');
    const newProjectBtn = document.getElementById('new-project-btn');
    const projectModal = document.getElementById('project-modal');
    const projectForm = document.getElementById('project-form');

    // Open Project Modal
    if (newProjectBtn) {
        newProjectBtn.addEventListener('click', function() {
            projectModal.style.display = 'block';
        });
    }

    // Close Modal
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            projectModal.style.display = 'none';
        });
    }

    // Close when clicking outside modal
    window.addEventListener('click', function(event) {
        if (event.target === projectModal) {
            projectModal.style.display = 'none';
        }
    });

    // Project Form Submission
    if (projectForm) {
        projectForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const projectData = {
                name: document.getElementById('project-name').value,
                description: document.getElementById('project-desc').value,
                deadline: document.getElementById('project-deadline').value
            };

            fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to create project');
                }
                return response.json();
            })
            .then(project => {
                // Close modal and refresh page
                projectModal.style.display = 'none';
                window.location.reload();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error creating project: ' + error.message);
            });
        });
    }
    // Comment functionality elements
    const taskCommentForm = document.getElementById('task-comment-form');
    const taskCommentsContainer = document.getElementById('task-comments-container');
    const commentTaskIdInput = document.getElementById('comment-task-id');
    const taskCommentText = document.getElementById('task-comment-text');

    // Task Modal functionality
    if (newTaskBtn && taskModal) {
        newTaskBtn.addEventListener('click', function() {
            taskModal.style.display = 'block';
            
            // Reset form when opening
            if (taskForm) {
                taskForm.reset();
                document.getElementById('modal-title').textContent = 'New Task';
            }
        });
    }

    // Close Modal
    if (closeModal) {
        closeModal.addEventListener('click', function() {
            taskModal.style.display = 'none';
        });
    }

    // Close when clicking outside modal
    window.addEventListener('click', function(event) {
        if (event.target === taskModal) {
            taskModal.style.display = 'none';
        }
    });

    // Task Form Submission
    if (taskForm) {
        taskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const taskData = {
                title: document.getElementById('task-title').value,
                projectId: document.getElementById('task-project').value,
                status: document.getElementById('task-status').value,
                priority: document.getElementById('task-priority').value
            };

            fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to create task');
                }
                return response.json();
            })
            .then(task => {
                // Close modal and refresh page
                taskModal.style.display = 'none';
                window.location.reload();
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Error creating task: ' + error.message);
            });
        });
    }

    // Add click event to task rows to show comments
    document.querySelectorAll('#tasks-table tbody tr').forEach(row => {
        row.addEventListener('click', function(e) {
            // Don't trigger if clicking on buttons
            if (e.target.tagName === 'BUTTON') return;
    
            const taskId = this.getAttribute('data-task-id');
            if (taskId) {
                // Highlight selected row
                document.querySelectorAll('#tasks-table tbody tr').forEach(r => {
                    r.classList.remove('selected');
                });
                this.classList.add('selected');
                
                // Load comments
                commentTaskIdInput.value = taskId;
                loadTaskComments(taskId);
            }
        });
    });
    
    // Load comments for a specific task
    function loadTaskComments(taskId) {
        fetch(`/api/tasks/${taskId}/comments`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load comments');
                }
                return response.json();
            })
            .then(comments => {
                taskCommentsContainer.innerHTML = '';
                
                if (comments.length === 0) {
                    taskCommentsContainer.innerHTML = '<p>No comments yet</p>';
                    return;
                }
    
                comments.forEach(comment => {
                    const commentElement = createCommentElement(comment);
                    taskCommentsContainer.appendChild(commentElement);
                });
            })
            .catch(error => {
                console.error('Error loading comments:', error);
                taskCommentsContainer.innerHTML = '<p>Error loading comments</p>';
            });
    }
    
    // Create HTML for a single comment
    function createCommentElement(comment) {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        
        const date = new Date(comment.createdAt);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        
        commentDiv.innerHTML = `
            <div class="comment-header">
                <strong>${comment.userName}</strong>
                <span class="comment-date">${formattedDate}</span>
            </div>
            <div class="comment-text">${comment.text}</div>
        `;
        
        return commentDiv;
    }
    
    // Handle comment submission
    taskCommentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const taskId = commentTaskIdInput.value;
        const commentText = taskCommentText.value.trim();
    
        if (!taskId) {
            alert('Please select a task first');
            return;
        }
    
        if (!commentText) {
            alert('Please enter a comment');
            return;
        }
    
        // Disable button during submission
        const submitBtn = this.querySelector('button');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';
    
        fetch(`/api/tasks/${taskId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: commentText
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to post comment');
            }
            return response.json();
        })
        .then(comment => {
            taskCommentText.value = ''; // Clear the textarea
            const commentElement = createCommentElement(comment);
            
            // Remove "no comments" message if it exists
            const noCommentsMsg = taskCommentsContainer.querySelector('p');
            if (noCommentsMsg && noCommentsMsg.textContent === 'No comments yet') {
                taskCommentsContainer.removeChild(noCommentsMsg);
            }
            
            // Add new comment at the top
            taskCommentsContainer.prepend(commentElement);
        })
        .catch(error => {
            console.error('Error posting comment:', error);
            alert(error.message);
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post Comment';
        });
    });
});