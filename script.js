(function(){
  const gradeMap = {
    'A+':4.0,'A':4.0,'A-':3.7,
    'B+':3.3,'B':3.0,'B-':2.7,
    'C+':2.3,'C':2.0,'C-':1.7,
    'D':1.0,'F':0.0
  };

  const STORAGE_KEY = 'gpa_courses_v1';
  const PRESETS = {
    'Load_1': [
      { name: 'Technical English', credits: 2, grade: 'A' },
      { name: 'Mathematical Foundation for Engineers', credits: 4, grade: 'A' },
      { name: 'Physics for Information Science I', credits: 3, grade: 'A' },
      { name: 'Chemistry for Information Science', credits: 3, grade: 'A' },
      { name: 'Heritage of Tamils', credits: 1, grade: 'A' },
      { name: 'Programming in C', credits: 4, grade: 'A' },
      { name: 'Engineering Graphics and Computer Application', credits: 4, grade: 'A' },
      { name: 'Engineering Practices Laboratory (Practical)', credits: 2, grade: 'A' },
      { name: 'Communication Skill Lab - I', credits: 1, grade: 'A' },
      { name: 'Design Thinking - Building Innovation & Solutioning Mindset', credits: 0.5, grade: 'A' }
    ],
    'Load_2': [
      { name: 'Professional English', credits: 2, grade: 'A' },
      { name: 'Probability and Statistics', credits: 4, grade: 'A' },
      { name: 'Physics for Information Science II', credits: 3, grade: 'A' },
      { name: 'Tamils and Technology', credits: 1, grade: 'A' },
      { name: 'Basics of Electrical and Electronics Engineering', credits: 3, grade: 'A' },
      { name: 'Green and Sustainable Chemistry', credits: 2, grade: 'A' },
      { name: 'Python Programming', credits: 4.5, grade: 'A' },
      { name: 'Physics and Chemistry Laboratory', credits: 2, grade: 'A' },
      { name: 'Communication Skill Lab - II', credits: 1, grade: 'A' },
      { name: 'Design Thinking - Decoding Innovation Opportunity', credits: 0.5, grade: 'A' }
    ]
  };
  const tbody = document.querySelector('#courses-table tbody');
  const addBtn = document.getElementById('add-course');
  const calcBtn = document.getElementById('calc');
  const saveBtn = document.getElementById('save');
  const loadBtn = document.getElementById('load');
  const resetBtn = document.getElementById('reset');
  const resultEl = document.getElementById('result');
  const totalCreditsEl = document.getElementById('total-credits');
  const toastEl = document.getElementById('toast');

  function createRow(data = {}){
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" placeholder="Course name" class="course-name" value="${escapeHtml(data.name||'')}"></td>
      <td><input type="number" min="0" step="0.5" value="${data.credits!=null?data.credits:3}" class="credits"></td>
      <td>
        <select class="grade">
          <option value="A">A</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B">B</option>
          <option value="B-">B-</option>
          <option value="C+">C+</option>
          <option value="C">C</option>
          <option value="C-">C-</option>
          <option value="D">D</option>
          <option value="F">F</option>
        </select>
      </td>
      <td class="points-cell">—</td>
      <td>
        <button type="button" class="btn icon destructive remove" aria-label="Remove course">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M3 6h18" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </button>
      </td>
    `;

    tbody.appendChild(tr);

    const gradeEl = tr.querySelector('.grade');
    if (data.grade) gradeEl.value = data.grade;

    const creditsEl = tr.querySelector('.credits');
    const inputs = tr.querySelectorAll('input,select');

    // events
    inputs.forEach(el=>{
      el.addEventListener('input', updateTotals);
      el.addEventListener('change', updateTotals);
      el.addEventListener('keydown', handleRowKeydown);
    });

    tr.querySelector('.remove').addEventListener('click', ()=>{ tr.remove(); updateTotals(); });

    updateTotals();
    return tr;
  }

  function handleRowKeydown(e){
    // Enter in last input -> add row
    if (e.key === 'Enter'){
      const tr = e.target.closest('tr');
      const inputs = Array.from(tr.querySelectorAll('input,select'));
      const idx = inputs.indexOf(e.target);
      if (idx === inputs.length - 1){
        e.preventDefault();
        const newTr = createRow();
        const firstInput = newTr.querySelector('.course-name');
        firstInput.focus();
      }
    }
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

  function updateTotals(){
    const rows = Array.from(tbody.querySelectorAll('tr'));
    let totalCredits=0, totalPoints=0;
    rows.forEach(r=>{
      const creditsEl = r.querySelector('.credits');
      const grade = r.querySelector('.grade').value;
      const credits = parseFloat(creditsEl.value) || 0;
      const gp = gradeMap[grade] || 0;
      const points = gp * credits;

      // validation: credits must be positive
      if (credits <= 0){
        r.classList.add('row-invalid');
        creditsEl.setAttribute('aria-invalid','true');
      } else {
        r.classList.remove('row-invalid');
        creditsEl.removeAttribute('aria-invalid');
      }

      const pointsCell = r.querySelector('.points-cell');
      pointsCell.textContent = credits>0 ? points.toFixed(2) : '—';

      totalCredits += credits;
      totalPoints += points;
    });

    totalCreditsEl.textContent = totalCredits.toFixed(2);
    const gpa = totalCredits ? (totalPoints/totalCredits) : 0;
    resultEl.querySelector('.result-value').textContent = `GPA: ${gpa.toFixed(2)}`;
  }

  function collectCourses(){
    return Array.from(tbody.querySelectorAll('tr')).map(r=>({
      name: r.querySelector('.course-name').value || '',
      credits: parseFloat(r.querySelector('.credits').value) || 0,
      grade: r.querySelector('.grade').value
    }));
  }

  function saveCourses(){
    const data = collectCourses();
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      showToast('Courses saved locally');
    }catch(e){ showToast('Unable to save'); }
  }

  function loadCourses(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { showToast('No saved courses found'); return; }
      const data = JSON.parse(raw);
      // clear
      tbody.innerHTML = '';
      data.forEach(d=>createRow(d));
      updateTotals();
      showToast('Courses loaded');
    }catch(e){ showToast('Unable to load saved courses'); }
  }

  function resetCourses(){
    tbody.innerHTML = '';
    for(let i=0;i<4;i++) createRow({credits: i===0?6:3, grade:'A'});
    updateTotals();
    showToast('Reset to default rows');
  }

  function showToast(msg, ms=2500){
    toastEl.textContent = msg;
    toastEl.hidden = false;
    toastEl.style.opacity = '1';
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(()=>{ toastEl.hidden = true; }, ms);
  }

  // initial rows or load from storage
  if (localStorage.getItem(STORAGE_KEY)){
    loadCourses();
  } else {
    resetCourses();
  }

  // wire buttons
  addBtn.addEventListener('click', ()=>createRow());
  calcBtn.addEventListener('click', updateTotals);
  saveBtn.addEventListener('click', saveCourses);
    loadBtn.addEventListener('click', async ()=>{
      const key = await showPresetChooser('Load preset');
      if (!key) return;
      const preset = PRESETS[key];
      if (!preset) { showToast('Preset not found'); return; }
      tbody.innerHTML = '';
      preset.forEach(d=>createRow({ name: d.name, credits: d.credits, grade: d.grade }));
      updateTotals();
      showToast(`Preset "${key}" loaded`);
    });
  // replace native confirm with styled modal
  const modal = document.getElementById('modal');
  const modalMessage = document.getElementById('modal-message');
  const modalTitle = document.getElementById('modal-title');
  const modalConfirm = document.getElementById('modal-confirm');
  const modalCancel = document.getElementById('modal-cancel');

  function showConfirm(message, title = 'Confirm'){
    return new Promise(resolve => {
      modalTitle.textContent = title;
      modalMessage.textContent = message;
      modal.setAttribute('aria-hidden','false');
      // focus management
      const prev = document.activeElement;
      modalConfirm.focus();

      function cleanup(){
        modal.setAttribute('aria-hidden','true');
        modalConfirm.removeEventListener('click', onConfirm);
        modalCancel.removeEventListener('click', onCancel);
        document.removeEventListener('keydown', onKey);
        if (prev && prev.focus) prev.focus();
      }

      function onConfirm(){ cleanup(); resolve(true); }
      function onCancel(){ cleanup(); resolve(false); }
      function onKey(e){ if (e.key === 'Escape'){ onCancel(); } }

      modalConfirm.addEventListener('click', onConfirm);
      modalCancel.addEventListener('click', onCancel);
      document.addEventListener('keydown', onKey);
    });
  }
  // show a chooser listing PRESETS and return chosen key or null
  function showPresetChooser(title = 'Load preset'){
    return new Promise(resolve => {
      modalTitle.textContent = title;
      modalMessage.textContent = 'Choose a preset to load:';
      const actions = document.getElementById('modal-actions');
      const origChildren = Array.from(actions.children);

      // hide original action buttons
      origChildren.forEach(c => c.style.display = 'none');

      // create cancel and preset buttons
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'btn';
      cancelBtn.textContent = 'Cancel';
      actions.appendChild(cancelBtn);

      const presetButtons = [];
      Object.keys(PRESETS).forEach(key => {
        const b = document.createElement('button');
        b.className = 'btn';
        b.textContent = key;
        actions.appendChild(b);
        presetButtons.push({ key, el: b });
      });

      function cleanup(){
        // remove created preset buttons and cancel
        presetButtons.forEach(p => p.el.remove());
        cancelBtn.remove();
        // restore original buttons
        origChildren.forEach(c => { c.style.display = ''; });
        modal.setAttribute('aria-hidden','true');
      }

      cancelBtn.addEventListener('click', () => { cleanup(); resolve(null); });
      presetButtons.forEach(p => p.el.addEventListener('click', () => { cleanup(); resolve(p.key); }));

      modal.setAttribute('aria-hidden','false');
      const first = actions.querySelector('button.btn:not(:disabled)');
      if (first) first.focus();
    });
  }

  resetBtn.addEventListener('click', async ()=>{
    const ok = await showConfirm('Reset rows to default? All unsaved changes will be lost.');
    if (ok) resetCourses();
  });

  // keyboard shortcut: Ctrl+Enter to calculate
  document.addEventListener('keydown', e=>{ if (e.key === 'Enter' && (e.ctrlKey||e.metaKey)){ updateTotals(); showToast('GPA updated'); } });

})();
