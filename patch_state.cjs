const fs = require('fs');
let code = fs.readFileSync('src/components/TaskManager.tsx', 'utf8');

const stateInjection = `
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectPriority, setNewProjectPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newProjectDueDate, setNewProjectDueDate] = useState('');
  const [newProjectAssignees, setNewProjectAssignees] = useState<string[]>([]);

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProject: Project = {
      id: 'PN' + Math.floor(Math.random() * 10000000).toString().padStart(7, '0'),
      name: newProjectName,
      description: newProjectDesc,
      reporter: currentUser.name,
      priority: newProjectPriority,
      dueDate: newProjectDueDate || new Date().toISOString().split('T')[0],
      assignees: newProjectAssignees
    };

    setProjects(prev => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
    setIsAddProjectOpen(false);
    
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectPriority('medium');
    setNewProjectDueDate('');
    setNewProjectAssignees([]);
  };
`;

code = code.replace(
  "// Form states for adding task",
  stateInjection + "\n  // Form states for adding task"
);

fs.writeFileSync('src/components/TaskManager.tsx', code);
console.log('patched states');
