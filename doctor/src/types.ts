export interface QuestionnaireData {
  clinicInfo: {
    clinicName: string;
    useClinicNameInGreeting: boolean;
    operatingHours: {
      start: string;
      end: string;
    };
    holidays: string;
    communicationStyle: string;
    phrasesToUse: string;
    phrasesToAvoid: string;
  };
  services: {
    commonServices: string;
    standardResponses: string;
    procedureDescriptions: boolean;
  };
  appointments: {
    appointmentTypes: string;
    appointmentDuration: number;
    schedulingSystem: string;
    requireContactDetails: boolean;
  };
  screening: {
    requirements: string;
    healthConditions: string;
  };
  privacy: {
    privacyPhrases: string;
    fallbackResponse: string;
  };
  language: {
    primaryLanguage: string;
    offerEnglish: boolean;
    agentName: string;
  };
  followUp: {
    sendConfirmation: boolean;
    sendReminders: boolean;
  };
  cancellation: {
    allowRescheduling: boolean;
    cancellationPolicy: string;
  };
  emergency: {
    emergencyResponse: string;
    afterHoursContact: string;
  };
}