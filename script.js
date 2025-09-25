 // Utilities
    const $ = sel => document.querySelector(sel);
    const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

    // State
    let tasks = [];
    const STORAGE_KEY = 'smartPlannerTasks_v1';
    let viewStartOffset = 0; // days offset for timeline (0 = today)
    let zoomDays = 7;
    let reminderTimers = new Map();
    let currentSection = 'overview';

    // Navigation
    function initNavigation() {
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          const section = item.dataset.section;
          switchSection(section);
        });
      });
    }

    function switchSection(sectionName) {
      // Update navigation
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.section === sectionName) {
          item.classList.add('active');
        }
      });

      // Update sections
      document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
      });
      document.getElementById(`${sectionName}-section`).classList.add('active');

      currentSection = sectionName;
      
      // Render appropriate content
      if (sectionName === 'overview') {
        renderOverview();
      } else if (sectionName === 'tasks') {
        renderList();
      } else if (sectionName === 'timeline') {
        renderTimeline();
      } else if (sectionName === 'analytics') {
        renderAnalytics();
      }
    }

    // Init
    function load(){
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : [];
      renderOverview();
      renderList();
      renderTimeline();
      renderAnalytics();
      scheduleReminders();
    }

    function save(){
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      renderOverview();
      renderList();
      renderTimeline();
      renderAnalytics();
      updateSubjectFilter();
    }

    function formatDateInput(d){
      if(!d) return '';
      const dt = new Date(d);
      const y = dt.getFullYear(), m = String(dt.getMonth()+1).padStart(2,'0'), day = String(dt.getDate()).padStart(2,'0');
      return `${y}-${m}-${day}`;
    }

    // Form handling
    function handleTaskForm(e) {
      e.preventDefault();
      const id = $('#editingId').value || uid();
      const task = {
        id,
        title: $('#title').value.trim() || 'Untitled',
        subject: $('#subject').value.trim() || 'General',
        start: $('#start').value,
        due: $('#due').value,
        hours: parseFloat($('#hours').value) || 0,
        priority: $('#priority').value,
        notes: $('#notes').value,
        reminder: parseInt($('#reminder').value) || 0,
        done: $('#editingId').value ? tasks.find(t => t.id === id)?.done || false : false,
        created: $('#editingId').value ? tasks.find(t => t.id === id)?.created || new Date().toISOString() : new Date().toISOString()
      };

      // validate dates
      if(new Date(task.due) < new Date(task.start)){
        alert('Due date must be on or after start date.');
        return;
      }

      const idx = tasks.findIndex(t => t.id === id);
      if(idx >= 0) tasks[idx] = task; else tasks.push(task);
      
      closeTaskModal();
      save();
      scheduleReminders();
    }



    // Dashboard Overview
    function renderOverview() {
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.done).length;
      const pendingTasks = totalTasks - completedTasks;
      const overdueTasks = tasks.filter(t => !t.done && new Date(t.due) < new Date()).length;

      $('#totalTasks').textContent = totalTasks;
      $('#completedTasks').textContent = completedTasks;
      $('#pendingTasks').textContent = pendingTasks;
      $('#overdueCount').textContent = overdueTasks;

      renderRecentTasks();
      renderUpcomingDeadlines();
    }

    function renderRecentTasks() {
      const container = $('#recentTasksList');
      container.innerHTML = '';
      
      const recentTasks = tasks
        .sort((a, b) => new Date(b.created) - new Date(a.created))
        .slice(0, 5);

      if (recentTasks.length === 0) {
        container.innerHTML = '<div style="color: var(--muted); text-align: center; padding: 20px;">No tasks yet</div>';
        return;
      }

      recentTasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'recent-task-item';
        item.innerHTML = `
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-meta">${escapeHtml(task.subject)} • Due: ${task.due}</div>
        `;
        item.onclick = () => {
          switchSection('tasks');
          editTask(task.id);
        };
        container.appendChild(item);
      });
    }

    function renderUpcomingDeadlines() {
      const container = $('#upcomingDeadlines');
      container.innerHTML = '';
      
      const upcoming = tasks
        .filter(t => !t.done && new Date(t.due) >= new Date())
        .sort((a, b) => new Date(a.due) - new Date(b.due))
        .slice(0, 5);

      if (upcoming.length === 0) {
        container.innerHTML = '<div style="color: var(--muted); text-align: center; padding: 20px;">No upcoming deadlines</div>';
        return;
      }

      const today = new Date();
      upcoming.forEach(task => {
        const dueDate = new Date(task.due);
        const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const isUrgent = daysUntil <= 2;
        
        const item = document.createElement('div');
        item.className = `deadline-item ${isUrgent ? 'urgent' : ''}`;
        item.innerHTML = `
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-meta">${escapeHtml(task.subject)} • ${daysUntil <= 0 ? 'Due today' : `${daysUntil} days left`}</div>
        `;
        item.onclick = () => {
          switchSection('tasks');
          editTask(task.id);
        };
        container.appendChild(item);
      });
    }

    // Render list
    function renderList(){
      const container = $('#taskList'); 
      container.innerHTML = '';
      
      const sortedTasks = [...tasks].sort((a,b)=> new Date(a.due) - new Date(b.due));
      $('#taskCount').textContent = `${tasks.length} tasks`;
      
      if (sortedTasks.length === 0) {
        container.innerHTML = '<div style="color: var(--muted); text-align: center; padding: 40px;">No tasks yet. Create your first task!</div>';
        return;
      }
      
      for(const t of sortedTasks){
        const el = document.createElement('div'); 
        el.className = 'task-item';
        
        const info = document.createElement('div');
        info.className = 'task-info';
        info.innerHTML = `
          <div class="task-title">${escapeHtml(t.title)}</div>
          <div class="task-meta">${escapeHtml(t.subject)} • ${t.start} → ${t.due} • ${t.priority} priority</div>
        `;

        const actions = document.createElement('div');
        actions.className = 'task-actions';
        
        const pct = calcProgressPercent(t);
        const prog = document.createElement('div'); 
        prog.className='progress'; 
        prog.innerHTML = `<i style='width:${pct}%'></i>`;
        
        const edit = document.createElement('button'); 
        edit.className='btn-ghost'; 
        edit.textContent='Edit'; 
        edit.onclick = ()=> editTask(t.id);
        
        const del = document.createElement('button'); 
        del.className='btn-ghost'; 
        del.textContent='Delete'; 
        del.onclick = ()=> { if(confirm('Delete task?')){ deleteTask(t.id); } };
        
        const done = document.createElement('button'); 
        done.textContent = t.done ? 'Undone' : 'Done'; 
        done.onclick = ()=> toggleDone(t.id);
        
        actions.append(edit, del, done);
        info.appendChild(prog);
        el.append(info, actions);
        container.appendChild(el);
      }
    }

    function escapeHtml(s){ return (s+'').replace(/[&<>]/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

    function editTask(id){
      const t = tasks.find(x=>x.id===id); 
      if(!t) return;
      
      // Switch to tasks section if not already there
      if (currentSection !== 'tasks') {
        switchSection('tasks');
      }
      
      // Open modal with task data
      openTaskModal(id);
    }
    function deleteTask(id){ tasks = tasks.filter(t=>t.id!==id); save(); scheduleReminders(); }
    function toggleDone(id){ const t = tasks.find(x=>x.id===id); if(!t) return; t.done = !t.done; save(); }

    function calcProgressPercent(t){
      const s = new Date(t.start), d = new Date(t.due), now = new Date();
      if(now <= s) return 0; if(now >= d) return 100;
      const total = d - s; const passed = now - s; return Math.round((passed/total)*100);
    }

    // Timeline
    function renderTimeline(){
      const daysEl = $('#days'); daysEl.innerHTML = '';
      const barsEl = $('#bars'); barsEl.innerHTML = '';
      const startDate = addDays(new Date(), viewStartOffset);
      
      // Update range subtitle
      const endDate = addDays(startDate, zoomDays - 1);
      const rangeText = viewStartOffset === 0 ? 
        `Next ${zoomDays} days` : 
        `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
      $('#timelineRange').textContent = rangeText;
      
      // Update subject filter options
      updateSubjectFilter();
      
      // Render days
      const days = [];
      for(let i=0;i<zoomDays;i++){ 
        const d = addDays(startDate, i); 
        days.push(d); 
        const div = document.createElement('div'); 
        div.className='day'; 
        const isToday = d.toDateString() === new Date().toDateString();
        div.innerHTML = `<strong style="${isToday ? 'color: var(--accent)' : ''}">${d.toLocaleDateString(undefined,{weekday:'short'})}</strong><small>${d.getDate()}/${d.getMonth()+1}</small>`; 
        if(isToday) div.style.background = 'rgba(124, 92, 255, 0.1)';
        daysEl.appendChild(div); 
      }

      // Apply filters and get visible tasks
      const visibleWindowStart = startDate; 
      const visibleWindowEnd = addDays(startDate, zoomDays-1);
      const filteredTasks = getFilteredTasks();
      
      const rows = filteredTasks.map(t=>{
        const s = new Date(t.start); const e = new Date(t.due);
        return {task:t,start:s,end:e};
      }).filter(r=> r.end >= visibleWindowStart && r.start <= visibleWindowEnd );

      for(const r of rows){
        const row = document.createElement('div'); row.className='bar-row';
        const label = document.createElement('div'); label.className='bar-label'; 
        label.textContent = `${r.task.title} (${r.task.subject})`;
        row.appendChild(label);
        
        const track = document.createElement('div'); track.className='bar-track';
        // compute left% and width% relative to visible window
        const totalWindow = visibleWindowEnd - visibleWindowStart + (24*3600*1000);
        const left = Math.max(0, (Math.max(r.start,visibleWindowStart) - visibleWindowStart) / totalWindow) * 100;
        const width = Math.max(1, (Math.min(r.end,visibleWindowEnd) - Math.max(r.start,visibleWindowStart) + (24*3600*1000)) / totalWindow * 100 );
        
        const bar = document.createElement('div'); bar.className='bar';
        bar.style.left = left + '%'; bar.style.width = width + '%';
        
        // Enhanced styling with hover effects
        if(r.task.done){ 
          bar.style.background = 'linear-gradient(90deg,var(--success),#68d391)'; 
          bar.style.opacity = '0.8';
        } else if(r.task.priority==='high'){ 
          bar.style.background = 'linear-gradient(90deg,#ff7b72,var(--accent))';
        } else if(r.task.priority==='med'){ 
          bar.style.background = 'linear-gradient(90deg,var(--accent),#45aaf2)';
        } else { 
          bar.style.background = 'linear-gradient(90deg,#9ca3af,#6b7280)';
        }
        
        // Enhanced tooltip
        const daysLeft = Math.ceil((r.end - new Date()) / (1000 * 60 * 60 * 24));
        const status = r.task.done ? '✅ Completed' : 
                      daysLeft < 0 ? '⚠️ Overdue' : 
                      daysLeft <= 1 ? '🔥 Due soon' : '📅 Upcoming';
        bar.title = `${r.task.title}\n${r.task.subject} • ${r.task.priority} priority\n${r.start.toLocaleDateString()} → ${r.end.toLocaleDateString()}\n${status}`;
        
        bar.onclick = ()=> editTask(r.task.id);
        track.appendChild(bar);
        row.appendChild(track);
        barsEl.appendChild(row);
      }

      if(rows.length===0){ 
        const message = filteredTasks.length === 0 && tasks.length > 0 ? 
          'No tasks match the current filters' : 'No tasks in this range';
        barsEl.innerHTML = `<div style="color:var(--muted);padding:20px;text-align:center;font-style:italic">${message}</div>`;
      }
    }

    function addDays(dt, n){ const d=new Date(dt); d.setHours(0,0,0,0); d.setDate(d.getDate()+n); return d; }

    // Filter functions
    function getFilteredTasks() {
      const priorityFilter = $('#priorityFilter').value;
      const subjectFilter = $('#subjectFilter').value;
      const statusFilter = $('#statusFilter').value;
      
      return tasks.filter(task => {
        // Priority filter
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
          return false;
        }
        
        // Subject filter
        if (subjectFilter !== 'all' && task.subject !== subjectFilter) {
          return false;
        }
        
        // Status filter
        if (statusFilter === 'pending' && task.done) {
          return false;
        }
        if (statusFilter === 'completed' && !task.done) {
          return false;
        }
        if (statusFilter === 'overdue' && (task.done || new Date(task.due) >= new Date())) {
          return false;
        }
        
        return true;
      });
    }
    
    function updateSubjectFilter() {
      const subjectFilter = $('#subjectFilter');
      const currentValue = subjectFilter.value;
      const subjects = [...new Set(tasks.map(t => t.subject))].sort();
      
      subjectFilter.innerHTML = '<option value="all">All Subjects</option>';
      subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectFilter.appendChild(option);
      });
      
      // Restore selection if it still exists
      if (subjects.includes(currentValue)) {
        subjectFilter.value = currentValue;
      }
    }



    // Analytics
    function renderAnalytics() {
      renderWeeklyProgress();
      renderSubjectBreakdown();
      renderProductivityInsights();
    }

    function renderWeeklyProgress() {
      const container = $('#weeklyProgress');
      container.innerHTML = '<div style="color: var(--muted); text-style: italic;">Progress tracking coming soon...</div>';
    }

    function renderSubjectBreakdown() {
      const container = $('#subjectBreakdown');
      container.innerHTML = '';
      
      const subjectCounts = {};
      tasks.forEach(task => {
        subjectCounts[task.subject] = (subjectCounts[task.subject] || 0) + 1;
      });

      if (Object.keys(subjectCounts).length === 0) {
        container.innerHTML = '<div style="color: var(--muted); font-style: italic;">No subjects to display</div>';
        return;
      }

      Object.entries(subjectCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([subject, count]) => {
          const item = document.createElement('div');
          item.className = 'subject-item';
          item.innerHTML = `
            <span class="subject-name">${escapeHtml(subject)}</span>
            <span class="subject-count">${count} task${count !== 1 ? 's' : ''}</span>
          `;
          container.appendChild(item);
        });
    }

    function renderProductivityInsights() {
      const container = $('#productivityInsights');
      container.innerHTML = '';

      const insights = [];
      const completedCount = tasks.filter(t => t.done).length;
      const overdueCount = tasks.filter(t => !t.done && new Date(t.due) < new Date()).length;
      const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

      if (completionRate >= 80) {
        insights.push("🎉 Excellent completion rate! You're doing great!");
      } else if (completionRate >= 60) {
        insights.push("👍 Good progress! Keep up the momentum.");
      } else if (tasks.length > 0) {
        insights.push("⚡ Room for improvement. Focus on completing existing tasks.");
      }

      if (overdueCount > 0) {
        insights.push(`⏰ You have ${overdueCount} overdue task${overdueCount !== 1 ? 's' : ''}. Consider prioritizing them.`);
      }

      if (tasks.length === 0) {
        insights.push("📝 Start by creating your first study task!");
      }

      if (insights.length === 0) {
        insights.push("📊 Not enough data for insights yet.");
      }

      insights.forEach(insight => {
        const item = document.createElement('div');
        item.className = 'insight-item';
        item.textContent = insight;
        container.appendChild(item);
      });
    }



    function scheduleReminders(){
      // clear existing timers
      for(const t of reminderTimers.values()) clearTimeout(t);
      reminderTimers.clear();

      if(Notification.permission !== 'granted') return;
      const now = Date.now();
      for(const task of tasks){
        if(!task.reminder) continue;
        const due = new Date(task.due).getTime();
        const msBefore = (task.reminder || 0) * 60 * 1000;
        const at = due - msBefore;
        if(at <= now) continue; // skip past
        const id = task.id;
        const timer = setTimeout(()=>{
          showNotification(task);
          reminderTimers.delete(id);
        }, Math.max(0, at - now));
        reminderTimers.set(id, timer);
      }
    }

    function showNotification(task){
      try{
        const n = new Notification(task.title, {body: `Due: ${task.due} • ${task.subject}`});
        n.onclick = ()=> window.focus();
      }catch(e){ console.warn(e); }
    }

    // helpers
    function deleteAll(){ if(confirm('Clear all tasks?')){ tasks=[]; save(); scheduleReminders(); } }



    // Modal functions
    function openTaskModal(taskId = null) {
      const modal = $('#taskModal');
      const modalTitle = $('#modalTitle');
      
      if (taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
          modalTitle.textContent = 'Edit Task';
          $('#title').value = task.title;
          $('#subject').value = task.subject;
          $('#start').value = task.start;
          $('#due').value = task.due;
          $('#hours').value = task.hours;
          $('#priority').value = task.priority;
          $('#notes').value = task.notes;
          $('#reminder').value = task.reminder || '';
          $('#editingId').value = task.id;
        }
      } else {
        modalTitle.textContent = 'Add New Task';
        $('#taskForm').reset();
        $('#editingId').value = '';
      }
      
      modal.classList.add('active');
      $('#title').focus();
    }
    
    function closeTaskModal() {
      const modal = $('#taskModal');
      modal.classList.remove('active');
      $('#taskForm').reset();
      $('#editingId').value = '';
    }

    // Initialize dashboard
    function initDashboard() {
      // Initialize navigation
      initNavigation();

      // Set up form event listeners
      $('#taskForm').addEventListener('submit', handleTaskForm);
      
      // Modal event listeners
      $('#addTaskBtn').addEventListener('click', () => openTaskModal());
      $('#overviewAddTaskBtn').addEventListener('click', () => openTaskModal());
      $('#closeModalBtn').addEventListener('click', closeTaskModal);
      $('#cancelBtn').addEventListener('click', closeTaskModal);
      
      // Close modal when clicking overlay
      $('#taskModal').addEventListener('click', (e) => {
        if (e.target === $('#taskModal')) {
          closeTaskModal();
        }
      });
      
      // Close modal with Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && $('#taskModal').classList.contains('active')) {
          closeTaskModal();
        }
      });

      // Timeline controls
      $('#prevRange').addEventListener('click', ()=>{ viewStartOffset -= zoomDays; renderTimeline(); });
      $('#nextRange').addEventListener('click', ()=>{ viewStartOffset += zoomDays; renderTimeline(); });
      $('#todayBtn').addEventListener('click', ()=>{ viewStartOffset = 0; renderTimeline(); });
      $('#viewRange').addEventListener('change', (e) => { zoomDays = parseInt(e.target.value); renderTimeline(); });
      
      // Timeline filters
      $('#priorityFilter').addEventListener('change', renderTimeline);
      $('#subjectFilter').addEventListener('change', renderTimeline);
      $('#statusFilter').addEventListener('change', renderTimeline);
      
      // Export/Import functionality
      $('#exportBtn').addEventListener('click', ()=>{
        const blob = new Blob([JSON.stringify(tasks, null, 2)], {type:'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'smart-planner-tasks.json'; a.click(); URL.revokeObjectURL(url);
      });

      $('#importBtn').addEventListener('click', ()=>{ $('#fileInput').click(); });
      $('#fileInput').addEventListener('change', e=>{
        const f = e.target.files[0]; if(!f) return; const reader = new FileReader(); reader.onload = ev => { try{ const arr = JSON.parse(ev.target.result); if(Array.isArray(arr)){ tasks = arr; save(); scheduleReminders(); alert('Imported tasks'); } else alert('Invalid file'); }catch(err){ alert('Invalid JSON'); } }; reader.readAsText(f);
      });

      // Notifications
      $('#notifyPerm').addEventListener('click', async ()=>{
        if(!('Notification' in window)){ alert('Notifications not supported'); return; }
        const perm = await Notification.requestPermission(); if(perm==='granted'){ alert('Notifications enabled'); }
      });
      
      // Visibility change for reminders
      document.addEventListener('visibilitychange', ()=>{ 
        if(document.visibilityState==='visible') scheduleReminders(); 
      });

      // Load data and render
      load();
    }

    // initial sample data if empty
    if(!localStorage.getItem(STORAGE_KEY)){
      tasks = [
        { id: uid(), title: 'Calculus - Integrals', subject:'Math', start: formatDateInput(addDays(new Date(),0)), due: formatDateInput(addDays(new Date(),3)), hours:3, priority:'high', notes:'Practice substitution & definite integrals', reminder:60, done:false, created:new Date().toISOString() },
        { id: uid(), title: 'CS - DSA Revision', subject:'CS', start: formatDateInput(addDays(new Date(),1)), due: formatDateInput(addDays(new Date(),7)), hours:6, priority:'med', notes:'Segment trees & DP problems', reminder:180, done:false, created:new Date().toISOString() }
      ]; localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

    // Start dashboard when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
      initDashboard();
    }

    // expose for debugging
    window.smartPlanner = {load, save, tasks, switchSection, openTaskModal, closeTaskModal};