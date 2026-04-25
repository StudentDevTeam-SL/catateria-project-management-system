// admin.js — LuxeCafé Admin Panel Logic

// ── Toast ──────────────────────────────────────────────
function toast(msg, type='info') {
  const tc = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  const icons = {success:'✅',error:'❌',info:'ℹ️',warning:'⚠️'};
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  tc.appendChild(t);
  setTimeout(()=>{ t.classList.add('hide'); setTimeout(()=>t.remove(),350); }, 3000);
}

// ── Tabs ───────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    const panel = document.getElementById('tab-' + btn.dataset.tab);
    if(panel) panel.classList.add('active');
    loadTab(btn.dataset.tab);
  });
});

function loadTab(tab) {
  switch(tab) {
    case 'dashboard': loadDashboard(); break;
    case 'orders':    loadOrders(); break;
    case 'menu':      loadMenu(); break;
    case 'categories':loadCategories(); break;
    case 'employees': loadEmployees(); break;
    case 'salaries':  loadSalaries(); break;
    case 'inventory': loadInventory(); break;
    case 'payments':  loadPayments(); break;
    case 'users':     loadUsers(); break;
    case 'auditlogs': loadAuditLogs(); break;
  }
}

// ── Clock ──────────────────────────────────────────────
function updateClock() {
  const el = document.getElementById('hdrTime');
  if(el) el.textContent = new Date().toLocaleTimeString();
}
setInterval(updateClock, 1000); updateClock();

// ── Modal helpers ──────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
function bindClose(btnId, modalId) {
  document.getElementById(btnId).addEventListener('click', ()=>closeModal(modalId));
  document.getElementById(modalId).addEventListener('click', e=>{ if(e.target===e.currentTarget) closeModal(modalId); });
}
bindClose('closeMenuModal','menuModal');
bindClose('closeCatModal','catModal');
bindClose('closeEmpModal','empModal');
bindClose('closeSalModal','salModal');
bindClose('closeInvModal','invModal');
bindClose('closeUserModal','userModal');

// ── Helpers ────────────────────────────────────────────
function fmtDate(iso) {
  if(!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function fmtTime(iso) {
  if(!iso) return '—';
  return new Date(iso).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
}
function badge(text, type) { return `<span class="badge badge-${type}">${text}</span>`; }
function statusBadge(s) {
  const map={completed:'success',paid:'success',active:'success',pending:'warning',inactive:'warning',cancelled:'danger','out-of-stock':'danger'};
  return badge(s, map[s]||'info');
}

function tableHtml(headers, rows) {
  const th = headers.map(h=>`<th>${h}</th>`).join('');
  const tr = rows.length ? rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('') :
    `<tr><td colspan="${headers.length}" style="text-align:center;padding:2rem;color:rgba(255,255,255,0.3)">No records found</td></tr>`;
  return `<thead><tr>${th}</tr></thead><tbody>${tr}</tbody>`;
}

function actionBtns(id, editFn, deleteFn) {
  return `<div style="display:flex;gap:0.4rem">
    <button class="btn btn-warning" style="padding:0.3rem 0.7rem;font-size:0.78rem" onclick="${editFn}(${id})">✏️ Edit</button>
    <button class="btn btn-danger"  style="padding:0.3rem 0.7rem;font-size:0.78rem" onclick="${deleteFn}(${id})">🗑</button>
  </div>`;
}

// ── DASHBOARD ──────────────────────────────────────────
function loadDashboard() {
  const orders   = DB.findAll('orders');
  const payments = DB.findAll('payments');
  const employees= DB.findAll('employees');
  const menuItems= DB.findAll('menu_items');
  const inventory= DB.findAll('inventory');

  const totalRev  = payments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount,0);
  const todayOrds = orders.filter(o=>new Date(o.created_at).toDateString()===new Date().toDateString());

  // Stats
  document.getElementById('dashStats').innerHTML = [
    {label:'Total Revenue',   value:`$${totalRev.toFixed(2)}`,   sub:'All time',           color:'#ff6b35'},
    {label:'Total Orders',    value:orders.length,                sub:`${todayOrds.length} today`,   color:'#e91e63'},
    {label:'Active Employees',value:employees.filter(e=>e.status==='active').length, sub:'Staff members', color:'#7c3aed'},
    {label:'Menu Items',      value:menuItems.filter(m=>m.is_active).length, sub:'Active items', color:'#10b981'},
    {label:'Inventory Items', value:inventory.length,             sub:'In stock',           color:'#f59e0b'},
  ].map(s=>`
    <div class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value" style="color:${s.color}">${s.value}</div>
      <div class="stat-sub">${s.sub}</div>
    </div>`).join('');

  // Top items bar chart
  const orderItems = DB.findAll('order_items');
  const countMap = {};
  orderItems.forEach(oi => { countMap[oi.menu_item_id] = (countMap[oi.menu_item_id]||0)+oi.quantity; });
  const sorted = Object.entries(countMap).sort((a,b)=>b[1]-a[1]).slice(0,6);
  const maxQty = sorted.length ? sorted[0][1] : 1;
  document.getElementById('topItemsChart').innerHTML = sorted.length
    ? sorted.map(([id,qty])=>{
        const item = DB.findById('menu_items',parseInt(id));
        return `<div class="bar-row">
          <div class="bar-label">${item?item.name:'?'}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${(qty/maxQty*100).toFixed(1)}%"></div></div>
          <div class="bar-val">${qty}</div>
        </div>`;
      }).join('')
    : '<p style="color:rgba(255,255,255,0.3);font-size:0.85rem">No sales data yet</p>';

  // Activity feed from audit logs
  const logs = DB.findAll('audit_logs').slice(-10).reverse();
  document.getElementById('activityFeed').innerHTML = logs.length
    ? logs.map(l=>`<div class="activity-item">
        <div class="activity-dot" style="background:#7c3aed"></div>
        <div class="activity-text">${l.action} on ${l.table_name} #${l.record_id}</div>
        <div class="activity-time">${fmtTime(l.created_at)}</div>
      </div>`).join('')
    : '<p style="color:rgba(255,255,255,0.3);font-size:0.85rem">No activity yet</p>';

  // Recent orders table
  const empMap = Object.fromEntries(DB.findAll('employees').map(e=>[e.id,e.full_name]));
  const recent = orders.slice(-8).reverse();
  document.getElementById('recentOrders').innerHTML = tableHtml(
    ['#','Employee','Total','Status','Date'],
    recent.map(o=>[o.id, empMap[o.employee_id]||'—', `$${o.total_price.toFixed(2)}`, statusBadge(o.status), fmtTime(o.created_at)])
  );
}

// ── ORDERS ────────────────────────────────────────────
function loadOrders(filter='', statusF='') {
  const empMap = Object.fromEntries(DB.findAll('employees').map(e=>[e.id,e.full_name]));
  let rows = DB.findAll('orders').reverse();
  if(statusF) rows = rows.filter(o=>o.status===statusF);
  if(filter)  rows = rows.filter(o=>String(o.id).includes(filter)||(empMap[o.employee_id]||'').toLowerCase().includes(filter.toLowerCase()));
  document.getElementById('ordersTable').innerHTML = tableHtml(
    ['#','Employee','Total','Status','Date','Action'],
    rows.map(o=>[o.id, empMap[o.employee_id]||'—', `$${o.total_price.toFixed(2)}`, statusBadge(o.status), fmtTime(o.created_at),
      `<div style="display:flex;gap:0.4rem">
        <button class="btn btn-ghost" style="padding:0.3rem 0.7rem;font-size:0.78rem" onclick="viewOrderItems(${o.id})">👁 View</button>
        <button class="btn btn-danger" style="padding:0.3rem 0.7rem;font-size:0.78rem" onclick="deleteOrder(${o.id})">🗑</button>
      </div>`])
  );
}

window.viewOrderItems = function(orderId) {
  const items = DB.findWhere('order_items', oi=>oi.order_id===orderId);
  const menuMap = Object.fromEntries(DB.findAll('menu_items').map(m=>[m.id,m.name]));
  let list = items.map(i=>`• ${menuMap[i.menu_item_id]||'?'} x${i.quantity} @ $${i.unit_price.toFixed(2)}`).join('\n');
  alert(`Order #${orderId} Items:\n\n${list||'No items'}`);
};
window.deleteOrder = function(id) {
  if(!confirm('Delete this order?')) return;
  DB.remove('orders',id);
  toast('Order deleted','warning');
  loadOrders();
};

document.getElementById('orderSearch').addEventListener('input', e=>loadOrders(e.target.value, document.getElementById('orderStatusFilter').value));
document.getElementById('orderStatusFilter').addEventListener('change', e=>loadOrders(document.getElementById('orderSearch').value, e.target.value));

// ── MENU ITEMS ─────────────────────────────────────────
function loadMenu(filter='') {
  const cats = Object.fromEntries(DB.findAll('categories').map(c=>[c.id,c.name]));
  let items = DB.findAll('menu_items');
  if(filter) items = items.filter(i=>i.name.toLowerCase().includes(filter.toLowerCase()));
  document.getElementById('menuTable').innerHTML = tableHtml(
    ['#','Name','Price','Category','Active','Actions'],
    items.map(i=>[i.id, i.name, `$${i.price.toFixed(2)}`, cats[i.category_id]||'—',
      i.is_active ? badge('Yes','success') : badge('No','danger'),
      actionBtns(i.id,'editMenuItem','deleteMenuItem')])
  );
}

document.getElementById('addMenuBtn').addEventListener('click', ()=>{
  document.getElementById('menuId').value='';
  document.getElementById('menuModalTitle').textContent='Add Menu Item';
  document.getElementById('menuName').value='';
  document.getElementById('menuPrice').value='';
  document.getElementById('menuActive').value='true';
  const sel=document.getElementById('menuCat');
  sel.innerHTML=DB.findAll('categories').map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  openModal('menuModal');
});

window.editMenuItem = function(id) {
  const item=DB.findById('menu_items',id);
  if(!item) return;
  document.getElementById('menuId').value=id;
  document.getElementById('menuModalTitle').textContent='Edit Menu Item';
  document.getElementById('menuName').value=item.name;
  document.getElementById('menuPrice').value=item.price;
  document.getElementById('menuActive').value=String(item.is_active);
  const sel=document.getElementById('menuCat');
  sel.innerHTML=DB.findAll('categories').map(c=>`<option value="${c.id}" ${c.id===item.category_id?'selected':''}>${c.name}</option>`).join('');
  openModal('menuModal');
};

window.deleteMenuItem = function(id) {
  if(!confirm('Delete this menu item?')) return;
  DB.remove('menu_items',id); toast('Item deleted','warning'); loadMenu();
};

document.getElementById('saveMenuBtn').addEventListener('click', ()=>{
  const id=document.getElementById('menuId').value;
  const data={name:document.getElementById('menuName').value.trim(), price:parseFloat(document.getElementById('menuPrice').value),
    category_id:parseInt(document.getElementById('menuCat').value), is_active:document.getElementById('menuActive').value==='true'};
  if(!data.name||isNaN(data.price)){toast('Fill all fields','error');return;}
  if(id) DB.update('menu_items',parseInt(id),data); else DB.insert('menu_items',data);
  toast(id?'Item updated':'Item added','success'); closeModal('menuModal'); loadMenu();
});

document.getElementById('menuSearch').addEventListener('input',e=>loadMenu(e.target.value));

// ── CATEGORIES ─────────────────────────────────────────
function loadCategories() {
  const cats=DB.findAll('categories');
  document.getElementById('catTable').innerHTML=tableHtml(
    ['#','Name','Actions'],
    cats.map(c=>[c.id,c.name,actionBtns(c.id,'editCat','deleteCat')])
  );
}
document.getElementById('addCatBtn').addEventListener('click',()=>{
  document.getElementById('catId').value='';
  document.getElementById('catModalTitle').textContent='Add Category';
  document.getElementById('catName').value='';
  openModal('catModal');
});
window.editCat=function(id){
  const c=DB.findById('categories',id);
  document.getElementById('catId').value=id;
  document.getElementById('catModalTitle').textContent='Edit Category';
  document.getElementById('catName').value=c.name;
  openModal('catModal');
};
window.deleteCat=function(id){
  if(!confirm('Delete category?'))return;
  DB.remove('categories',id);toast('Deleted','warning');loadCategories();
};
document.getElementById('saveCatBtn').addEventListener('click',()=>{
  const id=document.getElementById('catId').value;
  const name=document.getElementById('catName').value.trim();
  if(!name){toast('Enter a name','error');return;}
  if(id) DB.update('categories',parseInt(id),{name}); else DB.insert('categories',{name});
  toast(id?'Updated':'Added','success');closeModal('catModal');loadCategories();
});

// ── EMPLOYEES ──────────────────────────────────────────
function loadEmployees(filter='') {
  const userMap=Object.fromEntries(DB.findAll('users').map(u=>[u.id,u.username]));
  let emps=DB.findAll('employees');
  if(filter) emps=emps.filter(e=>e.full_name.toLowerCase().includes(filter.toLowerCase())||e.job_title.toLowerCase().includes(filter.toLowerCase()));
  document.getElementById('empTable').innerHTML=tableHtml(
    ['#','Name','Username','Phone','Job Title','Status','Actions'],
    emps.map(e=>[e.id,e.full_name,userMap[e.user_id]||'—',e.phone,e.job_title,statusBadge(e.status),actionBtns(e.id,'editEmployee','deleteEmployee')])
  );
}
document.getElementById('addEmpBtn').addEventListener('click',()=>{
  document.getElementById('empId').value='';
  document.getElementById('empModalTitle').textContent='Add Employee';
  ['empName','empPhone','empTitle'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('empUserId').innerHTML=DB.findAll('users').map(u=>`<option value="${u.id}">${u.username}</option>`).join('');
  document.getElementById('empStatus').value='active';
  openModal('empModal');
});
window.editEmployee=function(id){
  const e=DB.findById('employees',id);
  document.getElementById('empId').value=id;
  document.getElementById('empModalTitle').textContent='Edit Employee';
  document.getElementById('empUserId').innerHTML=DB.findAll('users').map(u=>`<option value="${u.id}" ${u.id===e.user_id?'selected':''}>${u.username}</option>`).join('');
  document.getElementById('empName').value=e.full_name;
  document.getElementById('empPhone').value=e.phone;
  document.getElementById('empTitle').value=e.job_title;
  document.getElementById('empStatus').value=e.status;
  openModal('empModal');
};
window.deleteEmployee=function(id){
  if(!confirm('Delete employee?'))return;
  DB.remove('employees',id);toast('Deleted','warning');loadEmployees();
};
document.getElementById('saveEmpBtn').addEventListener('click',()=>{
  const id=document.getElementById('empId').value;
  const data={user_id:parseInt(document.getElementById('empUserId').value),
    full_name:document.getElementById('empName').value.trim(),
    phone:document.getElementById('empPhone').value.trim(),
    job_title:document.getElementById('empTitle').value.trim(),
    status:document.getElementById('empStatus').value};
  if(!data.full_name||!data.job_title){toast('Fill required fields','error');return;}
  if(id) DB.update('employees',parseInt(id),data); else DB.insert('employees',data);
  toast(id?'Updated':'Added','success');closeModal('empModal');loadEmployees();
});
document.getElementById('empSearch').addEventListener('input',e=>loadEmployees(e.target.value));

// ── SALARIES ───────────────────────────────────────────
function loadSalaries() {
  const empMap=Object.fromEntries(DB.findAll('employees').map(e=>[e.id,e.full_name]));
  const sals=DB.findAll('salaries');
  document.getElementById('salTable').innerHTML=tableHtml(
    ['#','Employee','Base ($)','Bonus ($)','Deduction ($)','Net ($)','Pay Date','Actions'],
    sals.map(s=>[s.id,empMap[s.employee_id]||'—',s.base_salary.toFixed(2),s.bonus.toFixed(2),s.deduction.toFixed(2),
      `<strong style="color:#10b981">$${(s.base_salary+s.bonus-s.deduction).toFixed(2)}</strong>`,
      fmtDate(s.payment_date),actionBtns(s.id,'editSalary','deleteSalary')])
  );
}
document.getElementById('addSalBtn').addEventListener('click',()=>{
  document.getElementById('salId').value='';
  document.getElementById('salModalTitle').textContent='Add Salary Record';
  document.getElementById('salEmpId').innerHTML=DB.findAll('employees').map(e=>`<option value="${e.id}">${e.full_name}</option>`).join('');
  ['salBase','salBonus','salDed','salDate'].forEach(id=>document.getElementById(id).value='');
  openModal('salModal');
});
window.editSalary=function(id){
  const s=DB.findById('salaries',id);
  document.getElementById('salId').value=id;
  document.getElementById('salModalTitle').textContent='Edit Salary';
  document.getElementById('salEmpId').innerHTML=DB.findAll('employees').map(e=>`<option value="${e.id}" ${e.id===s.employee_id?'selected':''}>${e.full_name}</option>`).join('');
  document.getElementById('salBase').value=s.base_salary;
  document.getElementById('salBonus').value=s.bonus;
  document.getElementById('salDed').value=s.deduction;
  document.getElementById('salDate').value=s.payment_date;
  openModal('salModal');
};
window.deleteSalary=function(id){
  if(!confirm('Delete salary record?'))return;
  DB.remove('salaries',id);toast('Deleted','warning');loadSalaries();
};
document.getElementById('saveSalBtn').addEventListener('click',()=>{
  const id=document.getElementById('salId').value;
  const data={employee_id:parseInt(document.getElementById('salEmpId').value),
    base_salary:parseFloat(document.getElementById('salBase').value)||0,
    bonus:parseFloat(document.getElementById('salBonus').value)||0,
    deduction:parseFloat(document.getElementById('salDed').value)||0,
    payment_date:document.getElementById('salDate').value};
  if(id) DB.update('salaries',parseInt(id),data); else DB.insert('salaries',data);
  toast(id?'Updated':'Added','success');closeModal('salModal');loadSalaries();
});

// ── INVENTORY ──────────────────────────────────────────
function loadInventory(filter='') {
  let items=DB.findAll('inventory');
  if(filter) items=items.filter(i=>i.item_name.toLowerCase().includes(filter.toLowerCase()));
  document.getElementById('invTable').innerHTML=tableHtml(
    ['#','Item Name','Quantity','Unit','Stock Level','Actions'],
    items.map(i=>[i.id,i.item_name,i.quantity,i.unit,
      i.quantity<5?badge('Low','danger'):i.quantity<15?badge('Medium','warning'):badge('Good','success'),
      actionBtns(i.id,'editInventory','deleteInventory')])
  );
}
document.getElementById('addInvBtn').addEventListener('click',()=>{
  document.getElementById('invId').value='';
  document.getElementById('invModalTitle').textContent='Add Inventory Item';
  ['invName','invQty','invUnit'].forEach(id=>document.getElementById(id).value='');
  openModal('invModal');
});
window.editInventory=function(id){
  const i=DB.findById('inventory',id);
  document.getElementById('invId').value=id;
  document.getElementById('invModalTitle').textContent='Edit Item';
  document.getElementById('invName').value=i.item_name;
  document.getElementById('invQty').value=i.quantity;
  document.getElementById('invUnit').value=i.unit;
  openModal('invModal');
};
window.deleteInventory=function(id){
  if(!confirm('Delete inventory item?'))return;
  DB.remove('inventory',id);toast('Deleted','warning');loadInventory();
};
document.getElementById('saveInvBtn').addEventListener('click',()=>{
  const id=document.getElementById('invId').value;
  const data={item_name:document.getElementById('invName').value.trim(),
    quantity:parseFloat(document.getElementById('invQty').value)||0,
    unit:document.getElementById('invUnit').value.trim()};
  if(!data.item_name){toast('Enter item name','error');return;}
  if(id) DB.update('inventory',parseInt(id),data); else DB.insert('inventory',data);
  toast(id?'Updated':'Added','success');closeModal('invModal');loadInventory();
});
document.getElementById('invSearch').addEventListener('input',e=>loadInventory(e.target.value));

// ── PAYMENTS ───────────────────────────────────────────
function loadPayments() {
  const pays=DB.findAll('payments').reverse();
  document.getElementById('payTable').innerHTML=tableHtml(
    ['#','Order #','Amount','Method','Status','Paid At'],
    pays.map(p=>[p.id,p.order_id,`$${p.amount.toFixed(2)}`,p.method.toUpperCase(),statusBadge(p.status),fmtTime(p.paid_at)])
  );
}

// ── USERS ──────────────────────────────────────────────
function loadUsers() {
  const users=DB.findAll('users');
  document.getElementById('usersTable').innerHTML=tableHtml(
    ['#','Username','Email','Active','Created','Actions'],
    users.map(u=>[u.id,u.username,u.email,
      u.is_active?badge('Active','success'):badge('Inactive','danger'),
      fmtDate(u.created_at),actionBtns(u.id,'editUser','deleteUser')])
  );
}
document.getElementById('addUserBtn').addEventListener('click',()=>{
  document.getElementById('userId').value='';
  document.getElementById('userModalTitle').textContent='Add User';
  ['userName','userEmail','userPass'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('userActive').value='true';
  openModal('userModal');
});
window.editUser=function(id){
  const u=DB.findById('users',id);
  document.getElementById('userId').value=id;
  document.getElementById('userModalTitle').textContent='Edit User';
  document.getElementById('userName').value=u.username;
  document.getElementById('userEmail').value=u.email;
  document.getElementById('userPass').value='';
  document.getElementById('userActive').value=String(u.is_active);
  openModal('userModal');
};
window.deleteUser=function(id){
  if(!confirm('Delete user?'))return;
  DB.remove('users',id);toast('Deleted','warning');loadUsers();
};
document.getElementById('saveUserBtn').addEventListener('click',()=>{
  const id=document.getElementById('userId').value;
  const data={username:document.getElementById('userName').value.trim(),
    email:document.getElementById('userEmail').value.trim(),
    is_active:document.getElementById('userActive').value==='true',
    created_at:DB._now()};
  const pass=document.getElementById('userPass').value;
  if(pass) data.password_hash=pass;
  if(!data.username||!data.email){toast('Fill required fields','error');return;}
  if(id) DB.update('users',parseInt(id),data); else DB.insert('users',data);
  toast(id?'Updated':'Added','success');closeModal('userModal');loadUsers();
});

// ── AUDIT LOGS ─────────────────────────────────────────
function loadAuditLogs() {
  const userMap=Object.fromEntries(DB.findAll('users').map(u=>[u.id,u.username]));
  const logs=DB.findAll('audit_logs').reverse();
  document.getElementById('auditTable').innerHTML=tableHtml(
    ['#','User','Action','Table','Record ID','Time'],
    logs.map(l=>[l.id,userMap[l.user_id]||`User #${l.user_id}`,
      badge(l.action,'info'),l.table_name,l.record_id,fmtTime(l.created_at)])
  );
}

// ── Init ───────────────────────────────────────────────
loadDashboard();
