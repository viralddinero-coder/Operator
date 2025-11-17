import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { operatorService, siteService, userService, photoService } from '../../services/api'
import { albumService } from '../../services/albums'

const AdminProfilesPage: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [operators, setOperators] = useState<any[]>([])
  const [selectedSite, setSelectedSite] = useState<string>('')
  const [name, setName] = useState('')
  const [age, setAge] = useState<number>(25)
  const [bio, setBio] = useState('')
  const [assignOperatorId, setAssignOperatorId] = useState<string>('')
  const [uploadFiles, setUploadFiles] = useState<FileList | null>(null)
  const [galleryProfile, setGalleryProfile] = useState<any | null>(null)
  const [galleryPhotos, setGalleryPhotos] = useState<any[]>([])
  const [galleryUpload, setGalleryUpload] = useState<FileList | null>(null)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [albums, setAlbums] = useState<any[]>([])
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([])

  const load = async () => {
    const { data: profs } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_operator_profile', true)
      .order('updated_at', { ascending: false })
    setProfiles(profs || [])

    const sitesRes = await siteService.getAllSites()
    setSites(sitesRes.sites || [])

    const { data: ops } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'operator')
      .order('created_at', { ascending: false })
    setOperators(ops || [])
  }

  useEffect(() => { load() }, [])

  const createProfile = async () => {
    if (!name || !selectedSite || !age) {
      alert('Fyll i namn, ålder och välj domän')
      return
    }
    try {
      const { profile, error } = await operatorService.createOperatorProfile({
        name,
        age,
        gender: 'female',
        location: '',
        bio,
        status: 'offline',
        assigned_operator_id: assignOperatorId || null,
        site_id: selectedSite,
      })
      if (error || !profile) throw error || new Error('Misslyckades att skapa profil')

      if (uploadFiles && uploadFiles.length > 0) {
        for (let i = 0; i < uploadFiles.length; i++) {
          const file = uploadFiles.item(i)!
          await photoService.uploadPhoto(file, profile.user_id, profile.id)
        }
      }

      setName('')
      setAge(25)
      setBio('')
      setAssignOperatorId('')
      setUploadFiles(null)
      alert('Profil skapad')
      load()
    } catch (err: any) {
      alert('Kunde inte skapa profil: ' + (err?.message || 'Okänt fel'))
    }
  }

  const moveToOperator = async (profileId: string, operatorId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ assigned_operator_id: operatorId, status: 'offline' })
        .eq('id', profileId)
      if (error) throw error
      load()
    } catch (err: any) {
      alert('Kunde inte flytta profil: ' + (err?.message || 'Okänt fel'))
    }
  }

  const moveToPool = async (profileId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ assigned_operator_id: null, status: 'switching' })
        .eq('id', profileId)
      if (error) throw error
      load()
    } catch (err: any) {
      alert('Kunde inte flytta till pool: ' + (err?.message || 'Okänt fel'))
    }
  }

  const setStatus = async (profileId: string, status: 'online' | 'offline' | 'switching') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status, online_status: status === 'online' ? 'online' : 'offline' })
        .eq('id', profileId)
      if (error) throw error
      load()
    } catch (err: any) {
      alert('Kunde inte uppdatera status: ' + (err?.message || 'Okänt fel'))
    }
  }

  const openGallery = async (p: any) => {
    setGalleryProfile(p)
    const { photos } = await photoService.getPhotosByProfile(p.id)
    setGalleryPhotos(photos)
    const { albums } = await albumService.getAlbumsByProfile(p.id)
    setAlbums(albums)
  }

  const toggleBlur = async (photoId: string, current: boolean) => {
    const { photo } = await photoService.setPhotoBlur(photoId, !current)
    setGalleryPhotos((prev) => prev.map(ph => ph.id === photoId ? { ...ph, is_blurred: photo?.is_blurred } : ph))
  }

  const setPrimary = async (photoId: string, userId: string) => {
    const { photo } = await photoService.setPrimaryPhoto(photoId, userId)
    if (photo) {
      const { photos } = await photoService.getPhotosByProfile(galleryProfile!.id)
      setGalleryPhotos(photos)
    }
  }

  const deletePhoto = async (photoId: string) => {
    const { error } = await photoService.deletePhoto(photoId)
    if (!error) {
      setGalleryPhotos((prev) => prev.filter(ph => ph.id !== photoId))
    }
  }

  const uploadGalleryPhotos = async () => {
    if (!galleryProfile || !galleryUpload || galleryUpload.length === 0) return
    for (let i=0;i<galleryUpload.length;i++) {
      const f = galleryUpload.item(i)!
      await photoService.uploadPhoto(f, galleryProfile.user_id, galleryProfile.id)
    }
    const { photos } = await photoService.getPhotosByProfile(galleryProfile.id)
    setGalleryPhotos(photos)
    setGalleryUpload(null)
  }

  const filteredProfiles = selectedSite ? profiles.filter(p => p.site_id === selectedSite) : profiles
  const poolProfiles = filteredProfiles.filter(p => !p.assigned_operator_id)
  const assignedProfiles = filteredProfiles.filter(p => p.assigned_operator_id)

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Profiler & Pool</h2>

      <div className="bg-white rounded-lg border p-4 mb-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)} className="border rounded px-3 py-2">
            <option value="">Välj domän</option>
            {sites.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name} ({s.domain})</option>
            ))}
          </select>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Namn" className="border rounded px-3 py-2" />
          <input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} placeholder="Ålder" className="border rounded px-3 py-2" />
          <select value={assignOperatorId} onChange={(e) => setAssignOperatorId(e.target.value)} className="border rounded px-3 py-2">
            <option value="">Tilldela operatör (valfritt)</option>
            {operators.map((o: any) => (
              <option key={o.id} value={o.id}>{o.email}</option>
            ))}
          </select>
        </div>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Beskrivning" className="border rounded px-3 py-2 w-full" />
        <input type="file" multiple onChange={(e) => setUploadFiles(e.target.files)} className="border rounded px-3 py-2 w-full" />
        <div>
          <button onClick={createProfile} className="px-3 py-2 bg-pink-600 text-white rounded">Skapa profil</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Pool</h3>
          </div>
          <ul className="divide-y">
            {poolProfiles.map((p) => (
              <li key={p.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.name} • {p.age}</p>
                  <p className="text-sm text-gray-600">{p.status}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <select onChange={(e) => moveToOperator(p.id, e.target.value)} className="border rounded px-2 py-1">
                    <option value="">Flytta till operatör</option>
                    {operators.map((o: any) => (
                      <option key={o.id} value={o.id}>{o.email}</option>
                    ))}
                  </select>
                  <button onClick={() => setStatus(p.id, 'online')} className="px-2 py-1 bg-green-600 text-white rounded">Online</button>
                  <button onClick={() => setStatus(p.id, 'offline')} className="px-2 py-1 border rounded">Offline</button>
                </div>
              </li>
            ))}
            {poolProfiles.length === 0 && (
              <li className="p-4 text-sm text-gray-600">Poolen är tom</li>
            )}
          </ul>
        </div>

        <div className="bg-white rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Tilldelade profiler</h3>
          </div>
          <ul className="divide-y">
            {assignedProfiles.map((p) => (
              <li key={p.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{p.name} • {p.age}</p>
                  <p className="text-sm text-gray-600">{p.status}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => moveToPool(p.id)} className="px-2 py-1 bg-yellow-500 text-white rounded">Flytta till pool</button>
                  <button onClick={() => setStatus(p.id, 'online')} className="px-2 py-1 bg-green-600 text-white rounded">Online</button>
                  <button onClick={() => setStatus(p.id, 'offline')} className="px-2 py-1 border rounded">Offline</button>
                  <button onClick={() => openGallery(p)} className="px-2 py-1 border rounded">Galleri</button>
                </div>
              </li>
            ))}
            {assignedProfiles.length === 0 && (
              <li className="p-4 text-sm text-gray-600">Inga tilldelade profiler</li>
            )}
          </ul>
        </div>
      </div>

      {galleryProfile && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Galleri för {galleryProfile.name}</h3>
              <button onClick={() => { setGalleryProfile(null); setGalleryPhotos([]); }} className="text-gray-500">✕</button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {galleryPhotos.map((ph) => (
                  <div key={ph.id} className="relative border rounded-lg overflow-hidden">
                    <img src={ph.url} alt="" className={`${ph.is_blurred ? 'blur-sm' : ''} w-full h-40 object-cover`} />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <button onClick={() => toggleBlur(ph.id, ph.is_blurred)} className="px-2 py-1 text-xs rounded bg-black text-white">{ph.is_blurred ? 'Avblurr' : 'Blurr'}</button>
                      <div className="space-x-2">
                        <button onClick={() => setPrimary(ph.id, galleryProfile.user_id)} className="px-2 py-1 text-xs border rounded">Primär</button>
                        <button onClick={() => deletePhoto(ph.id)} className="px-2 py-1 text-xs border rounded">Ta bort</button>
                      </div>
                    </div>
                    <label className="absolute top-2 left-2 bg-white/80 text-xs px-2 py-1 rounded">
                      <input type="checkbox" checked={selectedPhotoIds.includes(ph.id)} onChange={(e) => setSelectedPhotoIds(e.target.checked ? [...selectedPhotoIds, ph.id] : selectedPhotoIds.filter(id => id !== ph.id))} />
                    </label>
                  </div>
                ))}
                {galleryPhotos.length === 0 && (
                  <div className="text-sm text-gray-500">Inga bilder ännu</div>
                )}
              </div>
              <div className="mt-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <input type="file" multiple onChange={(e) => setGalleryUpload(e.target.files)} className="border rounded px-3 py-2" />
                  <button onClick={uploadGalleryPhotos} className="px-3 py-2 bg-pink-600 text-white rounded">Ladda upp</button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Nya bilder blir blurriga som standard tills du avblurrar dem.</p>
              </div>
            </div>
            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold mb-2">Album</h4>
              <div className="flex items-center gap-2 mb-2">
                <input value={newAlbumName} onChange={(e) => setNewAlbumName(e.target.value)} placeholder="Album name" className="border rounded px-3 py-2" />
                <button onClick={async () => { if (!newAlbumName) return; const { album } = await albumService.createAlbum(galleryProfile!.id, newAlbumName); if (album) { const { albums } = await albumService.getAlbumsByProfile(galleryProfile!.id); setAlbums(albums); setNewAlbumName('') } }} className="px-3 py-2 bg-black text-white rounded">Create</button>
              </div>
              <div className="text-sm text-gray-600 mb-2">Select photos above, then choose album to add.</div>
              <div className="flex flex-wrap gap-2">
                {albums.map((a) => (
                  <button key={a.id} onClick={async () => { if (selectedPhotoIds.length>0) { await albumService.addPhotosToAlbum(a.id, selectedPhotoIds); setSelectedPhotoIds([]) } }} className="px-3 py-1 border rounded">
                    {a.name}
                  </button>
                ))}
                {albums.length === 0 && (<div className="text-xs text-gray-500">No albums</div>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminProfilesPage
