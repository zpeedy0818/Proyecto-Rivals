import { useState } from 'react'
import { authService } from './services/authService'

export default function LoginPage({ onLogin }) {
    const [isRegister, setIsRegister] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')
        try {
            if (isRegister) {
                await authService.signUp(email, password)
                setSuccess('¡Cuenta creada! Revisa tu email para confirmarla, luego inicia sesión.')
                setIsRegister(false)
            } else {
                const data = await authService.signIn(email, password)
                onLogin(data.session)
            }
        } catch (err) {
            setError(err.message || 'Error desconocido')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div className="glass" style={{
                width: '100%',
                maxWidth: '420px',
                padding: '3rem 2.5rem',
                textAlign: 'center'
            }}>
                {/* Logo / Brand */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        border: '2px solid var(--primary)',
                        background: 'rgba(0,212,255,0.08)',
                        marginBottom: '1.5rem',
                        boxShadow: '0 0 30px rgba(0,212,255,0.2)'
                    }}>
                        <span style={{ fontSize: '2.5rem' }}>⚡</span>
                    </div>
                    <h2 style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>
                        {isRegister ? 'CREAR CUENTA' : 'INICIAR SESIÓN'}
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.15em' }}>
                        RIVALS ACCOUNT MANAGER
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.2rem' }}>
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="glass form-input"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            style={{ borderRadius: '0.75rem' }}
                        />
                    </div>

                    <div className="form-group" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            className="glass form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            style={{ borderRadius: '0.75rem' }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(255, 68, 68, 0.1)',
                            border: '1px solid var(--danger)',
                            borderRadius: '0.5rem',
                            padding: '0.75rem 1rem',
                            color: 'var(--danger)',
                            fontSize: '0.85rem',
                            marginBottom: '1rem'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            background: 'rgba(0, 255, 136, 0.1)',
                            border: '1px solid var(--success)',
                            borderRadius: '0.5rem',
                            padding: '0.75rem 1rem',
                            color: 'var(--success)',
                            fontSize: '0.85rem',
                            marginBottom: '1rem'
                        }}>
                            ✅ {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', justifyContent: 'center', marginBottom: '1rem' }}
                    >
                        {loading ? '⌛ Procesando...' : isRegister ? 'Crear cuenta' : 'Entrar'}
                    </button>
                </form>

                <button
                    onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess('') }}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        cursor: 'pointer',
                        fontSize: '0.88rem',
                        textDecoration: 'underline',
                        fontFamily: 'Inter, sans-serif'
                    }}
                >
                    {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿Nuevo? Crea una cuenta'}
                </button>
            </div>
        </div>
    )
}
