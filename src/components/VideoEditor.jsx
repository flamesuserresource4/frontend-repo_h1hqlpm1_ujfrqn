import { useEffect, useRef, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

export default function VideoEditor() {
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [assets, setAssets] = useState([])
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [status, setStatus] = useState('')

  const videoRef = useRef(null)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState('')
  const [speed, setSpeed] = useState(1)
  const [volume, setVolume] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')

  useEffect(() => {
    fetch(`${API_BASE}/projects`).then(r => r.json()).then(setProjects).catch(()=>{})
  }, [])

  const createProject = async () => {
    const title = prompt('Project title') || `Project ${projects.length + 1}`
    const form = new FormData()
    form.append('title', title)
    form.append('description', '')
    const res = await fetch(`${API_BASE}/projects`, { method: 'POST', body: form })
    const p = await res.json()
    setProjects([p, ...projects])
    setCurrentProject(p)
  }

  const onUpload = async (e) => {
    if (!currentProject) return alert('Create or select a project first')
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('project_id', currentProject.id || currentProject._id || currentProject.project_id)
    form.append('file', file)
    setStatus('Uploading...')
    const res = await fetch(`${API_BASE}/assets/upload`, { method: 'POST', body: form })
    const data = await res.json()
    if (res.ok) {
      setAssets([data, ...assets])
      setSelectedAsset(data)
      setStatus('Uploaded')
    } else {
      setStatus(data.detail || 'Upload failed')
    }
  }

  useEffect(() => {
    if (!currentProject) return
    fetch(`${API_BASE}/projects/${currentProject.id || currentProject._id || currentProject.project_id}/assets`)
      .then(r => r.json()).then(setAssets)
  }, [currentProject])

  const render = async () => {
    if (!currentProject || !selectedAsset) return
    setStatus('Rendering... this may take a while')
    const payload = {
      project_id: currentProject.id || currentProject._id || currentProject.project_id,
      asset_id: selectedAsset.id || selectedAsset._id,
      start: Number(trimStart) || 0,
      end: trimEnd ? Number(trimEnd) : null,
      speed: Number(speed) || 1,
      volume: Number(volume) || 1,
      rotate: Number(rotate) || 0,
      resolution_width: width ? Number(width) : null,
      resolution_height: height ? Number(height) : null,
    }
    const res = await fetch(`${API_BASE}/render`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const data = await res.json()
    if (res.ok) {
      setStatus('Render complete')
      window.open(data.output_url, '_blank')
    } else {
      setStatus(data.detail || 'Render failed')
    }
  }

  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="p-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-500" />
          <div className="font-semibold">Video Editor</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={createProject} className="px-3 py-1.5 bg-blue-600 rounded hover:bg-blue-500">New Project</button>
          <input type="file" accept="video/*,audio/*,image/*" onChange={onUpload} className="block text-sm" />
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4 p-4">
        <aside className="col-span-3 bg-white/5 rounded p-3 overflow-auto max-h-[calc(100vh-120px)]">
          <h3 className="font-semibold mb-2">Projects</h3>
          <div className="space-y-2">
            {projects.map(p => (
              <button key={p.id} onClick={() => setCurrentProject(p)} className={`w-full text-left px-3 py-2 rounded hover:bg-white/10 ${currentProject && (currentProject.id===p.id) ? 'bg-white/10' : ''}`}>
                <div className="text-sm font-medium">{p.title}</div>
                <div className="text-xs opacity-70">{p.description || '—'}</div>
              </button>
            ))}
          </div>

          {currentProject && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Assets</h3>
              <div className="space-y-2">
                {assets.map(a => (
                  <button key={a.id} onClick={() => setSelectedAsset(a)} className={`w-full text-left px-3 py-2 rounded hover:bg-white/10 ${selectedAsset && (selectedAsset.id===a.id) ? 'bg-white/10' : ''}`}>
                    <div className="text-sm font-medium truncate">{a.filename}</div>
                    <div className="text-xs opacity-70 capitalize">{a.kind}{a.duration ? ` • ${a.duration.toFixed?.(1) || a.duration}s` : ''}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        <main className="col-span-6 bg-black/60 rounded p-3">
          {selectedAsset ? (
            <video ref={videoRef} src={selectedAsset.url} controls className="w-full aspect-video bg-black rounded" />
          ) : (
            <div className="h-full flex items-center justify-center text-white/60">Select or upload a video to preview</div>
          )}
        </main>

        <section className="col-span-3 bg-white/5 rounded p-3">
          <h3 className="font-semibold mb-2">Export Settings</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label className="col-span-1">
              <div className="opacity-70">Start (s)</div>
              <input value={trimStart} onChange={e=>setTrimStart(e.target.value)} className="w-full px-2 py-1 bg-black/40 rounded border border-white/10" />
            </label>
            <label className="col-span-1">
              <div className="opacity-70">End (s)</div>
              <input value={trimEnd} onChange={e=>setTrimEnd(e.target.value)} placeholder="auto" className="w-full px-2 py-1 bg-black/40 rounded border border-white/10" />
            </label>
            <label>
              <div className="opacity-70">Speed</div>
              <input value={speed} onChange={e=>setSpeed(e.target.value)} className="w-full px-2 py-1 bg-black/40 rounded border border-white/10" />
            </label>
            <label>
              <div className="opacity-70">Volume</div>
              <input value={volume} onChange={e=>setVolume(e.target.value)} className="w-full px-2 py-1 bg-black/40 rounded border border-white/10" />
            </label>
            <label>
              <div className="opacity-70">Rotate</div>
              <select value={rotate} onChange={e=>setRotate(e.target.value)} className="w-full px-2 py-1 bg-black/40 rounded border border-white/10">
                <option value={0}>0°</option>
                <option value={90}>90°</option>
                <option value={180}>180°</option>
                <option value={270}>270°</option>
              </select>
            </label>
            <label>
              <div className="opacity-70">Width</div>
              <input value={width} onChange={e=>setWidth(e.target.value)} placeholder="auto" className="w-full px-2 py-1 bg-black/40 rounded border border-white/10" />
            </label>
            <label>
              <div className="opacity-70">Height</div>
              <input value={height} onChange={e=>setHeight(e.target.value)} placeholder="auto" className="w-full px-2 py-1 bg-black/40 rounded border border-white/10" />
            </label>
          </div>

          <button onClick={render} className="mt-3 w-full py-2 bg-green-600 hover:bg-green-500 rounded">Render</button>

          {status && (
            <div className="mt-3 text-xs opacity-80">{status}</div>
          )}
        </section>
      </div>

      <footer className="px-4 pb-4 text-xs text-white/50">Note: Rendering happens on the server. Rendering large files may take time.</footer>
    </div>
  )
}
