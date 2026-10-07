import React, { useState, useEffect } from 'react';
import { eventService, galleryService } from '../../services/serviceModules';
import { useToast } from '../../context/ToastContext';
import { Trash2, Loader2, Upload } from 'lucide-react';

export const AdminGallery = () => {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    eventService.getEvents()
      .then(res => {
        if (res.success && res.events.length > 0) {
          setEvents(res.events);
          setSelectedEventId(res.events[0].id);
        }
      })
      .catch(err => toast.error(err.message));
  }, []);

  useEffect(() => {
    if (!selectedEventId) return;
    fetchGallery();
  }, [selectedEventId]);

  const fetchGallery = () => {
    setLoading(true);
    galleryService.getImages(selectedEventId)
      .then(res => {
        if (res.success) setImages(res.images);
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  const handleAddImage = async (e) => {
    e.preventDefault();
    if (!imageUrl) return;
    setUploading(true);

    try {
      const res = await galleryService.addImage(selectedEventId, { image_url: imageUrl, caption });
      if (res.success) {
        toast.success('Photo added to event gallery!');
        setImageUrl('');
        setCaption('');
        fetchGallery();
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      const res = await galleryService.deleteImage(selectedEventId, imageId);
      if (res.success) {
        toast.success('Image deleted from gallery.');
        fetchGallery();
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Event Photo Gallery Management</h1>
        <p className="text-xs text-zinc-400">Upload and manage photo highlights for completed events</p>
      </div>

      {/* Select Event */}
      <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl max-w-md">
        <label className="block text-xs font-semibold text-zinc-300 mb-1">Select Event</label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-white"
        >
          {events.map((evt) => (
            <option key={evt.id} value={evt.id}>{evt.title}</option>
          ))}
        </select>
      </div>

      {/* Upload Form */}
      <div className="glass-panel p-6 rounded-3xl border border-zinc-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Upload className="w-4 h-4 text-white" /> Upload New Photo
        </h3>
        
        <form onSubmit={handleAddImage} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <input
            type="url"
            required
            placeholder="Image URL (e.g. https://images.unsplash.com/...)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="sm:col-span-2 bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white"
          />
          <input
            type="text"
            placeholder="Caption (Optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="bg-black border border-zinc-800 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-white"
          />
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-zinc-200 border border-white"
            >
              {uploading ? 'Uploading...' : 'Add to Gallery'}
            </button>
          </div>
        </form>
      </div>

      {/* Images Grid */}
      {loading ? (
        <div className="py-16 text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-white" />
          <span className="text-xs font-semibold">Loading Gallery...</span>
        </div>
      ) : images.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-500 text-xs">
          No photos uploaded to gallery for this event yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img) => (
            <div key={img.id} className="relative rounded-2xl overflow-hidden border border-zinc-800 group h-56">
              <img src={img.image_url} alt={img.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform grayscale group-hover:grayscale-0" />
              
              <div className="absolute inset-x-0 bottom-0 bg-black/80 backdrop-blur-md p-3 flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium truncate">{img.caption || 'Gallery Photo'}</span>
                <button
                  onClick={() => handleDeleteImage(img.id)}
                  className="p-1.5 rounded-lg bg-black text-white hover:bg-zinc-800 border border-zinc-700"
                  title="Delete Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
