 // Utilities
    const $ = sel => document.querySelector(sel);
    const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);

    // State
    let tasks = [];
    const STORAGE_KEY = 'smartPlannerTasks_v1';
    let viewStartOffset = 0; // days offset for timeline (0 = today)
    let zoomDays = 7;
    let reminderTimers = new Map();

    // Init
    function load(){
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : [];
      renderList();
      renderTimeline();
      scheduleReminders();
    }

    function save(){
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      renderList();
      renderTimeline();
    }

    function formatDateInput(d){
      if(!d) return '';
      const dt = new Date(d);
      const y = dt.getFullYear(), m = String(dt.getMonth()+1).padStart(2,'0'), day = String(dt.getDate()).padStart(2,'0');
      return `${y}-${m}-${day}`;
    }

    // Form handling
    $('#taskForm').addEventListener('submit', e => {
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
        done: false,
        created: new Date().toISOString()
      };

      // validate dates
      if(new Date(task.due) < new Date(task.start)){
        alert('Due date must be on or after start date.');
        return;
      }

      const idx = tasks.findIndex(t => t.id === id);
      if(idx >= 0) tasks[idx] = task; else tasks.push(task);
      $('#taskForm').reset(); $('#editingId').value = '';
      save();
      scheduleReminders();
    });

    // Render list
    function renderList(){
      const container = $('#taskList'); container.innerHTML = '';
      tasks.sort((a,b)=> new Date(a.due) - new Date(b.due));
      $('#taskCount').textContent = tasks.length + ' tasks';
      for(const t of tasks){
        const el = document.createElement('div'); el.className = 'task-item';
        const left = document.createElement('div');
        left.innerHTML = `<div style="font-weight:600">${escapeHtml(t.title)}</div><div class='task-meta'>${escapeHtml(t.subject)} • ${t.start} → ${t.due}</div>`;
        const right = document.createElement('div');
        right.style.display='flex'; right.style.flexDirection='column'; right.style.gap='8px';
        const pct = calcProgressPercent(t);
        const prog = document.createElement('div'); prog.className='progress'; prog.innerHTML = `<i style='width:${pct}%'></i>`;
        const actions = document.createElement('div'); actions.style.display='flex'; actions.style.gap='6px';
        const edit = document.createElement('button'); edit.className='ghost'; edit.textContent='Edit'; edit.onclick = ()=> editTask(t.id);
        const del = document.createElement('button'); del.className='ghost'; del.textContent='Delete'; del.onclick = ()=> { if(confirm('Delete task?')){ deleteTask(t.id); } };
        const done = document.createElement('button'); done.textContent = t.done ? 'Mark Undone' : 'Mark Done'; done.onclick = ()=>{ toggleDone(t.id) };
        actions.append(edit, del, done);
        right.appendChild(prog); right.appendChild(actions);
        el.append(left,right);
        container.appendChild(el);
      }
    }

    function escapeHtml(s){ return (s+'').replace(/[&<>]/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

    function editTask(id){
      const t = tasks.find(x=>x.id===id); if(!t) return;
      $('#title').value = t.title; $('#subject').value = t.subject; $('#start').value = t.start; $('#due').value = t.due; $('#hours').value = t.hours; $('#priority').value = t.priority; $('#notes').value = t.notes; $('#reminder').value = t.reminder || '';
      $('#editingId').value = t.id; window.scrollTo({top:0,behavior:'smooth'});
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
      const days = [];
      for(let i=0;i<zoomDays;i++){ const d = addDays(startDate, i); days.push(d); const div = document.createElement('div'); div.className='day'; div.innerHTML = `<strong>${d.toLocaleDateString(undefined,{weekday:'short'})}</strong><small>${d.getDate()}/${d.getMonth()+1}</small>`; daysEl.appendChild(div); }

      // For each task create a row
      const visibleWindowStart = startDate; const visibleWindowEnd = addDays(startDate, zoomDays-1);
      const rows = tasks.map(t=>{
        const s = new Date(t.start); const e = new Date(t.due);
        return {task:t,start:s,end:e};
      }).filter(r=> r.end >= visibleWindowStart && r.start <= visibleWindowEnd );

      for(const r of rows){
        const row = document.createElement('div'); row.className='bar-row';
        const label = document.createElement('div'); label.className='bar-label'; label.textContent = `${r.task.title} (${r.task.subject})`;
        row.appendChild(label);
        const track = document.createElement('div'); track.className='bar-track';
        // compute left% and width% relative to visible window
        const totalWindow = visibleWindowEnd - visibleWindowStart + (24*3600*1000);
        const left = Math.max(0, (Math.max(r.start,visibleWindowStart) - visibleWindowStart) / totalWindow) * 100;
        const width = Math.max(1, (Math.min(r.end,visibleWindowEnd) - Math.max(r.start,visibleWindowStart) + (24*3600*1000)) / totalWindow * 100 );
        const bar = document.createElement('div'); bar.className='bar';
        bar.style.left = left + '%'; bar.style.width = width + '%';
        // style by priority/ done
        if(r.task.done){ bar.style.background = 'linear-gradient(90deg,var(--success),#68d391)'; bar.style.opacity=0.8 }
        else if(r.task.priority==='high'){ bar.style.background = 'linear-gradient(90deg,#ff7b72,var(--accent))' }
        else if(r.task.priority==='med'){ bar.style.background = 'linear-gradient(90deg,var(--accent),#45aaf2)' }
        else { bar.style.background = 'linear-gradient(90deg,#9ca3af,#6b7280)' }
        bar.title = `${r.task.title} — ${r.task.start.toLocaleDateString()} → ${r.task.end.toLocaleDateString()}`;
        bar.onclick = ()=> editTask(r.task.id);
        track.appendChild(bar);
        row.appendChild(track);
        barsEl.appendChild(row);
      }

      if(rows.length===0){ barsEl.innerHTML = '<div style="color:var(--muted);padding:10px">No tasks in this range</div>' }
    }

    function addDays(dt, n){ const d=new Date(dt); d.setHours(0,0,0,0); d.setDate(d.getDate()+n); return d; }

    $('#prevRange').addEventListener('click', ()=>{ viewStartOffset -= zoomDays; renderTimeline(); });
    $('#nextRange').addEventListener('click', ()=>{ viewStartOffset += zoomDays; renderTimeline(); });
    $('#zoomBtn').addEventListener('click', ()=>{ zoomDays = zoomDays===14 ? 7 : 7; renderTimeline(); });

    // Export / Import
    $('#exportBtn').addEventListener('click', ()=>{
      const blob = new Blob([JSON.stringify(tasks, null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'smart-planner-tasks.json'; a.click(); URL.revokeObjectURL(url);
    });

    $('#importBtn').addEventListener('click', ()=>{ $('#fileInput').click(); });
    $('#fileInput').addEventListener('change', e=>{
      const f = e.target.files[0]; if(!f) return; const reader = new FileReader(); reader.onload = ev => { try{ const arr = JSON.parse(ev.target.result); if(Array.isArray(arr)){ tasks = arr; save(); scheduleReminders(); alert('Imported tasks'); } else alert('Invalid file'); }catch(err){ alert('Invalid JSON'); } }; reader.readAsText(f);
    });

    // Notifications & reminders
    $('#notifyPerm').addEventListener('click', async ()=>{
      if(!('Notification' in window)){ alert('Notifications not supported'); return; }
      const perm = await Notification.requestPermission(); if(perm==='granted'){ alert('Notifications enabled'); }
    });

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

    // small UI enhancements
    document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible') scheduleReminders(); });

    // initial sample data if empty
    if(!localStorage.getItem(STORAGE_KEY)){
      tasks = [
        { id: uid(), title: 'Calculus - Integrals', subject:'Math', start: formatDateInput(addDays(new Date(),0)), due: formatDateInput(addDays(new Date(),3)), hours:3, priority:'high', notes:'Practice substitution & definite integrals', reminder:60, done:false, created:new Date().toISOString() },
        { id: uid(), title: 'CS - DSA Revision', subject:'CS', start: formatDateInput(addDays(new Date(),1)), due: formatDateInput(addDays(new Date(),7)), hours:6, priority:'med', notes:'Segment trees & DP problems', reminder:180, done:false, created:new Date().toISOString() }
      ]; localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

    // Start
    load();

    // expose for debugging
    window.smartPlanner = {load, save, tasks};