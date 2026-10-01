"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [usuario, setUsuario] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargandoAuth, setCargandoAuth] = useState(true)

  const [tareas, setTareas] = useState<any[]>([])
  const [nuevaTarea, setNuevaTarea] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null)
      setCargandoAuth(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUsuario(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (usuario) obtenerTareas()
    else setTareas([])
  }, [usuario])

  async function registrar(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert("Error: " + error.message)
    else { alert("¡Registro exitoso!"); setPassword(''); }
  }

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert("Credenciales incorrectas")
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  async function obtenerTareas() {
    let { data } = await supabase.from('tareas').select('*').order('id', { ascending: true })
    if (data) setTareas(data)
  }

  async function agregarTarea(e: React.FormEvent) {
    e.preventDefault()
    const { data, error } = await supabase.from('tareas').insert([{ titulo: nuevaTarea, user_id: usuario.id }]).select()
    if (!error && data) {
      setTareas([...tareas, data[0]]) 
      setNuevaTarea('') 
    }
  }

  async function eliminarTarea(id: number) {
    const { error } = await supabase.from('tareas').delete().eq('id', id)
    if (!error) setTareas(tareas.filter((t) => t.id !== id))
  }

  async function toggleCompletada(id: number, estadoActual: boolean) {
    const { error } = await supabase.from('tareas').update({ completada: !estadoActual }).eq('id', id)
    if (!error) {
      setTareas(tareas.map((t) => t.id === id ? { ...t, completada: !estadoActual } : t))
    }
  }

  if (cargandoAuth) return <div>Cargando sistema...</div>

  // PANTALLA 1: LOGIN
  if (!usuario) {
    return (
      <div className="contenedor">
        <h2>Bienvenido 👋</h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>Inicia sesión o crea una cuenta.</p>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Contraseña (mínimo 6 letras)" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={iniciarSesion} className="btn-azul" style={{ flex: 1 }}>Entrar</button>
            <button type="button" onClick={registrar} className="btn-oscuro" style={{ flex: 1 }}>Registrarse</button>
          </div>
        </form>
      </div>
    )
  }

  // PANTALLA 2: APLICACIÓN
  return (
    <div className="contenedor">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h1>Mis Tareas</h1>
        <button onClick={cerrarSesion} className="btn-oscuro" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Salir</button>
      </div>
      
      <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '2rem', marginTop: '-0.5rem' }}>
        {usuario.email}
      </p>
      
      <form onSubmit={agregarTarea} style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        <input type="text" value={nuevaTarea} onChange={(e) => setNuevaTarea(e.target.value)} placeholder="¿Qué necesitas hacer hoy?" required />
        <button type="submit" className="btn-azul">Añadir</button>
      </form>

      <ul>
        {tareas.map((tarea: any) => (
          <li key={tarea.id}>
            <span 
              onClick={() => toggleCompletada(tarea.id, tarea.completada)}
              style={{ cursor: 'pointer', textDecoration: tarea.completada ? 'line-through' : 'none', color: tarea.completada ? '#9ca3af' : 'inherit', flex: 1 }}
            >
              {tarea.completada ? '✅ ' : '⏳ '} {tarea.titulo}
            </span>
            <button onClick={() => eliminarTarea(tarea.id)} className="btn-rojo">Borrar</button>
          </li>
        ))}
      </ul>
    </div>
  )
}