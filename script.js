(function () {
  // Grade Point Maps
  const gradeMapAU = {
    'O': 10,
    'A+': 9,
    'A': 8,
    'B+': 7,
    'B': 6,
    'C': 5,
    'U': 0,
    'SA': 0,
    'WD': 0
  };

  const gradeMapUS = {
    'A+': 4.0,
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D': 1.0,
    'F': 0.0
  };

  const STORAGE_KEY = 'msec_academics_state_v1';

  // Default State
  let state = {
    dept: 'B.E CSE',
    sem: '1',
    scale: 'AU',
    targetGpa: 8.5,
    courses: [], // { name, credits, grade }
    cgpaSemesters: [
      { semName: 'Semester 1', credits: 22, gpa: 8.2 },
      { semName: 'Semester 2', credits: 26, gpa: 8.4 }
    ],
    savedSemesters: {},
    currentGpa: 0,
    currentEarnedCredits: 0
  };

  // DOM Elements
  const tabBtnGpa = document.getElementById('tab-btn-gpa');
  const tabBtnCgpa = document.getElementById('tab-btn-cgpa');
  const tabHighlight = document.getElementById('tab-highlight');
  const gpaView = document.getElementById('gpa-view');
  const cgpaView = document.getElementById('cgpa-view');

  const introOverlay = document.getElementById('intro-overlay');
  const mainApp = document.getElementById('main-app');
  const btnStart = document.getElementById('btn-start');
  const btnChangeSetup = document.getElementById('btn-change-setup');
  const currentPresetTitle = document.getElementById('current-preset-title');
  const currentPresetScale = document.getElementById('current-preset-scale');

  const deptSelect = document.getElementById('intro-dept');
  const semSelect = document.getElementById('intro-sem');
  const yearSelect = document.getElementById('intro-year');
  const scaleSelect = document.getElementById('intro-scale');

  // Target GPA inputs removed

  const coursesTbody = document.querySelector('#courses-table tbody');
  const addCourseBtn = document.getElementById('add-course');
  const saveSemesterBtn = document.getElementById('save-semester');
  const resetBtn = document.getElementById('reset');
  const gpaDisplay = document.getElementById('gpa-display');
  const totalCreditsEl = document.getElementById('total-credits');
  const gradedCountEl = document.getElementById('graded-count');
  const gradeDistributionBars = document.getElementById('grade-distribution-bars');

  const cgpaTbody = document.getElementById('cgpa-tbody');
  const cgpaAddRowBtn = document.getElementById('cgpa-add-row');
  const cgpaDisplayVal = document.getElementById('cgpa-display-val');
  const cgpaTotalCreditsEl = document.getElementById('cgpa-total-credits');
  const cgpaClassEl = document.getElementById('cgpa-class');
  const cgpaResetBtn = document.getElementById('cgpa-reset');
  const cgpaStatusBox = document.getElementById('cgpa-status-box');

  const toastEl = document.getElementById('toast');
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modal-title');
  const modalMessage = document.getElementById('modal-message');
  const modalConfirm = document.getElementById('modal-confirm');
  const modalCancel = document.getElementById('modal-cancel');

  // --- Initialize Application ---
  function init() {
    const hasExistingState = loadStateFromStorage();
    setupEventListeners();
    updateTabUI('gpa');

    // Set initial values in dropdowns
    deptSelect.value = state.dept;
    semSelect.value = state.sem;
    yearSelect.value = Math.ceil(parseInt(state.sem || 1) / 2);

    // Hydrate sem select based on year
    updateSemestersByYear();
    semSelect.value = state.sem;
    scaleSelect.value = state.scale;
    // Target GPA logic removed




    if (state.courses && state.courses.length > 0) {
      restoreMissingPresets();
      renderCourses();
    } else {
      loadPresetCourses(state.dept, state.sem, false);
    }

    // Automatically skip setup if we found existing save data and we aren't manually changing setup
    const isChangingSetup = sessionStorage.getItem('isChangingSetup') === 'true';
    if (hasExistingState && !isChangingSetup) {
      introOverlay.classList.add('hidden');
      introOverlay.classList.remove('active');
      introOverlay.style.display = 'none';
      mainApp.style.display = 'block';
    }

    updatePresetTitleDisplay();
    renderCgpaRows();
    updateGpaCalculation();
    updateCgpaCalculation();
  }

  function updatePresetTitleDisplay() {
    const branchData = window.COURSES_DB[state.dept];
    if (state.dept !== 'CUSTOM' && branchData) {
      currentPresetTitle.textContent = `${branchData.name} - Semester ${state.sem}`;
    } else {
      currentPresetTitle.textContent = `Custom Subjects Mode`;
    }
    currentPresetScale.textContent = state.scale === 'AU' ? 'Anna University (Regulation 2021)' : 'US Standard (4.0 Scale)';
  }

  function startApp() {
    const isChanged = state.dept !== deptSelect.value || state.sem !== semSelect.value || state.scale !== scaleSelect.value;
    
    if (isChanged && state.courses && state.courses.length > 0) {
      // Auto-save current semester before switching instead of prompting for reset
      saveCurrentSemesterMarks(true);
    }
    
    applySetupAndStart(isChanged);
  }

  function applySetupAndStart(needsReload) {
    sessionStorage.removeItem('isChangingSetup');
    state.dept = deptSelect.value;
    state.sem = semSelect.value;
    state.scale = scaleSelect.value;
    updatePresetTitleDisplay();

    if (needsReload || !state.courses || state.courses.length === 0) {
      const semKey = `${state.dept}_${state.sem}`;
      state.savedSemesters = state.savedSemesters || {};
      
      if (state.savedSemesters[semKey]) {
        state.courses = state.savedSemesters[semKey].courses;
        restoreMissingPresets();
        renderCourses();
        updateGpaCalculation();
        showToast(`Loaded saved marks for Semester ${state.sem}.`);
      } else {
        loadPresetCourses(state.dept, state.sem, false);
      }
    }

    introOverlay.style.position = 'absolute';
    introOverlay.style.width = '100%';
    introOverlay.classList.remove('active');
    introOverlay.classList.add('hidden');
    mainApp.style.display = 'block';
    
    setTimeout(() => {
      introOverlay.style.display = 'none';
      introOverlay.style.position = '';
      introOverlay.style.width = '';
      updateGpaCalculation();
    }, 400);
  }

  function saveCurrentSemesterMarks(silent = false) {
    updateGpaCalculation();
    const semKey = `${state.dept}_${state.sem}`;
    
    state.savedSemesters = state.savedSemesters || {};
    state.savedSemesters[semKey] = {
      courses: collectCourses(),
      gpa: state.currentGpa || 0,
      credits: state.currentEarnedCredits || 0
    };
    
    saveStateToStorage();
    syncCgpaTracker();
    
    if (!silent) {
      showToast(`Semester ${state.sem} marks successfully saved!`);
    }
  }

  function getPresetCreditsForSem(dept, sem) {
    const normalizedDept = dept === 'B.E CSE' ? 'CSE' : dept;
    const branchData = window.COURSES_DB[normalizedDept];
    if (branchData && branchData.semesters && branchData.semesters[sem]) {
      const courses = branchData.semesters[sem];
      return courses.reduce((sum, c) => sum + (parseFloat(c.credits) || 0), 0);
    }
    return 22; // default fallback if not found
  }

  function syncCgpaTracker() {
    const targetSemCount = parseInt(state.sem) || 1;
    state.cgpaSemesters = state.cgpaSemesters || [];
    
    while (state.cgpaSemesters.length < targetSemCount) {
      const semNum = state.cgpaSemesters.length + 1;
      state.cgpaSemesters.push({
        semName: `Semester ${semNum}`,
        credits: getPresetCreditsForSem(state.dept, semNum.toString()),
        gpa: 0
      });
    }
    
    for (let i = 1; i <= state.cgpaSemesters.length; i++) {
      const semKey = `${state.dept}_${i}`;
      if (state.savedSemesters && state.savedSemesters[semKey]) {
        state.cgpaSemesters[i - 1].gpa = state.savedSemesters[semKey].gpa;
        state.cgpaSemesters[i - 1].credits = state.savedSemesters[semKey].credits;
      } else {
        state.cgpaSemesters[i - 1].credits = getPresetCreditsForSem(state.dept, i.toString());
      }
    }
    
    saveCgpaState();
    if (cgpaView.classList.contains('active-view')) {
      renderCgpaRows();
      updateCgpaCalculation();
    }
  }

  function updateSemestersByYear() {
    const year = parseInt(yearSelect.value);
    semSelect.innerHTML = '';
    const sem1 = (year - 1) * 2 + 1;
    const sem2 = sem1 + 1;
    semSelect.innerHTML += `<option value="${sem1}" style="color:#1e293b;">Semester ${sem1}</option>`;
    semSelect.innerHTML += `<option value="${sem2}" style="color:#1e293b;">Semester ${sem2}</option>`;
  }

  // --- State Management ---
  function loadStateFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          state = Object.assign({}, state, parsed);
          return true;
        }
      }
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
    }
    return false;
  }

  function saveStateToStorage() {
    try {
      // Collect current courses list from DOM
      state.courses = collectCourses();
      state.dept = deptSelect.value;
      state.sem = semSelect.value;
      state.scale = scaleSelect.value;

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving state to localStorage:', e);
    }
  }

  // --- Tab Switcher Logic ---
  function updateTabUI(tab) {
    if (tab === 'gpa') {
      tabBtnGpa.classList.add('active');
      tabBtnCgpa.classList.remove('active');
      tabHighlight.style.left = '4px';
      gpaView.classList.add('active-view');
      cgpaView.classList.remove('active-view');
    } else {
      tabBtnGpa.classList.remove('active');
      tabBtnCgpa.classList.add('active');
      tabHighlight.style.left = 'calc(50% + 0px)';
      gpaView.classList.remove('active-view');
      cgpaView.classList.add('active-view');
    }
  }

  // --- Preset Loader ---
  function restoreMissingPresets() {
    const branchData = window.COURSES_DB[state.dept];
    if (branchData && branchData.semesters && branchData.semesters[state.sem]) {
      const presets = branchData.semesters[state.sem];
      const newCourses = [];
      presets.forEach(presetCourse => {
        const existing = state.courses.find(c => c.name === presetCourse.name);
        if (existing) {
          newCourses.push(existing);
        } else {
          newCourses.push({ name: presetCourse.name, credits: presetCourse.credits, grade: '', isPreset: true });
        }
      });
      state.courses.forEach(c => {
        const isPresetCourse = presets.some(p => p.name === c.name);
        if (!isPresetCourse) {
          newCourses.push(c);
        }
      });
      state.courses = newCourses;
    }
  }

  function loadPresetCourses(dept, sem, showToastAlert = true) {
    coursesTbody.innerHTML = '';
    const branchData = window.COURSES_DB[dept];

    if (branchData && branchData.semesters && branchData.semesters[sem]) {
      const courses = branchData.semesters[sem];
      courses.forEach(c => {
        createCourseRow({ name: c.name, credits: c.credits, grade: '', isPreset: true });
      });

      if (showToastAlert) {
        showToast(`Loaded ${branchData.name} Semester ${sem} template.`);
      }
    } else {
      // Fallback custom default rows
      for (let i = 1; i <= 5; i++) {
        createCourseRow({ name: `Custom Subject ${i}`, credits: i === 1 ? 4 : 3, grade: '' });
      }
      if (showToastAlert) {
        showToast('Created custom semester template.');
      }
    }

    updateGpaCalculation();
    saveStateToStorage();
  }

  // --- Course Row Renderer ---
  function createCourseRow(data = {}) {
    const tr = document.createElement('tr');

    // Choose grade options based on selected scale
    let gradeOptions = '<option value="">Yet to decide</option>';
    const currentMap = state.scale === 'AU' ? gradeMapAU : gradeMapUS;
    Object.keys(currentMap).forEach(grade => {
      const selectedAttr = (data.grade === grade) ? 'selected' : '';
      gradeOptions += `<option value="${grade}" ${selectedAttr}>${grade}</option>`;
    });

    // Aggressive retroactive fix for older localStorage saves where isPreset might be explicitly false
    let isPreset = data.isPreset;
    if (!isPreset && data.name) {
      // If it starts with a standard course code format (e.g., U24EN201), it's a predefined preset
      if (/^[A-Z0-9]{4,8}\s/.test(data.name)) {
        isPreset = true;
      }
    }

    const readonlyAttr = isPreset ? 'readonly' : '';

    tr.innerHTML = `
      <td>
        <input type="text" placeholder="Course Name/Code" class="course-name" value="${escapeHtml(data.name || '')}" ${readonlyAttr}>
      </td>
      <td>
        <input type="number" min="0" max="20" step="0.5" value="${data.credits != null ? data.credits : 3}" class="credits-input" ${readonlyAttr}>
      </td>
      <td>
        <select class="grade-select">
          ${gradeOptions}
        </select>
      </td>
      <td class="points-cell hide-on-mobile" style="text-align: right;">—</td>
      <td>
        <button type="button" class="btn-row-remove" aria-label="Remove Course">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" stroke-width="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </td>
    `;

    coursesTbody.appendChild(tr);

    // Event listeners
    const inputs = tr.querySelectorAll('input, select');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        updateGpaCalculation();
        saveStateToStorage();
      });
      input.addEventListener('change', () => {
        updateGpaCalculation();
        saveStateToStorage();
      });
    });

    tr.querySelector('.btn-row-remove').addEventListener('click', () => {
      tr.classList.add('animate-fadeIn');
      tr.style.animationDirection = 'reverse';
      setTimeout(() => {
        tr.remove();
        updateGpaCalculation();
        saveStateToStorage();
      }, 150);
    });
  }

  function renderCourses() {
    coursesTbody.innerHTML = '';
    state.courses.forEach(c => {
      createCourseRow(c);
    });

    // Update preset info text label
    updatePresetTitleDisplay();
  }

  function collectCourses() {
    const rows = Array.from(coursesTbody.querySelectorAll('tr'));
    return rows.map(r => {
      const nameInput = r.querySelector('.course-name');
      const creditsInput = r.querySelector('.credits-input');
      const gradeSelect = r.querySelector('.grade-select');

      return {
        name: nameInput ? nameInput.value : '',
        credits: creditsInput ? parseFloat(creditsInput.value) || 0 : 0,
        grade: gradeSelect ? gradeSelect.value : '',
        isPreset: nameInput ? nameInput.hasAttribute('readonly') : false
      };
    });
  }

  // --- Dynamic Calculator Logic (Semester GPA) ---
  // Set validation bounds based on grading scale
  function updateTargetGpaBounds() {
    if (state.scale === 'AU') {
      targetGpaInput.setAttribute('max', '10.0');
      targetGpaInput.setAttribute('step', '0.1');
      if (parseFloat(targetGpaInput.value) < 4.0 || parseFloat(targetGpaInput.value) > 10.0) {
        targetGpaInput.value = '8.5';
      }
    } else {
      targetGpaInput.setAttribute('max', '4.0');
      targetGpaInput.setAttribute('step', '0.05');
      if (parseFloat(targetGpaInput.value) > 4.0) {
        targetGpaInput.value = '3.5';
      }
    }
  }

  function updateGpaCalculation() {

    const rows = Array.from(coursesTbody.querySelectorAll('tr'));
    const currentMap = state.scale === 'AU' ? gradeMapAU : gradeMapUS;

    let totalCredits = 0;
    let gradedCredits = 0;
    let earnedCredits = 0;
    let totalPoints = 0;
    let unselectedCount = 0;

    // Frequency map of grades for distribution bar chart
    const gradeCounts = {};
    Object.keys(currentMap).forEach(k => { gradeCounts[k] = 0; });

    rows.forEach(r => {
      const creditsEl = r.querySelector('.credits-input');
      const gradeEl = r.querySelector('.grade-select');
      const pointsCell = r.querySelector('.points-cell');

      let credits = parseFloat(creditsEl.value);
      if (isNaN(credits) || credits < 0) credits = 0;

      const grade = gradeEl.value;

      if (grade === "") {
        pointsCell.textContent = '—';
        totalCredits += credits;
        unselectedCount++;
      } else {
        const gp = currentMap[grade];
        const points = gp * credits;
        pointsCell.textContent = points.toFixed(2);

        totalCredits += credits;
        gradedCredits += credits;
        if (state.scale === 'AU' && ['U', 'SA', 'WD'].includes(grade)) {
          // Exclude AU failures from the GPA denominator
        } else {
          earnedCredits += credits;
        }
        totalPoints += points;

        gradeCounts[grade]++;
      }
    });

    // Compute GPA
    const gpa = earnedCredits > 0 ? (totalPoints / earnedCredits) : 0;
    
    // Save to state for easy CGPA sync
    state.currentGpa = parseFloat(gpa.toFixed(2));
    state.currentEarnedCredits = earnedCredits;

    gpaDisplay.textContent = earnedCredits > 0 ? gpa.toFixed(2) : '0.00';
    totalCreditsEl.textContent = totalCredits.toFixed(2);

    const totalRowList = rows.length;
    gradedCountEl.textContent = `${totalRowList - unselectedCount}/${totalRowList}`;

    // Render visual distribution bars
    renderGradeDistribution(gradeCounts, totalRowList - unselectedCount);

    // Run Target GPA Analyzer (Removed)
    const remainingCredits = totalCredits - gradedCredits;
    // --- Visual Grade Distribution Chart ---
    function renderGradeDistribution(counts, totalGraded) {
      gradeDistributionBars.innerHTML = '';

      // Color map matching the grade tier reference table
      const gradeColors = {
        'O': { bar: 'linear-gradient(to top,#10b981,#34d399)', label: '#059669', glow: 'rgba(16,185,129,0.3)' },
        'A+': { bar: 'linear-gradient(to top,#3b82f6,#60a5fa)', label: '#2563eb', glow: 'rgba(59,130,246,0.3)' },
        'A': { bar: 'linear-gradient(to top,#38bdf8,#7dd3fc)', label: '#0369a1', glow: 'rgba(56,189,248,0.3)' },
        'B+': { bar: 'linear-gradient(to top,#6366f1,#a5b4fc)', label: '#4338ca', glow: 'rgba(99,102,241,0.3)' },
        'B': { bar: 'linear-gradient(to top,#8b5cf6,#c4b5fd)', label: '#6d28d9', glow: 'rgba(139,92,246,0.3)' },
        'C': { bar: 'linear-gradient(to top,#f97316,#fdba74)', label: '#c2410c', glow: 'rgba(249,115,22,0.3)' },
        'U': { bar: 'linear-gradient(to top,#ef4444,#fca5a5)', label: '#b91c1c', glow: 'rgba(239,68,68,0.3)' },
        'SA': { bar: 'linear-gradient(to top,#94a3b8,#cbd5e1)', label: '#64748b', glow: 'rgba(148,163,184,0.2)' },
        'WD': { bar: 'linear-gradient(to top,#94a3b8,#cbd5e1)', label: '#64748b', glow: 'rgba(148,163,184,0.2)' },
        'A-': { bar: 'linear-gradient(to top,#38bdf8,#7dd3fc)', label: '#0369a1', glow: 'rgba(56,189,248,0.3)' },
        'B-': { bar: 'linear-gradient(to top,#a78bfa,#ddd6fe)', label: '#6d28d9', glow: 'rgba(167,139,250,0.3)' },
        'C+': { bar: 'linear-gradient(to top,#fb923c,#fed7aa)', label: '#c2410c', glow: 'rgba(251,146,60,0.3)' },
        'C-': { bar: 'linear-gradient(to top,#f87171,#fecaca)', label: '#dc2626', glow: 'rgba(248,113,113,0.3)' },
        'D': { bar: 'linear-gradient(to top,#f87171,#fecaca)', label: '#dc2626', glow: 'rgba(248,113,113,0.3)' },
        'F': { bar: 'linear-gradient(to top,#ef4444,#fca5a5)', label: '#b91c1c', glow: 'rgba(239,68,68,0.3)' },
      };

      // For AU scale, skip SA/WD if 0 to reduce clutter
      let keys = Object.keys(counts);
      if (state.scale === 'AU') {
        keys = keys.filter(g => counts[g] > 0 || !['SA', 'WD'].includes(g));
      }

      const maxCount = Math.max(...keys.map(k => counts[k] || 0), 1);
      const BAR_MAX_PX = 60; // max bar height in px

      keys.forEach(grade => {
        const count = counts[grade] || 0;
        const heightPx = count > 0 ? Math.max((count / maxCount) * BAR_MAX_PX, 10) : 3;
        const color = gradeColors[grade] || { bar: '#94a3b8', label: '#64748b', glow: 'transparent' };

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;';

        // Count badge above bar
        const badge = count > 0
          ? `<span style="display:inline-block;background:${color.bar};color:white;font-size:9px;font-weight:800;border-radius:99px;padding:1px 5px;box-shadow:0 1px 4px ${color.glow};">${count}</span>`
          : `<span style="font-size:9px;color:transparent;">0</span>`;

        wrapper.innerHTML = `
        ${badge}
        <div style="
          width: min(24px, 100%);
          border-radius: 6px 6px 0 0;
          background: ${count > 0 ? color.bar : 'rgba(203,213,225,0.4)'};
          height: ${heightPx}px;
          transition: height 0.5s cubic-bezier(0.34,1.56,0.64,1);
          ${count > 0 ? `box-shadow: 0 4px 12px ${color.glow};` : ''}
        " title="${grade}: ${count} subject(s)"></div>
        <span style="font-size:10px;font-weight:800;color:${count > 0 ? color.label : '#cbd5e1'};">${grade}</span>
      `;
        gradeDistributionBars.appendChild(wrapper);
      });

      // Update summary
      const summaryEl = document.getElementById('grade-dist-summary');
      if (summaryEl) {
        summaryEl.textContent = totalGraded > 0 ? `${totalGraded} graded` : 'No grades yet';
      }
    }

    // --- Target GPA Goals Analyser (USP) ---

    function updateTargetEstimator(earnedCredits, remainingCredits, currentPoints) {

      const targetGpa = parseFloat(targetGpaInput.value) || 0;
      const maxGradePoint = state.scale === 'AU' ? 10 : 4.0;
      const expectedTotalCredits = earnedCredits + remainingCredits;

      if (expectedTotalCredits === 0) {
        targetGpaStatus.textContent = 'No Courses';
        targetGpaStatus.className = 'target-gpa-badge warning';
        targetMessageCard.className = 'target-message-card';
        targetMessageText.textContent = 'Please load or add some courses first to check target goals.';
        return;
      }

      if (remainingCredits === 0) {
        const actualGpa = currentPoints / earnedCredits;
        if (actualGpa >= targetGpa) {
          targetGpaStatus.textContent = 'Achieved';
          targetGpaStatus.className = 'target-gpa-badge';
          targetMessageCard.className = 'target-message-card on-track';
          targetMessageText.textContent = `Excellent! Your semester GPA of ${actualGpa.toFixed(2)} achieved your target goal of ${targetGpa.toFixed(2)}. 🎉`;
        } else {
          targetGpaStatus.textContent = 'Missed';
          targetGpaStatus.className = 'target-gpa-badge danger';
          targetMessageCard.className = 'target-message-card danger';
          targetMessageText.textContent = `You secured a ${actualGpa.toFixed(2)} GPA. You missed your target of ${targetGpa.toFixed(2)} by ${(targetGpa - actualGpa).toFixed(2)} points. Keep pushing next semester!`;
        }
        return;
      }

    // How many total points do we need?
    const targetTotalPoints = targetGpa * expectedTotalCredits;
    const neededPoints = targetTotalPoints - currentPoints;
    const requiredRemainingAvg = neededPoints / remainingCredits;

    if (requiredRemainingAvg <= 0) {
      // Target already safe
      targetGpaStatus.textContent = 'Safe';
      targetGpaStatus.className = 'target-gpa-badge';
      targetMessageCard.className = 'target-message-card on-track';
      targetMessageText.textContent = `You are on track! Even if you secure the minimum passing grades in the remaining ${remainingCredits.toFixed(1)} credits, you will exceed your target of ${targetGpa.toFixed(2)}.`;
    } else if (requiredRemainingAvg > maxGradePoint) {
      // Impossible
      targetGpaStatus.textContent = 'Impossible';
      targetGpaStatus.className = 'target-gpa-badge danger';
      targetMessageCard.className = 'target-message-card danger';
      targetMessageText.textContent = `Target GPA of ${targetGpa.toFixed(2)} is mathematically impossible. Even with a perfect '${state.scale === 'AU' ? 'O' : 'A+'}' grade in all remaining ${remainingCredits.toFixed(1)} credits, your maximum GPA would be ${((currentPoints + (remainingCredits * maxGradePoint)) / expectedTotalCredits).toFixed(2)}.`;
    } else {
      // Feasible but requires effort
      // Identify corresponding average letter grade needed
      let recommendedGrade = '';
      if (state.scale === 'AU') {
        if (requiredRemainingAvg > 9.0) recommendedGrade = 'O (Outstanding)';
        else if (requiredRemainingAvg > 8.0) recommendedGrade = 'A+ (Excellent)';
        else if (requiredRemainingAvg > 7.0) recommendedGrade = 'A (Very Good)';
        else if (requiredRemainingAvg > 6.0) recommendedGrade = 'B+ (Good)';
        else if (requiredRemainingAvg > 5.0) recommendedGrade = 'B (Above Average)';
        else recommendedGrade = 'C (Average)';
      } else {
        if (requiredRemainingAvg > 3.7) recommendedGrade = 'A/A+';
        else if (requiredRemainingAvg > 3.3) recommendedGrade = 'A-';
        else if (requiredRemainingAvg > 3.0) recommendedGrade = 'B+';
        else if (requiredRemainingAvg > 2.7) recommendedGrade = 'B';
        else if (requiredRemainingAvg > 2.3) recommendedGrade = 'B-';
        else if (requiredRemainingAvg > 2.0) recommendedGrade = 'C+';
        else if (requiredRemainingAvg > 1.7) recommendedGrade = 'C';
        else recommendedGrade = 'D';
      }

      // Check risk level
      const riskRatio = requiredRemainingAvg / maxGradePoint;
      if (riskRatio > 0.82) {
        targetGpaStatus.textContent = 'At Risk';
        targetGpaStatus.className = 'target-gpa-badge warning';
        targetMessageCard.className = 'target-message-card warning';
      } else {
        targetGpaStatus.textContent = 'On Track';
        targetGpaStatus.className = 'target-gpa-badge';
        targetMessageCard.className = 'target-message-card on-track';
      }

      targetMessageText.innerHTML = `To hit your target of <strong>${targetGpa.toFixed(2)}</strong>, you need to average a grade of <strong>${recommendedGrade}</strong> (minimum <strong>${requiredRemainingAvg.toFixed(2)}</strong> points per credit) across your remaining <strong>${remainingCredits.toFixed(1)}</strong> credits.`;
    }
  }
}

  // --- TAB 2: CGPA TRACKER VIEW ---
  function renderCgpaRows() {
    cgpaTbody.innerHTML = '';
    state.cgpaSemesters.forEach((sem, idx) => {
      createCgpaRow(sem, idx);
    });
  }

  function createCgpaRow(data = {}, index) {
    const tr = document.createElement('tr');
    const defaultCredits = getPresetCreditsForSem(state.dept, (index + 1).toString());
    tr.innerHTML = `
      <td>
        <input type="text" value="${escapeHtml(data.semName || `Semester ${index + 1}`)}" class="cgpa-sem-name">
      </td>
      <td>
        <input type="number" min="0" max="100" step="0.5" value="${data.credits != null ? data.credits : defaultCredits}" class="cgpa-credits">
      </td>
      <td>
        <input type="number" min="0" max="${state.scale === 'AU' ? 10.0 : 4.0}" step="0.01" value="${data.gpa != null ? data.gpa : 8.0}" class="cgpa-gpa">
      </td>
      <td>
        <button type="button" class="btn-row-remove" aria-label="Remove Semester">
          <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" stroke-width="2.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </td>
    `;

    cgpaTbody.appendChild(tr);

    // Event listeners
    const inputs = tr.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('input', () => {
        collectCgpaData();
        updateCgpaCalculation();
        saveCgpaState();
      });
    });

    tr.querySelector('.btn-row-remove').addEventListener('click', () => {
      tr.remove();
      collectCgpaData();
      updateCgpaCalculation();
      saveCgpaState();
    });
  }

  function collectCgpaData() {
    const rows = Array.from(cgpaTbody.querySelectorAll('tr'));
    state.cgpaSemesters = rows.map(r => {
      return {
        semName: r.querySelector('.cgpa-sem-name').value,
        credits: parseFloat(r.querySelector('.cgpa-credits').value) || 0,
        gpa: parseFloat(r.querySelector('.cgpa-gpa').value) || 0
      };
    });
  }

  function saveCgpaState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { }
  }

  function updateCgpaCalculation() {
    let totalCredits = 0;
    let totalWeightedGpa = 0;

    state.cgpaSemesters.forEach(sem => {
      totalCredits += sem.credits;
      totalWeightedGpa += (sem.gpa * sem.credits);
    });

    const cgpa = totalCredits > 0 ? (totalWeightedGpa / totalCredits) : 0;
    cgpaDisplayVal.textContent = totalCredits > 0 ? cgpa.toFixed(2) : '0.00';
    cgpaTotalCreditsEl.textContent = totalCredits.toFixed(2);

    // Classification (Anna University Regulation 2021)
    let classification = '—';
    let motivationalMsg = '';

    if (totalCredits > 0) {
      if (state.scale === 'AU') {
        if (cgpa >= 8.5) {
          classification = 'First Class with Distinction';
          motivationalMsg = 'Sensational achievement! You are currently eligible for First Class with Distinction. Keep maintaining it! 🌟';
        } else if (cgpa >= 6.5) {
          classification = 'First Class';
          motivationalMsg = 'Excellent work! You are in the First Class bracket. A little extra push could bump you to Distinction!';
        } else if (cgpa >= 5.0) {
          classification = 'Second Class';
          motivationalMsg = 'You are in the Second Class bracket. Focus on increasing your GPA in subsequent semesters.';
        } else {
          classification = 'Arrears / Re-appearance needed';
          motivationalMsg = 'Keep working hard. Aim to clear outstanding semesters to qualify for classification.';
        }
      } else {
        // US standard classification estimation
        if (cgpa >= 3.8) {
          classification = 'Summa Cum Laude (Distinction)';
          motivationalMsg = 'Phenomenal academic record! Placing you in the highest honors tier. 🎓';
        } else if (cgpa >= 3.5) {
          classification = 'Magna Cum Laude (High Honors)';
          motivationalMsg = 'Stellar performance! You qualify for high honors.';
        } else if (cgpa >= 3.0) {
          classification = 'Cum Laude (Honors)';
          motivationalMsg = 'Very good job! You qualify for graduation honors.';
        } else if (cgpa >= 2.0) {
          classification = 'Good Standing';
          motivationalMsg = 'You are in good academic standing. Keep pushing forward!';
        } else {
          classification = 'Academic Probation';
          motivationalMsg = 'Seek support to improve your grade point average.';
        }
      }
    } else {
      motivationalMsg = 'No semester data added. Add semesters to calculate overall standing.';
    }

    cgpaClassEl.textContent = classification;
    cgpaStatusBox.textContent = motivationalMsg;

    // Switch styling of motivational box depending on classification
    if (classification.includes('Distinction') || classification.includes('First Class') || classification.includes('Laude')) {
      cgpaStatusBox.style.borderLeftColor = 'var(--accent-emerald)';
      cgpaStatusBox.style.background = 'rgba(16, 185, 129, 0.03)';
    } else if (classification === '—') {
      cgpaStatusBox.style.borderLeftColor = 'var(--accent-blue)';
      cgpaStatusBox.style.background = 'rgba(255, 255, 255, 0.02)';
    } else {
      cgpaStatusBox.style.borderLeftColor = 'var(--accent-red)';
      cgpaStatusBox.style.background = 'rgba(239, 68, 68, 0.03)';
    }
  }

  // --- Event Listeners and Triggers ---
  function setupEventListeners() {
    initSwipeToDelete(coursesTbody);
    initSwipeToDelete(cgpaTbody);

    saveSemesterBtn.addEventListener('click', () => {
      saveCurrentSemesterMarks();
    });

    // Tab switching
    tabBtnGpa.addEventListener('click', () => {
      updateTabUI('gpa');
    });

    tabBtnCgpa.addEventListener('click', () => {
      updateTabUI('cgpa');
      syncCgpaTracker();
      renderCgpaRows();
      updateCgpaCalculation();
    });

    btnStart.addEventListener('click', () => {
      startApp();
    });

    btnChangeSetup.addEventListener('click', () => {
      sessionStorage.setItem('isChangingSetup', 'true');
      introOverlay.style.display = 'flex';
      // Force reflow
      void introOverlay.offsetWidth;
      introOverlay.classList.remove('hidden');
      introOverlay.classList.add('active');
      mainApp.style.display = 'none';
    });

    yearSelect.addEventListener('change', () => {
      updateSemestersByYear();
    });

    // Target GPA inputs removed

    // Main buttons
    addCourseBtn.addEventListener('click', () => {
      createCourseRow({ name: '', credits: 3, grade: '' });
      updateGpaCalculation();
      saveStateToStorage();
      showToast('Added new customizable course row.');
    });

    resetBtn.addEventListener('click', () => {
      showConfirm('Are you sure you want to reset this semester? All custom subjects and selected grades will be wiped.', 'Reset Semester')
        .then(confirm => {
          if (confirm) {
            loadPresetCourses(deptSelect.value, semSelect.value, true);
            showToast('Semester has been reset.');
          }
        });
    });

    // CGPA Buttons
    cgpaAddRowBtn.addEventListener('click', () => {
      const nextIdx = state.cgpaSemesters.length;
      const defaultCredits = getPresetCreditsForSem(state.dept, (nextIdx + 1).toString());
      createCgpaRow({ semName: `Semester ${nextIdx + 1}`, credits: defaultCredits, gpa: 8.0 }, nextIdx);
      collectCgpaData();
      updateCgpaCalculation();
      saveCgpaState();
      showToast('Added new semester tracker row.');
    });

    cgpaResetBtn.addEventListener('click', () => {
      showConfirm('Clear all semesters in your CGPA tracker? This action cannot be undone.', 'Reset CGPA Tracker')
        .then(confirm => {
          if (confirm) {
            state.cgpaSemesters = [];
            renderCgpaRows();
            updateCgpaCalculation();
            saveCgpaState();
            showToast('CGPA tracker has been cleared.');
          }
        });
    });
  }

  // --- Styled Toast System ---
  let toastTimeout;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    // Add show class after a minor delay to trigger transition
    setTimeout(() => {
      toastEl.classList.add('show');
    }, 10);

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.classList.remove('show');
      setTimeout(() => {
        toastEl.hidden = true;
      }, 300);
    }, 3000);
  }

  // --- Styled Confirmation Dialog Modal ---
  function showConfirm(message, title = 'Confirm Action') {
    return new Promise(resolve => {
      modalTitle.textContent = title;
      modalMessage.textContent = message;
      modal.setAttribute('aria-hidden', 'false');

      const prevActive = document.activeElement;
      modalConfirm.focus();

      function onConfirm() {
        cleanup();
        resolve(true);
      }

      function onCancel() {
        cleanup();
        resolve(false);
      }

      function onKeydown(e) {
        if (e.key === 'Escape') {
          onCancel();
        }
      }

      function cleanup() {
        modal.setAttribute('aria-hidden', 'true');
        modalConfirm.removeEventListener('click', onConfirm);
        modalCancel.removeEventListener('click', onCancel);
        document.removeEventListener('keydown', onKeydown);
        if (prevActive && prevActive.focus) prevActive.focus();
      }

      modalConfirm.addEventListener('click', onConfirm);
      modalCancel.addEventListener('click', onCancel);
      document.addEventListener('keydown', onKeydown);
    });
  }

  // Helper to escape HTML characters
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // --- Mobile Swipe to Delete ---
  let swipeState = { 
    row: null, 
    startX: 0, 
    startY: 0, 
    startTransform: 0, 
    currentX: 0, 
    isSwiping: false, 
    openRow: null, 
    directionChecked: false, 
    isVerticalScroll: false 
  };

  function initSwipeToDelete(tbody) {
    tbody.addEventListener('touchstart', e => {
      if (window.innerWidth > 640) return;
      
      // Ignore swipe if clicking on buttons or links
      if (e.target.closest('button, a')) return;
      
      const row = e.target.closest('tr');
      if (!row) return;

      // Close previously open row if different
      if (swipeState.openRow && swipeState.openRow !== row) {
        swipeState.openRow.style.transform = 'translateX(0)';
        swipeState.openRow.style.boxShadow = '';
        swipeState.openRow = null;
        const bg = document.getElementById('global-swipe-bg');
        if (bg) bg.style.display = 'none';
      }

      swipeState.row = row;
      swipeState.startX = e.touches[0].clientX;
      swipeState.startY = e.touches[0].clientY;
      swipeState.startTransform = swipeState.openRow === row ? -160 : 0;
      swipeState.currentX = swipeState.startTransform;
      swipeState.isSwiping = true;
      swipeState.directionChecked = false;
      swipeState.isVerticalScroll = false;
      
      row.style.transition = 'none';
    }, {passive: true});

    tbody.addEventListener('touchmove', e => {
      if (!swipeState.isSwiping || !swipeState.row) return;
      
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const deltaX = currentX - swipeState.startX;
      const deltaY = currentY - swipeState.startY;

      // Detect direction on first movements (at least 8px threshold)
      if (!swipeState.directionChecked) {
        if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
          if (Math.abs(deltaY) > Math.abs(deltaX)) {
            // Vertical scroll: abort swipe
            swipeState.isVerticalScroll = true;
            swipeState.isSwiping = false;
          } else {
            // Horizontal swipe: setup background
            swipeState.directionChecked = true;
            if (document.activeElement && typeof document.activeElement.blur === 'function') {
              document.activeElement.blur();
            }
            const row = swipeState.row;
            row.style.position = 'relative';
            row.style.zIndex = '2';

            let bg = document.getElementById('global-swipe-bg');
            if (!bg) {
              bg = document.createElement('div');
              bg.id = 'global-swipe-bg';
              bg.innerHTML = '<div style="position:absolute; right:0; top:0; bottom:0; width:180px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:12px; box-sizing:border-box;"><button style="display:flex; align-items:center; justify-content:center; gap:8px; width:100%; height:100%; max-height:48px; font-weight:600; font-size:0.875rem; border-radius:8px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); background-color:#ef4444; color:white; border:none; cursor:pointer;"><svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg><span>Delete</span></button></div>';
              bg.style.position = 'absolute';
              bg.style.backgroundColor = 'transparent';
              bg.style.borderRadius = '16px';
              bg.style.display = 'none';
              bg.style.alignItems = 'center';
              bg.style.justifyContent = 'flex-end';
              bg.style.zIndex = '1';
            }

            if (bg.parentNode !== row.parentNode) {
              row.parentNode.appendChild(bg);
            }

            row.parentNode.style.position = 'relative';
            bg.style.top = row.offsetTop + 'px';
            bg.style.left = row.offsetLeft + 'px';
            bg.style.width = row.offsetWidth + 'px';
            bg.style.height = row.offsetHeight + 'px';
            bg.style.display = 'flex';

            bg.onclick = (event) => {
              event.preventDefault();
              const activeRow = swipeState.openRow || swipeState.row;
              if (activeRow) {
                const deleteBtn = activeRow.querySelector('.btn-row-remove');
                if (deleteBtn) deleteBtn.click();
                activeRow.style.transform = 'translateX(0)';
              }
              bg.style.display = 'none';
              swipeState.openRow = null;
            };
          }
        }
        return;
      }

      if (swipeState.isVerticalScroll) return;

      // Lock vertical scrolling while swiping horizontally
      if (e.cancelable) e.preventDefault();

      let newX = swipeState.startTransform + deltaX;
      
      // Restrict swipe between -200px (left) and 0px (right)
      if (newX > 0) newX = 0;
      if (newX < -200) newX = -200;
      
      swipeState.currentX = newX;
      swipeState.row.style.transform = `translateX(${swipeState.currentX}px)`;
    }, {passive: false});

    tbody.addEventListener('touchend', e => {
      if (!swipeState.row) return;

      const row = swipeState.row;
      row.style.transition = 'transform 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), box-shadow 0.3s';

      if (swipeState.isSwiping && swipeState.directionChecked && !swipeState.isVerticalScroll) {
        swipeState.isSwiping = false;
        if (swipeState.currentX <= -50) {
          // Snap open
          row.style.transform = `translateX(-160px)`;
          row.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
          swipeState.openRow = row;
        } else {
          // Snap closed
          row.style.transform = `translateX(0)`;
          row.style.boxShadow = '';
          swipeState.openRow = null;
          setTimeout(() => {
            if (!swipeState.openRow) {
              const bg = document.getElementById('global-swipe-bg');
              if (bg) bg.style.display = 'none';
            }
          }, 300);
        }
      } else {
        // Just clean up if it was a vertical scroll or simple tap
        if (swipeState.openRow !== row) {
          row.style.transform = 'translateX(0)';
          row.style.boxShadow = '';
        }
      }
      swipeState.row = null;
      swipeState.isSwiping = false;
    });
  }

  // Launch on document ready
  document.addEventListener('DOMContentLoaded', init);

})();
