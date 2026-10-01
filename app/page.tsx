"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  // --- ESTADOS DE USUARIO ---
  const [usuario, setUsuario] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargandoAuth, setCargandoAuth] = useState(true)

  // --- ESTADOS DE TAREAS ---
  const [tareas, setTareas] = useState<any[]>([])
  const [nuevaTarea, setNuevaTarea] = useState('')

  // 1. Escuchar la sesión del usuario al cargar la página
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

  // 2. Cargar tareas SOLO si hay un usuario logueado
  useEffect(() => {
    if (usuario) obtenerTareas()
    else setTareas([]) // Limpiar pantalla si cierra sesión
  }, [usuario])

  // --- FUNCIONES DE AUTENTICACIÓN ---
  async function registrar(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert("Error al registrar: " + error.message)
    else {
      alert("¡Registro exitoso! Ya puedes iniciar sesión.")
      setPassword('')
    }
  }

  async function iniciarSesion(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert("Error al iniciar sesión: Credenciales incorrectas")
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
  }

  // --- FUNCIONES DE TAREAS ---
  async function obtenerTareas() {
    let { data, error } = await supabase.from('tareas').select('*').order('id', { ascending: true })
    if (error) console.log("Error al cargar:", error)
    else if (data) setTareas(data)
  }

  async function agregarTarea(e: React.FormEvent) {
    e.preventDefault()
    // IMPORTANTE: Ahora incluimos 'user_id' para decirle a la base de datos de quién es la tarea
    const { data, error } = await supabase.from('tareas').insert([
      { titulo: nuevaTarea, user_id: usuario.id }
    ]).select()
    
    if (error) console.log("Error al agregar:", error)
    else if (data) {
      setTareas([...tareas, data[0]]) 
      setNuevaTarea('') 
    }
  }

  async function eliminarTarea(id: number) {
    const { error } = await supabase.from('tareas').delete().eq('id', id)
    if (!error) setTareas(tareas.filter((tarea) => tarea.id !== id))
  }

  async function toggleCompletada(id: number, estadoActual: boolean) {
    const { error } = await supabase.from('tareas').update({ completada: !estadoActual }).eq('id', id)
    if (!error) {
      setTareas(tareas.map((tarea) => 
        tarea.id === id ? { ...tarea, completada: !estadoActual } : tarea
      ))
    }
  }

  // --- PANTALLAS ---
  
  if (cargandoAuth) return <div style={{ padding: '2rem' }}>Cargando sistema...</div>

  // PANTALLA 1: LOGIN (Si el usuario no ha iniciado sesión)
  if (!usuario) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '400px', margin: '0 auto' }}>
        <h2>Inicia Sesión</h2>
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
          <input 
            type="email" 
            placeholder="Tu correo de prueba" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '0.8rem', color: 'black', borderRadius: '4px', border: '1px solid #ccc' }}
            required
          />
          <input 
            type="password" 
            placeholder="Contraseña (mínimo 6 letras)" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '0.8rem', color: 'black', borderRadius: '4px', border: '1px solid #ccc' }}
            required
          />
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button onClick={iniciarSesion} style={{ padding: '0.8rem', cursor: 'pointer', flex: 1, backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px' }}>Entrar</button>
            <button onClick={registrar} style={{ padding: '0.8rem', cursor: 'pointer', flex: 1, backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px' }}>Registrarse</button>
          </div>
        </form>
      </div>
    )
  }

  // PANTALLA 2: APLICACIÓN (Si el usuario inició sesión correctamente)
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Mis Tareas</h1>
        <button onClick={cerrarSesion} style={{ padding: '0.5rem 1rem', cursor: 'pointer', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px' }}>Cerrar Sesión</button>
      </div>
      
      <p style={{ marginBottom: '2rem', fontSize: '0.9rem', color: '#666' }}>
        Conectado como: <strong>{usuario.email}</strong>
      </p>
      
      <form onSubmit={agregarTarea} style={{ marginBottom: '2rem', display: 'flex' }}>
        <input
          type="text"
          value={nuevaTarea}
          onChange={(e) => setNuevaTarea(e.target.value)}
          placeholder="Escribe una nueva tarea..."
          required
          style={{ padding: '0.8rem', marginRight: '0.5rem', flex: 1, color: 'black', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button type="submit" style={{ padding: '0.8rem 1.5rem', cursor: 'pointer', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px' }}>Añadir</button>
      </form>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {tareas.map((tarea: any) => (
          <li key={tarea.id} style={{ 
            padding: '1rem', 
            borderBottom: '1px solid #ddd',
            display: 'flex',
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <span 
              onClick={() => toggleCompletada(tarea.id, tarea.completada)}
              style={{ 
                cursor: 'pointer', 
                textDecoration: tarea.completada ? 'line-through' : 'none',
                color: tarea.completada ? 'gray' : 'inherit',
                flex: 1
              }}
            >
              {tarea.completada ? '✅ ' : '⏳ '} {tarea.titulo}
            </span>
            <button 
              onClick={() => eliminarTarea(tarea.id)}
              style={{ 
                padding: '0.4rem 0.8rem', 
                backgroundColor: '#ff4d4d', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Borrar
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}