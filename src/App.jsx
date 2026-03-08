import { useState, useEffect } from 'react'
import { sheetsService } from './services/sheetsService'
import { eldoradoService } from './services/eldoradoService'
import { rivalsService } from './services/rivalsService'

const initialAccounts = [
  { id: '001', usuario_cuenta: 'Zpeedtag01', email: 'Zpeedtag01@gmail.com', contraseña: '', nivel: 1, estado: 'Subiendo', precio_usd: 5, plataforma: 'PC', fecha_creacion: '2026-03-08', notas: '', stats: null },
  { id: '002', usuario_cuenta: 'RivalNova02', email: 'rivalnova02@gmail.com', contraseña: '', nivel: 1, estado: 'Subiendo', precio_usd: 0, plataforma: 'PC', fecha_creacion: '2026-03-08', notas: '', stats: null },
  { id: '003', usuario_cuenta: 'RivalNova03', email: 'rivalnova03@gmail.com', contraseña: '', nivel: 1, estado: 'Subiendo', precio_usd: 0, plataforma: 'PC', fecha_creacion: '2026-03-08', notas: '', stats: null },
  { id: '004', usuario_cuenta: 'RivalNova04', email: 'rivalnova04@gmail.com', contraseña: '', nivel: 1, estado: 'Subiendo', precio_usd: 0, plataforma: 'PC', fecha_creacion: '2026-03-08', notas: '', stats: null },
]

function App() {
  const [accounts, setAccounts] = useState(() => {
    const saved = localStorage.getItem('marvel_accounts')
    return saved ? JSON.parse(saved) : initialAccounts
  })

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('marvel_settings')
    return saved ? JSON.parse(saved) : { sheetsUrl: '', eldoradoKey: '', rivalsKey: '' }
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const [formData, setFormData] = useState({
    id: '', usuario_cuenta: '', email: '', contraseña: '', nivel: 1, estado: 'Subiendo', precio_usd: 0, plataforma: 'PC', notas: ''
  })

  useEffect(() => {
    localStorage.setItem('marvel_accounts', JSON.stringify(accounts))
  }, [accounts])

  useEffect(() => {
    localStorage.setItem('marvel_settings', JSON.stringify(settings))
  }, [settings])

  const openModal = (acc = null) => {
    if (acc) {
      setEditingAccount(acc)
      setFormData(acc)
    } else {
      setEditingAccount(null)
      setFormData({
        id: String(accounts.length + 1).padStart(3, '0'),
        usuario_cuenta: '', email: '', contraseña: '', nivel: 1, estado: 'Subiendo', precio_usd: 0, plataforma: 'PC', notas: ''
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
    // Sync to Sheets if URL is present
    if (settings.sheetsUrl) {
      try {
        await sheetsService.upsertAccount(settings.sheetsUrl, formData)
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
          stats: data.stats
        };
        const newAccounts = accounts.map(a => a.id === account.id ? updatedAccount : a);
        setAccounts(newAccounts);

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
      if (settings.sheetsUrl) {
        const remoteData = await sheetsService.fetchData(settings.sheetsUrl)
        if (remoteData && remoteData.length > 0) {
          // Normalizing headers just in case
          const mappedData = remoteData.map(item => ({
            id: item.id || '',
            usuario_cuenta: item.usuario_cuenta || '',
            email: item.email || '',
            contraseña: item.contraseña || '',
            nivel: parseInt(item.nivel) || 1,
            estado: item.estado || 'Subiendo',
            precio_usd: parseFloat(item.precio_usd) || 0,
            plataforma: item.plataforma || 'PC',
            fecha_creacion: item.fecha_creacion || '',
            notas: item.notas || ''
          })).filter(a => a.id)
          setAccounts(mappedData)
        }
      }

      if (settings.eldoradoKey) {
        await eldoradoService.checkOrders(settings.eldoradoKey)
        alert(`Eldorado: Sincronización real completada. Consultadas órdenes para el vendedor.`)
      } else {
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
      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Marvel Rivals Accounts</h1>
          <p style={{ color: 'var(--text-muted)' }}>Gestión profesional de cuentas de nivel 15</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
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
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <div className="glass" style={{ padding: '1rem 2rem', flex: 1 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total Cuentas</p>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--secondary)' }}>{accounts.length}</h3>
          </div>
          <div className="glass" style={{ padding: '1rem 2rem', flex: 1 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Subiendo</p>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--warning)' }}>{accounts.filter(a => a.estado === 'Subiendo').length}</h3>
          </div>
          <div className="glass" style={{ padding: '1rem 2rem', flex: 1 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Vendidas</p>
            <h3 style={{ fontSize: '1.5rem', color: 'var(--success)' }}>{accounts.filter(a => a.estado === 'Vendido').length}</h3>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {acc.usuario_cuenta || <span style={{ color: 'var(--text-muted)' }}>-</span>}
                      {acc.usuario_cuenta && (
                        <button
                          onClick={() => handleFetchStats(acc)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--secondary)', opacity: 0.7 }}
                          title="Consultar stats reales"
                        >🔍</button>
                      )}
                      {acc.stats && (
                        <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem', background: 'rgba(52, 211, 153, 0.1)', color: 'var(--success)', borderRadius: '4px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>
                          WR: {acc.stats.winRate}
                        </span>
                      )}
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
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass" style={{ padding: '2.5rem', width: '500px', maxWidth: '90%' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingAccount ? 'Editar Cuenta' : 'Nueva Cuenta'}</h2>
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>ID</label>
                  <input className="glass" style={{ width: '100%', padding: '0.8rem', color: 'white' }}
                    value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Usuario</label>
                    <button type="button" onClick={generateUsername} style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}>
                      ⚡ Sugerir
                    </button>
                  </div>
                  <input className="glass" style={{ width: '100%', padding: '0.8rem', color: 'white' }}
                    value={formData.usuario_cuenta} onChange={e => setFormData({ ...formData, usuario_cuenta: e.target.value })} />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Email</label>
                <input className="glass" style={{ width: '100%', padding: '0.8rem', color: 'white' }}
                  value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Contraseña</label>
                  <button type="button" onClick={generatePassword} style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 'card-bold' }}>
                    ⚡ Generar Segura
                  </button>
                </div>
                <input className="glass" style={{ width: '100%', padding: '0.8rem', color: 'white' }}
                  value={formData.contraseña} onChange={e => setFormData({ ...formData, contraseña: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nivel (1-15)</label>
                  <input type="number" min="1" max="15" className="glass" style={{ width: '100%', padding: '0.8rem', color: 'white' }}
                    value={formData.nivel} onChange={e => setFormData({ ...formData, nivel: parseInt(e.target.value) })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Precio (USD)</label>
                  <input type="number" className="glass" style={{ width: '100%', padding: '0.8rem', color: 'white' }}
                    value={formData.precio_usd} onChange={e => setFormData({ ...formData, precio_usd: parseFloat(e.target.value) })} />
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Estado</label>
                <select className="glass" style={{ width: '100%', padding: '0.8rem', color: 'white', background: '#1e293b' }}
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
            <h2 style={{ marginBottom: '1.5rem' }}>Configuración de Integraciones</h2>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>URL de Google Apps Script</label>
              <input className="glass" style={{ width: '100%', padding: '0.8rem', color: 'white' }}
                placeholder="https://script.google.com/macros/s/.../exec"
                value={settings.sheetsUrl} onChange={e => setSettings({ ...settings, sheetsUrl: e.target.value })} />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Obligatorio para sincronización con Sheets.</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Eldorado.gg API Key (Seller)</label>
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

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setIsSettingsOpen(false)}>Cerrar y Guardar</button>
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
