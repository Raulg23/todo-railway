"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  // Le decimos a TypeScript que 'tareas' será un arreglo de cualquier tipo por ahora
  const [tareas, setTareas] = useState<any[]>([])
  const [nuevaTarea, setNuevaTarea] = useState('')

  useEffect(() => {
    obtenerTareas()
  }, [])

  async function obtenerTareas() {
    let { data, error } = await supabase.from('tareas').select('*').order('id', { ascending: true })
    if (error) console.log("Error al cargar:", error)
    else if (data) setTareas(data)
  }

  async function agregarTarea(e: React.FormEvent) {
    e.preventDefault()
    const { data, error } = await supabase.from('tareas').insert([{ titulo: nuevaTarea }]).select()
    
    if (error) {
      console.log("Error al agregar:", error)
    } else if (data) {
      setTareas([...tareas, data[0]]) 
      setNuevaTarea('') 
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Mi Gestor de Tareas</h1>
      
      <form onSubmit={agregarTarea} style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={nuevaTarea}
          onChange={(e) => setNuevaTarea(e.target.value)}
          placeholder="Escribe una nueva tarea..."
          required
          style={{ padding: '0.5rem', marginRight: '0.5rem', width: '250px', color: 'black' }}
        />
        <button type="submit" style={{ padding: '0.5rem', cursor: 'pointer' }}>Añadir</button>
      </form>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {tareas.map((tarea: any) => (
          <li key={tarea.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #333' }}>
            {tarea.titulo} {tarea.completada ? '✅' : '⏳'}
          </li>
        ))}
      </ul>
    </div>
  )
}