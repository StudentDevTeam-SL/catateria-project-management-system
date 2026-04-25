
// ====================================================
//  CafeteriaDB — localStorage-backed database layer
//  Schema: Users, Employees, Salaries, Orders,
//          Order Items, Menu Items, Categories,
//          Payments, Inventory, Audit Logs
// ====================================================

const DB = {
  // ── helpers ──────────────────────────────────────
  _get(table) {
    return JSON.parse(localStorage.getItem(`caf_${table}`) || '[]');
  },
  _set(table, data) {
    localStorage.setItem(`caf_${table}`, JSON.stringify(data));
  },
  _nextId(table) {
    const rows = this._get(table);
    return rows.length ? Math.max(...rows.map(r => r.id)) + 1 : 1;
  },
  _now() {
    return new Date().toISOString();
  },

  // ── generic CRUD ─────────────────────────────────
  insert(table, record) {
    const rows = this._get(table);
    const newRecord = { id: this._nextId(table), ...record };
    rows.push(newRecord);
    this._set(table, rows);
    return newRecord;
  },
  findAll(table) {
    return this._get(table);
  },
  findById(table, id) {
    return this._get(table).find(r => r.id === id) || null;
  },
  findWhere(table, predicate) {
    return this._get(table).filter(predicate);
  },
  update(table, id, changes) {
    const rows = this._get(table).map(r => r.id === id ? { ...r, ...changes } : r);
    this._set(table, rows);
    return rows.find(r => r.id === id);
  },
  remove(table, id) {
    const rows = this._get(table).filter(r => r.id !== id);
    this._set(table, rows);
  },

  // ── audit logging ─────────────────────────────────
  audit(userId, action, tableName, recordId) {
    this.insert('audit_logs', {
      user_id: userId,
      action,
      table_name: tableName,
      record_id: recordId,
      created_at: this._now()
    });
  },

  // ── seed demo data ────────────────────────────────
  seed() {
    if (localStorage.getItem('caf_seeded')) return;

    // Categories
    const cat1 = this.insert('categories', { name: 'Main Course' });
    const cat2 = this.insert('categories', { name: 'Beverages' });
    const cat3 = this.insert('categories', { name: 'Snacks' });
    const cat4 = this.insert('categories', { name: 'Desserts' });

    // Menu Items
    this.insert('menu_items', { name: 'Grilled Chicken', price: 8.50, category_id: cat1.id, is_active: true });
    this.insert('menu_items', { name: 'Beef Burger',     price: 7.00, category_id: cat1.id, is_active: true });
    this.insert('menu_items', { name: 'Veggie Wrap',     price: 5.50, category_id: cat1.id, is_active: true });
    this.insert('menu_items', { name: 'Pasta Alfredo',   price: 6.75, category_id: cat1.id, is_active: true });
    this.insert('menu_items', { name: 'Caesar Salad',    price: 4.50, category_id: cat1.id, is_active: true });
    this.insert('menu_items', { name: 'Fresh Juice',     price: 2.50, category_id: cat2.id, is_active: true });
    this.insert('menu_items', { name: 'Coffee',          price: 1.75, category_id: cat2.id, is_active: true });
    this.insert('menu_items', { name: 'Soft Drink',      price: 1.50, category_id: cat2.id, is_active: true });
    this.insert('menu_items', { name: 'Water Bottle',    price: 0.75, category_id: cat2.id, is_active: true });
    this.insert('menu_items', { name: 'Chips',           price: 1.25, category_id: cat3.id, is_active: true });
    this.insert('menu_items', { name: 'Spring Rolls',    price: 3.00, category_id: cat3.id, is_active: true });
    this.insert('menu_items', { name: 'Chocolate Cake',  price: 3.50, category_id: cat4.id, is_active: true });
    this.insert('menu_items', { name: 'Ice Cream',       price: 2.75, category_id: cat4.id, is_active: true });

    // Users
    const u1 = this.insert('users', { username: 'admin',   email: 'admin@cafe.com',  password_hash: 'admin123',  is_active: true, created_at: this._now() });
    const u2 = this.insert('users', { username: 'cashier1',email: 'cash1@cafe.com',  password_hash: 'cash123',   is_active: true, created_at: this._now() });
    const u3 = this.insert('users', { username: 'cashier2',email: 'cash2@cafe.com',  password_hash: 'cash123',   is_active: true, created_at: this._now() });

    // Employees
    const e1 = this.insert('employees', { user_id: u1.id, full_name: 'Ahmed Ali',     phone: '0611111111', job_title: 'Manager',  status: 'active' });
    const e2 = this.insert('employees', { user_id: u2.id, full_name: 'Hodan Omar',    phone: '0622222222', job_title: 'Cashier',  status: 'active' });
    const e3 = this.insert('employees', { user_id: u3.id, full_name: 'Fadumo Hassan', phone: '0633333333', job_title: 'Cashier',  status: 'active' });

    // Salaries
    this.insert('salaries', { employee_id: e1.id, base_salary: 1200, bonus: 200, deduction: 50,  payment_date: '2026-04-01' });
    this.insert('salaries', { employee_id: e2.id, base_salary: 800,  bonus: 100, deduction: 30,  payment_date: '2026-04-01' });
    this.insert('salaries', { employee_id: e3.id, base_salary: 800,  bonus: 80,  deduction: 20,  payment_date: '2026-04-01' });

    // Inventory
    this.insert('inventory', { item_name: 'Chicken Breast', quantity: 50,  unit: 'kg' });
    this.insert('inventory', { item_name: 'Beef Patty',     quantity: 100, unit: 'pcs' });
    this.insert('inventory', { item_name: 'Flour',          quantity: 25,  unit: 'kg' });
    this.insert('inventory', { item_name: 'Tomatoes',       quantity: 30,  unit: 'kg' });
    this.insert('inventory', { item_name: 'Lettuce',        quantity: 15,  unit: 'kg' });
    this.insert('inventory', { item_name: 'Coffee Beans',   quantity: 10,  unit: 'kg' });
    this.insert('inventory', { item_name: 'Sugar',          quantity: 20,  unit: 'kg' });

    // Sample Orders
    const o1 = this.insert('orders', { employee_id: e2.id, total_price: 16.00, status: 'completed', created_at: this._now() });
    this.insert('order_items', { order_id: o1.id, menu_item_id: 1, quantity: 1, unit_price: 8.50 });
    this.insert('order_items', { order_id: o1.id, menu_item_id: 6, quantity: 2, unit_price: 2.50 });
    this.insert('order_items', { order_id: o1.id, menu_item_id: 7, quantity: 1, unit_price: 1.75 });
    this.insert('payments', { order_id: o1.id, amount: 16.00, method: 'cash', status: 'paid', paid_at: this._now() });

    const o2 = this.insert('orders', { employee_id: e3.id, total_price: 10.50, status: 'completed', created_at: this._now() });
    this.insert('order_items', { order_id: o2.id, menu_item_id: 2, quantity: 1, unit_price: 7.00 });
    this.insert('order_items', { order_id: o2.id, menu_item_id: 8, quantity: 1, unit_price: 1.50 });
    this.insert('order_items', { order_id: o2.id, menu_item_id: 10, quantity: 1, unit_price: 1.25 });
    this.insert('payments', { order_id: o2.id, amount: 10.50, method: 'card', status: 'paid', paid_at: this._now() });

    localStorage.setItem('caf_seeded', '1');
    console.log('✅ CafeteriaDB seeded successfully');
  }
};

// Auto-seed on load
DB.seed();
