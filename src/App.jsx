import { useState, useEffect } from 'react'
import { sheetsService } from './services/sheetsService'
import { eldoradoService } from './services/eldoradoService'
import { rivalsService } from './services/rivalsService'
import { supabaseService } from './services/supabaseService'

const RANK_TIERS = [
  { name: 'Unranked', color: '#94a3b8', icon: '❓' },
  { name: 'Bronce', color: '#cd7f32', icon: '🥉' },
  { name: 'Plata', color: '#c0c0c0', icon: '🥈' },
  { name: 'Oro', color: '#ffd700', icon: '🥇' },
  { name: 'Platino', color: '#e5e4e2', icon: '💎' },
  { name: 'Diamante', color: '#b9f2ff', icon: '💠' },
  { name: 'Gran Maestro', color: '#ff4d4d', icon: '🏮' },
  { name: 'Celestial', color: '#a855f7', icon: '✨' },
  { name: 'Eternity', color: '#3b82f6', icon: '🌌' },
  { name: 'One Above All', color: '#facc15', icon: '👑' }
]

const initialAccounts = [
  { id: '001', usuario_cuenta: 'Zpeedtag01', email: 'Zpeedtag01@gmail.com', contraseña: '', nivel: 1, rango: 'Unranked', division: '', estado: 'Subiendo', precio_usd: 5, plataforma: 'PC', fecha_creacion: '2026-03-08', notas: '', stats: null },
  { id: '002', usuario_cuenta: 'RivalNova02', email: 'rivalnova02@gmail.com', contraseña: '', nivel: 1, rango: 'Unranked', division: '', estado: 'Subiendo', precio_usd: 0, plataforma: 'PC', fecha_creacion: '2026-03-08', notas: '', stats: null },
]

function App() {
  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem('marvel_accounts')
    return saved ? JSON.parse(saved) : initialAccounts
  })

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('marvel_settings')
    return saved ? JSON.parse(saved) : {
      sheetsUrl: '',
      eldoradoKey: '',
      rivalsKey: '',
      supabaseUrl: '',
      supabaseKey: ''
    }
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const [formData, setFormData] = useState({
    id: '', usuario_cuenta: '', email: '', contraseña: '', nivel: 1, rango: 'Unranked', division: '', estado: 'Subiendo', precio_usd: 0, plataforma: 'PC', notas: ''
  })

  useEffect(() => {
    localStorage.setItem('marvel_accounts', JSON.stringify(accounts))
  }, [accounts])

  useEffect(() => {
    localStorage.setItem('marvel_settings', JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    if (settings.supabaseUrl && settings.supabaseKey) {
      supabaseService.init(settings.supabaseUrl, settings.supabaseKey)
    }
  }, [settings.supabaseUrl, settings.supabaseKey])

  useEffect(() => {
    // Cross-device sync: If we have a URL but no accounts, try to fetch immediately
    if (settings.sheetsUrl && (accounts.length === 0 || accounts.length === initialAccounts.length)) {
      syncAll()
    }
  }, [])

  const openModal = (acc = null) => {
    if (acc) {
      setEditingAccount(acc)
      setFormData({
        ...acc,
        rango: acc.rango || 'Unranked',
        division: acc.division || ''
      })
    } else {
      setEditingAccount(null)
      setFormData({
        id: String(accounts.length + 1).padStart(3, '0'),
        usuario_cuenta: '', email: '', contraseña: '', nivel: 1,
        rango: 'Unranked', division: '',
        estado: 'Subiendo', precio_usd: 0, plataforma: 'PC', notas: ''
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    let newAccounts
    if (editingAccount) {
      newAccounts = accounts.map(a => a.id === editingAccount.id ? formData : a)
    } else {
      newAccounts = [...accounts, { ...formData, fecha_creacion: new Date().toISOString().split('T')[0] }]
    }
    setAccounts(newAccounts)
    setIsModalOpen(false)

    const accountToSave = {
      ...formData,
      fecha_creacion: formData.fecha_creacion || new Date().toISOString().split('T')[0]
    }

    // Sync to Supabase (Priority)
    if (settings.supabaseUrl && settings.supabaseKey) {
      try {
        await supabaseService.upsertAccount(accountToSave)
      } catch (err) {
        console.error("Supabase sync failed on save")
      }
    }

    // Sync to Sheets
    if (settings.sheetsUrl) {
      try {
        await sheetsService.upsertAccount(settings.sheetsUrl, accountToSave)
      } catch (err) {
        console.error("Sheets sync failed on save")
      }
    }
  }

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, contraseña: password });
  }

  const generateUsername = () => {
    const prefixes = ['Iron', 'Spider', 'Hulk', 'Thanos', 'Nova', 'Rival', 'Super', 'Hyper', 'Nexus', 'Cosmic', 'Shadow', 'Eternal'];
    const suffixes = ['Striker', 'Nova', 'Core', 'Agent', 'Prime', 'Soul', 'Pulse', 'Edge', 'Lord', 'King', 'Queen', 'Knight'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const number = Math.floor(Math.random() * 99) + 1;
    const username = `${prefix}${suffix}${String(number).padStart(2, '0')}`;
    setFormData({ ...formData, usuario_cuenta: username });
  }

  const handleQuickLevelUpdate = async (account, increment) => {
    const newLevel = Math.min(Math.max(account.nivel + increment, 1), 15);
    if (newLevel === account.nivel) return;

    const updatedAccount = { ...account, nivel: newLevel };
    const newAccounts = accounts.map(a => a.id === account.id ? updatedAccount : a);
    setAccounts(newAccounts);

    if (settings.supabaseUrl && settings.supabaseKey) {
      try {
        await supabaseService.upsertAccount(updatedAccount);
      } catch (err) {
        console.error("Supabase quick level update failed");
      }
    }

    if (settings.sheetsUrl) {
      try {
        await sheetsService.upsertAccount(settings.sheetsUrl, updatedAccount);
      } catch (err) {
        console.error("Quick level sync failed");
      }
    }
  }

  const handleFetchStats = async (account) => {
    if (!account.usuario_cuenta) {
      alert("La cuenta no tiene un nombre de usuario asignado.");
      return;
    }

    try {
      const data = await rivalsService.fetchPlayerStats(account.usuario_cuenta, settings.rivalsKey);
      if (data) {
        const updatedAccount = {
          ...account,
          nivel: data.level,
          rango: data.rank || account.rango,
          division: data.tier || account.division,
          stats: data.stats
        };
        const newAccounts = accounts.map(a => a.id === account.id ? updatedAccount : a);
        setAccounts(newAccounts);

        if (settings.supabaseUrl && settings.supabaseKey) {
          await supabaseService.upsertAccount(updatedAccount);
        }

        if (settings.sheetsUrl) {
          await sheetsService.upsertAccount(settings.sheetsUrl, updatedAccount);
        }

        alert(`Stats actualizadas para ${account.usuario_cuenta}:\nNivel: ${data.level}\nWin Rate: ${data.stats.winRate}`);
      }
    } catch (err) {
      alert(`Error al buscar stats: El jugador no existe o su perfil es privado.`);
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres borrar esta cuenta?')) return

    const newAccounts = accounts.filter(a => a.id !== id)
    setAccounts(newAccounts)

    // Sync deletion to Supabase
    if (settings.supabaseUrl && settings.supabaseKey) {
      try {
        await supabaseService.deleteAccount(id)
      } catch (err) {
        console.error("Supabase delete failed")
      }
    }

    // Sync deletion to Sheets
    if (settings.sheetsUrl) {
      try {
        await sheetsService.deleteAccount(settings.sheetsUrl, id)
      } catch (err) {
        console.error("Sheets delete failed")
      }
    }
  }

  const syncAll = async () => {
    setIsSyncing(true)
    try {
      // Try Supabase first (Modern, fast, real-time)
      if (settings.supabaseUrl && settings.supabaseKey) {
        const dbData = await supabaseService.getAccounts()
        if (dbData && dbData.length > 0) {
          setAccounts(dbData)
          alert('Sincronización con Supabase (DB) completada.')
          setIsSyncing(false)
          return
        }
      }

      // Fallback to Google Sheets
      if (settings.sheetsUrl) {
        const remoteData = await sheetsService.fetchData(settings.sheetsUrl)
        if (remoteData && remoteData.length > 0) {
          const dateNow = new Date().toISOString().split('T')[0]
          const mappedData = remoteData.map(item => ({
            id: item.id || '',
            usuario_cuenta: item.usuario_cuenta || '',
            email: item.email || '',
            contraseña: item.contraseña || '',
            nivel: parseInt(item.nivel) || 1,
            rango: item.rango || 'Unranked',
            division: item.division || '',
            estado: item.estado || 'Subiendo',
            precio_usd: parseFloat(item.precio_usd) || 0,
            plataforma: item.plataforma || 'PC',
            fecha_creacion: item.fecha_creacion && item.fecha_creacion !== "" ? item.fecha_creacion : dateNow,
            notas: item.notas || ''
          })).filter(a => a.id)
          setAccounts(mappedData)

          // Migration: If Supabase is connected but empty, migrate Sheets data
          if (settings.supabaseUrl && settings.supabaseKey) {
            for (const acc of mappedData) {
              await supabaseService.upsertAccount(acc)
            }
            alert('Datos de Sheets migrados a Supabase con éxito.')
          }
        }
      }

      if (settings.eldoradoKey) {
        await eldoradoService.checkOrders(settings.eldoradoKey)
        alert(`Eldorado: Sincronización real completada. Consultadas órdenes para el vendedor.`)
      } else if (!settings.supabaseUrl) {
        setTimeout(() => alert('Sincronización de Sheets completada.'), 1000)
      }
    } catch (err) {
      alert('Error en la sincronización: ' + err.message)
    } finally {
      setIsSyncing(false)
    }
  }

  const getStatusBadge = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'subiendo': return 'badge-subiendo';
      case 'vendido': return 'badge-vendido';
      default: return 'badge-pausado';
    }
  }

  return (
    <div className="container">
      <header className="main-header">
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Marvel Rivals Accounts</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión profesional de cuentas de nivel 15</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline" onClick={() => setIsSettingsOpen(true)}>
            ⚙️ Ajustes
          </button>
          <button className="btn btn-outline" onClick={syncAll} disabled={isSyncing}>
            {isSyncing ? 'Sincronizando...' : '🔄 Sincronizar Todo'}
          </button>
          <button className="btn btn-primary" onClick={() => openModal()}>
            <span>+</span> Nueva Cuenta
          </button>
        </div>
      </header>

      <div className="glass" style={{ padding: '1.5rem' }}>
        <div className="stats-grid">
          <div className="glass stat-card">
            <p className="stat-label">Total Cuentas</p>
            <h3 className="stat-value" style={{ color: 'var(--secondary)' }}>{accounts.length}</h3>
          </div>
          <div className="glass stat-card">
            <p className="stat-label">Subiendo</p>
            <h3 className="stat-value" style={{ color: 'var(--warning)' }}>{accounts.filter(a => a.estado === 'Subiendo').length}</h3>
          </div>
          <div className="glass stat-card">
            <p className="stat-label">Vendidas</p>
            <h3 className="stat-value" style={{ color: 'var(--success)' }}>{accounts.filter(a => a.estado === 'Vendido').length}</h3>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario / Rango</th>
                <th>Email</th>
                <th>Nivel</th>
                <th>Estado</th>
                <th>Precio (USD)</th>
                <th>Plataforma</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc, index) => (
                <tr key={acc.id || index}>
                  <td style={{ fontWeight: 600, color: 'var(--secondary)' }}>#{acc.id}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {acc.usuario_cuenta || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                        {acc.usuario_cuenta && (
                          <button
                            onClick={() => handleFetchStats(acc)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--secondary)', opacity: 0.7 }}
                            title="Consultar stats reales"
                          >🔍</button>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
                        <span style={{ color: RANK_TIERS.find(r => r.name === acc.rango)?.color || '#94a3b8' }}>
                          {RANK_TIERS.find(r => r.name === acc.rango)?.icon} {acc.rango} {acc.division}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>{acc.email}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <button
                        onClick={() => handleQuickLevelUpdate(acc, -1)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}
                      >-</button>
                      <span style={{ minWidth: '15px', textAlign: 'center' }}>{acc.nivel}</span>
                      <button
                        onClick={() => handleQuickLevelUpdate(acc, 1)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', borderRadius: '4px', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}
                      >+</button>
                      <div className="progress-bg" style={{ marginLeft: '0.4rem' }}>
                        <div className="progress-fill" style={{ width: `${(acc.nivel / 15) * 100}%` }}></div>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/15</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(acc.estado)}`}>
                      {acc.estado}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>${acc.precio_usd}</td>
                  <td>{acc.plataforma}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => openModal(acc)}>
                        Editar
                      </button>
                      <button className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', border: '1px solid var(--danger)', color: 'var(--danger)' }} onClick={() => handleDelete(acc.id)}>
                        Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mobile-cards">
          {accounts.map((acc, index) => (
            <div key={acc.id || index} className="glass card-mobile">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ color: 'var(--secondary)' }}>#{acc.id} {acc.usuario_cuenta}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                    <span style={{ color: RANK_TIERS.find(r => r.name === acc.rango)?.color || '#94a3b8' }}>
                      {RANK_TIERS.find(r => r.name === acc.rango)?.icon} {acc.rango} {acc.division}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{acc.email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${getStatusBadge(acc.estado)}`}>{acc.estado}</span>
                  {acc.stats && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--success)' }}>
                      WR: {acc.stats.winRate}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1 }}>Nivel de Cuenta</span>
                <button onClick={() => handleQuickLevelUpdate(acc, -1)} className="btn-outline" style={{ width: '32px', height: '32px', borderRadius: '8px', padding: 0, justifyContent: 'center' }}>-</button>
                <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{acc.nivel}</span>
                <button onClick={() => handleQuickLevelUpdate(acc, 1)} className="btn-outline" style={{ width: '32px', height: '32px', borderRadius: '8px', padding: 0, justifyContent: 'center' }}>+</button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-outline" style={{ flex: 1, fontSize: '0.8rem' }} onClick={() => openModal(acc)}>Editar</button>
                {acc.usuario_cuenta && (
                  <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => handleFetchStats(acc)}>🔍</button>
                )}
                <button className="btn btn-outline" style={{ border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: '0.8rem' }} onClick={() => handleDelete(acc.id)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass" style={{ padding: '2.5rem', width: '500px', maxWidth: '90%' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}</h2>
            <form onSubmit={handleSave}>
              <div className="modal-form-grid">
                <div className="form-group">
                  <label className="form-label">ID Cuenta</label>
                  <input className="glass form-input"
                    value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} />
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Usuario Juego</label>
                    <button type="button" className="btn-suggest" onClick={generateUsername}>⚡ Sugerir</button>
                  </div>
                  <input className="glass form-input"
                    placeholder="Ej: IronStriker99"
                    value={formData.usuario_cuenta} onChange={e => setFormData({ ...formData, usuario_cuenta: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email / Login</label>
                <input className="glass form-input"
                  placeholder="correo@ejemplo.com"
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Contraseña</label>
                  <button type="button" className="btn-suggest" onClick={generatePassword}>⚡ Generar</button>
                </div>
                <input className="glass form-input"
                  type="text"
                  value={formData.contraseña} onChange={e => setFormData({ ...formData, contraseña: e.target.value })} />
              </div>

              <div className="modal-form-grid">
                <div className="form-group">
                  <label className="form-label">Rango</label>
                  <select className="glass form-input"
                    value={formData.rango || 'Unranked'} onChange={e => setFormData({ ...formData, rango: e.target.value })}>
                    {RANK_TIERS.map(tier => (
                      <option key={tier.name} value={tier.name} style={{ background: '#1e293b' }}>
                        {tier.icon} {tier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">División</label>
                  <select className="glass form-input"
                    value={formData.division || ''} onChange={e => setFormData({ ...formData, division: e.target.value })}>
                    <option value="" style={{ background: '#1e293b' }}>N/A</option>
                    <option value="I" style={{ background: '#1e293b' }}>I</option>
                    <option value="II" style={{ background: '#1e293b' }}>II</option>
                    <option value="III" style={{ background: '#1e293b' }}>III</option>
                  </select>
                </div>
              </div>

              <div className="modal-form-grid">
                <div className="form-group">
                  <label className="form-label">Nivel (1-15)</label>
                  <input type="number" min="1" max="15" className="glass form-input"
                    value={formData.nivel} onChange={e => setFormData({ ...formData, nivel: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Precio (USD)</label>
                  <input type="number" className="glass form-input"
                    value={formData.precio_usd} onChange={e => setFormData({ ...formData, precio_usd: parseFloat(e.target.value) })} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Estado de Cuenta</label>
                <select className="glass form-input"
                  value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })}>
                  <option value="Subiendo">Subiendo</option>
                  <option value="Vendido">Vendido</option>
                  <option value="Pausado">Pausado</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110
        }}>
          <div className="glass" style={{ padding: '2.5rem', width: '600px', maxWidth: '90%' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginBottom: '0.5rem' }}>🌐 Sincronización en la Nube</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Copia tu URL de Google Sheets de tu PC y pégala aquí en tu teléfono para ver todas tus cuentas al instante.
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Tu LLAVE de Sincronización (URL de Apps Script)</label>
              <input className="glass" style={{ width: '100%', padding: '0.8rem', color: 'white' }}
                placeholder="https://script.google.com/macros/s/.../exec"
                value={settings.sheetsUrl} onChange={e => setSettings({ ...settings, sheetsUrl: e.target.value })} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Eldorado.gg API Key</label>
              <input type="password" className="glass" style={{ width: '100%', padding: '0.8rem', color: 'white' }}
                placeholder="Tu API Key de vendedor"
                value={settings.eldoradoKey} onChange={e => setSettings({ ...settings, eldoradoKey: e.target.value })} />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Usado para consultar estados de órdenes reales.</p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Marvel Rivals API Key (Opcional)</label>
              <input type="password" className="glass" style={{ width: '100%', padding: '0.8rem', color: 'white' }}
                placeholder="Tu x-api-key de MarvelRivalsAPI.com"
                value={settings.rivalsKey} onChange={e => setSettings({ ...settings, rivalsKey: e.target.value })} />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Obligatorio para buscar jugadores por nombre de forma fiable.</p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>📦 Base de Datos Principal (Supabase)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <input className="glass" style={{ width: '100%', padding: '0.8rem', color: 'white' }}
                  placeholder="Supabase Project URL"
                  value={settings.supabaseUrl} onChange={e => setSettings({ ...settings, supabaseUrl: e.target.value })} />
                <input type="password" className="glass" style={{ width: '100%', padding: '0.8rem', color: 'white' }}
                  placeholder="Supabase Anon Key"
                  value={settings.supabaseKey} onChange={e => setSettings({ ...settings, supabaseKey: e.target.value })} />
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Recomendado para sincronización instantánea y apps de producción.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => {
                setIsSettingsOpen(false);
                syncAll();
              }}>Cerrar y Guardar</button>
            </div>
          </div>
        </div>
      )}

      <footer style={{ marginTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <p>© 2026 Marvel Rivals Account Manager • Conectado con Google Sheets & Eldorado.gg</p>
      </footer>
    </div>
  )
}

export default App
