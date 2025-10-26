import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { validateEventDescription, sanitizeInput } from '../../../utils/validation';


const EventPromptForm = ({ onGenerate, isGenerating, defaultEventType }) => {
  const [prompt, setPrompt] = useState('');
  const [eventType, setEventType] = useState(defaultEventType || '');
  const [errors, setErrors] = useState({});
  const [isValidating, setIsValidating] = useState(false);

  React.useEffect(() => {
    if (defaultEventType) {
      setEventType(defaultEventType);
    }
  }, [defaultEventType]);

  const eventTypes = [
    'Corporate Conference',
    'Wedding Celebration',
    'Birthday Party',
    'Product Launch',
    'Academic Seminar',
    'Networking Event',
    'Charity Fundraiser',
    'Music Concert',
    'Art Exhibition',
    'Sports Tournament'
  ];

  const validateForm = () => {
    const newErrors = {};
    
    // Validate event description
    const descriptionValidation = validateEventDescription(prompt, eventType);
    if (!descriptionValidation.isValid) {
      newErrors.prompt = descriptionValidation.errors[0]; // Show first error
    }
    
    if (!eventType) {
      newErrors.eventType = 'Please select an event type';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (validateForm()) {
      onGenerate({
        prompt: prompt,
        description: prompt,
        eventType,
        timestamp: new Date()?.toISOString()
      });
    }
  };

  const handlePromptChange = (e) => {
    const sanitizedValue = sanitizeInput(e?.target?.value, true);
    setPrompt(sanitizedValue);
    
    if (errors?.prompt) {
      setErrors(prev => ({ ...prev, prompt: '' }));
    }
    
    // Real-time validation for better UX
    if (sanitizedValue.length > 20 && eventType) {
      setIsValidating(true);
      setTimeout(() => {
        const validation = validateEventDescription(sanitizedValue, eventType);
        if (!validation.isValid) {
          setErrors(prev => ({ ...prev, prompt: validation.errors[0] }));
        }
        setIsValidating(false);
      }, 500);
    }
  };

  const handleEventTypeChange = (e) => {
    setEventType(e?.target?.value);
    if (errors?.eventType) {
      setErrors(prev => ({ ...prev, eventType: '' }));
    }
  };

  const examplePromptsByType = {
    'Corporate Conference': [
      "Plan a tech startup product launch for 200 attendees with networking sessions and live demos",
      "Create a corporate annual conference with keynote speakers, breakout sessions, and team building activities",
      "Organize a leadership summit for 150 executives with panel discussions and executive dinner"
    ],
    'Wedding Celebration': [
      "Organize a sustainable wedding celebration for 150 guests with outdoor ceremony and eco-friendly catering",
      "Plan a beach wedding for 100 guests with cocktail hour, dinner reception, and live band entertainment",
      "Create a traditional Indian wedding with mehendi, sangeet, and reception ceremonies for 300 guests"
    ],
    'Birthday Party': [
      "Plan a milestone 50th birthday celebration for 80 guests with themed decorations and live entertainment",
      "Organize a kids' birthday party for 30 children with games, activities, and birthday cake ceremony",
      "Create an adult birthday celebration with cocktail party, DJ, and midnight cake cutting for 60 guests"
    ],
    'Product Launch': [
      "Plan a product launch event for 250 attendees with product demos, media coverage, and networking reception",
      "Organize a tech gadget launch with hands-on demos, influencer meet-and-greet, and cocktail reception for 200 people",
      "Create a fashion line launch event with runway show, celebrity appearances, and after-party for 150 guests"
    ],
    'Academic Seminar': [
      "Organize a research symposium for 100 academics with paper presentations, poster sessions, and networking lunch",
      "Plan an educational workshop for 50 students with lectures, hands-on activities, and certification ceremony",
      "Create a conference for 200 educators with keynote speeches, breakout sessions, and panel discussions"
    ],
    'Networking Event': [
      "Plan a business networking mixer for 100 professionals with speed networking, refreshments, and keynote speaker",
      "Organize an industry meetup for 75 professionals with presentations, panel discussion, and networking hour",
      "Create a career fair for 200 job seekers with company booths, resume reviews, and networking sessions"
    ],
    'Charity Fundraiser': [
      "Plan a charity gala for 150 donors with silent auction, dinner, and entertainment to raise funds for education",
      "Organize a charity run for 300 participants with registration, race, awards ceremony, and sponsor booths",
      "Create a charity concert for 500 attendees with live performances, donation drives, and awareness campaigns"
    ],
    'Music Concert': [
      "Plan a rock concert for 1000 fans with opening acts, main performance, and VIP meet-and-greet section",
      "Organize a classical music evening for 200 attendees with orchestra performance and cocktail reception",
      "Create a music festival for 2000 people with multiple stages, food vendors, and camping facilities"
    ],
    'Art Exhibition': [
      "Plan an art gallery opening for 100 guests with artist meet-and-greet, wine tasting, and guided tours",
      "Organize a contemporary art exhibition for 150 visitors with interactive installations and artist talks",
      "Create a photography exhibition for 80 attendees with photo displays, artist Q&A, and networking reception"
    ],
    'Sports Tournament': [
      "Plan a corporate cricket tournament for 200 participants with matches, awards ceremony, and closing dinner",
      "Organize a football league for 150 players with multiple matches, refreshments, and trophy presentation",
      "Create a sports day for 300 participants with various games, competitions, and medal ceremonies"
    ]
  };

  const getExamplePrompts = () => {
    if (eventType && examplePromptsByType[eventType]) {
      return examplePromptsByType[eventType];
    }
    return [
      "Plan a tech startup product launch for 200 attendees with networking sessions and live demos",
      "Organize a sustainable wedding celebration for 150 guests with outdoor ceremony and eco-friendly catering",
      "Create a corporate annual conference with keynote speakers, breakout sessions, and team building activities"
    ];
  };

  const examplePrompts = getExamplePrompts();

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
          <Icon name="Sparkles" size={20} className="text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Event Planner</h3>
          <p className="text-sm text-gray-600">Describe your vision and let AI create your perfect event plan</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Type Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Event Type
          </label>
          <select
            value={eventType}
            onChange={handleEventTypeChange}
            className={`w-full px-3 py-2 border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
              errors?.eventType ? 'border-error' : 'border-border'
            }`}
          >
            <option value="">Select event type...</option>
            {eventTypes?.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors?.eventType && (
            <p className="mt-1 text-sm text-error">{errors?.eventType}</p>
          )}
        </div>

        {/* Event Description */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Event Description
            {isValidating && (
              <span className="ml-2 text-xs text-primary">
                <Icon name="Loader2" size={12} className="inline animate-spin mr-1" />
                Validating...
              </span>
            )}
          </label>
          <textarea
            value={prompt}
            onChange={handlePromptChange}
            placeholder={`Describe your ${eventType || 'event'} vision in detail... Include audience size, venue preferences, key activities, budget range, and any special requirements. Be specific and detailed for better AI-generated plans.

You can write in English or Hindi. Feel free to use multiple lines and detailed descriptions for better results.`}
            rows={8}
            className={`w-full px-4 py-3 border rounded-md bg-input text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y min-h-[200px] ${
              errors?.prompt ? 'border-error' : 'border-border'
            }`}
            style={{ lineHeight: '1.6', whiteSpace: 'pre-wrap' }}
          />
          <div className="flex justify-between items-center mt-1">
            {errors?.prompt ? (
              <div className="flex items-center text-sm text-error">
                <Icon name="AlertCircle" size={14} className="mr-1" />
                {errors?.prompt}
              </div>
            ) : (
              <p className={`text-xs ${
                prompt?.length < 20 ? 'text-warning' : 
                prompt?.length > 1500 ? 'text-error' : 'text-muted-foreground'
              }`}>
                {prompt?.length}/2000 characters
                {prompt?.length < 20 && ' (minimum 20 required)'}
                {prompt?.length > 1500 && ' (approaching limit)'}
              </p>
            )}
          </div>
        </div>

        {/* Example Prompts */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Need inspiration? Try these examples:</p>
          <div className="space-y-2">
            {examplePrompts?.map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPrompt(example)}
                className="w-full text-left p-3 bg-muted hover:bg-muted/80 rounded-md text-sm text-muted-foreground hover:text-foreground transition-smooth"
              >
                <Icon name="Lightbulb" size={14} className="inline mr-2" />
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <Button
          type="submit"
          variant="default"
          size="lg"
          fullWidth
          loading={isGenerating || isValidating}
          iconName="Sparkles"
          iconPosition="left"
          disabled={isGenerating || isValidating}
        >
          {isGenerating ? 'Generating Your Event Plan...' : 
           isValidating ? 'Validating Description...' : 
           'Generate Event Plan'}
        </Button>
      </form>
      {/* AI Features Info */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Icon name="Calendar" size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground">Timeline Generation</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="CheckSquare" size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground">Task Management</span>
          </div>
          <div className="flex items-center space-x-2">
            <Icon name="IndianRupee" size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground">Budget Estimation</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPromptForm;