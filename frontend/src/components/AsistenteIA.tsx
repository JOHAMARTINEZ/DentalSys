import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'

import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Drawer from '@mui/material/Drawer'
import Fab from '@mui/material/Fab'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded'
import DoneRoundedIcon from '@mui/icons-material/DoneRounded'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import SendRoundedIcon from '@mui/icons-material/SendRounded'

import { apiGet, apiPost, getNombreSesion, getRol, mensajeError } from '../services/api'
import type { Rol } from '../services/api'

/* =========================================================
   ASISTENTE DE IA (Gemini) PARA EL PERSONAL
   - Botón flotante en todas las páginas de gestión.
   - Solo apoyo administrativo: el backend no le envía datos
     personales ni clínicos de pacientes.
   - La conversación se mantiene mientras no se cierre sesión
     o se recargue la página.
========================================================= */

const GRADIENT = 'linear-gradient(135deg, #2563eb 0%, #22d3ee 100%)'
const MAX_CARACTERES = 1000

interface Mensaje {
  rol: 'usuario' | 'asistente'
  texto: string
  error?: boolean
}

interface EstadoAsistente {
  configurado: boolean
  modelo: string
}

interface RespuestaAsistente {
  respuesta: string
  modelo: string
}

const SUGERENCIAS: Record<Exclude<Rol, 'PACIENTE'>, string[]> = {
  ADMIN: [
    '¿Cómo va la caja de hoy?',
    'Resume los indicadores de la agenda',
    '¿Cómo creo la cuenta de un nuevo odontólogo?',
    '¿Qué odontólogos atienden los sábados?',
  ],
  RECEPCIONISTA: [
    '¿Cuántas citas faltan por confirmar?',
    'Redacta un WhatsApp para confirmar una hora',
    '¿Cuánto cuesta una limpieza como referencia?',
    '¿Cómo registro un abono a un presupuesto?',
  ],
  ODONTOLOGO: [
    '¿Qué citas tengo hoy?',
    '¿Tengo atenciones en borrador pendientes?',
    '¿Cómo cierro una atención clínica?',
    '¿Cuál es mi horario semanal?',
  ],
}

const DESCRIPCION_ROL: Record<Exclude<Rol, 'PACIENTE'>, string> = {
  ADMIN: 'Indicadores, caja, personal y uso del sistema.',
  RECEPCIONISTA: 'Agenda, confirmaciones, valores y mensajes para pacientes.',
  ODONTOLOGO: 'Tu agenda, tus pendientes y uso del sistema.',
}

/* ---------- Formato simple de la respuesta (negritas y listas) ---------- */

function textoEnLinea(linea: string): ReactNode[] {
  // **negrita** y _cursiva_ / *cursiva*.
  // El guion bajo solo cuenta como cursiva si no está dentro de una palabra
  // (así GEMINI_API_KEY o nombres_de_archivo se muestran tal cual).
  const partes = linea.split(/(\*\*[^*]+\*\*|(?<![\w])_[^_\n]+_(?![\w])|(?<![\w*])\*[^*\s][^*]*\*(?![\w*]))/g)

  return partes.map((parte, i) => {
    if (parte.startsWith('**') && parte.endsWith('**') && parte.length > 4) {
      return <strong key={i}>{parte.slice(2, -2)}</strong>
    }
    if (
      parte.length > 2
      && ((parte.startsWith('_') && parte.endsWith('_'))
        || (parte.startsWith('*') && parte.endsWith('*')))
    ) {
      return <em key={i}>{parte.slice(1, -1)}</em>
    }
    return parte
  })
}

function TextoFormateado({ texto }: { texto: string }) {
  const lineas = texto.replace(/\r/g, '').split('\n')
  const bloques: ReactNode[] = []
  let lista: { ordenada: boolean; items: string[] } | null = null

  const cerrarLista = () => {
    if (!lista) return
    const actual = lista
    const Etiqueta = actual.ordenada ? 'ol' : 'ul'
    bloques.push(
      <Box
        component={Etiqueta}
        key={`l${bloques.length}`}
        sx={{ my: 0.5, pl: 2.5, '& li': { mb: 0.25 } }}
      >
        {actual.items.map((item, i) => (
          <li key={i}>{textoEnLinea(item)}</li>
        ))}
      </Box>,
    )
    lista = null
  }

  lineas.forEach((linea) => {
    const vineta = linea.match(/^\s*[-*•]\s+(.*)$/)
    const numerada = linea.match(/^\s*\d+[.)]\s+(.*)$/)

    if (vineta || numerada) {
      const ordenada = Boolean(numerada)
      const contenido = (vineta ?? numerada)![1]
      if (!lista || lista.ordenada !== ordenada) {
        cerrarLista()
        lista = { ordenada, items: [] }
      }
      lista.items.push(contenido)
      return
    }

    cerrarLista()

    if (!linea.trim()) {
      bloques.push(<Box key={`e${bloques.length}`} sx={{ height: 6 }} />)
      return
    }

    const titulo = linea.match(/^#{1,4}\s+(.*)$/)
    bloques.push(
      <Typography
        key={`p${bloques.length}`}
        variant="body2"
        sx={{ fontWeight: titulo ? 700 : 400, lineHeight: 1.55 }}
      >
        {textoEnLinea(titulo ? titulo[1] : linea)}
      </Typography>,
    )
  })

  cerrarLista()

  return <Box sx={{ fontSize: '0.875rem', lineHeight: 1.55 }}>{bloques}</Box>
}

/* ---------- Componente principal ---------- */

function AsistenteIA() {
  const rol = getRol()
  const [abierto, setAbierto] = useState(false)
  const [estado, setEstado] = useState<EstadoAsistente | null>(null)
  const [errorEstado, setErrorEstado] = useState('')
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [copiado, setCopiado] = useState<number | null>(null)

  const finRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLTextAreaElement | null>(null)

  // Consulta si el asistente está configurado la primera vez que se abre
  useEffect(() => {
    if (!abierto || estado) return
    let activo = true
    apiGet<EstadoAsistente>('/api/asistente/estado')
      .then((data) => {
        if (activo) setEstado(data)
      })
      .catch((err) => {
        if (activo) setErrorEstado(mensajeError(err))
      })
    return () => {
      activo = false
    }
  }, [abierto, estado])

  // Baja al último mensaje
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [mensajes, enviando])

  // Enfoca el cuadro de texto al abrir
  useEffect(() => {
    if (abierto) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 250)
      return () => window.clearTimeout(id)
    }
  }, [abierto])

  if (!rol || rol === 'PACIENTE') {
    return null
  }

  const nombre = getNombreSesion().split(' ')[0]
  const disponible = estado?.configurado === true

  const enviar = async (pregunta: string) => {
    const limpio = pregunta.trim()
    if (!limpio || enviando || !disponible) return

    // Solo los mensajes válidos (sin errores) se envían como historial
    const historial = mensajes
      .filter((m) => !m.error)
      .map(({ rol: r, texto: t }) => ({ rol: r, texto: t }))

    setMensajes((actual) => [...actual, { rol: 'usuario', texto: limpio }])
    setTexto('')
    setEnviando(true)

    try {
      const data = await apiPost<RespuestaAsistente>('/api/asistente/preguntar', {
        mensaje: limpio,
        historial,
      })
      setMensajes((actual) => [...actual, { rol: 'asistente', texto: data.respuesta }])
    } catch (err) {
      setMensajes((actual) => [
        ...actual,
        { rol: 'asistente', texto: mensajeError(err), error: true },
      ])
    } finally {
      setEnviando(false)
      inputRef.current?.focus()
    }
  }

  const alPresionarTecla = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void enviar(texto)
    }
  }

  const copiar = async (indice: number, contenido: string) => {
    try {
      await navigator.clipboard.writeText(contenido.replace(/\*\*/g, ''))
      setCopiado(indice)
      window.setTimeout(() => setCopiado(null), 1800)
    } catch {
      // El navegador no permitió copiar: no se hace nada
    }
  }

  const nuevaConversacion = () => {
    setMensajes([])
    setTexto('')
    inputRef.current?.focus()
  }

  return (
    <>
      {!abierto && (
        <Tooltip title="Asistente Más Dent" placement="left">
          <Fab
            onClick={() => setAbierto(true)}
            aria-label="Abrir asistente"
            sx={{
              position: 'fixed',
              right: { xs: 16, sm: 28 },
              bottom: { xs: 16, sm: 28 },
              zIndex: (t) => t.zIndex.drawer - 1,
              color: '#fff',
              background: GRADIENT,
              boxShadow: '0 12px 30px rgba(37,99,235,.35)',
              '&:hover': { background: GRADIENT, filter: 'brightness(1.05)' },
            }}
          >
            <AutoAwesomeRoundedIcon />
          </Fab>
        </Tooltip>
      )}

      <Drawer
        anchor="right"
        open={abierto}
        onClose={() => setAbierto(false)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: '100%', sm: 430 },
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#f5f7fb',
              borderTopLeftRadius: { sm: 20 },
              borderBottomLeftRadius: { sm: 20 },
            },
          },
        }}
      >
        {/* ===== Encabezado ===== */}
        <Box
          sx={{
            px: 2.5,
            py: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            color: '#fff',
            background: 'linear-gradient(135deg, #0a1628 0%, #1d3a75 100%)',
          }}
        >
          <Avatar sx={{ width: 40, height: 40, background: GRADIENT }}>
            <AutoAwesomeRoundedIcon fontSize="small" />
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, lineHeight: 1.2 }}>Asistente Más Dent</Typography>
            <Typography variant="caption" sx={{ opacity: 0.75 }} noWrap component="div">
              {DESCRIPCION_ROL[rol]}
            </Typography>
          </Box>
          <Tooltip title="Nueva conversación">
            <span>
              <IconButton
                onClick={nuevaConversacion}
                disabled={mensajes.length === 0 || enviando}
                sx={{ color: '#fff', '&.Mui-disabled': { color: 'rgba(255,255,255,.35)' } }}
                aria-label="Nueva conversación"
              >
                <RestartAltRoundedIcon />
              </IconButton>
            </span>
          </Tooltip>
          <IconButton onClick={() => setAbierto(false)} sx={{ color: '#fff' }} aria-label="Cerrar asistente">
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        {/* ===== Mensajes ===== */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 2, py: 2 }}>
          {!estado && !errorEstado && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={28} />
            </Box>
          )}

          {errorEstado && (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {errorEstado}
            </Alert>
          )}

          {estado && !estado.configurado && (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                El asistente aún no está activado
              </Typography>
              <Typography variant="body2">
                Falta la clave de Google Gemini. Agrega la línea <code>GEMINI_API_KEY=tu_clave</code> en el
                archivo <code>.env</code> del proyecto y reinicia el backend. El resto del sistema funciona normal.
              </Typography>
            </Alert>
          )}

          {disponible && mensajes.length === 0 && (
            <Box sx={{ textAlign: 'center', pt: 3, px: 1 }}>
              <Avatar sx={{ width: 56, height: 56, mx: 'auto', mb: 1.5, background: GRADIENT }}>
                <AutoAwesomeRoundedIcon />
              </Avatar>
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>Hola, {nombre}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2.5 }}>
                Te ayudo con la agenda, horarios, valores de referencia, caja y uso del sistema.
                No entrego indicaciones clínicas.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'stretch' }}>
                {SUGERENCIAS[rol].map((sugerencia) => (
                  <Chip
                    key={sugerencia}
                    label={sugerencia}
                    onClick={() => void enviar(sugerencia)}
                    variant="outlined"
                    sx={{
                      justifyContent: 'flex-start',
                      height: 'auto',
                      py: 1,
                      px: 0.5,
                      borderRadius: 3,
                      backgroundColor: '#fff',
                      fontWeight: 600,
                      '& .MuiChip-label': { whiteSpace: 'normal', textAlign: 'left' },
                      '&:hover': { borderColor: 'primary.main' },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {mensajes.map((mensaje, indice) => {
            const esUsuario = mensaje.rol === 'usuario'
            return (
              <Box
                key={indice}
                sx={{ display: 'flex', justifyContent: esUsuario ? 'flex-end' : 'flex-start', mb: 1.5 }}
              >
                <Box
                  sx={{
                    maxWidth: '88%',
                    px: 1.75,
                    py: 1.25,
                    borderRadius: 3,
                    borderTopRightRadius: esUsuario ? 6 : undefined,
                    borderTopLeftRadius: esUsuario ? undefined : 6,
                    ...(esUsuario
                      ? { color: '#fff', background: GRADIENT }
                      : mensaje.error
                        ? { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }
                        : { backgroundColor: '#fff', border: '1px solid #e6eaf2' }),
                  }}
                >
                  {esUsuario ? (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                      {mensaje.texto}
                    </Typography>
                  ) : (
                    <TextoFormateado texto={mensaje.texto} />
                  )}

                  {!esUsuario && !mensaje.error && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5, mb: -0.5, mr: -0.75 }}>
                      <Tooltip title={copiado === indice ? 'Copiado' : 'Copiar'}>
                        <IconButton
                          size="small"
                          onClick={() => void copiar(indice, mensaje.texto)}
                          aria-label="Copiar respuesta"
                          sx={{ color: 'text.secondary' }}
                        >
                          {copiado === indice
                            ? <DoneRoundedIcon sx={{ fontSize: 16 }} />
                            : <ContentCopyRoundedIcon sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Box>
              </Box>
            )
          })}

          {enviando && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1.5 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Pensando…</Typography>
            </Box>
          )}

          <div ref={finRef} />
        </Box>

        {/* ===== Escribir ===== */}
        <Box sx={{ px: 2, pt: 1.25, pb: 1.5, borderTop: '1px solid #e6eaf2', backgroundColor: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
            <TextField
              inputRef={inputRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value.slice(0, MAX_CARACTERES))}
              onKeyDown={alPresionarTecla}
              placeholder={disponible ? 'Escribe tu pregunta…' : 'Asistente no disponible'}
              disabled={!disponible || enviando}
              multiline
              maxRows={4}
              slotProps={{ input: { sx: { borderRadius: 3, backgroundColor: '#f5f7fb' } } }}
            />
            <IconButton
              onClick={() => void enviar(texto)}
              disabled={!disponible || enviando || !texto.trim()}
              aria-label="Enviar pregunta"
              sx={{
                width: 42,
                height: 42,
                color: '#fff',
                background: GRADIENT,
                '&:hover': { background: GRADIENT, filter: 'brightness(1.05)' },
                '&.Mui-disabled': { background: '#cbd5e1', color: '#fff' },
              }}
            >
              <SendRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75, color: 'text.secondary' }}>
            <LockOutlinedIcon sx={{ fontSize: 13 }} />
            <Typography variant="caption" sx={{ flexGrow: 1, lineHeight: 1.3 }}>
              No se comparten nombres, RUT ni datos clínicos de pacientes. Revisa siempre la respuesta.
            </Typography>
            {texto.length > MAX_CARACTERES * 0.8 && (
              <Typography variant="caption">{texto.length}/{MAX_CARACTERES}</Typography>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  )
}

export default AsistenteIA
