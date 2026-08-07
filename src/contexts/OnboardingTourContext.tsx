import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";

// Tour step configuration
export interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  spotlightPadding?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  skipable?: boolean;
}

export interface Tour {
  id: string;
  name: string;
  description?: string;
  steps: TourStep[];
  route?: string; // Only show on this route
  triggerOnFirstVisit?: boolean;
}

interface OnboardingTourContextType {
  // Current tour state
  activeTour: Tour | null;
  currentStep: number;
  isActive: boolean;
  
  // Tour management
  startTour: (tourId: string) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  skipTour: () => void;
  
  // Tour registration
  registerTour: (tour: Tour) => void;
  unregisterTour: (tourId: string) => void;
  
  // Completion tracking
  completedTours: string[];
  markTourComplete: (tourId: string) => void;
  resetTourProgress: (tourId?: string) => void;
  
  // Available tours
  availableTours: Tour[];
}

const OnboardingTourContext = createContext<OnboardingTourContextType | null>(null);

const STORAGE_KEY = "onboarding-tours-completed";

export function OnboardingTourProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [tours, setTours] = useState<Map<string, Tour>>(new Map());
  const [activeTour, setActiveTour] = useState<Tour | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedTours, setCompletedTours] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist completed tours
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(completedTours));
    } catch {
      // Ignore storage errors
    }
  }, [completedTours]);

  // Check for first-visit tours when route changes
  useEffect(() => {
    if (activeTour) return; // Don't interrupt active tour
    
    tours.forEach((tour) => {
      if (
        tour.triggerOnFirstVisit &&
        !completedTours.includes(tour.id) &&
        (!tour.route || location.pathname === tour.route)
      ) {
        setActiveTour(tour);
        setCurrentStep(0);
      }
    });
  }, [location.pathname, tours, completedTours, activeTour]);

  const registerTour = useCallback((tour: Tour) => {
    setTours((prev) => new Map(prev).set(tour.id, tour));
  }, []);

  const unregisterTour = useCallback((tourId: string) => {
    setTours((prev) => {
      const next = new Map(prev);
      next.delete(tourId);
      return next;
    });
  }, []);

  const startTour = useCallback((tourId: string) => {
    const tour = tours.get(tourId);
    if (tour) {
      setActiveTour(tour);
      setCurrentStep(0);
    }
  }, [tours]);

  const endTour = useCallback(() => {
    if (activeTour) {
      setCompletedTours((prev) => 
        prev.includes(activeTour.id) ? prev : [...prev, activeTour.id]
      );
    }
    setActiveTour(null);
    setCurrentStep(0);
  }, [activeTour]);

  const nextStep = useCallback(() => {
    if (!activeTour) return;
    
    if (currentStep < activeTour.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      endTour();
    }
  }, [activeTour, currentStep, endTour]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const goToStep = useCallback((step: number) => {
    if (activeTour && step >= 0 && step < activeTour.steps.length) {
      setCurrentStep(step);
    }
  }, [activeTour]);

  const skipTour = useCallback(() => {
    if (activeTour) {
      setCompletedTours((prev) => 
        prev.includes(activeTour.id) ? prev : [...prev, activeTour.id]
      );
    }
    setActiveTour(null);
    setCurrentStep(0);
  }, [activeTour]);

  const markTourComplete = useCallback((tourId: string) => {
    setCompletedTours((prev) => 
      prev.includes(tourId) ? prev : [...prev, tourId]
    );
  }, []);

  const resetTourProgress = useCallback((tourId?: string) => {
    if (tourId) {
      setCompletedTours((prev) => prev.filter((id) => id !== tourId));
    } else {
      setCompletedTours([]);
    }
  }, []);

  return (
    <OnboardingTourContext.Provider
      value={{
        activeTour,
        currentStep,
        isActive: !!activeTour,
        startTour,
        endTour,
        nextStep,
        prevStep,
        goToStep,
        skipTour,
        registerTour,
        unregisterTour,
        completedTours,
        markTourComplete,
        resetTourProgress,
        availableTours: Array.from(tours.values()),
      }}
    >
      {children}
    </OnboardingTourContext.Provider>
  );
}

export function useOnboardingTour() {
  const context = useContext(OnboardingTourContext);
  if (!context) {
    throw new Error("useOnboardingTour must be used within OnboardingTourProvider");
  }
  return context;
}

// Hook to register a tour
export function useTour(tour: Tour) {
  const { registerTour, unregisterTour } = useOnboardingTour();
  
  useEffect(() => {
    registerTour(tour);
    return () => unregisterTour(tour.id);
  }, [tour, registerTour, unregisterTour]);
}
