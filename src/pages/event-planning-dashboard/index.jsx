import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import ProgressIndicator from '../../components/ui/ProgressIndicator';
import QuickActionButton from '../../components/ui/QuickActionButton';
import NotificationToast, { useNotifications } from '../../components/ui/NotificationToast';
import EventPromptForm from './components/EventPromptForm';
import GeneratedContentCard from './components/GeneratedContentCard';
import ProgressOverview from './components/ProgressOverview';
import QuickAccessPanel from './components/QuickAccessPanel';
import EmptyState from './components/EmptyState';
import EventPreferencesPanel from './components/EventPreferencesPanel';
import { eventService } from '../../services/eventService';
import { geminiService } from '../../services/geminiService';
import { supabase } from '../../lib/supabaseClient';

const EventPlanningDashboard = () => {
  const navigate = useNavigate();
  const { notifications, showSuccess, showError, showLoading, dismissNotification } = useNotifications();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [generatedContent, setGeneratedContent] = useState([]);
  const [selectedEventType, setSelectedEventType] = useState('');

  // Mock generated content data
  const mockGeneratedContent = [
    {
      id: 'event-plan',
      title: 'Event Timeline',
      description: 'Detailed schedule and agenda',
      icon: 'Calendar',
      status: 'completed',
      progress: 100,
      lastUpdated: new Date(Date.now() - 1800000)?.toISOString(),
      items: [
        'Registration & Welcome (9:00 AM)',
        'Opening Keynote (10:00 AM)',
        'Networking Break (11:30 AM)',
        'Panel Discussion (12:00 PM)',
        'Lunch & Networking (1:00 PM)'
      ]
    },
    {
      id: 'task-list',
      title: 'Task Management',
      description: 'Organized action items',
      icon: 'CheckSquare',
      status: 'in-progress',
      progress: 75,
      lastUpdated: new Date(Date.now() - 3600000)?.toISOString(),
      items: [
        'Book venue and confirm availability',
        'Send invitations to speakers',
        'Order catering for 200 attendees',
        'Set up registration system',
        'Prepare welcome materials'
      ]
    },
    {
      id: 'budget',
      title: 'Budget Estimate',
      description: 'Cost breakdown and planning',
      icon: 'IndianRupee',
      status: 'completed',
      progress: 100,
      lastUpdated: new Date(Date.now() - 7200000)?.toISOString(),
      items: [
        'Venue: ₹4,15,000',
        'Catering: ₹6,64,000',
        'Speakers: ₹2,49,000',
        'Marketing: ₹1,24,500',
        'Total: ₹14,52,500'
      ]
    },
    {
      id: 'marketing',
      title: 'Marketing Materials',
      description: 'Promotional content and assets',
      icon: 'Megaphone',
      status: 'in-progress',
      progress: 60,
      lastUpdated: new Date(Date.now() - 10800000)?.toISOString(),
      items: [
        'Event poster design',
        'Email invitation template',
        'Social media captions',
        'LinkedIn event page',
        'Registration landing page'
      ]
    }
  ];

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      try {
        const { data: latestEvent, error: eventError } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (eventError && eventError.code !== 'PGRST116') {
          console.error('Error fetching event:', eventError);
          return;
        }

        if (isMounted && latestEvent) {
          const { data: aiContent, error: aiError } = await supabase
            .from('ai_generated_content')
            .select('*')
            .eq('event_id', latestEvent.id)
            .eq('content_type', 'event_plan')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (aiError && aiError.code !== 'PGRST116') {
            console.error('Error fetching AI content:', aiError);
          }

          if (aiContent && aiContent.generated_content) {
            const eventPlan = aiContent.generated_content;
            const generatedContentFromAI = [
              {
                id: 'event-plan',
                title: 'Event Timeline',
                description: 'AI-generated schedule and agenda',
                icon: 'Calendar',
                status: 'completed',
                progress: 100,
                lastUpdated: aiContent.created_at,
                items: eventPlan.timeline?.slice(0, 5)?.map(t => `${t.time} - ${t.activity}`) || []
              },
              {
                id: 'task-list',
                title: 'Task Management',
                description: 'AI-generated action items',
                icon: 'CheckSquare',
                status: 'in-progress',
                progress: 75,
                lastUpdated: aiContent.created_at,
                items: eventPlan.tasks?.slice(0, 5)?.map(t => t.task) || []
              },
              {
                id: 'budget',
                title: 'Budget Estimate',
                description: 'AI-generated cost breakdown',
                icon: 'IndianRupee',
                status: 'completed',
                progress: 100,
                lastUpdated: aiContent.created_at,
                items: eventPlan.budget ? [
                  `Venue: ₹${eventPlan.budget.venue?.toLocaleString()}`,
                  `Catering: ₹${eventPlan.budget.catering?.toLocaleString()}`,
                  `Marketing: ₹${eventPlan.budget.marketing?.toLocaleString()}`,
                  `Equipment: ₹${eventPlan.budget.equipment?.toLocaleString()}`,
                  `Total: ₹${Object.values(eventPlan.budget).reduce((a, b) => a + b, 0).toLocaleString()}`
                ] : []
              },
              {
                id: 'marketing',
                title: 'Marketing Materials',
                description: 'AI-powered promotional content',
                icon: 'Megaphone',
                status: 'in-progress',
                progress: 60,
                lastUpdated: aiContent.created_at,
                items: [
                  'Event poster design',
                  'Email invitation template',
                  'Social media captions',
                  'LinkedIn event page',
                  'Registration landing page'
                ]
              }
            ];

            setEventData(latestEvent);
            setGeneratedContent(generatedContentFromAI);
            setHasGeneratedContent(true);
          }
        }
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };

    loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGenerateEvent = async (formData) => {
    setIsGenerating(true);
    const loadingId = showLoading('Generating your event plan with AI...');

    try {
      const eventPlan = await geminiService.generateEventPlan(
        formData.prompt || formData.description,
        formData.eventType,
        {
          audienceSize: formData.audienceSize,
          budget: formData.budget,
          duration: formData.duration,
          venueType: formData.venueType
        }
      );

      const savedEvent = await eventService.createEvent({
        eventName: formData.eventName || formData.eventType || 'New Event',
        eventType: formData.eventType,
        description: formData.prompt || formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        city: formData.city,
        venueType: formData.venueType,
        audienceSize: formData.audienceSize,
        duration: formData.duration
      });

      const { data: aiContent, error: aiError } = await supabase
        .from('ai_generated_content')
        .insert({
          event_id: savedEvent.id,
          content_type: 'event_plan',
          prompt: formData.prompt || formData.description,
          generated_content: eventPlan,
          metadata: { eventType: formData.eventType, timestamp: new Date().toISOString() }
        })
        .select()
        .maybeSingle();

      if (aiError) {
        console.error('Error saving AI content:', aiError);
      }

      const generatedContentFromAI = [
        {
          id: 'event-plan',
          title: 'Event Timeline',
          description: 'AI-generated schedule and agenda',
          icon: 'Calendar',
          status: 'completed',
          progress: 100,
          lastUpdated: new Date().toISOString(),
          items: eventPlan.timeline?.slice(0, 5)?.map(t => `${t.time} - ${t.activity}`) || []
        },
        {
          id: 'task-list',
          title: 'Task Management',
          description: 'AI-generated action items',
          icon: 'CheckSquare',
          status: 'in-progress',
          progress: 75,
          lastUpdated: new Date().toISOString(),
          items: eventPlan.tasks?.slice(0, 5)?.map(t => t.task) || []
        },
        {
          id: 'budget',
          title: 'Budget Estimate',
          description: 'AI-generated cost breakdown',
          icon: 'IndianRupee',
          status: 'completed',
          progress: 100,
          lastUpdated: new Date().toISOString(),
          items: eventPlan.budget ? [
            `Venue: ₹${eventPlan.budget.venue?.toLocaleString()}`,
            `Catering: ₹${eventPlan.budget.catering?.toLocaleString()}`,
            `Marketing: ₹${eventPlan.budget.marketing?.toLocaleString()}`,
            `Equipment: ₹${eventPlan.budget.equipment?.toLocaleString()}`,
            `Total: ₹${Object.values(eventPlan.budget).reduce((a, b) => a + b, 0).toLocaleString()}`
          ] : []
        },
        {
          id: 'marketing',
          title: 'Marketing Materials',
          description: 'AI-powered promotional content',
          icon: 'Megaphone',
          status: 'in-progress',
          progress: 60,
          lastUpdated: new Date().toISOString(),
          items: [
            'Event poster design',
            'Email invitation template',
            'Social media captions',
            'LinkedIn event page',
            'Registration landing page'
          ]
        }
      ];

      setEventData(savedEvent);
      setGeneratedContent(generatedContentFromAI);
      setHasGeneratedContent(true);

      dismissNotification(loadingId);
      showSuccess('Event plan generated with AI and saved successfully!');

    } catch (error) {
      console.error('Error creating event:', error);
      dismissNotification(loadingId);
      showError('Failed to generate event plan. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleContentAction = (action, contentId) => {
    switch (action) {
      case 'view':
        if (contentId === 'task-list') {
          navigate('/task-board-management');
        } else if (contentId === 'budget') {
          navigate('/budget-calculator');
        } else if (contentId === 'marketing') {
          navigate('/marketing-materials');
        } else if (contentId === 'event-plan') {
          navigate('/event-plan-details');
        }
        break;
      case 'edit':
        showSuccess(`Editing ${contentId} - Feature coming soon!`);
        break;
      case 'download':
        showSuccess(`Downloading ${contentId} materials...`);
        break;
      default:
        break;
    }
  };

  const handleQuickAction = (actionType) => {
    switch (actionType) {
      case 'ai-generate':
        document.querySelector('textarea')?.focus();
        showSuccess('Ready to generate! Describe your event above.');
        break;
      case 'quick-add': navigate('/task-board-management');
        break;
      default:
        showSuccess(`${actionType} action triggered!`);
        break;
    }
  };

  const handlePreferencesSave = (savedData) => {
    showSuccess('Event preferences saved successfully!');
  };

  const handlePreferencesLoad = (loadedData) => {
    console.log('Preferences loaded:', loadedData);
    if (loadedData?.eventType) {
      setSelectedEventType(loadedData.eventType);
    }
  };

  const handleEventTypeChange = (eventType) => {
    setSelectedEventType(eventType);
  };

  const scrollToForm = () => {
    document.querySelector('textarea')?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate overall progress
  const calculateOverallProgress = () => {
    if (!hasGeneratedContent) return 0;
    const totalProgress = generatedContent?.reduce((sum, item) => sum + item?.progress, 0);
    return Math.round(totalProgress / generatedContent?.length);
  };

  const overallProgress = calculateOverallProgress();
  const completedTasks = 9; // Mock data
  const totalTasks = 12; // Mock data

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Event Planning Dashboard
                </h1>
                <p className="text-muted-foreground">
                  {hasGeneratedContent 
                    ? `Managing: ${eventData?.eventType || 'Your Event'}` 
                    : 'Transform your event vision into a comprehensive plan with AI assistance'
                  }
                </p>
              </div>
              
              {hasGeneratedContent && (
                <div className="hidden lg:block">
                  <ProgressIndicator
                    currentStep={Math.floor(overallProgress / 25)}
                    totalSteps={4}
                    completedTasks={completedTasks}
                    totalTasks={totalTasks}
                    budgetCompleted={generatedContent?.find(c => c?.id === 'budget')?.status === 'completed'}
                    marketingCompleted={generatedContent?.find(c => c?.id === 'marketing')?.status === 'completed'}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-8">
              {/* Combined Event Configuration Panel */}
              <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Event Configuration Center</h2>
                  <p className="text-blue-100 text-sm mt-1">Configure your event preferences and generate your plan with AI</p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Event Preferences Panel */}
                  <EventPreferencesPanel
                    onSave={handlePreferencesSave}
                    onLoad={handlePreferencesLoad}
                    onEventTypeChange={handleEventTypeChange}
                  />

                  {/* Event Prompt Form */}
                  <EventPromptForm
                    onGenerate={handleGenerateEvent}
                    isGenerating={isGenerating}
                    defaultEventType={selectedEventType}
                  />
                </div>
              </div>

              {/* Generated Content or Empty State */}
              {hasGeneratedContent ? (
                <>
                  {/* Progress Overview - Mobile */}
                  <div className="lg:hidden">
                    <ProgressOverview
                      overallProgress={overallProgress}
                      planningComplete={generatedContent?.find(c => c?.id === 'event-plan')?.status === 'completed'}
                      tasksComplete={completedTasks}
                      totalTasks={totalTasks}
                      budgetComplete={generatedContent?.find(c => c?.id === 'budget')?.status === 'completed'}
                      marketingComplete={generatedContent?.find(c => c?.id === 'marketing')?.status === 'completed'}
                    />
                  </div>

                  {/* Generated Content Cards */}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-foreground">Generated Content</h2>
                      <div className="text-sm text-muted-foreground">
                        Last updated: {new Date()?.toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {generatedContent?.map((content) => (
                        <GeneratedContentCard
                          key={content?.id}
                          title={content?.title}
                          description={content?.description}
                          icon={content?.icon}
                          status={content?.status}
                          progress={content?.progress}
                          lastUpdated={content?.lastUpdated}
                          items={content?.items}
                          onView={() => handleContentAction('view', content?.id)}
                          onEdit={() => handleContentAction('edit', content?.id)}
                          onDownload={content?.id === 'marketing' ? () => handleContentAction('download', content?.id) : null}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <EmptyState onGetStarted={scrollToForm} />
              )}
            </div>

            {/* Right Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Progress Overview - Desktop */}
                {hasGeneratedContent && (
                  <div className="hidden lg:block">
                    <ProgressOverview
                      overallProgress={overallProgress}
                      planningComplete={generatedContent?.find(c => c?.id === 'event-plan')?.status === 'completed'}
                      tasksComplete={completedTasks}
                      totalTasks={totalTasks}
                      budgetComplete={generatedContent?.find(c => c?.id === 'budget')?.status === 'completed'}
                      marketingComplete={generatedContent?.find(c => c?.id === 'marketing')?.status === 'completed'}
                    />
                  </div>
                )}

                {/* Quick Access Panel */}
                <QuickAccessPanel />
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Quick Action Button */}
      <QuickActionButton onAction={handleQuickAction} />
      {/* Notifications */}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
        position="top-right"
      />
    </div>
  );
};

export default EventPlanningDashboard;