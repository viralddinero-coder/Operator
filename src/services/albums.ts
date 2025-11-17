import { supabase } from '../lib/supabase'

export const albumService = {
  async createAlbum(profileId: string, name: string) {
    try {
      const { data, error } = await supabase
        .from('profile_albums')
        .insert({ profile_id: profileId, name })
        .select()
        .single()
      if (error) throw error
      return { album: data, error: null }
    } catch (error) {
      return { album: null, error }
    }
  },
  async addPhotosToAlbum(albumId: string, photoIds: string[]) {
    try {
      const rows = photoIds.map(pid => ({ album_id: albumId, photo_id: pid }))
      const { error } = await supabase.from('album_photos').insert(rows)
      if (error) throw error
      return { error: null }
    } catch (error) {
      return { error }
    }
  },
  async getAlbumsByProfile(profileId: string) {
    try {
      const { data, error } = await supabase.from('profile_albums').select('*').eq('profile_id', profileId)
      if (error) throw error
      return { albums: data || [], error: null }
    } catch (error) {
      return { albums: [], error }
    }
  }
}
