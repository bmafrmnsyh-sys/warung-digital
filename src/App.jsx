import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  LayoutDashboard, ShoppingCart, Package, BookOpen, BarChart3,
  Tag, Truck, Settings, LogOut, Search, Plus, Trash2, Edit, Printer,
  CheckCircle, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw,
  Download, Upload, UserCheck, Shield, DollarSign, CreditCard, QrCode,
  FileText, Menu, X, Phone, Check, Eye
} from 'lucide-react';

// Logo Komponen sesuai pesanan (Lingkaran Hijau dengan Keranjang Putih)
const Logo = ({ size = "w-10 h-10" }) => (
  <div className={`${size} bg-emerald-600 rounded-full flex items-center justify-center shadow-md relative overflow-hidden flex-shrink-0`}>
    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700"></div>
    <svg className="w-2/3 h-2/3 text-white relative z-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <path d="M16 10a4 4 0 0 1-8 0"></path>
    </svg>
  </div>
);

export default function App() {
  // Autentikasi State (Tahap 3)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: "", role: "Pemilik Warung" });
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [userRole, setUserRole] = useState('Pemilik Warung');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [posSearchTerm, setPosSearchTerm] = useState('');

  // Pengaturan Warung (Tersimpan Permanen di LocalStorage)
  const defaultSettings = {
    name: "WARUNG DIGITAL",
    address: "Jl. Raya Kelontong No. 45, Jakarta",
    phone: "081234567890",
    printerType: "58mm",
  };

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('warung_digital_settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  });

  // Suara Beep Kasir Menggunakan Web Audio API (Fitur 5)
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Abaikan jika audio dicegah autoplay oleh browser
    }
  };

  // Data State
  const [products, setProducts] = useState([
    { id: 1, code: "BRD001", name: "Beras Premium 5kg", category: "Sembako", buyPrice: 60000, sellPrice: 68000, stock: 25, unit: "Sak", supplier: "Toko Tani Makmur" },
    { id: 2, code: "BRD002", name: "Minyak Goreng 2L", category: "Sembako", buyPrice: 32000, sellPrice: 36000, stock: 4, unit: "Pcs", supplier: "CV Sumber Rejeki" },
    { id: 3, code: "BRD003", name: "Gula Pasir 1kg", category: "Sembako", buyPrice: 14000, sellPrice: 16500, stock: 30, unit: "Kg", supplier: "Toko Tani Makmur" },
    { id: 4, code: "BRD004", name: "Telur Ayam 1kg", category: "Sembako", buyPrice: 24000, sellPrice: 28000, stock: 8, unit: "Kg", supplier: "Peternakan Berkah" },
    { id: 5, code: "BRD005", name: "Mie Instan Goreng", category: "Makanan", buyPrice: 2800, sellPrice: 3500, stock: 120, unit: "Dus", supplier: "PT Indofood" },
    { id: 6, code: "BRD006", name: "Kopi Bubuk Hitam 165g", category: "Minuman", buyPrice: 8500, sellPrice: 10500, stock: 15, unit: "Pcs", supplier: "Agro Jaya" },
  ]);
  const [transactions, setTransactions] = useState([]);
  const [debts, setDebts] = useState([]);

  // Biaya Operasional & Pembelian
  const [expenses, setExpenses] = useState([
    { id: 1, category: "Listrik", amount: 250000, date: "2026-06-01", note: "Token Listrik Bulanan" },
    { id: 2, category: "Transportasi", amount: 50000, date: "2026-06-01", note: "Bensin ambil barang" }
  ]);

  const [purchases, setPurchases] = useState([
    { id: 1, date: "2026-06-01", supplier: "Toko Tani Makmur", product: "Beras Premium 5kg", qty: 10, buyPrice: 60000, total: 600000, method: "Transfer" }
  ]);

  // Sinkronisasi data awal & Realtime listener dengan Supabase (Tahap 2 & Tahap 3)
  useEffect(() => {
    // Cek sesi aktif Supabase Auth saat aplikasi dibuka
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const role = session.user.user_metadata?.role || "Pemilik Warung";
        setIsLoggedIn(true);
        setCurrentUser({
          name: session.user.email,
          role: role
        });
        if (role === 'Kasir') {
          setActiveTab('pos');
        }
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const role = session.user.user_metadata?.role || "Pemilik Warung";
        setIsLoggedIn(true);
        setCurrentUser({
          name: session.user.email,
          role: role
        });
        if (role === 'Kasir') {
          setActiveTab('pos');
        }
      }
    });

    fetchDataFromSupabase();

    // Langganan perubahan database secara real-time (Tahap 2)
    const channel = supabase
      .channel('warung-digital-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('Perubahan data terdeteksi:', payload);
        fetchDataFromSupabase(); // Otomatis tarik data terbaru
      })
      .subscribe();

    // Sinkronisasi otomatis transaksi offline saat online kembali
    const syncPendingTransactions = async () => {
      try {
        const pending = JSON.parse(localStorage.getItem('pending_transactions') || '[]');
        if (pending.length === 0) return;
        console.log(`Mengirim ${pending.length} transaksi offline ke Supabase...`);
        const { error } = await supabase.from('transactions').insert(pending);
        if (!error) {
          localStorage.removeItem('pending_transactions');
          console.log("Semua transaksi offline berhasil disinkronkan ke Supabase!");
          fetchDataFromSupabase();
        }
      } catch (e) {
        console.error("Gagal sinkronisasi otomatis:", e);
      }
    };

    if (navigator.onLine) {
      syncPendingTransactions();
    }
    window.addEventListener('online', syncPendingTransactions);

    return () => {
      authListener?.subscription?.unsubscribe();
      supabase.removeChannel(channel);
      window.removeEventListener('online', syncPendingTransactions);
    };
  }, []);

  async function fetchDataFromSupabase() {
    try {
      // Ambil Produk
      const { data: prodData } = await supabase.from('products').select('*');
      if (prodData && prodData.length > 0) {
        setProducts(prodData.map(p => ({
          ...p,
          buyPrice: p.buyPrice ?? p.buy_price ?? 0,
          sellPrice: p.sellPrice ?? p.sell_price ?? 0,
        })));
      }

      // Ambil Transaksi
      const { data: trxData } = await supabase.from('transactions').select('*');
      if (trxData && trxData.length > 0) setTransactions(trxData);

      // Ambil Buku Utang
      const { data: debtData } = await supabase.from('debts').select('*');
      if (debtData && debtData.length > 0) setDebts(debtData);

      // Ambil Biaya Operasional
      const { data: expData } = await supabase.from('expenses').select('*');
      if (expData && expData.length > 0) setExpenses(expData);

      // Ambil Pembelian Masuk
      const { data: purData } = await supabase.from('purchases').select('*');
      if (purData && purData.length > 0) {
        setPurchases(purData.map(p => ({
          ...p,
          buyPrice: p.buyPrice ?? p.buy_price ?? 0,
        })));
      }

    } catch (error) {
      console.error("Gagal memuat data dari Supabase:", error);
    }
  }

  // Handler Autentikasi (Tahap 3: Login & Register)
  const handleAuth = async (e) => {
    if (e) e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    if (isRegisterMode) {
      // Registrasi Akun Baru ke Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: loginEmail,
        password: loginPassword,
        options: {
          data: { role: userRole }
        }
      });
      setAuthLoading(false);

      if (error) {
        setAuthError(error.message);
        alert("Pendaftaran gagal: " + error.message);
      } else {
        if (data.session) {
          setIsLoggedIn(true);
          setCurrentUser({
            name: data.user.email,
            role: userRole
          });
          alert("Pendaftaran berhasil dan Anda telah login!");
        } else {
          setAuthSuccess("Pendaftaran berhasil! Silakan masuk dengan email dan password Anda.");
          setIsRegisterMode(false);
          alert("Pendaftaran berhasil! Silakan login sekarang.");
        }
      }
    } else {
      // Login Akun
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      setAuthLoading(false);

      if (error) {
        let msg = error.message;
        if (error.message.toLowerCase().includes('email not confirmed')) {
          msg = "Email belum dikonfirmasi! Silakan cek kotak masuk/spam email Anda, atau matikan 'Confirm Email' di Supabase.";
        } else if (error.message.toLowerCase().includes('invalid login credentials')) {
          msg = "Email atau password salah! Jika baru mendaftar, pastikan email sudah dikonfirmasi di Supabase.";
        }
        setAuthError(msg);
        alert("Login gagal: " + msg);
      } else {
        const role = userRole || data.user.user_metadata?.role || "Pemilik Warung";
        setIsLoggedIn(true);
        setCurrentUser({
          name: data.user.email,
          role: role
        });
        if (role === 'Kasir') {
          setActiveTab('pos');
        } else {
          setActiveTab('dashboard');
        }
      }
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    }
    setIsLoggedIn(false);
    setCurrentUser({ name: '', role: 'Pemilik Warung' });
    setActiveTab('pos');
  };

  // Keranjang Kasir
  const [cart, setCart] = useState([]);
  const [cashAmount, setCashAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [lastReceipt, setLastReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // State Form Produk Baru
  const [newProduct, setNewProduct] = useState({ code: '', name: '', category: 'Sembako', buyPrice: '', sellPrice: '', stock: '', unit: 'Pcs', supplier: '' });
  const [editingProduct, setEditingProduct] = useState(null);

  // State Buku Utang (Tambah Pelanggan / Catatan Utang)
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [newDebtForm, setNewDebtForm] = useState({ name: '', phone: '', amount: '', note: '' });

  const handleAddDebtCustomer = async (e) => {
    e.preventDefault();
    if (!newDebtForm.name.trim()) {
      alert("Nama pelanggan wajib diisi!");
      return;
    }

    const initAmount = Number(newDebtForm.amount) || 0;
    const now = new Date().toISOString().slice(0, 10);
    const newEntry = {
      id: Date.now(),
      name: newDebtForm.name.trim(),
      phone: newDebtForm.phone.trim() || "-",
      amount: initAmount,
      date: now,
      status: initAmount > 0 ? "Belum Lunas" : "Lunas",
      history: initAmount > 0 ? [{
        date: now,
        note: newDebtForm.note.trim() || "Saldo Awal Utang / Kasbon",
        amount: initAmount
      }] : []
    };

    const { error } = await supabase.from('debts').insert([newEntry]);
    if (error) {
      alert("Gagal menambahkan pelanggan ke database: " + error.message);
      console.error(error);
      return;
    }

    setNewDebtForm({ name: '', phone: '', amount: '', note: '' });
    setShowAddDebtModal(false);
    fetchDataFromSupabase();
    alert("Pelanggan baru berhasil ditambahkan!");
  };

  const handleDeleteDebtCustomer = async (id, name) => {
    if (window.confirm(`Yakin ingin menghapus data buku utang untuk ${name}?`)) {
      const { error } = await supabase.from('debts').delete().eq('id', id);
      if (error) {
        alert("Gagal menghapus pelanggan: " + error.message);
      } else {
        fetchDataFromSupabase();
      }
    }
  };

  // State & Handler Pembelian Masuk (Stok Masuk)
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({
    productId: '',
    supplier: '',
    qty: '',
    buyPrice: '',
    method: 'Cash',
    date: new Date().toISOString().slice(0, 10),
    updateBuyPrice: true
  });

  const handleSelectProductForPurchase = (productId) => {
    const prod = products.find(p => p.id === Number(productId) || p.id === productId);
    if (prod) {
      setPurchaseForm(prev => ({
        ...prev,
        productId: prod.id,
        supplier: prod.supplier || prev.supplier || '',
        buyPrice: prod.buyPrice ?? prod.buy_price ?? ''
      }));
    } else {
      setPurchaseForm(prev => ({ ...prev, productId: '' }));
    }
  };

  const handleSavePurchase = async (e) => {
    e.preventDefault();
    if (!purchaseForm.productId) {
      alert("Pilih produk yang dibeli!");
      return;
    }
    if (!purchaseForm.qty || Number(purchaseForm.qty) <= 0) {
      alert("Jumlah barang masuk (qty) harus lebih dari 0!");
      return;
    }
    if (!purchaseForm.buyPrice || Number(purchaseForm.buyPrice) <= 0) {
      alert("Harga kulak/beli harus lebih dari 0!");
      return;
    }

    const prod = products.find(p => p.id === Number(purchaseForm.productId) || p.id === purchaseForm.productId);
    if (!prod) {
      alert("Produk tidak ditemukan!");
      return;
    }

    const qtyNum = Number(purchaseForm.qty);
    const buyPriceNum = Number(purchaseForm.buyPrice);
    const totalCost = qtyNum * buyPriceNum;
    const now = purchaseForm.date || new Date().toISOString().slice(0, 10);

    // 1. Catat ke tabel purchases di Supabase
    const newPurchaseEntry = {
      date: now,
      supplier: purchaseForm.supplier || prod.supplier || "Supplier Umum",
      product: prod.name,
      qty: qtyNum,
      buy_price: buyPriceNum,
      total: totalCost,
      method: purchaseForm.method
    };

    const { error: purError } = await supabase.from('purchases').insert([newPurchaseEntry]);
    if (purError) {
      alert("Gagal mencatat pembelian ke database: " + purError.message);
      console.error(purError);
      return;
    }

    // 2. Tambah stok otomatis di tabel products
    const updatedStock = (Number(prod.stock) || 0) + qtyNum;
    const prodUpdate = { stock: updatedStock };
    if (purchaseForm.updateBuyPrice) {
      prodUpdate.buy_price = buyPriceNum;
    }

    const { error: prodError } = await supabase.from('products').update(prodUpdate).eq('id', prod.id);
    if (prodError) {
      console.error("Gagal update stok produk:", prodError);
    }

    // Reset Form & Refresh
    setPurchaseForm({
      productId: '',
      supplier: '',
      qty: '',
      buyPrice: '',
      method: 'Cash',
      date: new Date().toISOString().slice(0, 10),
      updateBuyPrice: true
    });
    setShowPurchaseModal(false);
    fetchDataFromSupabase();
    alert(`Pembelian stok berhasil dicatat!\nStok "${prod.name}" bertambah +${qtyNum} ${prod.unit || 'Unit'} (Total stok saat ini: ${updatedStock}).`);
  };

  const handleDeletePurchase = async (id, productName) => {
    if (window.confirm(`Hapus catatan pembelian masuk untuk ${productName}?`)) {
      const { error } = await supabase.from('purchases').delete().eq('id', id);
      if (error) {
        alert("Gagal menghapus catatan pembelian: " + error.message);
      } else {
        fetchDataFromSupabase();
      }
    }
  };

  // State & Handler Biaya Operasional (Pengeluaran - Fitur 1)
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Listrik & Air',
    amount: '',
    note: '',
    date: new Date().toISOString().slice(0, 10)
  });

  const handleSaveExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
      alert("Nominal biaya pengeluaran harus lebih dari 0!");
      return;
    }

    const newExp = {
      date: expenseForm.date || new Date().toISOString().slice(0, 10),
      category: expenseForm.category,
      amount: Number(expenseForm.amount),
      note: expenseForm.note || "-"
    };

    const { error } = await supabase.from('expenses').insert([newExp]);
    if (error) {
      alert("Gagal mencatat pengeluaran ke database: " + error.message);
      console.error(error);
      return;
    }

    setExpenseForm({
      category: 'Listrik & Air',
      amount: '',
      note: '',
      date: new Date().toISOString().slice(0, 10)
    });
    setShowExpenseModal(false);
    fetchDataFromSupabase();
    alert("Biaya operasional berhasil dicatat!");
  };

  const handleDeleteExpense = async (id, note) => {
    if (window.confirm(`Hapus catatan pengeluaran "${note}"?`)) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) {
        alert("Gagal menghapus pengeluaran: " + error.message);
      } else {
        fetchDataFromSupabase();
      }
    }
  };

  // State Periode Laporan Keuangan (Fitur 2)
  const [reportPeriod, setReportPeriod] = useState('today'); // 'today', 'week', 'month', 'all'

  // Kalkulasi Kasir
  const subTotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.qty), 0);
  const finalTotal = Math.max(0, subTotal - Number(discountAmount));
  const change = Number(cashAmount) >= finalTotal ? Number(cashAmount) - finalTotal : 0;

  // Handler Keranjang
  const addToCart = (prod) => {
    if (prod.stock <= 0) {
      alert("Stok barang habis!");
      return;
    }
    playBeep(); // Bunyi Beep Kasir saat scan/tambah barang (Fitur 5)
    const existing = cart.find(item => item.id === prod.id);
    if (existing) {
      if (existing.qty >= prod.stock) {
        alert("Stok tidak mencukupi!");
        return;
      }
      setCart(cart.map(item => item.id === prod.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...prod, qty: 1 }]);
    }
  };

  const updateCartQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        const prod = products.find(p => p.id === id);
        if (newQty > prod.stock) {
          alert("Stok maksimal tercapai!");
          return item;
        }
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Proses Checkout & Integrasi Supabase (Offline-First Mode)
  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert("Keranjang masih kosong!");
      return;
    }
    if (paymentMethod === 'Cash' && Number(cashAmount) < finalTotal) {
      alert("Jumlah uang tunai kurang!");
      return;
    }
    if (paymentMethod === 'Utang Pelanggan' && !selectedCustomer) {
      alert("Pilih nama pelanggan untuk pencatatan utang!");
      return;
    }

    const trxId = "TRX-" + Math.floor(1000 + Math.random() * 9000);
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const totalProfit = cart.reduce((sum, item) => sum + ((item.sellPrice - item.buyPrice) * item.qty), 0);

    // 1. Buat data transaksi baru
    const newTrx = {
      id: trxId,
      date: now,
      items: [...cart],
      total: finalTotal,
      profit: totalProfit,
      method: paymentMethod,
      customer: selectedCustomer || "Umum"
    };

    // 2. SELALU SIMPAN KE LOCALSTORAGE (Aman 100% meskipun offline / tanpa koneksi)
    try {
      const dataLama = JSON.parse(localStorage.getItem('riwayat_transaksi') || '[]');
      dataLama.unshift(newTrx);
      localStorage.setItem('riwayat_transaksi', JSON.stringify(dataLama));
    } catch (e) {
      console.warn("Gagal simpan ke localStorage:", e);
    }

    // 3. Update Stok di State Lokal (Kasir tidak terganggu jika offline)
    const updatedProducts = products.map(p => {
      const cartItem = cart.find(c => c.id === p.id);
      if (cartItem) {
        return { ...p, stock: Math.max(0, p.stock - cartItem.qty) };
      }
      return p;
    });
    setProducts(updatedProducts);

    // 4. Update Utang di State Lokal (Jika Utang Pelanggan)
    if (paymentMethod === 'Utang Pelanggan') {
      setDebts(debts.map(d => {
        if (d.name === selectedCustomer) {
          return {
            ...d,
            amount: d.amount + finalTotal,
            history: [...(d.history || []), { date: now, note: `Belanja POS (${trxId})`, amount: finalTotal }]
          };
        }
        return d;
      }));
    }

    // 5. COBA KIRIM KE SUPABASE JIKA ADA INTERNET
    if (navigator.onLine) {
      try {
        const { error: trxError } = await supabase.from('transactions').insert([newTrx]);
        if (trxError) throw trxError;

        // Update stok produk di Supabase
        for (const cartItem of cart) {
          const targetProd = products.find(p => p.id === cartItem.id);
          if (targetProd) {
            const newStock = Math.max(0, targetProd.stock - cartItem.qty);
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', cartItem.id);
          }
        }

        // Update utang di Supabase (Jika Utang Pelanggan)
        if (paymentMethod === 'Utang Pelanggan') {
          const targetDebt = debts.find(d => d.name === selectedCustomer);
          if (targetDebt) {
            const updatedAmount = targetDebt.amount + finalTotal;
            const updatedHistory = [...(targetDebt.history || []), { date: now, note: `Belanja POS (${trxId})`, amount: finalTotal }];

            await supabase
              .from('debts')
              .update({ amount: updatedAmount, history: updatedHistory })
              .eq('id', targetDebt.id);
          }
        }

        console.log("Transaksi berhasil dikirim ke cloud Supabase!");
      } catch (err) {
        console.warn("Gagal sinkron ke Supabase, data tersimpan aman di lokal:", err.message);
        // Simpan ke antrean sinkronisasi offline
        const pendingSync = JSON.parse(localStorage.getItem('pending_transactions') || '[]');
        pendingSync.push(newTrx);
        localStorage.setItem('pending_transactions', JSON.stringify(pendingSync));
      }
    } else {
      console.log("Mode Offline: Transaksi tersimpan aman di memori perangkat.");
      // Simpan ke antrean sinkronisasi offline
      const pendingSync = JSON.parse(localStorage.getItem('pending_transactions') || '[]');
      pendingSync.push(newTrx);
      localStorage.setItem('pending_transactions', JSON.stringify(pendingSync));
    }

    // 6. Perbarui state transaksi lokal & Tampilkan Struk Pembelian
    setTransactions([newTrx, ...transactions]);
    setLastReceipt(newTrx);
    setShowReceiptModal(true);

    // 7. Reset Kasir
    setCart([]);
    setCashAmount('');
    setDiscountAmount(0);
    setSelectedCustomer('');

    // Jika online, refresh data terbaru dari Supabase
    if (navigator.onLine) {
      fetchDataFromSupabase();
    }
  };

  // Tambah / Perbarui Produk
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.code || !newProduct.name || !newProduct.buyPrice || !newProduct.sellPrice || !newProduct.stock) {
      alert("Semua field wajib diisi!");
      return;
    }

    const itemData = {
      code: newProduct.code,
      name: newProduct.name,
      category: newProduct.category,
      buy_price: Number(newProduct.buyPrice),
      sell_price: Number(newProduct.sellPrice),
      stock: Number(newProduct.stock),
      unit: newProduct.unit || 'Pcs',
      supplier: newProduct.supplier || ''
    };

    if (editingProduct) {
      const { error } = await supabase.from('products').update(itemData).eq('id', editingProduct.id);
      if (error) {
        alert("Gagal memperbarui produk di database: " + error.message);
        console.error(error);
        return;
      }
      setEditingProduct(null);
      alert(`Produk "${itemData.name}" berhasil diperbarui!`);
    } else {
      const { error } = await supabase.from('products').insert([itemData]);
      if (error) {
        alert(`Gagal menyimpan produk ke database!\nDetail: ${error.message || JSON.stringify(error)}`);
        console.error(error);
        return;
      }
      alert(`Produk "${itemData.name}" berhasil ditambahkan ke database!`);
    }

    setNewProduct({ code: '', name: '', category: 'Sembako', buyPrice: '', sellPrice: '', stock: '', unit: 'Pcs', supplier: '' });
    fetchDataFromSupabase();
  };

  // Filter Periode Laporan Keuangan (Fitur 2)
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  const sevenDaysStr = sevenDaysAgo.toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7);

  const filteredTrx = transactions.filter(t => {
    const d = (t.date || '').slice(0, 10);
    if (reportPeriod === 'today') return d === todayStr;
    if (reportPeriod === 'week') return d >= sevenDaysStr;
    if (reportPeriod === 'month') return d.startsWith(currentMonthStr);
    return true;
  });

  const filteredExp = expenses.filter(e => {
    const d = (e.date || '').slice(0, 10);
    if (reportPeriod === 'today') return d === todayStr;
    if (reportPeriod === 'week') return d >= sevenDaysStr;
    if (reportPeriod === 'month') return d.startsWith(currentMonthStr);
    return true;
  });

  // Keuangan Berdasarkan Periode Terpilih
  const periodOmzet = filteredTrx.reduce((sum, t) => sum + (t.total || 0), 0);
  const periodGrossProfit = filteredTrx.reduce((sum, t) => sum + (t.profit || 0), 0);
  const periodExpenses = filteredExp.reduce((sum, e) => sum + (e.amount || 0), 0);
  const periodNetProfit = periodGrossProfit - periodExpenses;

  // Keuangan Hari Ini (Untuk Dashboard Utama)
  const todayTrx = transactions.filter(t => (t.date || '').slice(0, 10) === todayStr);
  const totalOmzetToday = todayTrx.length > 0 ? todayTrx.reduce((sum, t) => sum + (t.total || 0), 0) : transactions.reduce((sum, t) => sum + (t.total || 0), 0);
  const totalGrossProfit = todayTrx.length > 0 ? todayTrx.reduce((sum, t) => sum + (t.profit || 0), 0) : transactions.reduce((sum, t) => sum + (t.profit || 0), 0);
  const totalOperationalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalNetProfit = totalGrossProfit - totalOperationalExpense;
  const totalReceivables = debts.reduce((sum, d) => sum + (d.amount || 0), 0);
  const lowStockCount = products.filter(p => p.stock <= 5).length;
  const totalItemsCount = products.reduce((sum, p) => sum + (p.stock || 0), 0);

  const cashTotal = transactions.filter(t => t.method === 'Cash').reduce((sum, t) => sum + (t.total || 0), 0);
  const qrisTotal = transactions.filter(t => t.method === 'QRIS').reduce((sum, t) => sum + (t.total || 0), 0);
  const transferTotal = transactions.filter(t => t.method === 'Transfer').reduce((sum, t) => sum + (t.total || 0), 0);

  // Ekspor Laporan CSV
  const handleExportCSV = () => {
    if (filteredTrx.length === 0) {
      alert("Tidak ada data transaksi untuk diekspor pada periode ini.");
      return;
    }
    const headers = ["ID Transaksi", "Tanggal", "Metode Bayar", "Pelanggan", "Total Belanja (Rp)", "Laba Kotor (Rp)"];
    const rows = filteredTrx.map(t => [
      `"${t.id}"`,
      `"${t.date}"`,
      `"${t.method}"`,
      `"${t.customer}"`,
      t.total,
      t.profit
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Keuangan_${reportPeriod}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Tampilan Login & Register jika belum autentikasi (Tahap 3)
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-emerald-100">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <Logo size="w-16 h-16" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{settings.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Sistem Kasir & Manajemen Toko</p>
          </div>

          {/* Toggle Tab Masuk / Daftar */}
          <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => { setIsRegisterMode(false); setAuthError(''); setAuthSuccess(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${!isRegisterMode ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => { setIsRegisterMode(true); setAuthError(''); setAuthSuccess(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${isRegisterMode ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Daftar Akun Baru
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="nama@warung.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                {isRegisterMode ? 'Pilih Peran Akun' : 'Masuk Sebagai (Peran)'}
              </label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Pemilik Warung">👑 Pemilik Warung (Semua Akses & Laporan)</option>
                <option value="Kasir">🛒 Kasir (Hanya Transaksi & Cek Stok)</option>
              </select>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-600/30 text-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {authLoading ? (
                <span>Memproses...</span>
              ) : isRegisterMode ? (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Daftarkan Akun Baru</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Masuk ke Sistem</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-800">

      {/* SIDEBAR (Desktop) & MOBILE HEADER */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-emerald-900 text-white transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col shadow-xl`}>
        <div className="p-5 flex items-center space-x-3 border-b border-emerald-800 bg-emerald-950">
          <Logo size="w-12 h-12" />
          <div>
            <h1 className="font-bold text-lg tracking-wider text-white">{settings.name}</h1>
            <p className="text-xs text-emerald-300">Aplikasi Kasir & Warung</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Pemilik Warung'] },
            { id: 'pos', label: 'Kasir / Penjualan', icon: ShoppingCart, roles: ['Pemilik Warung', 'Kasir'] },
            { id: 'inventory', label: 'Stok Barang', icon: Package, roles: ['Pemilik Warung', 'Kasir'] },
            { id: 'debts', label: 'Buku Utang', icon: BookOpen, roles: ['Pemilik Warung', 'Kasir'] },
            { id: 'purchases', label: 'Pembelian Masuk', icon: Truck, roles: ['Pemilik Warung'] },
            { id: 'barcodes', label: 'Cetak Barcode', icon: Tag, roles: ['Pemilik Warung', 'Kasir'] },
            { id: 'reports', label: 'Laporan Keuangan', icon: BarChart3, roles: ['Pemilik Warung'] },
            { id: 'settings', label: 'Pengaturan', icon: Settings, roles: ['Pemilik Warung'] },
          ]
            .filter(item => item.roles.includes(currentUser?.role || 'Pemilik Warung'))
            .map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${active ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'text-emerald-100 hover:bg-emerald-800/60'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
        </nav>

        <div className="p-4 border-t border-emerald-800 bg-emerald-950/50 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow ${currentUser?.role === 'Kasir' ? 'bg-blue-600' : 'bg-emerald-700'}`}>
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold truncate max-w-[120px]">{currentUser.name}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${currentUser?.role === 'Kasir' ? 'bg-blue-500/30 text-blue-200 border border-blue-400/40' : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'}`}>
                  {currentUser?.role === 'Kasir' ? '🛒 Kasir' : '👑 Pemilik'}
                </span>
              </div>
            </div>
            <button onClick={handleLogout} title="Keluar / Logout" className="text-emerald-300 hover:text-white p-1">
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Tombol Praktis Beralih Peran Akun */}
          <button
            type="button"
            onClick={() => {
              const nextRole = currentUser?.role === 'Kasir' ? 'Pemilik Warung' : 'Kasir';
              setCurrentUser(prev => ({ ...prev, role: nextRole }));
              if (nextRole === 'Kasir') {
                setActiveTab('pos');
              }
            }}
            className="w-full text-[11px] font-bold py-1.5 px-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-white border border-emerald-600/50 transition flex items-center justify-center space-x-1.5 shadow-sm"
            title="Klik untuk beralih mode akun seketika"
          >
            <RefreshCw className="w-3 h-3 text-emerald-300" />
            <span>Ganti Peran ke {currentUser?.role === 'Kasir' ? '👑 Pemilik' : '🛒 Kasir'}</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen">

        {/* TOPBAR */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center space-x-4">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-gray-600 hover:text-emerald-600">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center space-x-2">
              <Logo size="w-8 h-8 md:hidden" />
              <span className="font-bold text-gray-800 text-lg md:text-xl capitalize">{activeTab.replace('-', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Indikator Status Akun */}
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${currentUser?.role === 'Kasir' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              <span>{currentUser?.role === 'Kasir' ? '🛒 Peran: Kasir' : '👑 Peran: Pemilik Warung'}</span>
            </div>

            {/* Tombol Beralih Mode Cepat */}
            <button
              type="button"
              onClick={() => {
                const nextRole = currentUser?.role === 'Kasir' ? 'Pemilik Warung' : 'Kasir';
                setCurrentUser(prev => ({ ...prev, role: nextRole }));
                if (nextRole === 'Kasir') {
                  setActiveTab('pos');
                }
              }}
              className="hidden sm:flex text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 transition items-center space-x-1.5 shadow-sm"
              title="Ganti peran akun untuk melihat perbedaan fitur"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ganti ke {currentUser?.role === 'Kasir' ? 'Pemilik' : 'Kasir'}</span>
            </button>

            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>
        </header>

        {/* CONTENT DYNAMIC */}
        <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">

          {/* Proteksi Halaman Khusus Pemilik dari Akses Kasir */}
          {currentUser?.role === 'Kasir' && ['dashboard', 'purchases', 'reports', 'settings'].includes(activeTab) && (
            <div className="bg-white rounded-3xl p-8 border border-amber-200 text-center max-w-md mx-auto my-12 shadow-md space-y-4">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Akses Terbatas (Khusus Pemilik)</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Halaman <strong>{activeTab.toUpperCase()}</strong> berisi data privasi keuangan (omzet toko, laba bersih, supplier, atau konfigurasi).
                Akun dengan peran <strong>Kasir</strong> difokuskan hanya untuk transaksi penjualan & kasbon.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('pos')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-md inline-flex items-center space-x-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Buka Kasir / Penjualan</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && currentUser?.role === 'Pemilik Warung' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Selamat Datang, {currentUser.name}! 🚀</h2>
                  <p className="text-emerald-100 text-sm mt-1">Semua sistem pencatatan warung berjalan normal dan sinkron.</p>
                </div>
                <div className="mt-4 md:mt-0 flex space-x-3">
                  <button onClick={() => setActiveTab('pos')} className="bg-white text-emerald-800 font-bold px-5 py-2.5 rounded-xl shadow hover:bg-emerald-50 transition flex items-center space-x-2">
                    <ShoppingCart className="w-4 h-4" />
                    <span>Buka Kasir POS</span>
                  </button>
                </div>
              </div>

              {/* KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { title: "Omzet Hari Ini", value: `Rp ${totalOmzetToday.toLocaleString()}`, icon: DollarSign, color: "bg-emerald-500" },
                  { title: "Total Laba Kotor", value: `Rp ${totalGrossProfit.toLocaleString()}`, icon: ArrowUpRight, color: "bg-blue-500" },
                  { title: "Total Laba Bersih", value: `Rp ${totalNetProfit.toLocaleString()}`, icon: Shield, color: "bg-indigo-500" },
                  { title: "Total Piutang", value: `Rp ${totalReceivables.toLocaleString()}`, icon: BookOpen, color: "bg-amber-500" },
                ].map((kpi, idx) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{kpi.title}</p>
                        <p className="text-xl font-bold text-gray-800 mt-1">{kpi.value}</p>
                      </div>
                      <div className={`${kpi.color} text-white p-3.5 rounded-xl shadow-md`}>
                        <Icon className="w-6 h-6" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SECONDARY STATS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Jumlah Transaksi</p>
                    <p className="text-lg font-bold text-gray-800">{transactions.length} Transaksi</p>
                  </div>
                  <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-lg">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Total Barang Tersedia</p>
                    <p className="text-lg font-bold text-gray-800">{totalItemsCount} Unit</p>
                  </div>
                  <div className="bg-blue-100 text-blue-700 p-2.5 rounded-lg">
                    <Package className="w-5 h-5" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Barang Hampir Habis</p>
                    <p className="text-lg font-bold text-red-600">{lowStockCount} Produk</p>
                  </div>
                  <div className="bg-red-100 text-red-700 p-2.5 rounded-lg">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Metode Bayar (Cash / QRIS / Trx)</p>
                    <p className="text-xs font-bold text-gray-800 mt-1">Cash: Rp {cashTotal.toLocaleString()}</p>
                    <p className="text-xs font-bold text-emerald-600">QRIS/Trx: Rp {(qrisTotal + transferTotal).toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-100 text-purple-700 p-2.5 rounded-lg">
                    <CreditCard className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* GRAFIK & PRODUK TERLARIS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-800">Grafik Omzet Penjualan Terakhir</h3>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-semibold">Realtime</span>
                  </div>
                  <div className="h-64 flex items-end justify-between space-x-4 pt-10 px-4 border-b border-gray-200">
                    {[
                      { day: 'Senin', val: 450000, height: '60%' },
                      { day: 'Selasa', val: 620000, height: '80%' },
                      { day: 'Rabu', val: 380000, height: '50%' },
                      { day: 'Kamis', val: 750000, height: '95%' },
                      { day: 'Jumat', val: 590000, height: '75%' },
                      { day: 'Sabtu', val: 920000, height: '100%' },
                      { day: 'Minggu', val: totalOmzetToday || 500000, height: '65%' },
                    ].map((item, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                        <div className="text-[10px] text-gray-500 mb-1 opacity-0 group-hover:opacity-100 transition">Rp {(item.val / 1000).toFixed(0)}k</div>
                        <div className="w-full bg-emerald-500 rounded-t-lg group-hover:bg-emerald-600 transition-all duration-300" style={{ height: item.height }}></div>
                        <span className="text-xs text-gray-600 mt-2 font-medium">{item.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-800 mb-4">Produk Paling Laris</h3>
                  <div className="space-y-4">
                    {products.slice(0, 4).map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                            #{idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                            <p className="text-xs text-gray-500">Stok: {p.stock} {p.unit}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">Rp {p.sell_price ? p.sell_price.toLocaleString() : p.sellPrice?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KASIR / POS */}
          {activeTab === 'pos' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
              <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-800 text-lg">Katalog Produk</h3>
                  <div className="relative w-72">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={posSearchTerm}
                      onChange={(e) => setPosSearchTerm(e.target.value)}
                      placeholder="Cari nama barang / scan barcode [Enter]..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const query = (posSearchTerm || e.target.value).trim().toLowerCase();
                          if (!query) return;
                          const found = products.find(p =>
                            (p.code && p.code.toLowerCase() === query) ||
                            (p.name && p.name.toLowerCase() === query) ||
                            (p.name && p.name.toLowerCase().includes(query))
                          );
                          if (found) {
                            addToCart({ ...found, sellPrice: found.sell_price ?? found.sellPrice, buyPrice: found.buy_price ?? found.buyPrice });
                            setPosSearchTerm('');
                          } else {
                            alert("Produk tidak ditemukan!");
                          }
                        }
                      }}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-4 pr-1">
                  {products
                    .filter(p =>
                      !posSearchTerm ||
                      (p.name && p.name.toLowerCase().includes(posSearchTerm.toLowerCase())) ||
                      (p.code && p.code.toLowerCase().includes(posSearchTerm.toLowerCase())) ||
                      (p.category && p.category.toLowerCase().includes(posSearchTerm.toLowerCase()))
                    )
                    .map(prod => {
                    const price = prod.sell_price ?? prod.sellPrice ?? 0;
                    return (
                      <div
                        key={prod.id}
                        onClick={() => addToCart({ ...prod, sellPrice: price, buyPrice: prod.buy_price ?? prod.buyPrice ?? 0 })}
                        className="bg-gray-50 hover:bg-emerald-50/50 border border-gray-200 hover:border-emerald-500 rounded-2xl p-4 cursor-pointer transition flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">{prod.category}</span>
                            <span className="text-[10px] text-gray-400 font-mono">{prod.code}</span>
                          </div>
                          <h4 className="font-bold text-gray-800 text-sm mt-2 group-hover:text-emerald-700">{prod.name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">Stok: {prod.stock} {prod.unit}</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                          <span className="font-bold text-emerald-600 text-sm">Rp {price.toLocaleString()}</span>
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* KERANJANG & CHECKOUT */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                    <h3 className="font-bold text-gray-800 flex items-center space-x-2">
                      <ShoppingCart className="w-5 h-5 text-emerald-600" />
                      <span>Keranjang Belanja</span>
                    </h3>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-semibold">{cart.length} Item</span>
                  </div>

                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {cart.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 text-sm">Keranjang masih kosong.<br />Silakan pilih produk di samping.</div>
                    ) : (
                      cart.map(item => (
                        <div key={item.id} className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl">
                          <div className="flex-1 pr-2">
                            <p className="text-xs font-bold text-gray-800">{item.name}</p>
                            <p className="text-[10px] text-emerald-600">Rp {item.sellPrice.toLocaleString()} x {item.qty}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => updateCartQty(item.id, -1)} className="w-6 h-6 bg-gray-200 rounded-md font-bold text-xs hover:bg-gray-300">-</button>
                            <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                            <button onClick={() => updateCartQty(item.id, 1)} className="w-6 h-6 bg-emerald-600 text-white rounded-md font-bold text-xs hover:bg-emerald-700">+</button>
                            <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-700 ml-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-semibold">Rp {subTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Diskon</span>
                    <input
                      type="number"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      className="w-24 text-right border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex justify-between text-base font-bold text-emerald-700 border-t border-dashed border-gray-200 pt-2">
                    <span>Total Belanja</span>
                    <span>Rp {finalTotal.toLocaleString()}</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Metode Pembayaran</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="Cash">Cash / Tunai</option>
                      <option value="QRIS">QRIS</option>
                      <option value="Transfer">Transfer Bank</option>
                      <option value="Utang Pelanggan">Utang Pelanggan</option>
                    </select>
                  </div>

                  {paymentMethod === 'Cash' && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Uang Tunai Diterima</label>
                      <input
                        type="number"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        placeholder="Masukkan jumlah uang..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <div className="flex justify-between text-xs mt-1 text-gray-500">
                        <span>Kembalian:</span>
                        <span className="font-bold text-emerald-600">Rp {change.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Utang Pelanggan' && (
                    <div>
                      <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Pelanggan (Utang)</label>
                      <select
                        value={selectedCustomer}
                        onChange={(e) => setSelectedCustomer(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="">-- Pilih Pelanggan --</option>
                        {debts.map(d => (
                          <option key={d.id} value={d.name}>{d.name} (Sisa: Rp {d.amount.toLocaleString()})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/30 transition text-sm flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>Selesaikan Transaksi</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STOK BARANG */}
          {activeTab === 'inventory' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Manajemen Stok & Produk</h3>
                  <p className="text-xs text-gray-500">
                    {currentUser?.role === 'Kasir'
                      ? 'Daftar katalog ketersediaan stok produk dan harga jual untuk kasir.'
                      : 'Kelola inventaris, harga kulak, dan harga jual produk warung.'}
                  </p>
                </div>
                {currentUser?.role === 'Pemilik Warung' && (
                  <button
                    onClick={() => setEditingProduct(null)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-md transition flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Produk Baru</span>
                  </button>
                )}
              </div>

              {/* Banner Khusus Mode Kasir */}
              {currentUser?.role === 'Kasir' && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-blue-900">
                  <Shield className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Mode Akses Kasir Aktif:</span>
                    <p className="text-blue-700 mt-0.5">
                      Anda dapat melihat ketersediaan stok dan harga jual kepada pelanggan. Informasi harga modal (kulak), margin laba bersih, serta tombol tambah/edit produk disembunyikan demi privasi toko.
                    </p>
                  </div>
                </div>
              )}

              {/* Form Tambah/Edit Produk (Hanya untuk Pemilik Warung) */}
              {currentUser?.role === 'Pemilik Warung' && (
                <form onSubmit={handleAddProduct} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Kode Produk (mis. BRD007)"
                    value={newProduct.code}
                    onChange={(e) => setNewProduct({ ...newProduct, code: e.target.value })}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Nama Barang"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white"
                  />
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white"
                  >
                    <option value="Sembako">Sembako</option>
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                    <option value="Kebutuhan Rumah">Kebutuhan Rumah</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Harga Kulak (Beli)"
                    value={newProduct.buyPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, buyPrice: e.target.value })}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white"
                  />
                  <input
                    type="number"
                    placeholder="Harga Jual"
                    value={newProduct.sellPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, sellPrice: e.target.value })}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white"
                  />
                  <input
                    type="number"
                    placeholder="Jumlah Stok Awal"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Satuan (Pcs/Kg/Sak)"
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white"
                  />
                  <div className="flex space-x-2">
                    <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs py-2 shadow">
                      {editingProduct ? 'Perbarui Produk' : 'Simpan Produk'}
                    </button>
                    {editingProduct && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(null);
                          setNewProduct({ code: '', name: '', category: 'Sembako', buyPrice: '', sellPrice: '', stock: '', unit: 'Pcs', supplier: '' });
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl text-xs px-3 py-2"
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase bg-gray-50">
                      <th className="p-3">Kode / Barcode</th>
                      <th className="p-3">Nama Barang</th>
                      <th className="p-3">Kategori</th>
                      {currentUser?.role === 'Pemilik Warung' && <th className="p-3">Harga Beli</th>}
                      <th className="p-3">Harga Jual</th>
                      {currentUser?.role === 'Pemilik Warung' && <th className="p-3">Margin Laba</th>}
                      <th className="p-3">Stok</th>
                      {currentUser?.role === 'Pemilik Warung' && <th className="p-3 text-center">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {products.map(p => {
                      const bPrice = p.buy_price ?? p.buyPrice ?? 0;
                      const sPrice = p.sell_price ?? p.sellPrice ?? 0;
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="p-3 font-mono text-xs text-gray-600">{p.code}</td>
                          <td className="p-3 font-semibold text-gray-800">{p.name}</td>
                          <td className="p-3"><span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md">{p.category}</span></td>
                          {currentUser?.role === 'Pemilik Warung' && (
                            <td className="p-3 text-gray-600">Rp {bPrice.toLocaleString()}</td>
                          )}
                          <td className="p-3 text-emerald-600 font-bold">Rp {sPrice.toLocaleString()}</td>
                          {currentUser?.role === 'Pemilik Warung' && (
                            <td className="p-3 text-blue-600 font-medium">Rp {(sPrice - bPrice).toLocaleString()}</td>
                          )}
                          <td className="p-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${p.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'}`}>
                              {p.stock} {p.unit}
                            </span>
                          </td>
                          {currentUser?.role === 'Pemilik Warung' && (
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setNewProduct({
                                      code: p.code,
                                      name: p.name,
                                      category: p.category,
                                      buyPrice: p.buyPrice ?? p.buy_price ?? '',
                                      sellPrice: p.sellPrice ?? p.sell_price ?? '',
                                      stock: p.stock,
                                      unit: p.unit || 'Pcs',
                                      supplier: p.supplier || ''
                                    });
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                  }}
                                  className="text-blue-500 hover:text-blue-700 p-1"
                                  title="Edit Produk"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (window.confirm(`Hapus produk "${p.name}" dari database?`)) {
                                      await supabase.from('products').delete().eq('id', p.id);
                                      fetchDataFromSupabase();
                                    }
                                  }}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Hapus Produk"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: BUKU UTANG */}
          {activeTab === 'debts' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Buku Utang Pelanggan (Piutang)</h3>
                  <p className="text-xs text-gray-500">Kelola catatan utang pelanggan warung dengan riwayat lengkap.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-amber-800 font-bold text-sm">
                    Total Piutang: Rp {totalReceivables.toLocaleString()}
                  </div>
                  <button
                    onClick={() => setShowAddDebtModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Pelanggan Baru</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {debts.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <BookOpen className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-gray-600">Belum ada data utang pelanggan</p>
                    <p className="text-xs text-gray-400 mt-0.5">Klik tombol "+ Tambah Pelanggan Baru" di atas untuk menambahkan catatan.</p>
                  </div>
                ) : (
                  debts.map(debt => (
                    <div key={debt.id} className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-gray-800 text-base">{debt.name}</h4>
                          <p className="text-xs text-gray-500 flex items-center space-x-1 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{debt.phone}</span>
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                            Rp {debt.amount.toLocaleString()}
                          </span>
                          {currentUser?.role === 'Pemilik Warung' && (
                            <button
                              onClick={() => handleDeleteDebtCustomer(debt.id, debt.name)}
                              title="Hapus data utang pelanggan ini"
                              className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-3 space-y-2">
                        <p className="text-xs font-bold text-gray-600">Riwayat Transaksi Utang:</p>
                        {debt.history && debt.history.length > 0 ? (
                          debt.history.map((h, i) => (
                            <div key={i} className="flex justify-between text-xs bg-white p-2 rounded-lg border border-gray-100">
                              <span className="text-gray-600">{h.date} - {h.note}</span>
                              <span className={`font-bold ${h.amount < 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {h.amount < 0 ? `- Rp ${Math.abs(h.amount).toLocaleString()}` : `+ Rp ${h.amount.toLocaleString()}`}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 italic">Belum ada riwayat transaksi.</p>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <button
                          onClick={async () => {
                            const nominal = prompt(`Masukkan jumlah utang tambahan untuk ${debt.name}:`);
                            if (nominal && !isNaN(nominal) && Number(nominal) > 0) {
                              const val = Number(nominal);
                              const note = prompt(`Keterangan utang baru:`, `Kasbon tambahan`) || "Kasbon tambahan";
                              const newAmount = debt.amount + val;
                              const newHistory = [...(debt.history || []), {
                                date: new Date().toISOString().slice(0, 10),
                                note: note,
                                amount: val
                              }];

                              await supabase
                                .from('debts')
                                .update({ amount: newAmount, history: newHistory })
                                .eq('id', debt.id);

                              fetchDataFromSupabase();
                            }
                          }}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 rounded-xl text-xs shadow transition flex items-center justify-center space-x-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Utang</span>
                        </button>

                        <button
                          onClick={async () => {
                            const bayar = prompt(`Masukkan jumlah pembayaran cicilan untuk ${debt.name}:`);
                            if (bayar && !isNaN(bayar) && Number(bayar) > 0) {
                              const val = Number(bayar);
                              const newAmount = Math.max(0, debt.amount - val);
                              const newHistory = [...(debt.history || []), {
                                date: new Date().toISOString().slice(0, 10),
                                note: "Pembayaran Cicilan",
                                amount: -val
                              }];

                              await supabase
                                .from('debts')
                                .update({ amount: newAmount, history: newHistory })
                                .eq('id', debt.id);

                              fetchDataFromSupabase();
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs shadow transition flex items-center justify-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Cicil / Lunas</span>
                        </button>

                        <a
                          href={`https://wa.me/${debt.phone}?text=Halo%20${debt.name},%20ini%20dari%20${settings.name}.%20Mengingatkan%20sisa%20utang%20belanja%20sebesar%20Rp%20${debt.amount.toLocaleString()}.%20Terima%20kasih.`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: PEMBELIAN MASUK */}
          {activeTab === 'purchases' && currentUser?.role === 'Pemilik Warung' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Manajemen Pembelian Barang (Stok Masuk)</h3>
                  <p className="text-xs text-gray-500">Catat pembelian barang dari supplier dan stok produk akan bertambah otomatis.</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-emerald-800 font-bold text-sm">
                    Total Pembelian: Rp {purchases.reduce((sum, p) => sum + (p.total || 0), 0).toLocaleString()}
                  </div>
                  <button
                    onClick={() => setShowPurchaseModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Catat Pembelian Stok</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                {purchases.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <Truck className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-gray-600">Belum ada riwayat pembelian masuk</p>
                    <p className="text-xs text-gray-400 mt-0.5">Klik tombol "+ Catat Pembelian Stok" di atas untuk menambahkan stok masuk dari supplier.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase bg-gray-50">
                        <th className="p-3">Tanggal</th>
                        <th className="p-3">Supplier</th>
                        <th className="p-3">Nama Produk</th>
                        <th className="p-3">Jumlah Masuk</th>
                        <th className="p-3">Harga Kulak</th>
                        <th className="p-3">Total Biaya</th>
                        <th className="p-3">Metode Bayar</th>
                        <th className="p-3 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {purchases.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition">
                          <td className="p-3 text-xs text-gray-600 font-mono">{p.date}</td>
                          <td className="p-3 font-semibold text-gray-800">{p.supplier}</td>
                          <td className="p-3 text-gray-800 font-medium">{p.product}</td>
                          <td className="p-3 font-bold text-emerald-600">+{p.qty} Unit</td>
                          <td className="p-3 text-gray-600">Rp {(p.buyPrice ?? p.buy_price ?? 0).toLocaleString()}</td>
                          <td className="p-3 font-bold text-gray-800">Rp {(p.total || 0).toLocaleString()}</td>
                          <td className="p-3">
                            <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md font-medium">
                              {p.method}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => handleDeletePurchase(p.id, p.product)}
                              title="Hapus catatan ini"
                              className="text-gray-400 hover:text-red-500 p-1 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: CETAK BARCODE */}
          {activeTab === 'barcodes' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
              <h3 className="text-lg font-bold text-gray-800">Cetak Barcode & Label Harga</h3>
              <p className="text-xs text-gray-500">Buat label harga produk siap cetak untuk ditempel di rak warung.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {products.map(p => (
                  <div key={p.id} className="border-2 border-dashed border-gray-300 rounded-2xl p-5 text-center bg-white space-y-3 shadow-sm">
                    <p className="text-xs font-bold text-emerald-800">{settings.name}</p>
                    <h4 className="font-bold text-gray-800 text-base">{p.name}</h4>
                    <p className="text-xl font-extrabold text-emerald-600">Rp {(p.sell_price ?? p.sellPrice)?.toLocaleString()}</p>
                    <div className="font-mono text-xs bg-gray-100 py-2 rounded-lg tracking-widest font-bold">
                      ||| | |||| || | ||| ({p.code})
                    </div>
                    <button onClick={() => window.print()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-2">
                      <Printer className="w-4 h-4" />
                      <span>Cetak Label</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: LAPORAN KEUANGAN */}
          {activeTab === 'reports' && currentUser?.role === 'Pemilik Warung' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Laporan Keuangan & Analisis Laba</h3>
                  <p className="text-xs text-gray-500">Laporan omzet, laba kotor, biaya operasional, dan laba bersih.</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow flex items-center space-x-1.5 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Catat Biaya Pengeluaran</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow flex items-center space-x-1.5 transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Ekspor CSV</span>
                  </button>
                </div>
              </div>

              {/* Filter Periode (Fitur 2) */}
              <div className="flex items-center space-x-2 bg-gray-100 p-1.5 rounded-2xl w-fit">
                {[
                  { id: 'today', label: 'Hari Ini' },
                  { id: 'week', label: '7 Hari Terakhir' },
                  { id: 'month', label: 'Bulan Ini' },
                  { id: 'all', label: 'Semua Waktu' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setReportPeriod(tab.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${reportPeriod === tab.id ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Kartu Ringkasan Keuangan Periode */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
                  <p className="text-xs text-emerald-800 font-medium">Omzet Penjualan</p>
                  <p className="text-xl font-bold text-emerald-900 mt-1">Rp {periodOmzet.toLocaleString()}</p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">{filteredTrx.length} Transaksi</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
                  <p className="text-xs text-blue-800 font-medium">Laba Kotor</p>
                  <p className="text-xl font-bold text-blue-900 mt-1">Rp {periodGrossProfit.toLocaleString()}</p>
                  <p className="text-[10px] text-blue-700 mt-0.5">Margin dari modal produk</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                  <p className="text-xs text-amber-800 font-medium">Biaya Operasional</p>
                  <p className="text-xl font-bold text-amber-900 mt-1">Rp {periodExpenses.toLocaleString()}</p>
                  <p className="text-[10px] text-amber-700 mt-0.5">{filteredExp.length} Pengeluaran</p>
                </div>
                <div className={`p-4 rounded-2xl border ${periodNetProfit >= 0 ? 'bg-teal-50 border-teal-200 text-teal-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                  <p className="text-xs font-medium">Laba Bersih Toko</p>
                  <p className="text-xl font-bold mt-1">Rp {periodNetProfit.toLocaleString()}</p>
                  <p className="text-[10px] opacity-80 mt-0.5">Laba kotor dikurangi biaya</p>
                </div>
              </div>

              {/* Tabel Riwayat Transaksi & Biaya Operasional */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                {/* Tabel Transaksi */}
                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                  <h4 className="font-bold text-gray-800 text-sm mb-3">Transaksi Penjualan ({filteredTrx.length})</h4>
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    {filteredTrx.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-6">Tidak ada transaksi pada periode ini.</p>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 font-bold text-gray-500 bg-gray-100">
                            <th className="p-2">Waktu</th>
                            <th className="p-2">Metode</th>
                            <th className="p-2">Total</th>
                            <th className="p-2">Laba</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredTrx.map(t => (
                            <tr key={t.id} className="hover:bg-white">
                              <td className="p-2 text-gray-600">{t.date}</td>
                              <td className="p-2"><span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">{t.method}</span></td>
                              <td className="p-2 font-bold text-gray-800">Rp {t.total?.toLocaleString()}</td>
                              <td className="p-2 font-bold text-emerald-600">Rp {t.profit?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Tabel Pengeluaran Operasional (Fitur 1) */}
                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-gray-800 text-sm">Biaya Operasional Toko ({filteredExp.length})</h4>
                    <button
                      onClick={() => setShowExpenseModal(true)}
                      className="text-amber-700 hover:text-amber-800 font-bold text-xs flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah</span>
                    </button>
                  </div>
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    {filteredExp.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-6">Belum ada catatan biaya operasional.</p>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 font-bold text-gray-500 bg-gray-100">
                            <th className="p-2">Tanggal</th>
                            <th className="p-2">Kategori</th>
                            <th className="p-2">Catatan</th>
                            <th className="p-2">Nominal</th>
                            <th className="p-2 text-center">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredExp.map(e => (
                            <tr key={e.id} className="hover:bg-white">
                              <td className="p-2 text-gray-600">{e.date}</td>
                              <td className="p-2"><span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">{e.category}</span></td>
                              <td className="p-2 text-gray-700">{e.note}</td>
                              <td className="p-2 font-bold text-red-600">Rp {e.amount?.toLocaleString()}</td>
                              <td className="p-2 text-center">
                                <button
                                  onClick={() => handleDeleteExpense(e.id, e.note)}
                                  className="text-gray-400 hover:text-red-500 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mx-auto" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: PENGATURAN (Fitur 3: Tersimpan Permanen) */}
          {activeTab === 'settings' && currentUser?.role === 'Pemilik Warung' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6 max-w-2xl">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Pengaturan Aplikasi Warung</h3>
                <p className="text-xs text-gray-500">Sesuaikan profil warung, cetak struk, dan manajemen data toko Anda.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Warung</label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Alamat Warung</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Nomor WhatsApp / Telp</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Ukuran Kertas Printer Struk</label>
                  <select
                    value={settings.printerType}
                    onChange={(e) => setSettings({ ...settings, printerType: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="58mm">Printer Kasir 58mm (Thermal Portable / Bluetooth)</option>
                    <option value="80mm">Printer Kasir 80mm (Thermal Desktop Standar)</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    localStorage.setItem('warung_digital_settings', JSON.stringify(settings));
                    alert("Pengaturan profil warung berhasil disimpan permanen!");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow transition flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan Permanen</span>
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL STRUK / NOTA PEMBELIAN */}
      {showReceiptModal && lastReceipt && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div id="printable-receipt" className="text-center space-y-2 border-b border-dashed border-gray-300 pb-4">
              <div className="flex justify-center mb-2">
                <Logo size="w-14 h-14" />
              </div>
              <h3 className="font-bold text-lg text-gray-800">{settings.name}</h3>
              <p className="text-xs text-gray-500">{settings.address}</p>
              <p className="text-xs text-gray-500">Telp: {settings.phone}</p>
              <div className="text-left text-xs text-gray-600 pt-2 border-t border-gray-100">
                <p>No. Trx: {lastReceipt.id}</p>
                <p>Waktu: {lastReceipt.date}</p>
                <p>Metode: {lastReceipt.method}</p>
                <p>Pelanggan: {lastReceipt.customer}</p>
              </div>

              <div className="border-t border-dashed border-gray-300 pt-2 text-left space-y-1">
                {lastReceipt.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span>{item.name} x{item.qty}</span>
                    <span className="font-semibold">Rp {(item.sellPrice * item.qty).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-gray-300 pt-2 text-sm font-bold flex justify-between text-gray-800">
                <span>Total Belanja</span>
                <span className="text-emerald-700">Rp {lastReceipt.total.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center space-x-2 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Struk</span>
              </button>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-4 py-2.5 rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PELANGGAN / UTANG BARU */}
      {showAddDebtModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
              <h3 className="font-bold text-gray-800 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <span>Tambah Pelanggan / Catatan Utang</span>
              </h3>
              <button onClick={() => setShowAddDebtModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDebtCustomer} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Pelanggan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ibu Siti, Pak Joko"
                  value={newDebtForm.name}
                  onChange={(e) => setNewDebtForm({ ...newDebtForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890 (untuk tombol WA)"
                  value={newDebtForm.phone}
                  onChange={(e) => setNewDebtForm({ ...newDebtForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Jumlah Utang Awal (Rp)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 jika belum ada utang"
                  value={newDebtForm.amount}
                  onChange={(e) => setNewDebtForm({ ...newDebtForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Kasbon belanja sembako, Pinjaman tunai"
                  value={newDebtForm.note}
                  onChange={(e) => setNewDebtForm({ ...newDebtForm, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddDebtModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CATAT PEMBELIAN STOK MASUK */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
              <h3 className="font-bold text-gray-800 flex items-center space-x-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <span>Catat Pembelian Barang (Stok Masuk)</span>
              </h3>
              <button onClick={() => setShowPurchaseModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Pilih Produk Yang Dibeli *</label>
                <select
                  required
                  value={purchaseForm.productId}
                  onChange={(e) => handleSelectProductForPurchase(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  <option value="">-- Pilih Produk dari Katalog --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stok saat ini: {p.stock} {p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Supplier / Pemasok</label>
                  <input
                    type="text"
                    placeholder="Contoh: Agen Grosir Makmur"
                    value={purchaseForm.supplier}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Masuk</label>
                  <input
                    type="date"
                    value={purchaseForm.date}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Jumlah Masuk (Qty) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 10"
                    value={purchaseForm.qty}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, qty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Harga Kulak / Beli Satuan (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Contoh: 50000"
                    value={purchaseForm.buyPrice}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, buyPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Metode Pembayaran</label>
                <select
                  value={purchaseForm.method}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, method: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Cash">Tunai / Cash</option>
                  <option value="Transfer">Transfer Bank</option>
                  <option value="Tempo / Utang">Tempo / Utang ke Supplier</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="updateBuyPrice"
                  checked={purchaseForm.updateBuyPrice}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, updateBuyPrice: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                />
                <label htmlFor="updateBuyPrice" className="text-xs text-gray-600">
                  Perbarui harga kulak dasar produk di master data produk
                </label>
              </div>

              {/* Kalkulasi Ringkasan Total */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-sm">
                <span className="text-emerald-800 font-medium">Total Pembelian:</span>
                <span className="text-emerald-900 font-bold text-base">
                  Rp {(Number(purchaseForm.qty || 0) * Number(purchaseForm.buyPrice || 0)).toLocaleString()}
                </span>
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md"
                >
                  Simpan & Tambah Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CATAT BIAYA OPERASIONAL (PENGELUARAN - FITUR 1) */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
              <h3 className="font-bold text-gray-800 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-amber-600" />
                <span>Catat Biaya Pengeluaran Operasional</span>
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kategori Pengeluaran *</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  <option value="Listrik & Air">Token Listrik & Air PDAM</option>
                  <option value="Transportasi & Bensin">Bensin / Transportasi Ambil Barang</option>
                  <option value="Plastik & Perlengkapan">Kantong Plastik Kresek & Nota</option>
                  <option value="Gaji Karyawan">Gaji Karyawan / Uang Makan</option>
                  <option value="Sewa Tempat">Sewa Toko / Retribusi Kebersihan</option>
                  <option value="Perbaikan & Renovasi">Perbaikan & Pemeliharaan Warung</option>
                  <option value="Lain-lain">Pengeluaran Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nominal Biaya (Rp) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 50000"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Pengeluaran</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Keterangan / Catatan Tambahan</label>
                <input
                  type="text"
                  placeholder="Contoh: Beli token listrik 100rb, Kresek 5 ikat"
                  value={expenseForm.note}
                  onChange={(e) => setExpenseForm({ ...expenseForm, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-md"
                >
                  Simpan Pengeluaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}