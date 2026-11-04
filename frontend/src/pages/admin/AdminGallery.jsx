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
        <h1 className="text-2xl font-black text-[#DAF1DE]">Event Photo Gallery Management</h1>
        <p className="text-xs text-[#8EB69B]">Upload and manage photo highlights for completed events</p>
      </div>

      {/* Select Event */}
      <div className="bg-[#0B2B26]/85 border border-[#163832] p-4 rounded-2xl max-w-md shadow-lg backdrop-blur-sm">
        <label className="block text-xs font-semibold text-[#DAF1DE] mb-1">Select Event</label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="w-full bg-[#051F20] border border-[#163832] rounded-xl px-4 py-2.5 text-xs text-[#DAF1DE] focus:outline-none focus:border-[#8EB69B]"
        >
          {events.map((evt) => (
            <option key={evt.id} value={evt.id}>{evt.title}</option>
          ))}
        </select>
      </div>

      {/* Upload Form */}
      <div className="bg-[#0B2B26]/85 p-6 rounded-3xl border border-[#163832] space-y-4 shadow-xl backdrop-blur-sm">
        <h3 className="text-sm font-bold text-[#DAF1DE] flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#DAF1DE]" /> Upload New Photo
        </h3>
        
        <form onSubmit={handleAddImage} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <input
            type="url"
            required
            placeholder="Image URL (e.g. https://images.unsplash.com/...)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="sm:col-span-2 bg-[#051F20] border border-[#163832] rounded-xl px-4 py-2.5 text-[#DAF1DE] placeholder-[#8EB69B]/50 focus:outline-none focus:border-[#8EB69B]"
          />
          <input
            type="text"
            placeholder="Caption (Optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="bg-[#051F20] border border-[#163832] rounded-xl px-4 py-2.5 text-[#DAF1DE] placeholder-[#8EB69B]/50 focus:outline-none focus:border-[#8EB69B]"
          />
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2.5 rounded-xl bg-[#DAF1DE] text-[#051F20] font-bold text-xs hover:bg-[#8EB69B] border border-[#DAF1DE] transition-colors cursor-pointer shadow-sm"
            >
              {uploading ? 'Uploading...' : 'Add to Gallery'}
            </button>
          </div>
        </form>
      </div>

      {/* Images Grid */}
      {loading ? (
        <div className="py-16 text-center text-[#DAF1DE]">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#DAF1DE]" />
          <span className="text-xs font-semibold">Loading Gallery...</span>
        </div>
      ) : images.length === 0 ? (
        <div className="bg-[#0B2B26]/60 border border-[#163832] rounded-3xl p-12 text-center text-[#8EB69B] text-xs">
          No photos uploaded to gallery for this event yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((img) => (
            <div key={img.id} className="relative rounded-2xl overflow-hidden border border-[#163832] hover:border-[#8EB69B] group h-56 shadow-lg">
              <img src={img.image_url} alt={img.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              
              <div className="absolute inset-x-0 bottom-0 bg-[#051F20]/90 backdrop-blur-md p-3 flex items-center justify-between text-xs border-t border-[#163832]">
                <span className="text-[#DAF1DE] font-medium truncate">{img.caption || 'Gallery Photo'}</span>
                <button
                  onClick={() => handleDeleteImage(img.id)}
                  className="p-1.5 rounded-lg bg-[#0B2B26] text-[#8EB69B] hover:text-white hover:bg-red-950/80 border border-[#163832] hover:border-red-800 transition-colors cursor-pointer"
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
