// js/api.js
import { db as firestoreDB, auth as firebaseAuth } from '../firebase-init.js';
import {
  collection, query, orderBy, getDocs, where, doc, getDoc, addDoc, updateDoc,
  Timestamp, limit, startAt, endAt, deleteDoc, serverTimestamp,
  runTransaction, getCountFromServer, writeBatch,
  arrayUnion, arrayRemove, documentId
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

export const db = firestoreDB;
export const auth = firebaseAuth;

let ACTIVE_LOCATION_ID = 'default'; 

// --- FIX: Export the ID or a getter for it ---
export function getActiveLocationId() {
    return ACTIVE_LOCATION_ID;
}

/**
 * Helper to build the query filters.
 */
function buildLocationFilter() {
    // FIX: If the location is 'default', return an empty array (no filter applied).
    if (ACTIVE_LOCATION_ID === 'default') {
        // This allows the query to find legacy documents missing the locationId field.
        return [];
    }
    // Otherwise, strictly filter by the selected location ID.
    return [where('locationId', '==', ACTIVE_LOCATION_ID)];
}

/**
 * Sets the active location for all API calls.
 */
export function setApiLocation(locationId) {
  ACTIVE_LOCATION_ID = locationId;
  localStorage.setItem('activeLocationId', locationId);
}

async function getFeeConfig() {
  const feeRef = doc(db, "fees", "optima");
  const feeSnap = await getDoc(feeRef);
  
  if (!feeSnap.exists()) {
    console.warn("Bank fee config not found! Defaulting to 0 fees.");
    return { qrBase: 0, qrOptima: 0, pos: {} }; // Default to 0 fees
  }
  
  return feeSnap.data();
}

/**
 * [NEW] Fetches the tax configuration from Firestore.
 */
async function getTaxConfig() {
  const taxRef = doc(db, "config", "tax");
  const taxSnap = await getDoc(taxRef);
  
  if (!taxSnap.exists()) {
    console.warn("Tax config not found! Defaulting to 0 tax.");
    return { companyTaxRate: 0 };
  }
  
  return taxSnap.data();
}


// ─────────────────────────────────────────────
// 🕒 Helpers
// ─────────────────────────────────────────────

function getStartDate(range) {
  const now = new Date();
  if (range === 'daily') return new Date(now.setHours(0, 0, 0, 0));
  if (range === 'weekly') {
    const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    return new Date(firstDayOfWeek.setHours(0, 0, 0, 0));
  }
  if (range === 'monthly') return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date();
}

/**
 * [NEW] Fetches a specific configuration document.
 * @param {string} docId - The document ID (e.g., 'tax', 'teacherFees').
 * @returns {Promise<object|null>} The config data or null.
 */
export async function getConfig(docId) {
  const ref = doc(db, "config", docId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

function getWeekNumber(date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = Math.floor((date - firstDay) / 86400000);
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
}

export function getDateRange(timeRange, year, month) {
  const now = new Date();
  const safeYear = year ?? now.getFullYear();

  // --- ✨ THIS IS THE FIX ---
  // We check for 'yearly' FIRST, before we even calculate safeMonth.
  if (timeRange === 'yearly') {
    const start = new Date(safeYear, 0, 1); // January 1st
    const end = new Date(safeYear, 11, 31, 23, 59, 59); // December 31st
    return { start, end };
  }

  // If not yearly, THEN we calculate the month
  const safeMonth = (month !== null && month !== undefined) 
    ? month 
    : now.getMonth();

  if (timeRange === 'weekly') {
    // We create a new 'now' to avoid mutating the original
    const weekStart = new Date();
    const first = weekStart.getDate() - weekStart.getDay(); 
    const start = new Date(weekStart.setDate(first));
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59);
    return { start, end };
  }
  
  // Default to monthly
  const start = new Date(safeYear, safeMonth, 1);
  const end = new Date(safeYear, safeMonth + 1, 0); // Last day of the month
  end.setHours(23, 59, 59);
  return { start, end };
}

// ─────────────────────────────────────────────
// 👤 USER (Student, Teacher, Admin) MANAGEMENT
// ─────────────────────────────────────────────

export async function getUsersByRole(role, includeArchived = false) {
    const usersRef = collection(db, 'users');
    
    // Combine role filter with location filter
    let q = query(
        usersRef, 
        where('role', '==', role),
        ...buildLocationFilter() // <-- ADDED CONDITIONAL FILTER
    );

    if (!includeArchived) {
        q = query(q, where('active', '==', true));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getUserById(userId) {
  if (!userId) return null;
  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.warn(`User not found for ID: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return null;
  }
}

export async function saveUser(userData, userId = null) {
  // Convert string date from modal to Timestamp
  if (userData.lastPaymentDate && typeof userData.lastPaymentDate === 'string') {
    if (userData.lastPaymentDate === '') {
      userData.lastPaymentDate = null; // Handle empty string
    } else {
      userData.lastPaymentDate = Timestamp.fromDate(new Date(userData.lastPaymentDate));
    }
  }
  
  if (userId) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, userData);
    return userId;
  } else {
    const usersRef = collection(db, 'users');
    const docRef = await addDoc(usersRef, {
      ...userData,
      active: true,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }
}

export async function archiveUser(userId) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    active: false,
    archivedAt: serverTimestamp()
  });
}

export async function restoreUser(userId) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    active: true,
    archivedAt: null
  });
}

/**
 * Fetches data records that are missing a locationId (for migration/audit).
 * Queries for docs where 'locationId' is explicitly null.
 */

export async function getUnassignedData(collectionName, roleFilter = null) {
    const ref = collection(db, collectionName);
    
    // FIX: Start with a broad query, removing the restrictive locationId filter.
    // We will rely on the client (migration.js) to filter for documents where locationId IS NULL/UNDEFINED.
    let q = ref; 
    
    // 1. Add role filter for 'users' collection
    if (collectionName === 'users' && roleFilter) {
        q = query(q, where('role', '==', roleFilter));
        q = query(q, where('active', '==', true)); // Still only show active users
    }
    
    const snap = await getDocs(q);
    
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Batch assigns a location to multiple documents (for migration).
 */
export async function assignLocationBatch(collectionName, itemIds, newLocationId) {
    const batch = writeBatch(db);
    
    itemIds.forEach(id => {
        const ref = doc(db, collectionName, id);
        batch.update(ref, { 
            locationId: newLocationId 
        });
    });

    await batch.commit();
}

// ─────────────────────────────────────────────
// 💵 SALARY & PAYROLL MANAGEMENT
// ─────────────────────────────────────────────

/**
 * Fetches all active salaries.
 */
export async function getSalaries() {
  const salariesRef = collection(db, 'salaries');
  const q = query(salariesRef, where('active', '==', true), orderBy('name'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Saves a new or existing salary.
 */
export async function saveSalary(data, salaryId = null) {
  if (salaryId) {
    const salaryRef = doc(db, 'salaries', salaryId);
    await updateDoc(salaryRef, data);
    return salaryId;
  } else {
    const salariesRef = collection(db, 'salaries');
    const docRef = await addDoc(salariesRef, {
      ...data,
      active: true,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  }
}

/**
 * Deletes a salary (by marking as inactive).
 */
export async function deleteSalary(salaryId) {
  const salaryRef = doc(db, 'salaries', salaryId);
  await updateDoc(salaryRef, {
    active: false,
    archivedAt: serverTimestamp()
  });
}

// ─────────────────────────────────────────────
// 🏫 CLASS MANAGEMENT
// ─────────────────────────────────────────────

/**
 * Fetches all classes for the active location.
 */
export async function getClasses() {
  // FIX: Point to the root "classes" collection
  const colRef = collection(db, "classes");
  const snap = await getDocs(colRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * Adds or removes a student from a class's student array.
 */
export async function updateClassStudents(classId, studentId, action) {
  // FIX: Point to the root "classes" collection
  const classRef = doc(db, "classes", classId);
  await updateDoc(classRef, {
    students: action === 'add' ? arrayUnion(studentId) : arrayRemove(studentId)
  });
}

/**
 * Creates a new class document.
 * @param {object} data - The class data to save.
 * @returns {string} The new class ID.
 */
export async function saveClass(data) {
  // FIX: Point to the root "classes" collection
  const colRef = collection(db, "classes");
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Updates an existing class document.
 * @param {string} classId - The ID of the class to update.
 * @param {object} data - The data to merge.
 */
export async function updateClass(classId, data) {
  // FIX: Point to the root "classes" collection
  const docRef = doc(db, "classes", classId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Deletes a class document.
 * @param {string} classId - The ID of the class to delete.
 */
export async function deleteClass(classId) {
  // FIX: Point to the root "classes" collection
  const docRef = doc(db, "classes", classId);
  await deleteDoc(docRef);
}

// ─────────────────────────────────────────────
// 💼 Expense Categories (per location)
// ─────────────────────────────────────────────

export async function getExpenseCategories(locationId = 'default') {
  const ref = collection(db, 'locations', ACTIVE_LOCATION_ID, 'expense_categories');
  const snap = await getDocs(ref);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => c.active !== false);
}

// ─────────────────────────────────────────────
// 📍 LOCATION MANAGEMENT
// ─────────────────────────────────────────────

/**
 * Fetches locations the current user is authorized to see.
 * SuperAdmins see all; others see their assigned location.
 * @param {string} userRole - The role of the current user.
 * @param {string} locationId - The user's assigned location ID.
 */
export async function getAuthorizedLocations(userRole, locationId) {
    const locationsRef = collection(db, 'locations');
    
    // SuperAdmins see all locations
    if (userRole === 'superAdmin' || userRole === 'platformAdmin') {
        const snap = await getDocs(locationsRef);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    }
    
    // All other users only see their assigned location (or the default one)
    const targetId = locationId || 'default';
    const docSnap = await getDoc(doc(locationsRef, targetId));
    
    if (docSnap.exists()) {
        return [{ id: docSnap.id, ...docSnap.data() }];
    }
    
    // Fallback: Return only a default location if necessary
    return [{ id: 'default', name: 'Default Location' }]; 
}

export async function addExpenseCategory(locationId, { name, color = '#4F46E5', description = '' }) {
  const ref = collection(db, 'locations', ACTIVE_LOCATION_ID, 'expense_categories');
  await addDoc(ref, {
    name: name.trim(),
    color,
    description,
    active: true,
    createdAt: serverTimestamp(),
  });
}

export async function updateExpenseCategory(locationId, id, data) {
  const ref = doc(db, 'locations', ACTIVE_LOCATION_ID, 'expense_categories', id);
  await updateDoc(ref, data);
}

export async function deleteExpenseCategory(locationId, id) {
  const ref = doc(db, 'locations', ACTIVE_LOCATION_ID, 'expense_categories', id);
  await updateDoc(ref, { active: false });
}

// ─────────────────────────────────────────────
// 💰 PAYMENT & TUITION MANAGEMENT
// ─────────────────────────────────────────────

export async function getPaymentsByDate(startDate, endDate) {
    const paymentsRef = collection(db, 'payments');
    const q = query(paymentsRef,
        ...buildLocationFilter(), // <-- ADDED CONDITIONAL FILTER
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate),
        orderBy('timestamp', 'desc')
    );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.timestamp?.toDate?.() || new Date(data.timestamp || data.date)
    };
  });
}

/**
 * [FIXED] Records a new payment and ATOMICALLY updates the student's tuition balance.
 * Now calculates per-lesson value.
 */
export async function addPayment(paymentData) {
  const { 
    studentId, amount, date, method, recordedBy, studentName,
    paymentType,  // 'monthly' or 'lesson'
    tuitionTotal, // The new total for the month
    expiresOn,    // 'YYYY-MM-DD' string or null
    lessonCount   // ✨ NEW: e.g., 12
  } = paymentData;
  
  // --- 1. Get Configs & Calculate Fees ---
  const [feeConfig, taxConfig] = await Promise.all([
    getFeeConfig(),
    getTaxConfig()
  ]);
  
  let bankFee = 0;
  const grossAmount = Number(amount); 
  
  switch (method) {
    case 'qr':
      bankFee = grossAmount * (feeConfig.qrBase || 0);
      break;
    case 'card':
      bankFee = grossAmount * (feeConfig.pos?.Elkart?.own || 0);
      break;
    default:
      bankFee = 0;
  }
  
  const taxRate = taxConfig.companyTaxRate || 0;
  const taxAmount = grossAmount * taxRate;
  const netAmount = grossAmount - bankFee - taxAmount;

  // --- 2. Start Transaction ---
  const paymentRef = doc(collection(db, 'payments'));
  const studentRef = doc(db, 'users', studentId);

  await runTransaction(db, async (transaction) => {
    
    // --- 3. READ FIRST ---
    const studentDoc = await transaction.get(studentRef);
    if (!studentDoc.exists()) {
      throw new Error("Student document not found!");
    }
    const studentData = studentDoc.data();
    
    // --- 4. PREPARE ALL WRITES ---

    // A. Prepare the Payment Document
    const newPaymentData = {
      studentId,
      payerName: studentName,
      amountGross: grossAmount,
      amountNet: netAmount,
      bankFee: bankFee,
      taxAmount: taxAmount,
      timestamp: Timestamp.fromDate(new Date(date)),
      method,
      recordedBy,
      createdAt: serverTimestamp(),
      paymentType: paymentType,
      expiresOn: expiresOn ? Timestamp.fromDate(new Date(expiresOn)) : null,
      
      // --- ✨ NEW FIELDS FOR PAYROLL ---
      lessonCount: lessonCount || null, // e.g., 12
      // Calculate and store the value of one lesson from this payment
      perLessonValue: (lessonCount && grossAmount > 0) ? (grossAmount / lessonCount) : 0, 
      lessonsLogged: 0 // We will increment this later
    };

    // B. Prepare the Student Update Document
    const studentUpdateData = {
      lastPaymentDate: Timestamp.fromDate(new Date(date)),
      paymentModel: paymentType,
    };

    if (paymentType === 'monthly') {
      const newTuitionTotal = Number(tuitionTotal);
      const newTuitionPaid = Number(grossAmount);
      const newTuitionOwed = newTuitionTotal - newTuitionPaid;

      studentUpdateData.tuitionTotal = newTuitionTotal;
      studentUpdateData.tuitionPaid = newTuitionPaid;
      studentUpdateData.tuitionOwed = Math.max(0, newTuitionOwed);
      studentUpdateData.paymentExpiresOn = Timestamp.fromDate(new Date(expiresOn));
      
    } else { // 'lesson' / 'session'
      const currentPaid = studentData.tuitionPaid || 0;
      const newTuitionPaid = currentPaid + grossAmount;
      const currentTotal = studentData.tuitionTotal || 0;
      const newOwed = currentTotal - newTuitionPaid;
      
      studentUpdateData.tuitionPaid = newTuitionPaid;
      studentUpdateData.tuitionOwed = Math.max(0, newOwed);
    }
    
    // --- 5. EXECUTE ALL WRITES ---
    transaction.set(paymentRef, newPaymentData);
    transaction.update(studentRef, studentUpdateData);
  });
}

/**
 * Deletes a payment and REVERSES the financial effect on the student.
 */
export async function deletePayment(paymentId) {
  const paymentRef = doc(db, 'payments', paymentId);
  
  await runTransaction(db, async (transaction) => {
    // 1. Get the payment to know what to reverse
    const paymentDoc = await transaction.get(paymentRef);
    if (!paymentDoc.exists()) throw new Error("Payment not found");
    
    const payment = paymentDoc.data();
    const studentRef = doc(db, 'users', payment.studentId);
    const studentDoc = await transaction.get(studentRef);

    // 2. If student exists, reverse the payment effects
    if (studentDoc.exists()) {
      const student = studentDoc.data();
      const updateData = {};

      if (payment.paymentType === 'monthly') {
        // Logic: If we delete a monthly payment, we assume the month is now UNPAID.
        // We reset Paid to 0 and Owed to Total.
        // (This is safer than trying to guess partial states)
        updateData.tuitionPaid = 0;
        updateData.tuitionOwed = student.tuitionTotal || 0; // Reset to full debt
        
        // Only remove expiration date if it matches this payment's expiration
        // (Prevents removing a date set by a newer, different payment)
        if (payment.expiresOn && student.paymentExpiresOn) {
            if (payment.expiresOn.seconds === student.paymentExpiresOn.seconds) {
                updateData.paymentExpiresOn = null;
            }
        }

      } else {
        // Logic: For 'lesson' or 'session' types, just do math.
        const currentPaid = student.tuitionPaid || 0;
        const currentOwed = student.tuitionOwed || 0;
        const amountReversed = payment.amountGross || 0;

        updateData.tuitionPaid = Math.max(0, currentPaid - amountReversed);
        updateData.tuitionOwed = currentOwed + amountReversed;
      }

      transaction.update(studentRef, updateData);
    }

    // 3. Delete the payment
    transaction.delete(paymentRef);
  });
}

export async function getTeacherPayments(teacherId, range = 'monthly', year, month) {
  const { start, end } = getDateRange(range, year, month);
  
  // 1. Get all lesson logs in the date range
  const allLessons = await getLessonsByDate(start, end); 
  
  // 2. Filter for the specific teacher
  return allLessons
    .filter((lesson) => lesson.teacherId === teacherId)
    .map((lesson) => ({
      // 3. Map to a "payment-like" object
      ...lesson,
      id: lesson.id, // Use the lesson's ID
      amount: Number(lesson.teacherShare) || 0, // This is the teacher's earned amount
      timestamp: lesson.date?.toDate?.() || new Date(lesson.date), // Ensure it's a Date object
      date: lesson.date?.toDate?.() || new Date(lesson.date), // Add date for compatibility
      payerName: lesson.studentName || `Lesson log`, // Use student name if available
      method: 'Lesson' // Clarify the type
    }));
}

export async function searchStudents(searchTerm) {
  const usersRef = collection(db, 'users');
  const searchTermEnd = searchTerm + '\uf8ff';

  // Base filters for both queries: role and locationId
  const baseFilters = [where('role', '==', 'student'), where('locationId', '==', ACTIVE_LOCATION_ID)];

  const nameQuery = query(usersRef, ...baseFilters, orderBy('name'), startAt(searchTerm), endAt(searchTermEnd), limit(10));
  const phoneQuery = query(usersRef, ...baseFilters, orderBy('phone'), startAt(searchTerm), endAt(searchTermEnd), limit(10));

  const [nameSnap, phoneSnap] = await Promise.all([ getDocs(nameQuery), getDocs(phoneQuery) ]);

  const studentsMap = new Map();
  nameSnap.docs.forEach(doc => studentsMap.set(doc.id, { id: doc.id, ...doc.data() }));
  phoneSnap.docs.forEach(doc => studentsMap.set(doc.id, { id: doc.id, ...doc.data() }));

  return Array.from(studentsMap.values());
}

// ─────────────────────────────────────────────
// 💸 Expenses
// ─────────────────────────────────────────────

export async function getExpensesByDate(startDate, endDate) {
    const expensesRef = collection(db, 'expenses');
    const q = query(expensesRef,
        ...buildLocationFilter(), // <-- ADDED CONDITIONAL FILTER
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
    );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      amount: Number(data.amount) || 0,
      date: data.date?.toDate?.() || new Date(data.date),
    };
  });
}

// [FIXED: This now uses the helper function]
export async function getExpenses(timeRange = 'monthly', year, month) {
  const { start, end } = getDateRange(timeRange, year, month);
  return getExpensesByDate(start, end);
}

export async function recordExpense({ description, amount, category, categoryColor, date }) {
  await addDoc(collection(db, 'expenses'), {
    description,
    amount: Number(amount),
    category,
    categoryColor: categoryColor || '#9CA3AF',
    date: date ? Timestamp.fromDate(new Date(date)) : Timestamp.now(),
  });
}

export async function updateExpense(id, data) {
  const ref = doc(db, 'expenses', id);
  if (data.date) data.date = Timestamp.fromDate(new Date(data.date));
  if (data.amount) data.amount = Number(data.amount);
  await updateDoc(ref, data);
}

export async function deleteExpense(id) {
  await deleteDoc(doc(db, 'expenses', id));
}

// ─────────────────────────────────────────────
// 🧾 Recurring Bills
// ─────────────────────────────────────────────

export async function getRecurringBills(timeRange = 'monthly', year, month) {
  const ref = collection(db, 'recurring_bills');
  const q = query(
        ref, 
        where('active', '==', true),
        // ✨ FIX: ENFORCE LOCATION FILTER
        where('locationId', '==', getActiveLocationId())
    );
  const snap = await getDocs(q);

  const bills = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return bills.filter((b) => b && b.amount && b.name);
}

export async function addRecurringBill(data) {
  await addDoc(collection(db, 'recurring_bills'), {
    ...data, 
    amount: Number(data.amount),
    currency: data.currency || 'KGS',
    dueDay: Number(data.dueDay),
    // ✨ NEW: Save Start Date as Timestamp
    startDate: data.startDate ? Timestamp.fromDate(new Date(data.startDate)) : Timestamp.now(),
    active: true,
    lastPaid: null,
  });
}

export async function updateRecurringBill(id, data) {
  const ref = doc(db, 'recurring_bills', id);
  const payload = { ...data };
  if (payload.amount) payload.amount = Number(payload.amount);
  if (payload.dueDay) payload.dueDay = Number(payload.dueDay);
  // ✨ NEW: Handle Start Date update
  if (payload.startDate && typeof payload.startDate === 'string') {
    payload.startDate = Timestamp.fromDate(new Date(payload.startDate));
  }
  await updateDoc(ref, payload);
}

export async function markBillPaid(billId) {
  const ref = doc(db, 'recurring_bills', billId);
  const now = new Date();
  const ts = Timestamp.fromDate(now);

  const paidPeriod = {
    year: now.getFullYear(),
    month: now.getMonth(),
    week: getWeekNumber(now),
  };

  await updateDoc(ref, {
    lastPaid: ts,
    lastPaidYear: paidPeriod.year,
    lastPaidMonth: paidPeriod.month,
    lastPaidWeek: paidPeriod.week,
    status: 'paid',
  });
}

export async function markBillUnpaid(billId) {
  const ref = doc(db, 'recurring_bills', billId);
  await updateDoc(ref, {
    lastPaid: null,
    lastPaidYear: null,
    lastPaidMonth: null,
    lastPaidWeek: null,
    status: 'unpaid',
  });
}

export async function deleteBill(id) {
  await deleteDoc(doc(db, 'recurring_bills', id));
}

// ─────────────────────────────────────────────
// 📊 NEW: DASHBOARD & PAYROLL
// ─────────────────────────────────────────────

export async function getSummaryStats() {
  const usersRef = collection(db, 'users');
  
  const studentsQuery = query(usersRef, where('role', '==', 'student'), where('active', '==', true));
  const studentSnap = await getCountFromServer(studentsQuery);
  const activeStudents = studentSnap.data().count;

  const allActiveUsers = await getDocs(query(usersRef, where('active', '==', true)));
  
  let outstandingTuition = 0;
  let totalPayrollDue = 0;

  allActiveUsers.docs.forEach(doc => {
    const data = doc.data();
    if (data.role === 'student' && data.tuitionOwed > 0) {
      outstandingTuition += data.tuitionOwed;
    }
    if (data.role === 'teacher' && data.payrollDue > 0) {
      totalPayrollDue += data.payrollDue;
    }
  });

  return { activeStudents, outstandingTuition, totalPayrollDue };
}

export async function updateTeacherPayroll(teacherId) {
  const teacherRef = doc(db, 'users', teacherId);
  const teacherDoc = await getDoc(teacherRef);
  if (!teacherDoc.exists()) throw new Error("Teacher not found");

  const teacher = teacherDoc.data();
  const payrollDue = (teacher.totalHours || 0) * (teacher.hourlyRate || 0);

  await updateDoc(teacherRef, { payrollDue });
  return payrollDue;
}

export async function markPayrollPaid(teacherId) {
  const teacherRef = doc(db, 'users', teacherId);
  await updateDoc(teacherRef, {
    payrollDue: 0,
    totalHours: 0,
    lastPayrollDate: serverTimestamp()
  });
}
/**
 * [--- ✨ NEW FUNCTION ---]
 * Updates multiple user documents in a single batch.
 * @param {Array<object>} usersToUpdate - An array of { id: "...", updates: {...} } objects.
 */
export async function batchUpdateUsers(usersToUpdate) {
  const batch = writeBatch(db);
  
  usersToUpdate.forEach(user => {
    const userRef = doc(db, "users", user.id);
    batch.update(userRef, user.updates);
  });

  await batch.commit();
}
/**
 * [--- 3. RENAMED & UPGRADED ---]
 * Saves a large batch of new student documents AND assigns them to their class.
 * @param {Array<object>} studentObjects - An array of student data objects.
 */
export async function batchSaveStudentsAndAssign(studentObjects) {
  const batch = writeBatch(db);
  const usersRef = collection(db, 'users');

  studentObjects.forEach(student => {
    const studentRef = doc(usersRef); // Create a new document reference
    
    // 1. Set the student's data
    batch.set(studentRef, {
      ...student,
      role: 'student', // Ensure all are set to 'student'
      active: true,    // Default to active
      createdAt: serverTimestamp()
    });
    
    // 2. If they have a class, update the class's student array
if (student.classId) {
      const classRef = doc(db, "classes", student.classId);
      batch.update(classRef, {
        students: arrayUnion(studentRef.id)
      });
    }
  });

  await batch.commit();
}

// ─────────────────────────────────────────────
// 📋 LESSON LOGGING
// ─────────────────────────────────────────────

/**
 * Fetches all "monthly" (package) payments for a student.
 * This will find both new AND old (legacy) packages.
 */
export async function getActivePaymentsForStudent(studentId) {
  const paymentsRef = collection(db, 'payments');
  const q = query(paymentsRef,
    where('studentId', '==', studentId),
    where('paymentType', '==', 'monthly')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
* Logs a single lesson for a student with a specific teacher.
 * This is a transaction that creates a new lesson_log document
 * and increments the 'lessonsLogged' count on the payment.
 */
export async function logLesson(paymentId, studentId, teacherId, classId, lessonDate) {
  const paymentRef = doc(db, 'payments', paymentId);
  const lessonRef = doc(collection(db, 'lesson_log'));
  const teacherRef = doc(db, 'users', teacherId);

await runTransaction(db, async (transaction) => {
    // 1. Read the payment and teacher
    const paymentDoc = await transaction.get(paymentRef);
    const teacherDoc = await transaction.get(teacherRef);
    
    if (!paymentDoc.exists()) throw new Error("Payment document not found!");
    if (!teacherDoc.exists()) throw new Error("Teacher document not found!");
    
    const paymentData = paymentDoc.data();
    const teacherData = teacherDoc.data();
    
    // 2. Check if the payment package is full
    const lessonsLogged = paymentData.lessonsLogged || 0;
    if (lessonsLogged >= paymentData.lessonCount) {
      throw new Error("This payment package is already full.");
    }
    
    // 3. Create the new lesson log document
    transaction.set(lessonRef, {
      studentId: studentId,
      teacherId: teacherId,
      teacherName: teacherData.name || 'Unknown Teacher',
      paymentId: paymentId,
      classId: classId || null,
      date: Timestamp.fromDate(lessonDate),
      perLessonValue: paymentData.perLessonValue || 0,
      teacherShare: (paymentData.perLessonValue || 0) * 0.5, // Assumes 50/50 split
    });
    
    // 4. Update the payment document
    transaction.update(paymentRef, {
      lessonsLogged: lessonsLogged + 1
    });
  });
  
  return { lessonId: lessonRef.id, payment: (await getDoc(paymentRef)).data() };
}

/**
 * Deletes a lesson log and decrements the count on the payment.
 */
export async function deleteLesson(lessonId, paymentId) {
  const lessonRef = doc(db, 'lesson_log', lessonId);
  const paymentRef = doc(db, 'payments', paymentId);
  
  await runTransaction(db, async (transaction) => {
    const paymentDoc = await transaction.get(paymentRef);
    if (paymentDoc.exists()) {
      const lessonsLogged = paymentDoc.data().lessonsLogged || 0;
      transaction.update(paymentRef, {
        lessonsLogged: Math.max(0, lessonsLogged - 1)
      });
    }
    transaction.delete(lessonRef);
  });
  
  const paymentDoc = await getDoc(paymentRef);
  return paymentDoc.exists() ? paymentDoc.data() : null;
}

/**
 * Fetches all lesson logs for a student for a specific month.
 */
export async function getLessonsForStudent(studentId, year, month) {
  const { start, end } = getDateRange('monthly', year, month);
  
  const lessonsRef = collection(db, 'lesson_log');
  const q = query(lessonsRef,
    where('studentId', '==', studentId),
    where('date', '>=', start),
    where('date', '<=', end),
    orderBy('date', 'asc') // Sort by date
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Updates a payment document.
 * AUTOMATICALLY RECALCULATES Net, Fees, Tax, and Per-Lesson Value if amount changes.
 */
export async function updatePayment(paymentId, data) {
  const paymentRef = doc(db, 'payments', paymentId);

  // 1. Handle Date Conversion
  if (data.date && typeof data.date === 'string') {
    data.timestamp = Timestamp.fromDate(new Date(data.date));
    data.date = Timestamp.fromDate(new Date(data.date));
  }

  // 2. Check if we need to recalculate financials
  if (data.amountGross !== undefined || data.method !== undefined) {
    
    // We need the current document to get missing fields (e.g. lessonCount, old method)
    const currentSnap = await getDoc(paymentRef);
    if (currentSnap.exists()) {
      const currentData = currentSnap.data();
      
      // Use new values if provided, otherwise fall back to existing values
      const gross = data.amountGross !== undefined ? Number(data.amountGross) : currentData.amountGross;
      const method = data.method !== undefined ? data.method : currentData.method;
      
      // Fetch configs
      const [feeConfig, taxConfig] = await Promise.all([
        getFeeConfig(),
        getTaxConfig()
      ]);

      // Calculate Bank Fee
      let bankFee = 0;
      switch (method) {
        case 'qr':
          bankFee = gross * (feeConfig.qrBase || 0);
          break;
        case 'card':
          // Default to Elkart rate if not specified, consistent with addPayment
          bankFee = gross * (feeConfig.pos?.Elkart?.own || 0);
          break;
        default:
          bankFee = 0;
      }

      // Calculate Tax
      const taxRate = taxConfig.companyTaxRate || 0;
      const taxAmount = gross * taxRate;

      // Calculate Net
      const netAmount = gross - bankFee - taxAmount;

      // Update Financial Fields
      data.amountNet = netAmount;
      data.bankFee = bankFee;
      data.taxAmount = taxAmount;

      // Recalculate Per-Lesson Value (Critical for Payroll)
      if (currentData.lessonCount) {
        data.perLessonValue = gross / currentData.lessonCount;
      }
    }
  }

  await updateDoc(paymentRef, data);
}

/**
 * Fetches all lessons within a specific date range.
 */
export async function getLessonsByDate(startDate, endDate) {
  const q = query(
    collection(db, 'lesson_log'), 
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Fetches a list of payment documents by their IDs.
 * Handles Firestore's 30-item limit for 'in' queries.
 */
export async function getPaymentsByIds(paymentIds) {
  if (!paymentIds || paymentIds.length === 0) {
    return [];
  }
  // Remove duplicates
  const uniqueIds = [...new Set(paymentIds)];
  
  const chunks = [];
  for (let i = 0; i < uniqueIds.length; i += 30) {
    chunks.push(uniqueIds.slice(i, i + 30));
  }

  const payments = [];
  for (const chunk of chunks) {
    const q = query(collection(db, 'payments'), where(documentId(), 'in', chunk));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      payments.push({ id: doc.id, ...doc.data() });
    });
  }
  return payments;
}