"use client"
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
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

  // --- NUEVA FUNCIÓN: ELIMINAR ---
  async function eliminarTarea(id: number) {
    // 1. Le decimos a Supabase que borre la fila donde el id coincida
    const { error } = await supabase.from('tareas').delete().eq('id', id)
    
    if (error) {
      console.log("Error al eliminar:", error)
    } else {
      // 2. Si se borra en la base de datos, la quitamos de nuestra pantalla
      setTareas(tareas.filter((tarea) => tarea.id !== id))
    }
  }

  // --- NUEVA FUNCIÓN: ACTUALIZAR (COMPLETAR) ---
  async function toggleCompletada(id: number, estadoActual: boolean) {
    // 1. Le decimos a Supabase que invierta el estado (si era true, pasa a false y viceversa)
    const { error } = await supabase.from('tareas').update({ completada: !estadoActual }).eq('id', id)
    
    if (error) {
      console.log("Error al actualizar:", error)
    } else {
      // 2. Actualizamos la pantalla para reflejar el cambio
      setTareas(tareas.map((tarea) => 
        tarea.id === id ? { ...tarea, completada: !estadoActual } : tarea
      ))
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px' }}>
      <h1>Mi Gestor de Tareas</h1>
      
      <form onSubmit={agregarTarea} style={{ marginBottom: '2rem' }}>
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
          <li key={tarea.id} style={{ 
            padding: '0.8rem', 
            borderBottom: '1px solid #ddd',
            display: 'flex',
            justifyContent: 'space-between', // Separa el texto del botón
            alignItems: 'center'
          }}>
            
            {/* Texto de la tarea que se puede hacer clic para tachar */}
            <span 
              onClick={() => toggleCompletada(tarea.id, tarea.completada)}
              style={{ 
                cursor: 'pointer', 
                textDecoration: tarea.completada ? 'line-through' : 'none',
                color: tarea.completada ? 'gray' : 'inherit'
              }}
            >
              {tarea.completada ? '✅' : '⏳'} {tarea.titulo}
            </span>

            {/* Botón rojo de borrar */}
            <button 
              onClick={() => eliminarTarea(tarea.id)}
              style={{ 
                padding: '0.3rem 0.6rem', 
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