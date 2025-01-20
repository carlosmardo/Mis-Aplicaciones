/*
  AQUÍ VA LA INICIALIZACIÓN DE LA BASE DE DATOS
*/

// Initialize data
let students = [];
let groups = [];
let payments = [];
let pendingPayments = [];
let events = {};

// Elementos del DOM
const mainContent = document.getElementById('mainContent');
const btnCalendario = document.getElementById('btnCalendario');
const btnMisAlumnos = document.getElementById('btnMisAlumnos');
const btnPagos = document.getElementById('btnPagos');
const btnPagosPendientes = document.getElementById('btnPagosPendientes');
const btnEstadisticas = document.getElementById('btnEstadisticas');

// Event Listeners
btnCalendario.addEventListener('click', showCalendar);
btnMisAlumnos.addEventListener('click', showStudents);
btnPagos.addEventListener('click', showPayments);
btnPagosPendientes.addEventListener('click', showPendingPayments);
btnEstadisticas.addEventListener('click', showStatistics);

let currentDate = new Date();

async function loadInitialData() {
    const data = await getData('/');
    if (data) {
      students = data.students || [];
      groups = data.groups || [];
      payments = data.payments || [];
      pendingPayments = data.pendingPayments || [];
      events = data.events || {};
      
      updatePendingPaymentsCount();
    }
    showCalendar();
  }

// Save all data
async function saveAllData() {
  await saveData('/', {
    students,
    groups,
    payments,
    pendingPayments,
    events
  });
}

function applyFadeInAnimation(container) {
    const elements = container.querySelectorAll('*');
    elements.forEach((el, index) => {
        el.classList.add('fade-in-element');
        setTimeout(() => {
            el.classList.add('animate');
        }, index * 20); 
    });
}

function showCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  let calendarHTML = '<div class="calendar-header">';
  calendarHTML += `<button id="prevMonth">❮</button>`;
  calendarHTML += `<h2>${getMonthName(month)} ${year}</h2>`;
  calendarHTML += `<button id="nextMonth">❯</button>`;
  calendarHTML += '</div>';
  calendarHTML += '<div class="calendar">';
  calendarHTML += getDaysOfWeek();
  calendarHTML += getDaysInMonth(month, year);
  calendarHTML += '</div>';
  
  mainContent.innerHTML = calendarHTML;
  applyFadeInAnimation(mainContent);
  
  document.querySelectorAll('.calendar-day').forEach(day => {
      const date = day.dataset.date;
      if (date) {
          day.addEventListener('click', () => showDayDetails(date));
          updateCalendarDayColor(date, !!events[date]);
      }
  });

  document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
  document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
}

function getDaysOfWeek() {
  const daysOfWeek = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
  return daysOfWeek.map(day => `<div class="calendar-day day-name">${day}</div>`).join('');
}

function getDaysInMonth(month, year) {
    const firstDay = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(year, month + 1, 0));
    let days = '';
  
    let startDay = firstDay.getUTCDay() - 1;
    if (startDay === -1) startDay = 6;
  
    for (let i = 0; i < startDay; i++) {
      days += '<div class="calendar-day empty"></div>';
    }
    
    for (let i = 1; i <= lastDay.getUTCDate(); i++) {
      const date = new Date(Date.UTC(year, month, i));
      const dateString = date.toISOString().split('T')[0];
      const hasEvents = events[dateString] ? 'has-events' : '';
      const isToday = isDateToday(date) ? 'today' : '';
      days += `<div class="calendar-day ${hasEvents} ${isToday}" data-date="${dateString}">${i}</div>`;
    }
    
    return days;
  }

function getMonthName(month) {
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return monthNames[month];
}

function changeMonth(delta) {
  currentDate.setMonth(currentDate.getMonth() + delta);
  showCalendar();
}

function isDateToday(date) {
  const today = new Date();
  return date.getUTCDate() === today.getDate() &&
         date.getUTCMonth() === today.getMonth() &&
         date.getUTCFullYear() === today.getFullYear();
}

async function showDayDetails(date) {
  const displayDate = new Date(date + 'T00:00:00Z');
  const formattedDate = displayDate.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'UTC'
  });
    
  let dayDetailsHTML = `<h2>${formattedDate}</h2>`;
  dayDetailsHTML += '<button id="btnAddGroup">+ Agregar Grupo</button>';
    
  if (events[date]) {
    events[date].forEach(group => {
      dayDetailsHTML += `<div class="group-item">
        <button class="btnDeleteGroup" data-group="${group.name}" data-date="${date}">Eliminar Grupo</button>
        <ul class="student-list">
          ${group.students.map(studentId => {
            const student = students.find(s => s.id === studentId);
            if (!student) return ''; // Omitir si el estudiante no existe
            const attendance = student.attendance && student.attendance[date] ? student.attendance[date] : { present: false, classCount: getAccumulatedClasses(student, date) };
            const isPaid = payments.some(p => p.studentId === student.id && p.date === date);
            const isPending = pendingPayments.some(p => p.studentId === student.id && p.date === date);
            //const paymentAmount = student.payment !== undefined ? student.payment.toFixed(2) : 'No definido';
            return `
              <li class="student-item studentitem2">
                <div class="nombreclass">
                  ${student.name}
                  <span>Clases: ${attendance.classCount}</span>
                  
                </div>
                <div class="btnpreauspay">
                  <button class="btnPresent ${attendance.present ? 'present' : ''}" data-student="${student.id}" data-date="${date}">Presente</button>
                  <button class="btnAbsent ${!attendance.present ? 'absent' : ''}" data-student="${student.id}" data-date="${date}">Ausente</button>
                  ${attendance.classCount === 4 ? `<button class="btnPaid ${isPaid ? 'paid' : ''}" data-student="${student.id}" data-date="${date}">${isPaid ? 'Pagado' : isPending ? 'Pendiente' : 'Marcar Pago'}</button>` : ''}
                </div>
              </li>
            `;
          }).join('')}
        </ul>
      </div>`;
    });
  }
    
  dayDetailsHTML += '<button id="btnBack">Volver</button>';
  mainContent.innerHTML = dayDetailsHTML;

  document.querySelectorAll('.btnPresent, .btnAbsent, .btnPaid').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const studentId = e.target.dataset.student;
      const date = e.target.dataset.date;

      if (e.target.classList.contains('btnPresent')) {
        await markAttendance(studentId, date, true);
        e.target.classList.add('present');
        e.target.nextElementSibling.classList.remove('absent');
      }
      if (e.target.classList.contains('btnAbsent')) {
        await markAttendance(studentId, date, false);
        e.target.classList.add('absent');
        e.target.previousElementSibling.classList.remove('present');
      }
      if (e.target.classList.contains('btnPaid')) {
        await markPaid(studentId, date);
        e.target.classList.add('paid');
        e.target.textContent = 'Pagado';
      }
      await saveAllData();

      updatePendingPaymentsCount();
    });
  });

  document.getElementById('btnAddGroup').addEventListener('click', async () => {
    await showAddGroupModal(date);
    await saveAllData();
  });
  document.getElementById('btnBack').addEventListener('click', showCalendar);
  document.querySelectorAll('.btnDeleteGroup').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      await deleteGroup(e.target.dataset.group, e.target.dataset.date);
      await saveAllData();
      updatePendingPaymentsCount();
    });
  });
}

async function showStudents() {
  let studentsHTML = '<h2>Mis Alumnos</h2>';
  studentsHTML += '<button id="btnAddStudent">+ Añadir Alumno</button>';
  studentsHTML += '<ul class="student-list">';
  students.filter(student => !student.inactive).forEach(student => {
      const classCount = getStudentClassCount(student);
      studentsHTML += `
          <li class="student-item">
              ${student.name} (${student.group})
              <span>Clases: ${classCount}</span>
              
              <button class="btnDeleteStudent" data-student="${student.id}">Eliminar Alumno</button>
          </li>
      `;                                              
  });
  studentsHTML += '</ul>';
  studentsHTML += '<button id="btnBack">Volver</button>';
  
  mainContent.innerHTML = studentsHTML;

  applyFadeInAnimation(mainContent);
  
  document.getElementById('btnAddStudent').addEventListener('click', async () => {
      await showAddStudentModal();
      await saveAllData();
  });
  document.getElementById('btnBack').addEventListener('click', showCalendar);
  document.querySelectorAll('.btnDeleteStudent').forEach(btn => {
      btn.addEventListener('click', async (e) => {
          await deleteStudent(e.target.dataset.student);
          await saveAllData();
      });
  });
}

async function showPayments() {
  let paymentsHTML = '<h2>Historial de Pagos</h2>';
  paymentsHTML += '<ul class="payment-list">';
  payments.forEach(payment => {
      const student = students.find(s => s.id === payment.studentId);
      if (student) {
          const amount = payment.amount !== undefined ? payment.amount.toFixed(2) : 'No definido';
          paymentsHTML += `
              <li class="payment-item">
                  ${student.name} - ${payment.date} - ${amount}€
              </li>
          `;
      }
  });
  paymentsHTML += '</ul>';
  paymentsHTML += '<button id="btnBack">Volver</button>';
  
  mainContent.innerHTML = paymentsHTML;
  
  applyFadeInAnimation(mainContent);
  
  document.getElementById('btnBack').addEventListener('click', showCalendar);
}

async function showAddStudentModal() {
  const modalHTML = `
        <div id="addStudentModal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2 id="titulomodalblanco">Añadir Alumno</h2>
                <form id="addStudentForm">
                    <label for="studentName">Nombre:</label>
                    <input type="text" id="studentName" required>
                    <label for="studentGroup">Grupo:</label>
                    <input type="text" id="studentGroup" required>
                    <label for="studentPayment">Cantidad de pago por clase:</label>
                    <input type="number" id="studentPayment" required min="0" step="5">
                    <button type="submit">Añadir</button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('addStudentModal');
    const span = document.getElementsByClassName('close')[0];
    const form = document.getElementById('addStudentForm');
    
    modal.style.display = 'block';
    
    span.onclick = () => {
        modal.style.display = 'none';
        modal.remove();
    };
    
    form.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('studentName').value;
      const group = document.getElementById('studentGroup').value;
      const payment = parseFloat(document.getElementById('studentPayment').value);
      await addStudent(name, group, payment);
      await saveAllData();
      modal.style.display = 'none';
      modal.remove();
      await showStudents();
  };
}

async function showAddGroupModal(date) {
  const modalHTML = `
        <div id="addGroupModal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2 id="titulomodalblanco">Agregar Grupo</h2>
                <form id="addGroupForm">
                    <label for="groupSelect">Seleccionar Grupo:</label>
                    <select id="groupSelect" required>
                        ${groups.map(group => `<option value="${group}">${group}</option>`).join('')}
                    </select>
                    <button type="submit">Agregar</button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById('addGroupModal');
    const span = document.getElementsByClassName('close')[0];
    const form = document.getElementById('addGroupForm');
    
    modal.style.display = 'block';
    
    span.onclick = () => {
        modal.style.display = 'none';
        modal.remove();
    };
    
    form.onsubmit = async (e) => {
      e.preventDefault();
      const group = document.getElementById('groupSelect').value;
      await addGroupToDate(group, date);
      await saveAllData();
      modal.style.display = 'none';
      modal.remove();
      await showDayDetails(date);
  };
}

async function addStudent(name, group, payment = 0) {
  const newStudent = {
    id: students.length + 1,
    name: name,
    group: group,
    payment: payment,
    attendance: {}
  };
  students.push(newStudent);
  if (!groups.includes(group)) {
    groups.push(group);
  }
  await saveAllData();
}

async function deleteStudent(studentId) {
  const student = students.find(s => s.id === parseInt(studentId));
  if (student && confirm(`¿Estás seguro de que quieres eliminar al alumno "${student.name}"?`)) {
      student.inactive = true;

      const today = new Date().toISOString().split('T')[0];
      for (let date in events) {
          if (date >= today) {
              events[date] = events[date].map(group => ({
                  ...group,
                  students: group.students.filter(id => id !== parseInt(studentId))
              }));
              events[date] = events[date].filter(group => group.students.length > 0);
              if (events[date].length === 0) {
                  delete events[date];
              }
          }
      }

      pendingPayments = pendingPayments.filter(p => !(p.studentId === parseInt(studentId) && p.date >= today));

      await saveAllData();
      await showStudents();
  }
}

async function addGroupToDate(group, date) {
  if (!events[date]) {
      events[date] = [];
  }
  const groupStudents = students.filter(student => student.group === group && !student.inactive).map(student => student.id);
  events[date].push({
      name: group,
      students: groupStudents
  });
  updateCalendarDayColor(date, true);
  await saveAllData();
}

async function deleteGroup(group, date) {
  if (confirm(`¿Estás seguro de que quieres eliminar el grupo "${group}" para la fecha ${date}?`)) {
      if (events[date]) {
          const groupToDelete = events[date].find(g => g.name === group);
          if (groupToDelete) {
              groupToDelete.students.forEach(studentId => {
                  payments = payments.filter(p => !(p.studentId === studentId && p.date === date));
                  pendingPayments = pendingPayments.filter(p => !(p.studentId === studentId && p.date === date));
                  const student = students.find(s => s.id === studentId);
                  if (student && student.attendance && student.attendance[date]) {
                      delete student.attendance[date];
                  }
              });

              events[date] = events[date].filter(g => g.name !== group);

              if (events[date].length === 0) {
                  delete events[date];
                  updateCalendarDayColor(date, false);
              }
          }
      }

      await saveAllData();
      updatePendingPaymentsCount();
      await showDayDetails(date);
  }
}

async function markAttendance(studentId, date, present) {
  const student = students.find(s => s.id === parseInt(studentId));
  if (student) {
      if (!student.attendance) {
          student.attendance = {};
      }
      if (!student.attendance[date]) {
          student.attendance[date] = { 
              present: false, 
              classCount: getAccumulatedClasses(student, date)
          };
      }
      
      if (present && !student.attendance[date].present) {
          student.attendance[date].present = true;
          student.attendance[date].classCount++;
          if (student.attendance[date].classCount > 4) {
              student.attendance[date].classCount = 1;
          }
          if (student.attendance[date].classCount === 4) {
              await addPendingPayment(student.id, date);
          }
      } else if (!present && student.attendance[date].present) {
          student.attendance[date].present = false;
          student.attendance[date].classCount = Math.max(0, student.attendance[date].classCount - 1);
          if (student.attendance[date].classCount < 4) {
              await removePendingPayment(student.id, date);
          }
      }
  }
  await saveAllData();
  await showDayDetails(date);
}

function getAccumulatedClasses(student, date) {
  let count = 0;
  if (student && student.attendance) {
    for (let [attendanceDate, attendance] of Object.entries(student.attendance)) {
        if (attendanceDate < date && attendance.present) {
            count++;
        }
    }
  }
  return count % 4;
}

async function addPendingPayment(studentId, date) {
  if (!pendingPayments.some(p => p.studentId === studentId && p.date === date)) {
    pendingPayments.push({ studentId, date });
    updatePendingPaymentsCount();
    await saveAllData();
  }
}

async function removePendingPayment(studentId, date) {
  pendingPayments = pendingPayments.filter(p => !(p.studentId === studentId && p.date === date));
  await saveAllData();
}

async function markPaid(studentId, date) {
  const student = students.find(s => s.id === parseInt(studentId));
  if (student) {
      const paymentIndex = payments.findIndex(p => p.studentId === student.id && p.date === date);
      const pendingIndex = pendingPayments.findIndex(p => p.studentId === student.id && p.date === date);
      
      if (paymentIndex !== -1) {
          payments.splice(paymentIndex, 1);
          pendingPayments.push({ studentId: student.id, date: date });
      } else {
          const amount = student.payment !== undefined ? student.payment : 0;
          payments.push({
              studentId: student.id,
              date: date,
              amount: amount
          });
          if (pendingIndex !== -1) {
              pendingPayments.splice(pendingIndex, 1);
          }
      }
  }
  await saveAllData();
  await showDayDetails(date);
}

async function showPendingPayments() {
  let pendingHTML = '<h2>Pagos Pendientes</h2>';

  if (pendingPayments.length === 0) {
    pendingHTML += '<p id="msjaldia">" Parece que los padres tienen los pagos al día."</p>';
    
    const btnPagosPendientes = document.getElementById('btnPagosPendientes');
    const badge = btnPagosPendientes.querySelector('.badge');
    if (badge) {
      badge.remove();
    }
  } else {
    pendingHTML += '<ul class="payment-list">';
    pendingPayments.forEach(pending => {
        const student = students.find(s => s.id === pending.studentId);
        if (student) {
            const pendingDate = new Date(pending.date + 'T00:00:00Z');
            const formattedDate = pendingDate.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                timeZone: 'UTC'
            });
            pendingHTML += `
                <li class="payment-item">
                    <a href="#" class="pending-payment-link" data-date="${pending.date}">
                        ${student.name} - ${formattedDate}
                    </a>
                </li>
            `;
        }
    });
    pendingHTML += '</ul>';
    
    updatePendingPaymentsCount();
  }

  pendingHTML += '<button id="btnBack">Volver</button>';
  
  mainContent.innerHTML = pendingHTML;
  applyFadeInAnimation(mainContent);
  
  document.getElementById('btnBack').addEventListener('click', showCalendar);
  document.querySelectorAll('.pending-payment-link').forEach(link => {
      link.addEventListener('click', (e) => {
          e.preventDefault();
          showDayDetails(e.target.dataset.date);
      });
  });
}

function updatePendingPaymentsCount() {
  const pendingPaymentsCount = pendingPayments.length;

  const pendingPaymentsButton = document.getElementById('btnPagosPendientes');
  
  if (pendingPaymentsCount > 0) {
    const counter = document.querySelector('.pending-count');
    
    if (counter) {
      counter.textContent = pendingPaymentsCount;
    } else {
      const counterElement = document.createElement('span');
      counterElement.classList.add('pending-count');
      counterElement.textContent = pendingPaymentsCount;
      pendingPaymentsButton.appendChild(counterElement);
    }
  } else {
    const counter = document.querySelector('.pending-count');
    if (counter) {
      counter.remove();
    }
  }
}

async function markPaymentAsPaid(paymentDate, studentId) {
  pendingPayments = pendingPayments.filter(payment => payment.studentId !== studentId || payment.date !== paymentDate);
  updatePendingPaymentsCount();
  await saveAllData();
}

async function showStatistics() {
  let totalClasses = 0;
  let totalEarnings = 0;

  for (let date in events) {
      totalClasses += events[date].length;
  }

  totalEarnings = payments.reduce((sum, payment) => sum + payment.amount, 0);

  let statisticsHTML = '<h2>Mis Estadísticas</h2>';
  statisticsHTML += `<p id="colorblanco">Total de clases impartidas: ${totalClasses}</p>`;
  statisticsHTML += `<p id="colorblanco">Total de ingresos: ${totalEarnings.toFixed(2)}€</p>`;
  statisticsHTML += '<button id="btnBack">Volver</button>';

  mainContent.innerHTML = statisticsHTML;

  applyFadeInAnimation(mainContent);

  document.getElementById('btnBack').addEventListener('click', showCalendar);
}

function updateCalendarDayColor(date, hasEvents) {
  const calendarDay = document.querySelector(`.calendar-day[data-date="${date}"]`);
    if (calendarDay) {
        if (hasEvents) {
            calendarDay.classList.add('has-events');
        } else {
            calendarDay.classList.remove('has-events');
        }
    }
}

function getStudentClassCount(student) {
  if (!student || !student.attendance) return 0;
  
  let count = 0;
  const sortedDates = Object.keys(student.attendance).sort();
  for (let date of sortedDates) {
      if (student.attendance[date].present) {
          count++;
          if (count > 4) {
              count = 1;
          }
      }
  }
  return count;
}

loadInitialData();
showCalendar();