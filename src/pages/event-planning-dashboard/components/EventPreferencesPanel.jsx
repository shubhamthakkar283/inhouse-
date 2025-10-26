import React, { useState, useEffect } from 'react';
import { MapPin, Save } from 'lucide-react';
import Dropdown from '../../../components/ui/Dropdown';
import NumberInput from '../../../components/ui/NumberInput';
import BudgetSlider from '../../../components/ui/BudgetSlider';
import DatePicker from '../../../components/ui/DatePicker';
import TimePicker from '../../../components/ui/TimePicker';
import { preferencesService } from '../../../services/preferencesService';
import { cn } from '../../../utils/cn';

const EventPreferencesPanel = ({ onSave, onLoad, onEventTypeChange }) => {
  const [preferences, setPreferences] = useState({
    venue: '',
    numberOfPeople: 50,
    budget: 50000,
    eventDate: '',
    eventTime: '',
    eventType: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const eventTypeOptions = [
    { value: 'Corporate Conference', label: 'Corporate Conference' },
    { value: 'Wedding Celebration', label: 'Wedding Celebration' },
    { value: 'Birthday Party', label: 'Birthday Party' },
    { value: 'Product Launch', label: 'Product Launch' },
    { value: 'Academic Seminar', label: 'Academic Seminar' },
    { value: 'Networking Event', label: 'Networking Event' },
    { value: 'Charity Fundraiser', label: 'Charity Fundraiser' },
    { value: 'Music Concert', label: 'Music Concert' },
    { value: 'Art Exhibition', label: 'Art Exhibition' },
    { value: 'Sports Tournament', label: 'Sports Tournament' },
  ];

  const venueOptions = [
    { value: 'taj-palace-lawns', label: 'Taj Palace Lawns - Luxury Garden with Gazebo' },
    { value: 'leela-ambience', label: 'The Leela Ambience - Grand Ballroom' },
    { value: 'itc-maurya', label: 'ITC Maurya - Conference & Banquet Hall' },
    { value: 'oberoi-sky-terrace', label: 'The Oberoi Sky Terrace - Premium Rooftop' },
    { value: 'trident-poolside', label: 'Trident Poolside Lawns - Lakeside View' },
    { value: 'lalit-ashok', label: 'The Lalit Ashok - Convention Center' },
  ];

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedPreferences = await preferencesService.getLatestPreferences();
      if (savedPreferences) {
        const loadedPrefs = {
          venue: savedPreferences.venue || '',
          numberOfPeople: savedPreferences.numberOfPeople || 50,
          budget: savedPreferences.budget || 50000,
          eventDate: savedPreferences.eventDate || '',
          eventTime: savedPreferences.eventTime || '',
          eventType: savedPreferences.eventType || '',
        };
        setPreferences(loadedPrefs);
        if (onLoad) onLoad(savedPreferences);
        if (onEventTypeChange && loadedPrefs.eventType) {
          onEventTypeChange(loadedPrefs.eventType);
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleChange = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);

    if (field === 'eventType' && onEventTypeChange) {
      onEventTypeChange(value);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const savedData = await preferencesService.savePreferences(preferences);
      setHasUnsavedChanges(false);
      if (onSave) onSave(savedData);
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = () => {
    return preferences.venue && preferences.numberOfPeople && preferences.budget;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Event Preferences</h3>
            <p className="text-sm text-gray-600">Configure your event details</p>
          </div>
        </div>

        {hasUnsavedChanges && (
          <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Dropdown
          label="Event Type"
          value={preferences.eventType}
          onChange={(value) => handleChange('eventType', value)}
          options={eventTypeOptions}
          placeholder="Select event type..."
        />

        <Dropdown
          label="Venue"
          value={preferences.venue}
          onChange={(value) => handleChange('venue', value)}
          options={venueOptions}
          placeholder="Select venue..."
          icon={MapPin}
        />

        <NumberInput
          label="Number of People"
          value={preferences.numberOfPeople}
          onChange={(value) => handleChange('numberOfPeople', value)}
          min={1}
          max={1000}
        />

        <BudgetSlider
          label="Budget"
          value={preferences.budget}
          onChange={(value) => handleChange('budget', value)}
        />

        <DatePicker
          label="Event Date"
          value={preferences.eventDate}
          onChange={(value) => handleChange('eventDate', value)}
        />

        <TimePicker
          label="Event Time"
          value={preferences.eventTime}
          onChange={(value) => handleChange('eventTime', value)}
        />

        <div className="flex items-end">
          <button
            onClick={handleSave}
            disabled={!isFormValid() || isSaving || !hasUnsavedChanges}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200",
              isFormValid() && hasUnsavedChanges && !isSaving
                ? "bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            )}
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {(preferences.eventType || preferences.venue) && (
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Selection Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {preferences.eventType && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Event Type</p>
                <p className="text-sm font-medium text-gray-900">{preferences.eventType}</p>
              </div>
            )}
            {preferences.venue && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Venue</p>
                <p className="text-sm font-medium text-gray-900">
                  {venueOptions.find(v => v.value === preferences.venue)?.label.split('-')[0].trim()}
                </p>
              </div>
            )}
            {preferences.numberOfPeople && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Attendees</p>
                <p className="text-sm font-medium text-gray-900">{preferences.numberOfPeople} people</p>
              </div>
            )}
            {preferences.budget && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Budget</p>
                <p className="text-sm font-medium text-gray-900">
                  ₹{(preferences.budget / 1000).toFixed(0)}K
                </p>
              </div>
            )}
            {preferences.eventDate && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Date</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(preferences.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            )}
            {preferences.eventTime && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Time</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(`2000-01-01T${preferences.eventTime}`).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventPreferencesPanel;
